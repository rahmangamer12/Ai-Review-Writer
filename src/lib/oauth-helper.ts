/**
 * OAuth Helper for Easy Platform Connection
 * Simplifies the OAuth flow for non-technical users
 */

export interface OAuthConfig {
  platform: 'google' | 'facebook' | 'yelp'
  clientId?: string
  redirectUri: string
}

export class OAuthHelper {
  /**
   * Generate OAuth URL for Google My Business
   */
  static getGoogleOAuthUrl(clientId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/business.manage',
      access_type: 'offline',
      prompt: 'consent'
    })
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  /**
   * Generate OAuth URL for Facebook
   */
  static getFacebookOAuthUrl(appId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: 'pages_read_engagement,pages_manage_metadata,pages_messaging',
      response_type: 'code'
    })
    
    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
  }

  /**
   * Handle OAuth callback and extract code
   */
  static extractAuthCode(url: string): string | null {
    const urlParams = new URLSearchParams(new URL(url).search)
    return urlParams.get('code')
  }

  /**
   * Check if user is on mobile device
   */
  static isMobile(): boolean {
    if (typeof window === 'undefined') return false
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  }

  /**
   * Open OAuth in popup window (desktop) or new tab (mobile)
   */
  static openOAuthWindow(url: string, platform: string): Window | null {
    if (this.isMobile()) {
      // On mobile, open in same tab
      window.location.href = url
      return null
    } else {
      // On desktop, open in popup
      const width = 600
      const height = 700
      const left = (window.screen.width - width) / 2
      const top = (window.screen.height - height) / 2
      
      return window.open(
        url,
        `${platform}_oauth`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,menubar=0`
      )
    }
  }
}

/**
 * Managed OAuth Service
 * For clients who want us to handle the OAuth flow
 */
export class ManagedOAuthService {
  private apiEndpoint = '/api/managed-oauth'

  /**
   * Request managed setup - we'll handle everything
   */
  async requestManagedSetup(data: {
    businessName: string
    businessEmail: string
    platform: string
    phoneNumber?: string
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          requestType: 'managed_setup'
        })
      })

      return await response.json()
    } catch (error) {
      console.error('Error requesting managed setup:', error)
      return {
        success: false,
        message: 'Failed to submit request. Please try again.'
      }
    }
  }

  /**
   * Schedule a call for setup assistance
   */
  async scheduleSetupCall(data: {
    businessName: string
    contactEmail: string
    phoneNumber: string
    preferredTime: string
    platforms: string[]
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          requestType: 'schedule_call'
        })
      })

      return await response.json()
    } catch (error) {
      console.error('Error scheduling call:', error)
      return {
        success: false,
        message: 'Failed to schedule call. Please try again.'
      }
    }
  }
}

export const managedOAuthService = new ManagedOAuthService()
