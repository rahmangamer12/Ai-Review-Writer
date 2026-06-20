import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { decryptSensitiveData, encryptSensitiveData } from '@/lib/encryption'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MAX_REFRESH_ATTEMPTS = 3
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    const connectedPlatform = await prisma.connectedPlatform.findFirst({
      where: { userId, platformType: platform },
    })

    if (!connectedPlatform) {
      return NextResponse.json({ error: 'No credentials found for this platform' }, { status: 404 })
    }

    const credentials = (connectedPlatform.credentials || {}) as Record<string, any>

    // Check if refresh is needed
    if (credentials.expiresAt && Date.now() < credentials.expiresAt - 60000) {
      return NextResponse.json({ message: 'Token still valid' })
    }

    // Check cooldown to prevent infinite loops
    const lastRefreshAttempt = credentials.lastRefreshAttempt || 0
    if (Date.now() - lastRefreshAttempt < REFRESH_COOLDOWN_MS) {
      return NextResponse.json({ 
        error: 'Rate limited. Please wait before retrying.' 
      }, { status: 429 })
    }

    // Decrypt the refresh token before using it
    const encryptedRefreshToken = credentials.refreshTokenEncrypted;
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
        const clientId = credentials.clientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
        let clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
        if (credentials.clientSecretEncrypted) {
          try {
            clientSecret = decryptSensitiveData(credentials.clientSecretEncrypted)
          } catch {
            return NextResponse.json({ error: 'Saved Google client secret could not be decrypted. Please reconnect Google.', requiresReauth: true }, { status: 401 })
          }
        }

        if (!clientId || !clientSecret) {
          return NextResponse.json({ error: 'Google OAuth client credentials missing. Please reconnect Google.', requiresReauth: true }, { status: 401 })
        }

        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
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
      } catch (_e) {
        refreshError = 'Network error during token refresh'
      }
    }

    if (refreshError) {
      await prisma.connectedPlatform.update({
        where: { id: connectedPlatform.id },
        data: {
          status: 'error',
          credentials: {
            ...credentials,
            lastRefreshAttempt: Date.now(),
            lastError: refreshError,
          },
        },
      })

      return NextResponse.json({
        error: refreshError,
        requiresReauth: true
      }, { status: 401 })
    }

    if (newTokens) {
      // Encrypt new tokens before storing
      const newEncryptedAccessToken = encryptSensitiveData(newTokens.access_token);

      await prisma.connectedPlatform.update({
        where: { id: connectedPlatform.id },
        data: {
          status: 'connected',
          credentials: {
            ...credentials,
            accessTokenEncrypted: newEncryptedAccessToken,
            expiresAt: Date.now() + (newTokens.expires_in * 1000),
            lastRefreshAttempt: null,
            lastError: null,
          },
          lastSyncedAt: new Date(),
        },
      })

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
