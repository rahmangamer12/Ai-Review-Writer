# 🔧 REFACTORED CODE SOLUTIONS

## Critical Fix #1: Remove Mock Data Fallback from Test Review Generation

**File**: `src/app/api/reviews/generate-test/route.ts`

### BEFORE (Problematic):
```typescript
// Lines 44-96: Generates FAKE reviews when AI fails
catch (aiError) {
  console.error(`[Generate Test Reviews] AI failed for review ${i + 1}, using fallback:`, aiError)
  
  // Fallback if AI fails - GENERATES FAKE DATA!
  const sampleNames = ['John Smith', 'Sarah Johnson', ...]
  const templates: Record<number, string[]> = { ... }
  
  const content = templates[rating]?.[Math.floor(Math.random() * templates[rating].length)]
  reviews.push({
    id: `ai-${Date.now()}-${i}`,
    author_name: name,
    content,
    sentiment_label: sentiment,
    ai_reply: aiReply,
    status: 'pending',
  })
}
```

### AFTER (Fixed):
```typescript
// src/app/api/reviews/generate-test/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { longcatAI } from '@/lib/longcatAI'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { count = 5, platform = 'google', ratingRange = 'mixed', businessType = 'restaurant' } = body

    console.log(`[Generate Test Reviews] Generating ${count} reviews using LongCat AI`)

    const reviews = []
    const failedReviews = []

    for (let i = 0; i < count; i++) {
      let rating: number
      if (ratingRange === 'mixed') {
        rating = Math.floor(Math.random() * 5) + 1
      } else {
        rating = parseInt(ratingRange)
      }

      try {
        // Use REAL LongCat AI to generate review
        const generated = await longcatAI.generateTestReview(platform, rating, businessType)
        
        reviews.push({
          id: `ai-${Date.now()}-${i}`,
          author_name: generated.author_name,
          platform,
          rating,
          content: generated.content,
          sentiment_label: generated.sentiment,
          ai_reply: generated.ai_reply,
          status: 'pending',
        })
        
        console.log(`[Generate Test Reviews] Generated review ${i + 1}/${count}`)
      } catch (aiError) {
        // ✅ FIXED: Return error instead of generating fake data
        console.error(`[Generate Test Reviews] AI failed for review ${i + 1}:`, aiError)
        failedReviews.push({
          index: i + 1,
          error: aiError instanceof Error ? aiError.message : 'Unknown error'
        })
      }
    }

    // ✅ Check if all reviews failed
    if (reviews.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'AI service unavailable',
        message: 'Could not generate any reviews. Please try again later.',
        failedCount: failedReviews.length,
        details: failedReviews
      }, { status: 503 })
    }

    // ✅ Return partial success if some failed
    return NextResponse.json({ 
      success: true,
      reviews,
      generated: reviews.length,
      failed: failedReviews.length,
      warning: failedReviews.length > 0 ? 'Some reviews failed to generate' : undefined,
      ai_provider: 'LongCat AI',
      generated_at: new Date().toISOString()
    })
  } catch (error: unknown) {
    console.error('[Generate Test Reviews Error]:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: message,
      success: false 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Test Review Generator API is running',
    ai_provider: 'LongCat AI',
    max_reviews: 20,
    timestamp: new Date().toISOString()
  })
}
```

---

## Critical Fix #2: Fix HTTP Status Codes in Chat API

**File**: `src/app/api/chat/route.ts`

### BEFORE:
```typescript
catch (error: unknown) {
  console.error('[Chat API Error]:', error)
  return NextResponse.json({
    content: "I apologize, but I'm having trouble...",
    success: false 
  }, { status: 200 })  // 🔴 WRONG: Returns 200 on error
}
```

### AFTER:
```typescript
catch (error: unknown) {
  console.error('[Chat API Error]:', error)
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  
  return NextResponse.json({
    content: "I apologize, but I'm having trouble connecting to my AI brain right now. Please try again in a moment!",
    error: errorMessage,  // ✅ Include error details
    success: false,
    fallback: true  // ✅ Client knows this is a fallback
  }, { status: 503 })  // ✅ Correct error status
}
```

