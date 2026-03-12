/**
 * Simple AI Agent for demonstration
 * In production, this would integrate with OpenAI or other AI services
 */

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral'
  emotion: 'happy' | 'angry' | 'disappointed' | 'excited' | 'frustrated' | 'calm'
  confidence: number
  topics: string[]
}

export interface LanguageDetection {
  language: 'english' | 'urdu' | 'roman_urdu'
  script: 'latin' | 'arabic' | 'mixed'
  confidence: number
}

export interface ReplyGeneration {
  reply: string
  tone_used: 'professional' | 'friendly' | 'desi_casual'
  language: 'english' | 'urdu' | 'roman_urdu'
  appropriateness_score: number
  needs_human_review: boolean
}

export interface AutoApproveCheck {
  auto_approve: boolean
  reason: string
  risk_level: 'low' | 'medium' | 'high'
  recommended_action: 'publish' | 'draft' | 'reject'
}

export interface AbusiveLanguageDetection {
  has_abusive_content: boolean
  severity: 'none' | 'mild' | 'moderate' | 'severe'
  flagged_words: string[]
  confidence: number
}

export interface TopicExtraction {
  topics: Array<{
    name: string
    confidence: number
    category: string
  }>
  main_topic: string
  confidence: number
}

export class AutoReviewAgent {
  constructor() {}

  /**
   * Analyzes sentiment and emotion from text
   */
  async analyzeSentiment(text: string, language?: string): Promise<SentimentAnalysis> {
    // Mock implementation - replace with real AI service
    const positiveWords = ['great', 'amazing', 'excellent', 'good', 'love', 'perfect']
    const negativeWords = ['terrible', 'bad', 'awful', 'hate', 'worst', 'poor']
    const emotions = ['happy', 'angry', 'disappointed', 'excited', 'frustrated', 'calm']
    
    const lowerText = text.toLowerCase()
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
    let emotion: 'happy' | 'angry' | 'disappointed' | 'excited' | 'frustrated' | 'calm' = 'calm'
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive'
      emotion = 'happy'
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative'
      emotion = 'disappointed'
    }
    
