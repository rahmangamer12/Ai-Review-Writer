import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { decryptSensitiveData, encryptSensitiveData } from '@/lib/encryption'

const MAX_REFRESH_ATTEMPTS = 3
const REFRESH_COOLDOWN_MS = 5000 // 5 seconds

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session.userId
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { platform } = body

    if (!platform) {
      return NextResponse.json({ error: 'Platform required' }, { status: 400 })
    }

    // Get current credentials
    const { data: credentials, error: dbError } = await supabase
      .from('platform_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single()

    if (dbError || !credentials) {
      return NextResponse.json({ error: 'No credentials found for this platform' }, { status: 404 })
    }

    // Check if refresh is needed
    if (credentials.expires_at && Date.now() < credentials.expires_at - 60000) {
      return NextResponse.json({ message: 'Token still valid' })
    }

    // Check cooldown to prevent infinite loops
    const lastRefreshAttempt = credentials.last_refresh_attempt || 0
    if (Date.now() - lastRefreshAttempt < REFRESH_COOLDOWN_MS) {
      return NextResponse.json({ 
        error: 'Rate limited. Please wait before retrying.' 
      }, { status: 429 })
    }

    // Decrypt the refresh token before using it
    const encryptedRefreshToken = credentials.refresh_token_encrypted || credentials.refresh_token;
    if (!encryptedRefreshToken) {
      return NextResponse.json({ error: 'No refresh token available', requiresReauth: true }, { status: 401 });
    }

    let refreshToken: string;
    try {
      refreshToken = decryptSensitiveData(encryptedRefreshToken);
    } catch {
      // Fallback: token might be plaintext (legacy)
      refreshToken = encryptedRefreshToken;
    }

    // Attempt refresh based on platform
    let newTokens = null
    let refreshError = null

    if (platform === 'google' && refreshToken) {
      try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          refreshError = errorData.error_description || 'Token refresh failed'
        } else {
          newTokens = await response.json()
        }
      } catch (e) {
        refreshError = 'Network error during token refresh'
      }
    }

    if (refreshError) {
      // Update refresh attempt timestamp
      await supabase
        .from('platform_credentials')
        .update({
          last_refresh_attempt: Date.now(),
          last_error: refreshError
        })
        .eq('user_id', userId)
        .eq('platform', platform)

      return NextResponse.json({
        error: refreshError,
        requiresReauth: true
      }, { status: 401 })
    }

    if (newTokens) {
      // Encrypt new tokens before storing
      const newEncryptedAccessToken = encryptSensitiveData(newTokens.access_token);

      // Update credentials with new ENCRYPTED tokens
      await supabase
        .from('platform_credentials')
        .update({
          access_token_encrypted: newEncryptedAccessToken,
          access_token: null, // Clear legacy plaintext field
          expires_at: Date.now() + (newTokens.expires_in * 1000),
          last_refresh_attempt: null,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('platform', platform)

      return NextResponse.json({ 
        success: true, 
        message: 'Tokens refreshed successfully' 
      })
    }

    return NextResponse.json({ error: 'Unknown error during refresh' }, { status: 500 })

  } catch (error: unknown) {
    console.error('Token refresh error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}