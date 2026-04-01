/**
 * Google My Business API Integration
 */

export interface GoogleReviewConfig {
  accountId: string
  locationId: string
  accessToken: string
  refreshToken: string
}

export interface GoogleReview {
  reviewId: string
  reviewer: {
    profilePhotoUrl?: string
    displayName: string
    isAnonymous: boolean
  }
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'
  comment?: string
  createTime: string
  updateTime: string
  reviewReply?: {
    comment: string
    updateTime: string
  }
}

export class GoogleReviewsAPI {
  private config: GoogleReviewConfig
  private baseUrl = 'https://mybusiness.googleapis.com/v4'

  constructor(config: GoogleReviewConfig) {
    this.config = config
  }

  async fetchReviews(): Promise<GoogleReview[]> {
    try {
      const url = `${this.baseUrl}/accounts/${this.config.accountId}/locations/${this.config.locationId}/reviews`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken()
          return this.fetchReviews()
        }
        throw new Error(`Google API error: ${response.status}`)
      }

      const data = await response.json()
      return data.reviews || []
    } catch (error) {
      console.error('Error fetching Google reviews:', error)
      throw error
    }
  }

  async postReply(reviewId: string, replyText: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/accounts/${this.config.accountId}/locations/${this.config.locationId}/reviews/${reviewId}/reply`
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: replyText })
      })

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken()
          return this.postReply(reviewId, replyText)
        }
        throw new Error(`Failed to post reply: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error('Error posting Google reply:', error)
      throw error
    }
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      // Validate refresh token exists
      if (!this.config.refreshToken || this.config.refreshToken.trim() === '') {
        throw new Error(
          'Google refresh token is missing or empty. ' +
          'User needs to re-authenticate with Google to restore access.'
        )
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: this.config.refreshToken,
          grant_type: 'refresh_token'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[Google Token Refresh Error]', {
          status: response.status,
          error: errorData.error,
          error_description: errorData.error_description
        })
        
        // If refresh token is invalid, it means the user needs to re-authenticate
        if (response.status === 400 && errorData.error === 'invalid_grant') {
          throw new Error(
            'Google refresh token has expired or been revoked. ' +
            'User needs to re-authenticate with Google.'
          )
        }
        
        throw new Error(`Google token refresh failed: ${response.status} ${errorData.error || 'Unknown error'}`)
      }

      const data = await response.json()
      
      if (!data.access_token) {
        throw new Error('Google API did not return access token in refresh response')
      }
      
      // Update the access token
      this.config.accessToken = data.access_token
      
      // Log successful refresh (without exposing the token)
      console.log('[Google Token Refresh] Successfully refreshed access token')
    } catch (error) {
      console.error('[Google Token Refresh Error]:', error)
      throw error
    }
  }

  static ratingToNumber(rating: GoogleReview['starRating']): number {
    const map = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }
    return map[rating]
  }
}
