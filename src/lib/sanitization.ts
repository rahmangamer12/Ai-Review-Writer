/**
 * Input Sanitization Service
 * Pure vanilla implementation — no external dependencies needed.
 * Works on both server-side (Node) and client-side.
 */

export interface SanitizationOptions {
  allowedTags?: string[]
  stripHTML?: boolean
  maxLength?: number
  trimWhitespace?: boolean
}

const defaultOptions: SanitizationOptions = {
  stripHTML: true,
  maxLength: 5000,
  trimWhitespace: true,
}

export class SanitizationService {
  /**
   * Sanitize user input to prevent XSS attacks
   */
  static sanitizeInput(input: string, options: SanitizationOptions = {}): string {
    if (!input || typeof input !== 'string') return ''

    const mergedOptions = { ...defaultOptions, ...options }
    let sanitized = input

    // Trim whitespace
    if (mergedOptions.trimWhitespace) {
      sanitized = sanitized.trim()
    }

    // Strip ALL HTML tags
    if (mergedOptions.stripHTML) {
      sanitized = sanitized.replace(/<[^>]*>/g, '')
    }

    // Limit length
    if (mergedOptions.maxLength && sanitized.length > mergedOptions.maxLength) {
      sanitized = sanitized.substring(0, mergedOptions.maxLength)
    }

    // Remove potential XSS patterns (belt-and-suspenders)
    sanitized = sanitized
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:text\/html/gi, '')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/vbscript:/gi, '')

    return sanitized
  }

  /**
   * Sanitize review text specifically
   */
  static sanitizeReviewText(text: string): string {
    return this.sanitizeInput(text, {
      stripHTML: true,
      maxLength: 5000,
    })
  }

  /**
   * Sanitize user names / author names
   */
  static sanitizeUserName(name: string): string {
    return this.sanitizeInput(name, {
      stripHTML: true,
      maxLength: 200,
    })
  }

  /**
   * Sanitize platform names
   */
  static sanitizePlatformName(platform: string): string {
    return this.sanitizeInput(platform, {
      stripHTML: true,
      maxLength: 50,
    }).toLowerCase()
  }

  /**
   * Sanitize AI response fields that may contain user-generated data
   */
  static sanitizeAIResponse(response: unknown): unknown {
    if (typeof response === 'string') {
      return this.sanitizeInput(response)
    }
    if (typeof response !== 'object' || response === null) {
      return response
    }

    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(response as Record<string, unknown>)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value)
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeAIResponse(value)
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }

  /**
   * Validate that a string is a valid UUID
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  /**
   * Validate review rating (1–5)
   */
  static isValidRating(rating: unknown): boolean {
    const num = Number(rating)
    return !isNaN(num) && num >= 1 && num <= 5 && Number.isInteger(num)
  }

  /**
   * Validate platform name against allowed list
   */
  static isValidPlatform(platform: string): boolean {
    const allowed = ['google', 'facebook', 'yelp', 'tripadvisor', 'trustpilot', 'instagram', 'manual']
    return allowed.includes(platform.toLowerCase())
  }

  /**
   * Comprehensive validation + sanitization for review data
   */
  static validateReviewData(data: Record<string, unknown>): {
    isValid: boolean
    errors: string[]
    sanitizedData: Record<string, unknown>
  } {
    const errors: string[] = []
    const sanitizedData: Record<string, unknown> = {}

    // Validate review text
    const rawText = (data.reviewText || data.content) as string | undefined
    if (rawText) {
      if (typeof rawText !== 'string' || rawText.trim().length === 0) {
        errors.push('Review text is required and must be a non-empty string')
      } else {
        sanitizedData.reviewText = this.sanitizeReviewText(rawText)
        if ((sanitizedData.reviewText as string).length < 5) {
          errors.push('Review text must be at least 5 characters long')
        }
      }
    }

    // Validate rating
    if (data.rating !== undefined) {
      if (!this.isValidRating(data.rating)) {
        errors.push('Rating must be an integer between 1 and 5')
      } else {
        sanitizedData.rating = Number(data.rating)
      }
    }

    // Validate author name
    const rawName = (data.authorName || data.author_name || data.reviewer_name) as string | undefined
    if (rawName) {
      if (typeof rawName !== 'string' || rawName.trim().length === 0) {
        errors.push('Author name must be a non-empty string')
      } else {
        sanitizedData.authorName = this.sanitizeUserName(rawName)
      }
    }

    // Validate platform
    if (data.platform) {
      if (!this.isValidPlatform(data.platform as string)) {
        errors.push('Invalid platform specified')
      } else {
        sanitizedData.platform = this.sanitizePlatformName(data.platform as string)
      }
    }

    // Validate review ID format
    if (data.reviewId) {
      if (!this.isValidUUID(data.reviewId as string)) {
        errors.push('Invalid review ID format')
      } else {
        sanitizedData.reviewId = data.reviewId
      }
    }

    return { isValid: errors.length === 0, errors, sanitizedData }
  }
}

// Export singleton
export const sanitizationService = new SanitizationService()