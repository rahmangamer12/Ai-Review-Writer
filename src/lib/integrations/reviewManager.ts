/**
 * Unified Review Manager
 * Handles all platform integrations in one place
 */

import { GoogleReviewsAPI, type GoogleReview } from './googleReviews'
import { YelpReviewsAPI, type YelpReview } from './yelpReviews'
import { TrustpilotReviewsAPI, type TrustpilotReview } from './trustpilotReviews'
import { FacebookReviewsAPI, type FacebookReview } from './facebookReviews'
import { TripAdvisorReviewsAPI, type TripAdvisorReview } from './tripadvisorReviews'
import { longcatAI } from '../longcatAI'
import { supabase } from '../supabase'

export type Platform = 'google' | 'yelp' | 'trustpilot' | 'facebook' | 'tripadvisor'

export interface UnifiedReview {
  id: string
  platform: Platform
  externalId: string
  author: string
  rating: number
  content: string
  createdAt: Date
  language?: string
  url?: string
  hasReply: boolean
  reply?: string
  replyDate?: Date
}

export interface PlatformConnection {
  platform: Platform
  isConnected: boolean
  config: any
  lastSync?: Date
}

export class ReviewManager {
  private platforms: Map<Platform, any> = new Map()
  private connections: PlatformConnection[] = []

  /**
   * Initialize platform connections from settings
   */
  async initialize(userId: string): Promise<void> {
    try {
      // Load platform connections from database
      const { data: connections } = await (supabase as any)
        .from('platform_connections')
        .select('*')
        .eq('user_id', userId)

      if (connections) {
        for (const conn of connections) {
          await this.connectPlatform(conn.platform, conn.config)
        }
      }
    } catch (error) {
      console.error('Error initializing review manager:', error)
    }
  }

  /**
   * Connect to a review platform
   */
  async connectPlatform(platform: Platform, config: any): Promise<boolean> {
    try {
      switch (platform) {
        case 'google':
          const googleAPI = new GoogleReviewsAPI(config)
          this.platforms.set('google', googleAPI)
          break
        
        case 'yelp':
          const yelpAPI = new YelpReviewsAPI(config)
          this.platforms.set('yelp', yelpAPI)
          break
        
        case 'trustpilot':
          const trustpilotAPI = new TrustpilotReviewsAPI(config)
          this.platforms.set('trustpilot', trustpilotAPI)
          break
        
        case 'facebook':
          const facebookAPI = new FacebookReviewsAPI(config)
          this.platforms.set('facebook', facebookAPI)
          break
        
        case 'tripadvisor':
          const tripadvisorAPI = new TripAdvisorReviewsAPI(config)
          this.platforms.set('tripadvisor', tripadvisorAPI)
          break
      }

      this.connections.push({
        platform,
        isConnected: true,
        config,
        lastSync: new Date()
      })

      return true
    } catch (error) {
      console.error(`Error connecting to ${platform}:`, error)
      return false
    }
  }

  /**
   * Fetch reviews from all connected platforms
   */
  async fetchAllReviews(): Promise<UnifiedReview[]> {
    const allReviews: UnifiedReview[] = []

    for (const [platform, api] of this.platforms) {
      try {
        let reviews: any[] = []

        switch (platform) {
          case 'google':
            const googleReviews = await api.fetchReviews()
            reviews = googleReviews.map((r: GoogleReview) => this.normalizeGoogleReview(r))
            break
          
          case 'yelp':
            const yelpReviews = await api.fetchReviews()
            reviews = yelpReviews.map((r: YelpReview) => this.normalizeYelpReview(r))
            break
          
          case 'trustpilot':
            const trustpilotReviews = await api.fetchReviews()
            reviews = trustpilotReviews.map((r: TrustpilotReview) => this.normalizeTrustpilotReview(r))
            break
          
          case 'facebook':
            const facebookReviews = await api.fetchReviews()
            reviews = facebookReviews.map((r: FacebookReview) => this.normalizeFacebookReview(r))
            break
          
          case 'tripadvisor':
            const tripadvisorReviews = await api.fetchReviews()
            reviews = tripadvisorReviews.map((r: TripAdvisorReview) => this.normalizeTripAdvisorReview(r))
            break
        }

        allReviews.push(...reviews)
      } catch (error) {
        console.error(`Error fetching reviews from ${platform}:`, error)
      }
    }

    return allReviews
  }

