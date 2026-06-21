import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { decryptSensitiveData, encryptSensitiveData } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

function ratingToNumber(rating: string): number {
  const map: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }
  return map[rating] || 5
}

function sentimentFromRating(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive'
  if (rating === 3) return 'neutral'
  return 'negative'
}

function idPart(name: string, prefix: string) {
  return name.replace(prefix, '').replace(/^\//, '')
}

class GoogleApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GoogleApiError'
    this.status = status
  }
}

async function refreshGoogleToken(credentials: Record<string, any>) {
  const refreshTokenEncrypted = credentials.refreshTokenEncrypted
  if (!refreshTokenEncrypted) throw new Error('Google refresh token missing. Please reconnect Google.')

  const refreshToken = decryptSensitiveData(refreshTokenEncrypted)
  const clientId = credentials.clientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  const clientSecret = credentials.clientSecretEncrypted
    ? decryptSensitiveData(credentials.clientSecretEncrypted)
    : process.env.GOOGLE_CLIENT_SECRET || ''

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth client credentials missing. Please reconnect Google.')
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

  const data = await response.json()
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Google token refresh failed')
  }

  return {
    accessToken: data.access_token as string,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  }
}

async function googleJson(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new GoogleApiError(data.error?.message || `Google API failed with ${response.status}`, response.status)
  }
  return data
}

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const platform = await prisma.connectedPlatform.findFirst({
      where: { userId, platformType: 'google' },
    })

    if (!platform) {
      return NextResponse.json({ error: 'Google is not connected yet' }, { status: 404 })
    }

    const credentials = (platform.credentials || {}) as Record<string, any>
    const syncLockedUntil = Number(credentials.syncLockedUntil || 0)

    if (syncLockedUntil > Date.now()) {
      const retryAfter = Math.max(1, Math.ceil((syncLockedUntil - Date.now()) / 1000))
      return NextResponse.json(
        {
          error: `Google API quota is cooling down. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const lastSyncAttemptAt = Number(credentials.lastSyncAttemptAt || 0)
    if (lastSyncAttemptAt && Date.now() - lastSyncAttemptAt < 60_000) {
      const retryAfter = Math.max(1, Math.ceil((60_000 - (Date.now() - lastSyncAttemptAt)) / 1000))
      return NextResponse.json(
        {
          error: `Please wait ${retryAfter} seconds before syncing Google again.`,
          retryAfter,
        },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    if (!credentials.accessTokenEncrypted) {
      return NextResponse.json(
        { error: 'Google is not connected via OAuth. Please reconnect Google to sync reviews.', requiresReauth: true },
        { status: 400 }
      )
    }

    let accessToken = decryptSensitiveData(credentials.accessTokenEncrypted)
    let updatedCredentials: Record<string, any> = { ...credentials, lastSyncAttemptAt: Date.now() }

    await prisma.connectedPlatform.update({
      where: { id: platform.id },
      data: { credentials: updatedCredentials },
    })

    if (!credentials.expiresAt || Date.now() > Number(credentials.expiresAt) - 60_000) {
      const refreshed = await refreshGoogleToken(credentials)
      accessToken = refreshed.accessToken
      updatedCredentials = {
        ...updatedCredentials,
        accessTokenEncrypted: encryptSensitiveData(refreshed.accessToken),
        expiresAt: refreshed.expiresAt,
        lastError: null,
      }
    }

    let accountId = credentials.accountId as string | undefined
    let locationId = credentials.locationId as string | undefined
    let locationName = credentials.locationName as string | undefined

    if (!accountId || !locationId) {
      const accountsData = await googleJson('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', accessToken)
      const account = accountsData.accounts?.[0]
      if (!account?.name) {
        return NextResponse.json({ error: 'No Google Business Profile account found for this user' }, { status: 404 })
      }

      const locationsData = await googleJson(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title`,
        accessToken
      )
      const location = locationsData.locations?.[0]
      if (!location?.name) {
        return NextResponse.json({ error: 'No Google Business location found for this account' }, { status: 404 })
      }

      accountId = idPart(account.name, 'accounts/')
      locationId = idPart(location.name, 'locations/')
      locationName = location.title || location.name
    }

    const reviewsData = await googleJson(
      `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`,
      accessToken
    )

    let synced = 0
    for (const review of reviewsData.reviews || []) {
      const rating = ratingToNumber(review.starRating)
      const externalId = review.reviewId || `${review.createTime}:${review.reviewer?.displayName || 'anonymous'}`
      const reviewId = `${userId}:${platform.id}:${externalId}`.slice(0, 500)

      await prisma.review.upsert({
        where: { id: reviewId },
        update: {
          authorName: review.reviewer?.displayName || 'Google Customer',
          content: review.comment || '',
          rating,
          sentimentLabel: sentimentFromRating(rating),
          sourceDate: review.createTime ? new Date(review.createTime) : new Date(),
          aiReplyText: review.reviewReply?.comment || undefined,
        },
        create: {
          id: reviewId,
          userId,
          platformId: platform.id,
          authorName: review.reviewer?.displayName || 'Google Customer',
          content: review.comment || '',
          rating,
          sentimentLabel: sentimentFromRating(rating),
          sourceDate: review.createTime ? new Date(review.createTime) : new Date(),
          status: review.reviewReply?.comment ? 'AI_replied' : 'pending',
          aiReplyText: review.reviewReply?.comment || undefined,
        },
      })
      synced += 1
    }

    await prisma.connectedPlatform.update({
      where: { id: platform.id },
      data: {
        status: 'connected',
        credentials: {
          ...updatedCredentials,
          accountId,
          locationId,
          locationName,
          syncLockedUntil: null,
          lastError: null,
        },
        lastSyncedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      synced,
      accountId,
      locationId,
      locationName,
      message: synced ? `Synced ${synced} Google reviews.` : 'Google connected, but no reviews were found yet.',
    })
  } catch (error) {
    console.error('[Google Sync] Error:', error)

    if (error instanceof GoogleApiError && error.status === 429) {
      const retryAfter = 60

      try {
        const { userId } = await auth()
        if (userId) {
          const platform = await prisma.connectedPlatform.findFirst({
            where: { userId, platformType: 'google' },
          })
          if (platform) {
            await prisma.connectedPlatform.update({
              where: { id: platform.id },
              data: {
                status: 'error',
                credentials: {
                  ...((platform.credentials || {}) as Record<string, any>),
                  syncLockedUntil: Date.now() + retryAfter * 1000,
                  lastError: error.message,
                },
              },
            })
          }
        }
      } catch {
        // Best-effort quota lock save.
      }

      return NextResponse.json(
        {
          error: 'Google Business Profile quota limit reached. Please wait about 1 minute, then sync again.',
          details: error.message,
          retryAfter,
        },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Google sync failed' },
      { status: 500 }
    )
  }
}
