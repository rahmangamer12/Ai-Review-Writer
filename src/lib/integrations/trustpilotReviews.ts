/**
 * Trustpilot API Integration
 * Fetches and replies to Trustpilot reviews
 */

export interface TrustpilotConfig {
  apiKey: string
  apiSecret: string
  businessUnitId: string
  accessToken?: string
}

export interface TrustpilotReview {
  id: string
  consumer: {
    displayName: string
    displayLocation: string
  }
  stars: number
  title: string
  text: string
  createdAt: string
  language: string
  companyReply?: {
    text: string
    createdAt: string
  }
}

export class TrustpilotReviewsAPI {
  private config: TrustpilotConfig
  private baseUrl = 'https://api.trustpilot.com/v1'

  constructor(config: TrustpilotConfig) {
    this.config = config
  }

  /**
   * Fetch reviews from Trustpilot
   */
  async fetchReviews(page: number = 1): Promise<TrustpilotReview[]> {
    try {
      const url = `${this.baseUrl}/business-units/${this.config.businessUnitId}/reviews?page=${page}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'ApiKey': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Trustpilot API error: ${response.status}`)
      }

      const data = await response.json()
      return data.reviews || []
    } catch (error) {
      console.error('Error fetching Trustpilot reviews:', error)
      throw error
    }
  }

  /**
   * Post a reply to a Trustpilot review
   */
  async postReply(reviewId: string, replyText: string): Promise<boolean> {
    try {
      if (!this.config.accessToken) {
        throw new Error('Access token required for posting replies')
      }

      const url = `${this.baseUrl}/private/business-units/${this.config.businessUnitId}/reviews/${reviewId}/reply`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: replyText
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to post Trustpilot reply: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error('Error posting Trustpilot reply:', error)
      throw error
    }
  }

  /**
   * Get OAuth access token
   */
  async authenticate(username: string, password: string): Promise<string> {
    try {
      const response = await fetch('https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: username,
          password: password
        }),
        // Add basic auth
        ...(this.config.apiKey && {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64')}`
          }
        })
      })

      const data = await response.json()
      this.config.accessToken = data.access_token
      return data.access_token
    } catch (error) {
      console.error('Error authenticating with Trustpilot:', error)
      throw error
    }
  }
}