---

## Critical Fix #3: Fix Empty Refresh Token in Google API

**File**: `src/app/api/platforms/google/reviews/route.ts`

### BEFORE:
```typescript
const api = new GoogleReviewsAPI({
  accountId,
  locationId,
  accessToken,
  refreshToken: '',  // 🔴 Always empty!
})
```

### AFTER:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GoogleReviewsAPI } from '@/lib/integrations/googleReviews'
import { longcatAI } from '@/lib/longcatAI'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session.userId
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const locationId = searchParams.get('locationId')
    const accessToken = searchParams.get('accessToken')

    if (!accessToken || !accountId || !locationId) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 })
    }

    // ✅ FIXED: Fetch refresh token from database
    let refreshToken = ''
    try {
      const { data: connection } = await supabase
        .from('platform_connections')
        .select('refresh_token')
        .eq('user_id', userId)
        .eq('platform', 'google')
        .single()
      
      if (connection?.refresh_token) {
        refreshToken = connection.refresh_token
      }
    } catch (dbError) {
      console.warn('Could not fetch refresh token from database:', dbError)
    }

    const api = new GoogleReviewsAPI({
      accountId,
      locationId,
      accessToken,
      refreshToken,  // ✅ Real token from database
    })

    const reviews = await api.fetchReviews()

    return NextResponse.json({
      success: true,
      reviews: reviews.map(r => ({
        id: r.reviewId,
        author: r.reviewer.displayName,
        rating: GoogleReviewsAPI.ratingToNumber(r.starRating),
        text: r.comment || '',
        platform: 'google',
        date: r.createTime,
        hasReply: !!r.reviewReply,
      })),
    })
  } catch (error: unknown) {
    console.error('Error fetching Google reviews:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session.userId
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reviewId, replyText, accountId, locationId, accessToken, autoGenerate, reviewData } = body

    if (!reviewId || !accountId || !locationId || !accessToken) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // ✅ Fetch refresh token
    let refreshToken = ''
    try {
      const { data: connection } = await supabase
        .from('platform_connections')
        .select('refresh_token')
        .eq('user_id', userId)
        .eq('platform', 'google')
        .single()
      
      if (connection?.refresh_token) {
        refreshToken = connection.refresh_token
      }
    } catch (dbError) {
      console.warn('Could not fetch refresh token:', dbError)
    }

    let finalReplyText = replyText

    if (autoGenerate && reviewData) {
      const sentiment = await longcatAI.analyzeSentiment(reviewData.text)
      const tone = sentiment.sentiment === 'negative' ? 'apologetic' : 
                   sentiment.sentiment === 'positive' ? 'enthusiastic' : 'friendly'
      
      const aiResponse = await longcatAI.generateReviewResponse(
        reviewData.text,
        reviewData.rating,
        sentiment.sentiment,
        tone
      )
      
      finalReplyText = aiResponse.response
    }

    if (!finalReplyText) {
      return NextResponse.json({ error: 'Reply text required' }, { status: 400 })
    }

    const api = new GoogleReviewsAPI({
      accountId,
      locationId,
      accessToken,
      refreshToken,  // ✅ Real token
    })

    const posted = await api.postReply(reviewId, finalReplyText)

    return NextResponse.json({
      success: true,
      posted,
      replyText: finalReplyText,
    })
  } catch (error: unknown) {
    console.error('Error posting reply:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

---

## Critical Fix #4: Add Proper Error Handling to Platform Integration

**File**: `src/lib/platformIntegrations.ts` (fetchReviews method)

### BEFORE:
```typescript
async fetchReviews(platformId: string): Promise<any[]> {
  // ... code ...
  
  // Google
  if (platformId === 'google') {
    try {
      const res = await fetch(...)
      // ... code ...
    } catch (e) {
      console.error('Error fetching Google reviews:', e)
    }
    return []  // 🔴 Returns empty array on error
  }
  
  return []
}
```

### AFTER:
```typescript
// Add this interface near the top
export interface FetchResult<T = any> {
  success: boolean
  data: T[]
  error?: {
    platform: string
    message: string
    code: string
    timestamp: string
  }
}

// Replace fetchReviews method:
async fetchReviews(platformId: string): Promise<FetchResult> {
  const platform = this.getPlatforms().find(p => p.id === platformId)
  
  if (!platform || !platform.connected) {
    return {
      success: false,
      data: [],
      error: {
        platform: platformId,
        message: 'Platform not connected',
        code: 'NOT_CONNECTED',
        timestamp: new Date().toISOString()
      }
    }
  }

  const { credentials } = platform

  // Google Reviews
  if (platformId === 'google') {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${credentials.placeId}&fields=reviews&key=${credentials.apiKey}`
      )
      
      if (!res.ok) {
        throw new Error(`Google API error: ${res.status}`)
      }
      
      const data = await res.json()
      
      if (data.error_message) {
        throw new Error(data.error_message)
      }
      
      if (data.result?.reviews) {
        return {
          success: true,
          data: data.result.reviews.map((r: any) => ({
            id: r.author_name + '-' + r.time,
            content: r.text,
            rating: r.rating,
            author: r.author_name,
            date: new Date(r.time * 1000).toISOString(),
            platform: 'google'
          }))
        }
      }
      
      return { success: true, data: [] }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error fetching Google reviews:', message)
      return {
        success: false,
        data: [],
        error: {
          platform: 'google',
          message,
          code: 'FETCH_FAILED',
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  // Similar pattern for other platforms...
  // Yelp, Facebook, TripAdvisor, Trustpilot
  
  return {
    success: false,
    data: [],
    error: {
      platform: platformId,
      message: 'Unknown platform',
      code: 'UNKNOWN_PLATFORM',
      timestamp: new Date().toISOString()
    }
  }
}
```

---

## Critical Fix #5: Add Real Credential Validation

**File**: New validation utility file

### CREATE: `src/lib/credentialValidator.ts`

```typescript
/**
 * Credential Validation Service
 * Validates platform credentials against real APIs
 */

export interface ValidationResult {
  valid: boolean
  message: string
  details?: Record<string, any>
}

export class CredentialValidator {
  /**
   * Validate Google API credentials
   */
  static async validateGoogle(apiKey: string, placeId: string): Promise<ValidationResult> {
    try {
      // Check format
      if (!apiKey.startsWith('AIza')) {
        return {
          valid: false,
          message: 'Invalid Google API key format (should start with "AIza")'
        }
      }

      // Test against real API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name&key=${apiKey}`,
        { signal: AbortSignal.timeout(5000) }
      )

      const data = await response.json()

      if (data.error_message) {
        return {
          valid: false,
          message: `Google API error: ${data.error_message}`
        }
      }

      if (data.status === 'OK') {
        return {
          valid: true,
          message: 'Google credentials are valid',
          details: { placeName: data.result?.name }
        }
      }

      return {
        valid: false,
        message: `Google API returned status: ${data.status}`
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validation failed'
      return {
        valid: false,
        message: `Failed to validate Google credentials: ${message}`
      }
    }
  }

  /**
   * Validate Yelp API credentials
   */
  static async validateYelp(apiKey: string, businessId: string): Promise<ValidationResult> {
    try {
      // Check format
      if (apiKey.length < 30) {
        return {
          valid: false,
          message: 'Invalid Yelp API key format (too short)'
        }
      }

      // Test against real API
      const response = await fetch(
        `https://api.yelp.com/v3/businesses/${businessId}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(5000)
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          return {
            valid: false,
            message: 'Invalid Yelp API key'
          }
        }
        if (response.status === 404) {
          return {
            valid: false,
            message: 'Business not found on Yelp'
          }
        }
      }

      const data = await response.json()

      return {
        valid: true,
        message: 'Yelp credentials are valid',
        details: { businessName: data.name }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validation failed'
      return {
        valid: false,
        message: `Failed to validate Yelp credentials: ${message}`
      }
    }
  }

  /**
   * Validate Facebook credentials
   */
  static async validateFacebook(accessToken: string, pageId: string): Promise<ValidationResult> {
    try {
      // Check format
      if (!accessToken.startsWith('EAA')) {
        return {
          valid: false,
          message: 'Invalid Facebook access token format'
        }
      }

      // Test against real API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?access_token=${accessToken}`,
        { signal: AbortSignal.timeout(5000) }
      )

      if (!response.ok) {
        if (response.status === 401) {
          return {
            valid: false,
            message: 'Invalid Facebook access token'
          }
        }
        if (response.status === 404) {
          return {
            valid: false,
            message: 'Facebook page not found'
          }
        }
      }

      const data = await response.json()

      if (data.error) {
        return {
          valid: false,
          message: `Facebook error: ${data.error.message}`
        }
      }

      return {
        valid: true,
        message: 'Facebook credentials are valid',
        details: { pageName: data.name }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validation failed'
      return {
        valid: false,
        message: `Failed to validate Facebook credentials: ${message}`
      }
    }
  }

  /**
   * Validate TripAdvisor credentials
   */
  static async validateTripAdvisor(apiKey: string, locationId: string): Promise<ValidationResult> {
    try {
      // Test against real API
      const response = await fetch(
        `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?key=${apiKey}`,
        { signal: AbortSignal.timeout(5000) }
      )

      if (!response.ok) {
        return {
          valid: false,
          message: `TripAdvisor API error: ${response.status}`
        }
      }

      const data = await response.json()

      if (data.errors) {
        return {
          valid: false,
          message: `TripAdvisor error: ${data.errors[0]}`
        }
      }

      return {
        valid: true,
        message: 'TripAdvisor credentials are valid',
        details: { locationName: data.name }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validation failed'
      return {
        valid: false,
        message: `Failed to validate TripAdvisor credentials: ${message}`
      }
    }
  }

  /**
   * Validate Trustpilot credentials
   */
  static async validateTrustpilot(apiKey: string, businessUnitId: string): Promise<ValidationResult> {
    try {
      // Test against real API
      const response = await fetch(
        `https://api.trustpilot.com/v1/business-units/${businessUnitId}`,
        {
          headers: { 'ApiKey': apiKey },
          signal: AbortSignal.timeout(5000)
        }
      )

      if (!response.ok) {
        return {
          valid: false,
          message: `Trustpilot API error: ${response.status}`
        }
      }

      const data = await response.json()

      if (data.error) {
        return {
          valid: false,
          message: `Trustpilot error: ${data.error}`
        }
      }

      return {
        valid: true,
        message: 'Trustpilot credentials are valid',
        details: { businessName: data.name }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validation failed'
      return {
        valid: false,
        message: `Failed to validate Trustpilot credentials: ${message}`
      }
    }
  }

  /**
   * Generic validation router
   */
  static async validate(platform: string, credentials: Record<string, string>): Promise<ValidationResult> {
    switch (platform) {
      case 'google':
        return this.validateGoogle(credentials.apiKey, credentials.placeId)
      case 'yelp':
        return this.validateYelp(credentials.apiKey, credentials.businessId)
      case 'facebook':
        return this.validateFacebook(credentials.pageAccessToken, credentials.pageId)
      case 'tripadvisor':
        return this.validateTripAdvisor(credentials.apiKey, credentials.locationId)
      case 'trustpilot':
        return this.validateTrustpilot(credentials.apiKey, credentials.businessUnitId)
      default:
        return {
          valid: false,
          message: `Unknown platform: ${platform}`
        }
    }
  }
}
```

---

## Summary of Fixes Applied

✅ **Test Review Generation**: Removed mock data fallback, returns error instead
✅ **Chat API**: Fixed HTTP status codes (503 instead of 200 for errors)
✅ **Google Reviews**: Fixed empty refresh token by fetching from database
✅ **Platform Integration**: Proper error objects instead of empty arrays
✅ **Credential Validation**: Added real API validation service

These fixes address **5 critical issues** preventing production deployment.

See COMPREHENSIVE_AUDIT_REPORT.md for complete details and additional fixes needed.