    return {
      sentiment,
      emotion,
      confidence: 0.7,
      topics: ['product_quality', 'service'] // Mock topics
    }
  }

  /**
   * Detects the language and script of the input text
   */
  async detectLanguage(text: string): Promise<LanguageDetection> {
    // Simple language detection
    const arabicRegex = /[\u0600-\u06FF]/
    const romanUrduWords = ['hai', 'hain', 'ki', 'ka', 'ke', 'ko', 'se', 'ne', 'par', 'mein']
    
    if (arabicRegex.test(text)) {
      return { language: 'urdu', script: 'arabic', confidence: 0.8 }
    } else {
      const words = text.toLowerCase().split(/\s+/)
      const urduWordsFound = words.filter(word => romanUrduWords.includes(word))
      
      if (urduWordsFound.length > 1) {
        return { language: 'roman_urdu', script: 'latin', confidence: 0.8 }
      }
    }
    
    return { language: 'english', script: 'latin', confidence: 0.7 }
  }

  /**
   * Generates a contextually appropriate reply
   */
  async draftReply(
    reviewContext: {
      content: string
      rating: number
      author: string
      sentiment: string
      emotion: string
      topics: string[]
    },
    tone: 'professional' | 'friendly' | 'desi_casual',
    language: 'english' | 'urdu' | 'roman_urdu'
  ): Promise<ReplyGeneration> {
    let reply = ''
    
    if (reviewContext.rating >= 4) {
      if (tone === 'friendly') {
        reply = `Hey ${reviewContext.author}! Thanks for the love! We're thrilled you enjoyed it! 🎉`
      } else if (tone === 'desi_casual') {
        reply = `Shukriya ${reviewContext.author}! Bohat khush hue apki feedback se. Zaroor phir ana!`
      } else {
        reply = `Dear ${reviewContext.author}, Thank you for your positive feedback. We appreciate your review.`
      }
    } else if (reviewContext.rating <= 2) {
      if (tone === 'professional') {
        reply = `Dear ${reviewContext.author}, We apologize for your experience. Please contact our support team.`
      } else {
        reply = `Hi ${reviewContext.author}, We're sorry to hear this. Let us make it right!`
      }
    } else {
      reply = `Thank you ${reviewContext.author} for your feedback. We value your review.`
    }
    
    return {
      reply,
      tone_used: tone,
      language,
      appropriateness_score: 0.8,
      needs_human_review: reviewContext.rating <= 2
    }
  }

  /**
   * Determines if a review reply requires human approval
   */
  async autoApproveCheck(params: {
    rating: number
    sentiment: string
    emotion: string
    has_abusive_language: boolean
    confidence_score: number
  }): Promise<AutoApproveCheck> {
    const { rating, sentiment, emotion, has_abusive_language, confidence_score } = params

    if (has_abusive_language) {
      return {
        auto_approve: false,
        reason: 'Abusive language detected',
        risk_level: 'high',
        recommended_action: 'draft'
      }
    }

    if (confidence_score < 0.7) {
      return {
        auto_approve: false,
        reason: 'Low confidence in AI analysis',
        risk_level: 'medium',
        recommended_action: 'draft'
      }
    }

    if (rating >= 4 && sentiment === 'positive') {
      return {
        auto_approve: true,
        reason: 'High rating with positive sentiment',
        risk_level: 'low',
        recommended_action: 'publish'
      }
    }

    if (rating <= 2 && (sentiment === 'negative' || emotion === 'angry' || emotion === 'frustrated')) {
      return {
        auto_approve: false,
        reason: 'Negative review with strong negative emotion',
        risk_level: 'medium',
        recommended_action: 'draft'
      }
    }

    return {
      auto_approve: false,
      reason: 'Neutral review - needs human review',
      risk_level: 'low',
      recommended_action: 'draft'
    }
  }

  /**
   * Detects abusive or inappropriate content
   */
  async detectAbusiveLanguage(text: string, language?: string): Promise<AbusiveLanguageDetection> {
    const abusiveWords = ['damn', 'hell', 'stupid', 'idiot', 'hate', 'kill']
    const lowerText = text.toLowerCase()
    const foundWords = abusiveWords.filter(word => lowerText.includes(word))
    
    return {
      has_abusive_content: foundWords.length > 0,
      severity: foundWords.length > 2 ? 'severe' : foundWords.length > 0 ? 'mild' : 'none',
      flagged_words: foundWords,
      confidence: 0.8
    }
  }

  /**
   * Extracts key topics and themes from text
   */
  async extractTopics(text: string, context?: string): Promise<TopicExtraction> {
    // Simple topic extraction based on keywords
    const topicKeywords = {
      product_quality: ['quality', 'product', 'item', 'broken', 'good', 'excellent'],
      service: ['service', 'staff', 'help', 'rude', 'friendly'],
      price: ['price', 'cost', 'expensive', 'cheap', 'affordable'],
      delivery: ['delivery', 'shipping', 'fast', 'slow', 'late']
    }
    
    const lowerText = text.toLowerCase()
    const topics = Object.entries(topicKeywords)
      .map(([topic, keywords]) => ({
        name: topic,
        confidence: keywords.filter(keyword => lowerText.includes(keyword)).length / keywords.length,
        category: topic
      }))
      .filter(topic => topic.confidence > 0)
    
    const mainTopic = topics.length > 0 ? topics[0].name : 'general'
    
    return {
      topics,
      main_topic: mainTopic,
      confidence: topics.length > 0 ? 0.6 : 0.3
    }
  }

  /**
   * Learns from human feedback to improve future responses
   */
  async learnFromFeedback(params: {
    originalReply: string
    humanEditedReply: string
    reviewContext: Record<string, unknown>
    feedbackType: 'edit' | 'approve' | 'reject'
  }) {
    const { originalReply, humanEditedReply, reviewContext, feedbackType } = params
    
    const patterns = []
    
    if (feedbackType === 'edit') {
      if (humanEditedReply.length > originalReply.length * 1.5) {
        patterns.push('prefers more detailed responses')
      }
      if (humanEditedReply.length < originalReply.length * 0.7) {
        patterns.push('prefers more concise responses')
      }
    }
    
    return {
      learning_applied: true,
      patterns_identified: patterns,
      improvement_suggestions: [
        'Consider adding more personalization',
        'Adjust tone based on customer emotion',
        'Include specific references to review content'
      ]
    }
  }

  /**
   * Generates dashboard insights from review data
   */
  async generateDashboardInsights(reviewsData: {sentiment_label?: string; rating?: number; topics?: string[]}[], timePeriod: string = 'week') {
    const totalReviews = reviewsData.length
    const sentimentDistribution = reviewsData.reduce((acc: Record<string, number>, review) => {
      acc[review.sentiment_label || 'unknown'] = (acc[review.sentiment_label || 'unknown'] || 0) + 1
      return acc
    }, {})
    
    const averageRating = reviewsData.reduce((sum: number, review) => sum + (review.rating || 0), 0) / totalReviews || 0
    
    const trendingTopics = reviewsData
      .flatMap((review) => review.topics || [])
      .reduce((acc: Record<string, number>, topic: string) => {
        acc[topic] = (acc[topic] || 0) + 1
        return acc
      }, {})
    
    const recommendations: string[] = []
    
    if ((sentimentDistribution.negative || 0) > totalReviews * 0.3) {
      recommendations.push('High negative sentiment detected - consider proactive outreach')
    }
    
    if (averageRating < 3.5) {
      recommendations.push('Low average rating - review product/service quality')
    }
    
    return {
      sentiment_distribution: sentimentDistribution,
      trending_topics: Object.entries(trendingTopics)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([topic]) => topic),
      performance_metrics: {
        total_reviews: totalReviews,
        average_rating: averageRating.toFixed(2),
        time_period: timePeriod
      },
      recommendations
    }
  }
}

export const autoReviewAgent = new AutoReviewAgent()