  /**
   * Process a review with AI and post reply
   */
  async processReview(review: UnifiedReview, autoReply: boolean = true): Promise<void> {
    try {
      // Analyze with AI
      const [sentiment, deepAnalysis] = await Promise.all([
        longcatAI.analyzeSentiment(review.content),
        longcatAI.deepAnalyzeReview(review.content)
      ])

      // Get settings
      const settings = JSON.parse(localStorage.getItem('autoreview-settings') || '{}')
      const tone = settings.aiTone || 'friendly'

      // Generate reply
      const replyGen = await longcatAI.generateReviewResponse(
        review.content,
        review.rating,
        sentiment.sentiment,
        tone
      )

      // Check if should auto-reply
      const shouldReply = autoReply && 
                         settings.autoReplyEnabled && 
                         review.rating >= (settings.autoApprovalMinRating || 4)

      // Post reply to platform if enabled
      if (shouldReply && !review.hasReply) {
        const api = this.platforms.get(review.platform)
        
        if (api && api.postReply) {
          await api.postReply(review.externalId, replyGen.response)
        }
      }

      // Save to database
      await (supabase as any)
        .from('reviews')
        .upsert({
          external_id: review.externalId,
          platform: review.platform,
          author_name: review.author,
          rating: review.rating,
          content: review.content,
          created_at: review.createdAt,
          sentiment_score: sentiment.score,
          sentiment_label: sentiment.sentiment,
          emotion_label: sentiment.emotion,
          topics: sentiment.topics,
          ai_analysis: JSON.stringify(deepAnalysis),
          status: shouldReply ? 'published' : 'pending'
        })

      // Save reply if posted
      if (shouldReply && !review.hasReply) {
        await (supabase as any)
          .from('replies')
          .insert({
            review_external_id: review.externalId,
            content: replyGen.response,
            tone_used: tone,
            platform: review.platform,
            status: 'published',
            auto_approved: true,
            confidence_score: replyGen.appropriateness_score
          })
      }
    } catch (error) {
      console.error('Error processing review:', error)
      throw error
    }
  }

  /**
   * Get connection status for all platforms
   */
  getConnections(): PlatformConnection[] {
    return this.connections
  }

  /**
   * Disconnect from a platform
   */
  disconnectPlatform(platform: Platform): void {
    this.platforms.delete(platform)
    this.connections = this.connections.filter(c => c.platform !== platform)
  }

  // Normalization methods for different platforms
  private normalizeGoogleReview(review: GoogleReview): UnifiedReview {
    return {
      id: `google_${review.reviewId}`,
      platform: 'google',
      externalId: review.reviewId,
      author: review.reviewer.displayName,
      rating: GoogleReviewsAPI.ratingToNumber(review.starRating),
      content: review.comment || '',
      createdAt: new Date(review.createTime),
      hasReply: !!review.reviewReply,
      reply: review.reviewReply?.comment,
      replyDate: review.reviewReply ? new Date(review.reviewReply.updateTime) : undefined
    }
  }

  private normalizeYelpReview(review: YelpReview): UnifiedReview {
    return {
      id: `yelp_${review.id}`,
      platform: 'yelp',
      externalId: review.id,
      author: review.user.name,
      rating: review.rating,
      content: review.text,
      createdAt: new Date(review.time_created),
      url: review.url,
      hasReply: false // Yelp API doesn't provide reply info
    }
  }

  private normalizeTrustpilotReview(review: TrustpilotReview): UnifiedReview {
    return {
      id: `trustpilot_${review.id}`,
      platform: 'trustpilot',
      externalId: review.id,
      author: review.consumer.displayName,
      rating: review.stars,
      content: `${review.title}\n${review.text}`,
      createdAt: new Date(review.createdAt),
      language: review.language,
      hasReply: !!review.companyReply,
      reply: review.companyReply?.text,
      replyDate: review.companyReply ? new Date(review.companyReply.createdAt) : undefined
    }
  }

  private normalizeFacebookReview(review: FacebookReview): UnifiedReview {
    return {
      id: `facebook_${review.id}`,
      platform: 'facebook',
      externalId: review.id,
      author: review.reviewer.name,
      rating: review.rating,
      content: review.review_text || '',
      createdAt: new Date(review.created_time),
      hasReply: false // Would need additional API call to check
    }
  }

  private normalizeTripAdvisorReview(review: TripAdvisorReview): UnifiedReview {
    return {
      id: `tripadvisor_${review.id}`,
      platform: 'tripadvisor',
      externalId: review.id,
      author: review.user.username,
      rating: review.rating,
      content: `${review.title}\n${review.text}`,
      createdAt: new Date(review.published_date),
      language: review.language,
      url: review.url,
      hasReply: false // TripAdvisor API doesn't provide reply info in basic access
    }
  }
}

// Export singleton instance
export const reviewManager = new ReviewManager()
