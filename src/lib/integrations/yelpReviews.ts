/**
 * Yelp Fusion API Integration
 */

export interface YelpReviewConfig {
  apiKey: string
  businessId: string
}

export interface YelpReview {
  id: string
  rating: number
  user: {
    name: string
    image_url?: string
  }
  text: string
  time_created: string
  url: string
}

export class YelpReviewsAPI {
  private config: YelpReviewConfig
  private baseUrl = 'https://api.yelp.com/v3'

  constructor(config: YelpReviewConfig) {
    this.config = config
  }

  async fetchReviews(): Promise<YelpReview[]> {
    try {
      const url = `${this.baseUrl}/businesses/${this.config.businessId}/reviews`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Yelp API error: ${response.status}`)
      }

      const data = await response.json()
      return data.reviews || []
    } catch (error) {
      console.error('Error fetching Yelp reviews:', error)
      throw error
    }
  }

  async searchBusiness(name: string, location: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        term: name,
        location: location,
        limit: '10'
      })
      
      const url = `${this.baseUrl}/businesses/search?${params}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Yelp API error: ${response.status}`)
      }

      const data = await response.json()
      return data.businesses || []
    } catch (error) {
      console.error('Error searching Yelp businesses:', error)
      throw error
    }
  }

  async getBusinessDetails(businessId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/businesses/${businessId}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Yelp API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching Yelp business details:', error)
      throw error
    }
  }
}
