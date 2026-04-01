// Platform Integration Management
// Handles API credentials, testing connections, and fetching reviews

export interface PlatformConfig {
  id: string
  name: string
  icon: string
  description: string
  connected: boolean
  credentials: Record<string, string>
  lastSync?: string
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  errorMessage?: string
}

export interface PlatformCredentialField {
  name: string
  label: string
  type: 'text' | 'password' | 'url'
  placeholder: string
  required: boolean
  helpText?: string
}

// Platform configuration definitions
export const platformDefinitions: Record<string, {
  name: string
  icon: string
  description: string
  fields: PlatformCredentialField[]
  testEndpoint?: string
}> = {
  google: {
    name: 'Google My Business',
    icon: '🔍',
    description: 'Connect your Google My Business account to manage reviews from Google Search and Maps',
    fields: [
      {
        name: 'apiKey',
        label: 'Google API Key',
        type: 'password',
        placeholder: 'AIzaSyCxxxxxxxxxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Get from Google Cloud Console > APIs & Services > Credentials'
      },
      {
        name: 'placeId',
        label: 'Place ID',
        type: 'text',
        placeholder: 'ChIJxxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Find your Place ID using Google Place ID Finder'
      },
      {
        name: 'businessName',
        label: 'Business Name',
        type: 'text',
        placeholder: 'Your Business Name',
        required: true,
        helpText: 'Exact name as it appears on Google'
      }
    ]
  },
  yelp: {
    name: 'Yelp',
    icon: '⭐',
    description: 'Connect your Yelp business page to manage reviews and respond to customers',
    fields: [
      {
        name: 'apiKey',
        label: 'Yelp API Key',
        type: 'password',
        placeholder: 'Bearer xxxxxx',
        required: true,
        helpText: 'Get from Yelp Fusion API > Manage App'
      },
      {
        name: 'businessId',
        label: 'Business ID',
        type: 'text',
        placeholder: 'business-name-city',
        required: true,
        helpText: 'Find in your Yelp business page URL'
      }
    ]
  },
  facebook: {
    name: 'Facebook',
    icon: '📘',
    description: 'Connect your Facebook Business Page to manage reviews and recommendations',
    fields: [
      {
        name: 'pageAccessToken',
        label: 'Page Access Token',
        type: 'password',
        placeholder: 'EAAxxxxxxxxxx',
        required: true,
        helpText: 'Get from Facebook Developers > Graph API Explorer'
      },
      {
        name: 'pageId',
        label: 'Page ID',
        type: 'text',
        placeholder: '123456789',
        required: true,
        helpText: 'Your Facebook Page numeric ID'
      }
    ]
  },
  tripadvisor: {
    name: 'TripAdvisor',
    icon: '✈️',
    description: 'Connect your TripAdvisor listing to manage reviews for hotels and restaurants',
    fields: [
      {
        name: 'apiKey',
        label: 'TripAdvisor API Key',
        type: 'password',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx',
        required: true,
        helpText: 'Request from TripAdvisor Content API'
      },
      {
        name: 'locationId',
        label: 'Location ID',
        type: 'text',
        placeholder: '123456',
        required: true,
        helpText: 'Find in your TripAdvisor listing URL'
      }
    ]
  },
  trustpilot: {
    name: 'Trustpilot',
    icon: '💚',
    description: 'Connect your Trustpilot business account to manage reviews and responses',
    fields: [
      {
        name: 'apiKey',
        label: 'Trustpilot API Key',
        type: 'password',
        placeholder: 'xxxxxxxxxxxxxxxx',
        required: true,
        helpText: 'Get from Trustpilot Business > Integrations > API'
      },
      {
        name: 'businessUnitId',
        label: 'Business Unit ID',
        type: 'text',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx',
        required: true,
        helpText: 'Found in Trustpilot Business settings'
      }
    ]
  }
}

/**
 * DEPRECATED: Old XOR encryption - NO LONGER USED
 * Replaced with proper AES-256-GCM encryption
 * This is kept only for migration purposes
 */
