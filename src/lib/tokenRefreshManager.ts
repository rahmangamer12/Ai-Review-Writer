/**
 * Token Refresh Manager
 * Handles OAuth token refresh with protection against infinite loops
 * and proper error handling
 */

export interface RefreshTokenConfig {
  platform: 'google' | 'facebook' | 'yelp'
  refreshToken: string
  clientId: string
  clientSecret: string
}

export interface RefreshResult {
  success: boolean
  accessToken?: string
  expiresIn?: number
  error?: string
  requiresReauth?: boolean // If true, user must re-authenticate
}

/**
 * Manages token refresh with circuit breaker pattern
 * Prevents infinite retry loops
 */
export class TokenRefreshManager {
  private static readonly MAX_RETRIES = 2
  private static readonly RETRY_DELAY_MS = 1000
  private static readonly REFRESH_TIMEOUT_MS = 10000
  
  // Track refresh attempts to prevent infinite loops
  private static refreshAttempts: Map<string, { count: number; timestamp: number }> = new Map()
  private static readonly RESET_WINDOW_MS = 60000 // Reset attempts every minute

  /**
   * Get a unique key for tracking refresh attempts
   */
  private static getAttemptKey(platform: string, refreshToken: string): string {
    return `${platform}:${refreshToken.substring(0, 10)}`
  }

  /**
   * Check if we should allow a refresh attempt
   */
  private static canAttemptRefresh(platform: string, refreshToken: string): boolean {
    const key = this.getAttemptKey(platform, refreshToken)
    const attempt = this.refreshAttempts.get(key)
    const now = Date.now()

    if (!attempt) {
      // First attempt
      this.refreshAttempts.set(key, { count: 0, timestamp: now })
      return true
    }

    // Check if we should reset the window
    if (now - attempt.timestamp > this.RESET_WINDOW_MS) {
      this.refreshAttempts.set(key, { count: 0, timestamp: now })
      return true
    }

    // Check if we've exceeded max retries
    if (attempt.count >= this.MAX_RETRIES) {
      console.error(
        `[Token Refresh] Max retries exceeded for ${platform}. ` +
        `User must re-authenticate.`
      )
      return false
    }

    return true
  }

  /**
   * Record a refresh attempt
   */
  private static recordAttempt(platform: string, refreshToken: string): void {
    const key = this.getAttemptKey(platform, refreshToken)
    const attempt = this.refreshAttempts.get(key)
    
    if (attempt) {
      attempt.count += 1
    } else {
      this.refreshAttempts.set(key, { count: 1, timestamp: Date.now() })
    }
  }

  /**
   * Refresh Google OAuth token
   */
  static async refreshGoogleToken(config: RefreshTokenConfig): Promise<RefreshResult> {
    try {
      // Check circuit breaker
      if (!this.canAttemptRefresh(config.platform, config.refreshToken)) {
        return {
          success: false,
          error: 'Too many refresh attempts. User must re-authenticate.',
          requiresReauth: true
        }
      }

      // Validate inputs
      if (!config.refreshToken?.trim()) {
        return {
          success: false,
          error: 'Refresh token is missing or invalid',
          requiresReauth: true
        }
      }

      this.recordAttempt(config.platform, config.refreshToken)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.REFRESH_TIMEOUT_MS)

      try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            refresh_token: config.refreshToken,
            grant_type: 'refresh_token'
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        const data = await response.json()

        if (!response.ok) {
          console.error('[Google Token Refresh Error]', {
            status: response.status,
            error: data.error,
            error_description: data.error_description
          })

          // Handle specific error cases
          if (response.status === 400 && data.error === 'invalid_grant') {
            return {
              success: false,
              error: 'Google refresh token has expired or been revoked',
              requiresReauth: true
            }
          }

          if (response.status === 401) {
            return {
              success: false,
              error: 'Invalid Google credentials',
              requiresReauth: true
            }
          }

          // For other errors, allow retry
          return {
            success: false,
            error: `Google token refresh failed: ${data.error || 'Unknown error'}`,
            requiresReauth: false
          }
        }

        if (!data.access_token) {
          return {
            success: false,
            error: 'Google API did not return access token',
            requiresReauth: false
          }
        }

        console.log('[Google Token Refresh] Success')
        return {
          success: true,
          accessToken: data.access_token,
          expiresIn: data.expires_in || 3600
        }
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof DOMException && error.name === 'AbortError') {
          return {
            success: false,
            error: 'Google token refresh request timed out',
            requiresReauth: false
          }
        }

        throw error
      }
    } catch (error) {
      console.error('[Token Refresh Manager Error]', error)
      return {
        success: false,
        error: `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requiresReauth: false
      }
    }
  }

  /**
   * Refresh Facebook token
   */
  static async refreshFacebookToken(config: RefreshTokenConfig): Promise<RefreshResult> {
    try {
      if (!this.canAttemptRefresh(config.platform, config.refreshToken)) {
        return {
          success: false,
          error: 'Too many refresh attempts. User must re-authenticate.',
          requiresReauth: true
        }
      }

      if (!config.refreshToken?.trim()) {
        return {
          success: false,
          error: 'Refresh token is missing or invalid',
          requiresReauth: true
        }
      }

      this.recordAttempt(config.platform, config.refreshToken)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.REFRESH_TIMEOUT_MS)

      try {
        const response = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
          method: 'GET',
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        const data = await response.json()

        if (!response.ok || data.error) {
          return {
            success: false,
            error: data.error?.message || 'Facebook token refresh failed',
            requiresReauth: data.error?.code === 190 // Invalid token
          }
        }

        return {
          success: true,
          accessToken: data.access_token,
          expiresIn: data.expires_in
        }
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof DOMException && error.name === 'AbortError') {
          return {
            success: false,
            error: 'Facebook token refresh request timed out',
            requiresReauth: false
          }
        }

        throw error
      }
    } catch (error) {
      console.error('[Token Refresh Manager Error]', error)
      return {
        success: false,
        error: `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requiresReauth: false
      }
    }
  }

  /**
   * Clear refresh attempts (useful for testing)
   */
  static clearAttempts(): void {
    this.refreshAttempts.clear()
  }
}
