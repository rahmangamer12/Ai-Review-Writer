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

// Encrypt sensitive data (simple encryption for localStorage)
function encryptData(data: string): string {
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
  static savePlatform(platformId: string, credentials: Record<string, string>): boolean {
    if (typeof window === 'undefined') return false
    
    try {
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
        return true
      }
    } catch (error) {
      console.error('Error saving platform:', error)
    }
    return false
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

  // Test connection (mock implementation - replace with real API calls)
  static async testConnection(platformId: string, credentials: Record<string, string>): Promise<{ success: boolean; message: string }> {
    // This is a mock implementation
    // In production, replace with actual API calls to test credentials
    
    const requiredFields = platformDefinitions[platformId]?.fields || []
    
    // Check if all required fields are provided
    for (const field of requiredFields) {
      if (field.required && !credentials[field.name]) {
        return {
          success: false,
          message: `Missing required field: ${field.label}`
        }
      }
    }

    // Simulate API test call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock success/failure (80% success rate for demo)
    const isSuccess = Math.random() > 0.2
    
    if (isSuccess) {
      return {
        success: true,
        message: `Successfully connected to ${platformDefinitions[platformId]?.name}`
      }
    } else {
      return {
        success: false,
        message: 'Invalid credentials. Please check your API key and try again.'
      }
    }
  }

  // Fetch reviews from a platform (mock implementation)
  static async fetchReviews(platformId: string): Promise<any[]> {
    const platform = this.getPlatforms().find(p => p.id === platformId)
    
    if (!platform || !platform.connected) {
      return []
    }

    // Mock review data - replace with actual API calls
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Return mock reviews
    return [
      {
        id: `${platformId}-1`,
        content: 'Great service! Very professional and helpful.',
        rating: 5,
        author: 'John Doe',
        date: new Date().toISOString(),
        platform: platformId
      },
      {
        id: `${platformId}-2`,
        content: 'Good experience overall. Would recommend.',
        rating: 4,
        author: 'Jane Smith',
        date: new Date(Date.now() - 86400000).toISOString(),
        platform: platformId
      }
    ]
  }

  // Get connected platforms count
  static getConnectedCount(): number {
    return this.getPlatforms().filter(p => p.connected).length
  }
}
