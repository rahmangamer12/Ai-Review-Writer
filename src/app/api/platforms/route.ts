import { NextRequest, NextResponse } from 'next/server'
import { PlatformIntegrationManager } from '@/lib/platformIntegrations'
import { auth } from '@clerk/nextjs/server'

// GET /api/platforms - Get all platforms and their connection status
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const platforms = PlatformIntegrationManager.getPlatforms()
    return NextResponse.json({ platforms })
  } catch (error) {
    console.error('Error fetching platforms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platforms' },
      { status: 500 }
    )
  }
}

// POST /api/platforms/test - Test platform connection
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platformId, credentials } = await request.json()

    if (!platformId || !credentials) {
      return NextResponse.json(
        { error: 'Missing platformId or credentials' },
        { status: 400 }
      )
    }

    const result = await PlatformIntegrationManager.testConnection(platformId, credentials)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error testing connection:', error)
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    )
  }
}

// PUT /api/platforms/save - Save platform configuration
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platformId, credentials } = await request.json()

    if (!platformId || !credentials) {
      return NextResponse.json(
        { error: 'Missing platformId or credentials' },
        { status: 400 }
      )
    }

    const success = PlatformIntegrationManager.savePlatform(platformId, credentials)

    if (success) {
      return NextResponse.json({ success: true, message: 'Platform saved successfully' })
    } else {
      return NextResponse.json(
        { error: 'Failed to save platform' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error saving platform:', error)
    return NextResponse.json(
      { error: 'Failed to save platform' },
      { status: 500 }
    )
  }
}

// DELETE /api/platforms/disconnect - Disconnect a platform
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const platformId = searchParams.get('platformId')

    if (!platformId) {
      return NextResponse.json(
        { error: 'Missing platformId' },
        { status: 400 }
      )
    }

    const success = PlatformIntegrationManager.disconnectPlatform(platformId)

    if (success) {
      return NextResponse.json({ success: true, message: 'Platform disconnected' })
    } else {
      return NextResponse.json(
        { error: 'Failed to disconnect platform' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error disconnecting platform:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect platform' },
      { status: 500 }
    )
  }
}
