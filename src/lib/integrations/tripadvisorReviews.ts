/**
 * TripAdvisor API Integration
 * Note: TripAdvisor has limited API access
 * Official API requires partnership, so this uses Content API
 */

export interface TripAdvisorConfig {
  apiKey: string
  locationId: string
}

export interface TripAdvisorReview {
  id: string
  rating: number
  title: string
  text: string
  published_date: string
  trip_type: string
  travel_date: string
  user: {
    username: string
    user_location: {
      name: string
    }
  }
  helpful_votes: number
  language: string
  url: string
}

export class TripAdvisorReviewsAPI {
  private config: TripAdvisorConfig
  private baseUrl = 'https://api.content.tripadvisor.com/api/v1'

  constructor(config: TripAdvisorConfig) {
    this.config = config
  }

  /**
   * Fetch location details including reviews
   */
  async fetchLocationDetails(): Promise<any> {
    try {
      const url = `${this.baseUrl}/location/${this.config.locationId}/details?key=${this.config.apiKey}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`TripAdvisor API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching TripAdvisor location details:', error)
      throw error
    }
  }

  /**
   * Fetch reviews for a location
   */
  async fetchReviews(): Promise<TripAdvisorReview[]> {
    try {
      const url = `${this.baseUrl}/location/${this.config.locationId}/reviews?key=${this.config.apiKey}&language=en`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`TripAdvisor API error: ${response.status}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching TripAdvisor reviews:', error)
      throw error
    }
  }

  /**
   * Get management response URL
   * Note: TripAdvisor doesn't allow posting replies via API
   * Owners must use TripAdvisor Management Center
   */
  getManagementUrl(): string {
    return `https://www.tripadvisor.com/ManagementCenter`
  }

  /**
   * Search for location by name and address
   */
  async searchLocation(searchQuery: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/location/search?key=${this.config.apiKey}&searchQuery=${encodeURIComponent(searchQuery)}&language=en`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`TripAdvisor API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error searching TripAdvisor location:', error)
      throw error
    }
  }
}
