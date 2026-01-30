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

      const data = await response.json()
      this.config.accessToken = data.access_token
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw error
    }
  }

  static ratingToNumber(rating: GoogleReview['starRating']): number {
    const map = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }
    return map[rating]
  }
}
