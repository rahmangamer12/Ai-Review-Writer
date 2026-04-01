/**
 * API Key validation utilities
 * Validates API keys before storing them
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate Google API credentials
 */
export async function validateGoogleCredentials(credentials: {
  client_id?: string
  client_secret?: string
  access_token?: string
  refresh_token?: string
}): Promise<ValidationResult> {
  try {
    // Basic format validation
    if (!credentials.client_id?.trim()) {
      return { valid: false, error: 'Google Client ID is missing' }
    }
    
    if (!credentials.client_secret?.trim()) {
      return { valid: false, error: 'Google Client Secret is missing' }
    }

    if (!credentials.access_token?.trim() && !credentials.refresh_token?.trim()) {
      return { valid: false, error: 'At least one of access_token or refresh_token is required' }
    }

    // Check format: Google tokens should be reasonably long strings
    if (credentials.access_token && credentials.access_token.length < 10) {
      return { valid: false, error: 'Google access_token appears to be invalid (too short)' }
    }

    if (credentials.refresh_token && credentials.refresh_token.length < 10) {
      return { valid: false, error: 'Google refresh_token appears to be invalid (too short)' }
    }

    return { valid: true }
  } catch (error) {
    return { 
      valid: false, 
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * Validate Facebook API credentials
 */
export async function validateFacebookCredentials(credentials: {
  access_token?: string
  app_id?: string
}): Promise<ValidationResult> {
  try {
    if (!credentials.access_token?.trim()) {
      return { valid: false, error: 'Facebook access_token is missing' }
    }

    // Facebook tokens are typically very long
    if (credentials.access_token.length < 20) {
      return { valid: false, error: 'Facebook access_token appears to be invalid (too short)' }
    }

    return { valid: true }
  } catch (error) {
    return { 
      valid: false, 
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * Validate Yelp API credentials
 */
export async function validateYelpCredentials(credentials: {
  access_token?: string
}): Promise<ValidationResult> {
  try {
    if (!credentials.access_token?.trim()) {
      return { valid: false, error: 'Yelp access_token is missing' }
    }

    if (credentials.access_token.length < 20) {
      return { valid: false, error: 'Yelp access_token appears to be invalid (too short)' }
    }

    return { valid: true }
  } catch (error) {
    return { 
      valid: false, 
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * Generic API key validator
 */
export async function validateApiKey(apiKey: string, minLength: number = 10): Promise<ValidationResult> {
  try {
    if (!apiKey?.trim()) {
      return { valid: false, error: 'API key is missing or empty' }
    }

    if (apiKey.length < minLength) {
      return { 
        valid: false, 
        error: `API key is too short (minimum ${minLength} characters)` 
      }
    }

    // Check for obviously invalid patterns
    if (apiKey.includes(' ')) {
      return { valid: false, error: 'API key contains spaces (invalid format)' }
    }

    return { valid: true }
  } catch (error) {
    return { 
      valid: false, 
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}
