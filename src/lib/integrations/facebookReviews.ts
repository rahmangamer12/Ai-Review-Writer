/**
 * Facebook Graph API Integration for Reviews
 */

export interface FacebookReviewConfig {
  pageId: string
  accessToken: string
}

export interface FacebookReview {
  id: string
  reviewer: {
    name: string
    id: string
  }
  rating: number
  review_text?: string
  created_time: string
  recommendation_type?: 'positive' | 'negative'
}

export class FacebookReviewsAPI {
  private config: FacebookReviewConfig
  private baseUrl = 'https://graph.facebook.com/v18.0'

  constructor(config: FacebookReviewConfig) {
    this.config = config
  }

  async fetchReviews(): Promise<FacebookReview[]> {
    try {
      const url = `${this.baseUrl}/${this.config.pageId}/ratings?access_token=${this.config.accessToken}&fields=reviewer{name},rating,review_text,created_time,recommendation_type`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching Facebook reviews:', error)
      throw error
    }
  }

  async postReply(reviewId: string, message: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/${reviewId}/comments?access_token=${this.config.accessToken}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })

      if (!response.ok) {
        throw new Error(`Failed to post reply: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error('Error posting Facebook reply:', error)
      throw error
    }
  }

  async getPageInfo(): Promise<{ name: string; id: string }> {
    try {
      const url = `${this.baseUrl}/${this.config.pageId}?access_token=${this.config.accessToken}&fields=name,id`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching page info:', error)
      throw error
    }
  }
}
