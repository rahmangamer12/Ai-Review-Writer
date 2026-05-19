import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { encryptSensitiveData } from '@/lib/encryption'
import { PlatformIntegrationManager, platformDefinitions } from '@/lib/platformIntegrations'

export const dynamic = 'force-dynamic'

async function getAuthedUserId() {
  const { userId } = await auth()
  return userId
}

async function ensureUser(userId: string) {
  const clerkUser = await currentUser().catch(() => null)
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@autoreview.local`
  const name = clerkUser?.fullName || clerkUser?.firstName || null

  await prisma.user.upsert({
    where: { id: userId },
    update: { email, name },
    create: { id: userId, email, name },
  })
}

function publicPlatform(platformId: string, dbPlatform?: any) {
  const definition = platformDefinitions[platformId]
  if (!definition) return null

  const connected = dbPlatform?.status === 'connected'
  return {
    id: platformId,
    name: definition.name,
    icon: definition.icon,
    description: definition.description,
    connected,
    credentials: {},
    lastSync: dbPlatform?.lastSyncedAt?.toISOString?.(),
    status: connected ? 'connected' : dbPlatform?.status || 'disconnected',
    errorMessage: dbPlatform?.status === 'error' ? 'Connection needs attention' : undefined,
  }
}

export async function GET() {
  try {
    const userId = await getAuthedUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const connected = await prisma.connectedPlatform.findMany({
      where: { userId },
      select: {
        platformType: true,
        status: true,
        lastSyncedAt: true,
      },
    })

    const byType = new Map(connected.map((item) => [item.platformType, item]))
    const platforms = Object.keys(platformDefinitions)
      .map((platformId) => publicPlatform(platformId, byType.get(platformId)))
      .filter(Boolean)

    return NextResponse.json({ platforms })
  } catch (error) {
    console.error('Error fetching platforms:', error)
    return NextResponse.json({ error: 'Failed to fetch platforms' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthedUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { platformId, credentials } = await request.json()
    if (!platformId || !credentials) {
      return NextResponse.json({ error: 'Missing platformId or credentials' }, { status: 400 })
    }

    const validationError = PlatformIntegrationManager.validateCredentials(platformId, credentials)
    if (validationError) {
      return NextResponse.json({ success: false, message: validationError }, { status: 400 })
    }

    if (platformId === 'facebook') {
      return NextResponse.json({
        success: true,
        message: 'Facebook credentials format is valid. Meta may still block OAuth until app mode, page permissions, and business verification are approved.',
      })
    }

    if (platformId === 'google') {
      return NextResponse.json({
        success: true,
        message: 'Google OAuth credentials format is valid. Continue with OAuth to connect a Google Business Profile.',
      })
    }

    return NextResponse.json({
      success: true,
      message: `${platformDefinitions[platformId]?.name || platformId} credentials format is valid. Save to connect.`,
    })
  } catch (error) {
    console.error('Error testing connection:', error)
    return NextResponse.json({ error: 'Failed to test connection' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthedUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { platformId, credentials } = await request.json()
    if (!platformId || !credentials) {
      return NextResponse.json({ error: 'Missing platformId or credentials' }, { status: 400 })
    }

    const validationError = PlatformIntegrationManager.validateCredentials(platformId, credentials)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    await ensureUser(userId)
    const encryptedCredentials = encryptSensitiveData(JSON.stringify(credentials))

    await prisma.connectedPlatform.upsert({
      where: {
        userId_platformType: {
          userId,
          platformType: platformId,
        },
      },
      update: {
        status: 'connected',
        credentials: { encrypted: encryptedCredentials, mode: 'api-key' },
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        platformType: platformId,
        status: 'connected',
        credentials: { encrypted: encryptedCredentials, mode: 'api-key' },
      },
    })

    return NextResponse.json({ success: true, message: 'Platform saved successfully' })
  } catch (error) {
    console.error('Error saving platform:', error)
    return NextResponse.json({ error: 'Failed to save platform' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthedUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const platformId = searchParams.get('platformId')
    if (!platformId) return NextResponse.json({ error: 'Missing platformId' }, { status: 400 })

    await prisma.connectedPlatform.deleteMany({
      where: {
        userId,
        platformType: platformId,
      },
    })

    return NextResponse.json({ success: true, message: 'Platform disconnected' })
  } catch (error) {
    console.error('Error disconnecting platform:', error)
    return NextResponse.json({ error: 'Failed to disconnect platform' }, { status: 500 })
  }
}
