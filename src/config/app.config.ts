/**
 * Application Configuration
 * Centralized configuration for enterprise-grade maintainability
 * @version 1.0.0
 */
import { LONGCAT_DEFAULT_MODEL } from '@/lib/longcatModels'

export const APP_CONFIG = {
  /**
   * Application Metadata
   */
  app: {
    name: 'AutoReview AI',
    version: '1.0.0',
    description: 'AI-powered review management platform',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://ai-review-writer.vercel.app',
  },

  /**
   * Subscription Plans
   * NOTE: Canonical plan data now lives in src/lib/plans.ts. These values are
   * kept aligned only to avoid drift; prefer importing from src/lib/plans.ts.
   */
  plans: {
    free: {
      name: 'Free',
      price: 0,
      credits: 20,
      maxPlatforms: 1,
      maxReviews: 50,
      features: ['Basic AI replies', '1 platform', 'Basic dashboard'],
    },
    starter: {
      name: 'Starter',
      price: 9,
      credits: 100,
      maxPlatforms: 3,
      maxReviews: 200,
      features: ['AI replies', '3 platforms', 'Bulk replies', 'Templates', 'Analytics'],
    },
    growth: {
      name: 'Growth',
      price: 19,
      credits: 300,
      maxPlatforms: 10,
      maxReviews: 1000,
      features: ['Auto-draft replies', '10 platforms', 'Weekly insights', 'Priority support'],
    },
    business: {
      name: 'Business',
      price: 39,
      credits: 1000,
      maxPlatforms: Infinity,
      maxReviews: Infinity,
      features: ['Unlimited platforms', 'Advanced analytics', 'Priority support (4h SLA)'],
    },
  },

  /**
   * Credit System — 1 credit = 1 AI response.
   */
  credits: {
    promptsPerCredit: 1,
    packages: [
      { credits: 100, price: 9, bonus: 0 },
      { credits: 250, price: 19, bonus: 25 },
      { credits: 500, price: 29, bonus: 100 },
    ],
  },

  /**
   * Rate Limiting
   */
  rateLimit: {
    aiAnalysis: {
      requests: 20,
      windowMs: 60000, // 1 minute
    },
    apiGeneral: {
      requests: 100,
      windowMs: 60000,
    },
    authentication: {
      requests: 5,
      windowMs: 300000, // 5 minutes
    },
  },

  /**
   * AI Models Configuration
   */
  ai: {
    defaultModel: LONGCAT_DEFAULT_MODEL,
    models: {
      chat: LONGCAT_DEFAULT_MODEL,
      thinking: LONGCAT_DEFAULT_MODEL,
      thinkingAdvanced: LONGCAT_DEFAULT_MODEL,
      lite: LONGCAT_DEFAULT_MODEL,
    },
    maxTokens: {
      chat: 2000,
      analysis: 1000,
      reply: 500,
    },
    temperature: {
      default: 0.7,
      creative: 0.9,
      precise: 0.3,
    },
  },

  /**
   * Platform Integration Limits
   */
  platforms: {
    maxConnectionsPerPlan: {
      free: 1,
      starter: 3,
      growth: 10,
      business: Infinity,
    },
    supported: ['google', 'facebook', 'yelp', 'tripadvisor', 'trustpilot'],
  },

  /**
   * Security Configuration
   */
  security: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16,
    },
    session: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    csrf: {
      enabled: true,
      tokenLength: 32,
    },
  },

  /**
   * Email Configuration
   */
  email: {
    from: {
      name: 'AutoReview AI',
      email: 'noreply@autoreview.ai',
    },
    templates: {
      welcome: 'welcome',
      paymentSuccess: 'payment-success',
      lowCredits: 'low-credits',
      reviewAlert: 'review-alert',
    },
  },

  /**
   * Notification Settings
   */
  notifications: {
    autoHideDelay: 3000, // 3 seconds
    maxVisible: 5,
  },

  /**
   * PWA Configuration
   */
  pwa: {
    name: 'AutoReview AI',
    shortName: 'AutoReview',
    themeColor: '#6366f1',
    backgroundColor: '#050505',
    display: 'standalone',
  },

  /**
   * Analytics & Monitoring
   */
  analytics: {
    enabled: process.env.NODE_ENV === 'production',
    trackingId: process.env.NEXT_PUBLIC_GA_ID,
  },

  /**
   * Feature Flags
   */
  features: {
    creditPurchase: false, // Coming soon
    voiceInput: true,
    darkMode: true,
    multiLanguage: true,
    browserExtension: true,
    mobileApp: false, // Future
  },

  /**
   * API Endpoints
   */
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },

  /**
   * Database Configuration
   */
  database: {
    connectionPoolSize: 10,
    queryTimeout: 10000, // 10 seconds
  },

  /**
   * File Upload Limits
   */
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },

  /**
   * Pagination Defaults
   */
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
} as const

/**
 * Type-safe config access
 */
export type AppConfig = typeof APP_CONFIG

/**
 * Helper function to get plan details
 */
export function getPlanConfig(planType: keyof typeof APP_CONFIG.plans) {
  return APP_CONFIG.plans[planType]
}

/**
 * Helper function to check feature flag
 */
export function isFeatureEnabled(feature: keyof typeof APP_CONFIG.features): boolean {
  return APP_CONFIG.features[feature]
}

/**
 * Helper function to get rate limit config
 */
export function getRateLimitConfig(type: keyof typeof APP_CONFIG.rateLimit) {
  return APP_CONFIG.rateLimit[type]
}