function encryptData(data: string): string {
  console.warn('[DEPRECATED] Using old encryptData function. This should not be called in production.')
  if (typeof window === 'undefined') return data
  try {
    // Simple XOR encryption with a key derived from user agent
    const key = window.navigator.userAgent.slice(0, 16)
    let encrypted = ''
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return btoa(encrypted)
  } catch {
    return data
  }
}

function decryptData(encrypted: string): string {
  console.warn('[DEPRECATED] Using old decryptData function. This should not be called in production.')
  if (typeof window === 'undefined') return encrypted
  try {
    const key = window.navigator.userAgent.slice(0, 16)
    const data = atob(encrypted)
    let decrypted = ''
    for (let i = 0; i < data.length; i++) {
      decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return decrypted
  } catch {
    return encrypted
  }
}

/**
 * Server-side encryption using proper AES-256-GCM
 * This should be used for all new credential storage
 */
async function encryptCredentialsServer(data: string): Promise<string> {
  try {
    // Dynamically import only on server
    if (typeof window !== 'undefined') {
      throw new Error('encryptCredentialsServer should only be called on the server')
    }
    const { encryptSensitiveData } = await import('./encryption')
    return encryptSensitiveData(data)
  } catch (error) {
    console.error('[Encryption Error]', error)
    // Fallback to old method (but log the error)
    console.warn('[SECURITY WARNING] Failed to use server encryption, falling back to old method')
    return encryptData(data)
  }
}

async function decryptCredentialsServer(encrypted: string): Promise<string> {
  try {
    // Dynamically import only on server
    if (typeof window !== 'undefined') {
      throw new Error('decryptCredentialsServer should only be called on the server')
    }
    const { decryptSensitiveData } = await import('./encryption')
    return decryptSensitiveData(encrypted)
  } catch (error) {
    console.error('[Decryption Error]', error)
    // Fallback to old method (but log the error)
    console.warn('[SECURITY WARNING] Failed to use server decryption, falling back to old method')
    return decryptData(encrypted)
  }
}

// Platform Integration Manager
export class PlatformIntegrationManager {
  private static STORAGE_KEY = 'autoreview-platforms-v2'

  // Get user's current plan
  private static getUserPlan(): string {
    if (typeof window === 'undefined') return 'free'
    
    // Get from localStorage
    const savedPlan = localStorage.getItem('autoreview-plan')
    return savedPlan || 'free'
  }

  // Get max platforms allowed for current plan
  private static getMaxPlatforms(): number {
    const plan = this.getUserPlan()
    const limits: Record<string, number> = {
      'free': 2,
      'starter': 5,
      'professional': 100, // Unlimited
      'enterprise': 100 // Unlimited
    }
    return limits[plan] || 2
  }

  // Check if user can connect more platforms
  static canConnectMore(): boolean {
    if (typeof window === 'undefined') return false
    
    const platforms = this.getPlatforms()
    const connected = platforms.filter(p => p.connected).length
    const max = this.getMaxPlatforms()
    
    return connected < max
  }

  // Get connection limit message
  static getConnectionLimitMessage(): string {
    const plan = this.getUserPlan()
    const limits: Record<string, string> = {
      'free': 'Free plan: Max 2 platforms. Upgrade for more!',
      'starter': 'Starter plan: Max 5 platforms. Upgrade for unlimited!',
      'professional': 'Connected platforms: Unlimited',
      'enterprise': 'Connected platforms: Unlimited'
    }
    return limits[plan] || limits['free']
  }

  // Validate credentials before saving
  static validateCredentials(platformId: string, credentials: Record<string, string>): string | null {
    // Check for empty credentials object
    if (!credentials || Object.keys(credentials).length === 0) {
      return 'No credentials provided'
    }

    // Platform-specific validation
    switch (platformId) {
      case 'google':
        if (!credentials.access_token?.trim()) {
          return 'Google access_token is required'
        }
        if (credentials.access_token.length < 10) {
          return 'Google access_token appears to be invalid (too short)'
        }
        // Google refresh token can be empty for some flows, but warn if completely missing
        if (!credentials.refresh_token?.trim()) {
          console.warn('[Platform Integration] Google refresh_token is empty. Token refresh will fail after 24 hours.')
        }
        break

      case 'facebook':
        if (!credentials.access_token?.trim()) {
          return 'Facebook access_token is required'
        }
        if (credentials.access_token.length < 20) {
          return 'Facebook access_token appears to be invalid (too short)'
        }
        break

      case 'yelp':
        if (!credentials.access_token?.trim()) {
          return 'Yelp access_token is required'
        }
        if (credentials.access_token.length < 20) {
          return 'Yelp access_token appears to be invalid (too short)'
        }
        break

      case 'trustpilot':
        if (!credentials.api_key?.trim()) {
          return 'Trustpilot API key is required'
        }
        if (credentials.api_key.length < 10) {
          return 'Trustpilot API key appears to be invalid (too short)'
        }
        break

      default:
        // Generic validation for unknown platforms
        const hasAnyCredential = Object.values(credentials).some(v => v?.trim())
        if (!hasAnyCredential) {
          return 'At least one credential field is required'
        }
    }

    // Check for obviously invalid patterns
    for (const [key, value] of Object.entries(credentials)) {
      if (typeof value === 'string') {
        if (value.includes('\n') || value.includes('\r')) {
          return `Credential "${key}" contains invalid line breaks`
        }
        if (value.includes(' ') && key.includes('token')) {
          return `Credential "${key}" (token) should not contain spaces`
        }
      }
    }

    return null // All validations passed
  }

  // Get all platforms with their current status
  static getPlatforms(): PlatformConfig[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Decrypt credentials
        return parsed.map((p: PlatformConfig) => ({
          ...p,
          credentials: Object.fromEntries(
            Object.entries(p.credentials).map(([k, v]) => [k, decryptData(v as string)])
          )
        }))
      }
    } catch (error) {
      console.error('Error loading platforms:', error)
    }

    // Return default platforms
    return Object.entries(platformDefinitions).map(([id, def]) => ({
      id,
      name: def.name,
      icon: def.icon,
      description: def.description,
      connected: false,
      credentials: {},
      status: 'disconnected'
    }))
  }

  // Save platform configuration
  static savePlatform(platformId: string, credentials: Record<string, string>): { success: boolean; error?: string } {
    if (typeof window === 'undefined') return { success: false, error: 'localStorage not available on server' }
    
    try {
      // Validate credentials before saving
      const validationError = this.validateCredentials(platformId, credentials)
      if (validationError) {
        console.warn(`[Platform Integration] Validation failed for ${platformId}:`, validationError)
        return { success: false, error: validationError }
      }

      const platforms = this.getPlatforms()
      const index = platforms.findIndex(p => p.id === platformId)
      
      if (index !== -1) {
        // Encrypt credentials before storing
        const encryptedCredentials = Object.fromEntries(
          Object.entries(credentials).map(([k, v]) => [k, encryptData(v)])
        )
        
        platforms[index] = {
          ...platforms[index],
          credentials: encryptedCredentials,
          connected: true,
          status: 'connected',
          lastSync: new Date().toISOString()
        }
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(platforms))
        return { success: true }
      } else {
        return { success: false, error: 'Platform not found' }
      }
    } catch (error) {
      console.error('Error saving platform:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Update platform status
  static updatePlatformStatus(platformId: string, status: PlatformConfig['status'], errorMessage?: string): void {
    if (typeof window === 'undefined') return
    
    try {
      const platforms = this.getPlatforms()
      const index = platforms.findIndex(p => p.id === platformId)
      
      if (index !== -1) {
        platforms[index] = {
          ...platforms[index],
          status,
          errorMessage,
          lastSync: status === 'connected' ? new Date().toISOString() : platforms[index].lastSync
        }
        
        // Re-encrypt before saving
        const encryptedPlatforms = platforms.map(p => ({
          ...p,
          credentials: Object.fromEntries(
            Object.entries(p.credentials).map(([k, v]) => [k, encryptData(v)])
          )
        }))
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(encryptedPlatforms))
      }
    } catch (error) {
      console.error('Error updating platform status:', error)
    }
  }

  // Disconnect a platform
  static disconnectPlatform(platformId: string): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const platforms = this.getPlatforms()
      const index = platforms.findIndex(p => p.id === platformId)
      
      if (index !== -1) {
        platforms[index] = {
          ...platforms[index],
          connected: false,
          credentials: {},
          status: 'disconnected',
          errorMessage: undefined
        }
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(platforms))
        return true
      }
    } catch (error) {
      console.error('Error disconnecting platform:', error)
    }
    return false
  }

  static async proxyFetch(url: string, headers?: Record<string, string>) {
    const res = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, headers: headers || {} })
    })
    return res.json()
  }

  // Test connection (real API implementation)
  static async testConnection(platformId: string, credentials: Record<string, string>): Promise<{ success: boolean; message: string }> {
    if (typeof window === 'undefined') {
      return { success: false, message: 'Loading...' }
    }

    const requiredFields = platformDefinitions[platformId]?.fields || []
    
    for (const field of requiredFields) {
      if (field.required && !credentials[field.name]) {
        return {
          success: false,
          message: `Missing required field: ${field.label}`
        }
      }
    }

    // Google
    if (platformId === 'google') {
      try {
        const res = await this.proxyFetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${credentials.placeId}&fields=name&key=${credentials.apiKey}`
        )
        if (!res.ok) return { success: false, message: `Google API Error: Invalid API Key or missing permissions.` }
        if (res.data.status === 'OK') return { success: true, message: 'Google connected!' }
        return { success: false, message: `Google Error: ${res.data.status}` }
      } catch (err) {
        return { success: false, message: 'Failed to access Google API. Check credentials.' }
      }
    }

    // Yelp
    if (platformId === 'yelp') {
      try {
        const res = await this.proxyFetch(
          `https://api.yelp.com/v3/businesses/${credentials.businessId}`,
          { Authorization: `Bearer ${credentials.apiKey}` }
        )
        if (!res.ok) return { success: false, message: 'Invalid Yelp credentials or missing permissions' }
        return { success: true, message: 'Yelp connected!' }
      } catch (err) {
        return { success: false, message: 'Failed to access Yelp API. Check credentials.' }
      }
    }

    // Facebook
    if (platformId === 'facebook') {
      try {
        const res = await this.proxyFetch(
          `https://graph.facebook.com/${credentials.pageId}?access_token=${credentials.pageAccessToken}`
        )
        if (!res.ok) return { success: false, message: 'Invalid Facebook token or page ID' }
        if (res.data.id) return { success: true, message: 'Facebook connected!' }
        return { success: false, message: 'Invalid Facebook Developer credentials' }
      } catch (err) {
        return { success: false, message: 'Failed to access Facebook Graph. Check credentials.' }
      }
    }

    // TripAdvisor
    if (platformId === 'tripadvisor') {
      try {
        const res = await this.proxyFetch(
          `https://api.content.tripadvisor.com/api/v1/location/${credentials.locationId}/details?key=${credentials.apiKey}`
        )
        if (!res.ok) return { success: false, message: 'Invalid TripAdvisor key or location ID' }
        return { success: true, message: 'TripAdvisor connected!' }
      } catch (err) {
        return { success: false, message: 'Failed to access TripAdvisor APIs. Check credentials.' }
      }
    }

    // Trustpilot
    if (platformId === 'trustpilot') {
      try {
        const res = await this.proxyFetch(
          `https://api.trustpilot.com/v1/business-units/${credentials.businessUnitId}`,
          { Authorization: `Basic ${btoa(credentials.apiKey + ':')}` }
        )
        if (!res.ok) return { success: false, message: 'Invalid Trustpilot Authorization credentials' }
        return { success: true, message: 'Trustpilot connected!' }
      } catch (err) {
        return { success: false, message: 'Failed to access Trustpilot APIs. Check credentials.' }
      }
    }

    return { success: false, message: 'Unknown platform' }
  }

  // Fetch reviews from a platform
  static async fetchReviews(platformId: string): Promise<any[]> {
    const platform = this.getPlatforms().find(p => p.id === platformId)
    
    if (!platform || !platform.connected) {
      return []
    }

    const { credentials } = platform

    // Google Reviews
    if (platformId === 'google') {
      try {
        const res = await this.proxyFetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${credentials.placeId}&fields=reviews&key=${credentials.apiKey}`
        )
        if (res.ok && res.data?.result?.reviews) {
          return res.data.result.reviews.map((r: any) => ({
            id: r.author_name + '-' + r.time,
            content: r.text,
            rating: r.rating,
            author: r.author_name,
            date: new Date(r.time * 1000).toISOString(),
            platform: 'google'
          }))
        }
      } catch (e) {
        console.error('Error fetching Google reviews:', e)
      }
      return []
    }

    // Yelp Reviews
    if (platformId === 'yelp') {
      try {
        const res = await this.proxyFetch(
          `https://api.yelp.com/v3/businesses/${credentials.businessId}/reviews`,
          { Authorization: `Bearer ${credentials.apiKey}` }
        )
        if (res.ok && res.data?.reviews) {
          return res.data.reviews.map((r: any) => ({
            id: r.id,
            content: r.text,
            rating: r.rating,
            author: r.user.name,
            date: r.time_created,
            platform: 'yelp'
          }))
        }
      } catch (e) {
        console.error('Error fetching Yelp reviews:', e)
      }
      return []
    }

    // Facebook Reviews
    if (platformId === 'facebook') {
      try {
        const res = await this.proxyFetch(
          `https://graph.facebook.com/${credentials.pageId}/ratings?access_token=${credentials.pageAccessToken}&fields=reviewer_name,rating,review_text,created_time`
        )
        if (res.ok && res.data?.data) {
          return res.data.data.map((r: any) => ({
            id: r.id,
            content: r.review_text,
            rating: r.rating,
            author: r.reviewer_name,
            date: r.created_time,
            platform: 'facebook'
          }))
        }
      } catch (e) {
        console.error('Error fetching Facebook reviews:', e)
      }
      return []
    }

    // TripAdvisor Reviews
    if (platformId === 'tripadvisor') {
      try {
        const res = await this.proxyFetch(
          `https://api.content.tripadvisor.com/api/v1/location/${credentials.locationId}/reviews?key=${credentials.apiKey}`
        )
        if (res.ok && res.data?.data) {
          return res.data.data.map((r: any) => ({
            id: r.id,
            content: r.text,
            rating: r.rating,
            author: r.author,
            date: r.publish_date,
            platform: 'tripadvisor'
          }))
        }
      } catch (e) {
        console.error('Error fetching TripAdvisor reviews:', e)
      }
      return []
    }

    // Trustpilot Reviews
    if (platformId === 'trustpilot') {
      try {
        const res = await this.proxyFetch(
          `https://api.trustpilot.com/v1/business-units/${credentials.businessUnitId}/reviews?apikey=${credentials.apiKey}`
        )
        if (res.ok && res.data?.reviews) {
          return res.data.reviews.map((r: any) => ({
            id: r.id,
            content: r.content,
            rating: r.stars,
            author: r.author.name,
            date: r.createdAt,
            platform: 'trustpilot'
          }))
        }
      } catch (e) {
        console.error('Error fetching Trustpilot reviews:', e)
      }
      return []
    }

    return []
  }

  // Get connected platforms count
  static getConnectedCount(): number {
    return this.getPlatforms().filter(p => p.connected).length
  }
}
