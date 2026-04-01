/**
 * Platform Connection Manager
 * Handles all platform connections with proper error handling
 */

export interface ConnectionResult {
  success: boolean;
  platform: string;
  connected: boolean;
  error?: string;
  setupRequired?: boolean;
  setupUrl?: string;
  message?: string;
}

// Platform Connection Manager
// Handles all platform connections requiring REAL credentials - NO MOCK ALLOWED

export interface ConnectionResult {
  success: boolean;
  platform: string;
  connected: boolean;
  error?: string;
  setupRequired?: boolean;
  setupUrl?: string;
  message?: string;
}

// Connect to platform - MUST have real API credentials
export async function connectPlatform(platformId: string, userId: string): Promise<ConnectionResult> {
  try {
    const response = await fetch(`/api/platforms/${platformId}/connect?userId=${userId}`);
    const data = await response.json();

    if (!response.ok) {
      // API not properly configured - user needs to enter real credentials
      if (data.setupRequired || data.error?.includes('not configured')) {
        return {
          success: false,
          platform: platformId,
          connected: false,
          error: data.message || 'Platform credentials required. Please configure real API keys.',
        };
      }
      
      return {
        success: false,
        platform: platformId,
        connected: false,
        error: data.error || 'Connection failed. Verify your credentials are correct.',
        setupRequired: false, // Credentials exist but may be invalid
      };
    }

    // Verify actual connection success
    if (!data.success && !data.connected) {
      return {
        success: false,
        platform: platformId,
        connected: false,
        error: data.error || 'Connection verification failed',
      };
    }

    return {
      success: true,
      platform: platformId,
      connected: true,
      message: `Successfully connected to ${platformId}`,
    };
  } catch (error: unknown) {
    return {
      success: false,
      platform: platformId,
      connected: false,
      error: 'Connection failed. Verify your credentials and try again.',
    };
  }
}

// Platform configuration helpers
export const PLATFORM_CONFIG = {
  google: {
    name: 'Google My Business',
    icon: '🔍',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    setupUrl: 'https://console.cloud.google.com/apis/credentials',
    instructions: [
      'Go to Google Cloud Console',
      'Create OAuth 2.0 credentials',
      'Add redirect URI',
      'Copy Client ID to .env file',
    ],
  },
  facebook: {
    name: 'Facebook Business',
    icon: '📘',
    color: 'from-blue-600 to-blue-700',
    bgColor: 'bg-blue-600/20',
    textColor: 'text-blue-500',
    setupUrl: 'https://developers.facebook.com/apps',
    instructions: [
      'Create Facebook App',
      'Add Facebook Login product',
      'Configure OAuth settings',
      'Copy App ID to .env file',
    ],
  },
  yelp: {
    name: 'Yelp for Business',
    icon: '⭐',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    setupUrl: 'https://www.yelp.com/developers/v3/manage_app',
    instructions: [
      'Create Yelp Fusion app',
      'Get API Key',
      'Copy API Key to .env file',
      'No OAuth needed for Yelp',
    ],
  },
  tripadvisor: {
    name: 'TripAdvisor',
    icon: '🌎',
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    setupUrl: 'https://www.tripadvisorsupport.com/hc/en-us',
    instructions: [
      'Apply for Content API access',
      'Wait for approval',
      'Get API credentials',
      'Setup takes 2-3 weeks',
    ],
  },
};

// Check if platform is properly configured
export function isPlatformConfigured(platformId: string): boolean {
  const envVars: Record<string, string[]> = {
    google: ['NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    facebook: ['NEXT_PUBLIC_FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
    yelp: ['YELP_API_KEY'],
    tripadvisor: ['TRIPADVISOR_API_KEY'],
  };

  const required = envVars[platformId] || [];
  return required.every(varName => {
    const value = process.env[varName];
    return value && !value.includes('YOUR_');
  });
}
