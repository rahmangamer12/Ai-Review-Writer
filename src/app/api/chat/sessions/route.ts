import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

/**
 * GET /api/chat/sessions
 * Fetch all sessions for history synchronization across devices.
 */
export async function GET() {
  try {
    const { userId } = await auth().catch(() => ({ userId: null }))
    if (!userId) {
      return NextResponse.json([])
    }

    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(sessions)
  } catch (err) {
    console.error('[Chat Session API] GET Error:', err)
    return NextResponse.json([])
  }
}

/**
 * POST /api/chat/sessions
 * Upsert a session or add a message.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, title, messages } = await req.json()

    // 1. If sessionId exists, update it. Otherwise create.
    const session = await prisma.chatSession.upsert({
      where: { id: sessionId || 'new' },
      update: { title, updatedAt: new Date() },
      create: {
        id: sessionId,
        userId,
        title: title || 'New Conversation'
      }
    })

    // 2. Sync messages (for simplicity, we replace or append)
    // In a real production app, you might want to save only the NEW message.
    if (messages && Array.isArray(messages)) {
      // Clear existing and rewrite (simplest sync for now)
      await prisma.chatMessage.deleteMany({ where: { sessionId: session.id } })
      
      await prisma.chatMessage.createMany({
        data: messages.map((m: any) => ({
          sessionId: session.id,
          role: m.role,
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
          createdAt: m.timestamp ? new Date(m.timestamp) : new Date()
        }))
      })
    }

    return NextResponse.json(session)
  } catch (err) {
    console.error('[Chat Session API] POST Error:', err)
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
  }
}

/**
 * DELETE /api/chat/sessions
 * Delete a specific session.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    await prisma.chatSession.delete({
      where: { id: sessionId, userId }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Chat Session API] DELETE Error:', err)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
