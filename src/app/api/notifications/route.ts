import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { z } from 'zod'

const createNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(['info', 'success', 'warning', 'error', 'urgent']).default('info'),
})

function normalizeNotification(notification: any) {
  return {
    id: notification.id,
    user_id: notification.userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: notification.read,
    created_at: notification.createdAt?.toISOString?.() || notification.createdAt,
    updated_at: notification.updatedAt?.toISOString?.() || notification.updatedAt,
  }
}

// GET - Fetch user notifications
export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(notifications.map(normalizeNotification))
  } catch (error: unknown) {
    console.error('Notifications API error:', error)
    return NextResponse.json({ error: 'Server error fetching notifications' }, { status: 500 })
  }
}

// POST - Create a notification
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = createNotificationSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const data = await prisma.notification.create({
      data: {
        userId,
        title: parsed.data.title,
        message: parsed.data.message,
        type: parsed.data.type,
        read: false,
      },
    })

    return NextResponse.json(normalizeNotification(data))
  } catch (error: unknown) {
    console.error('[Notifications API Error]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
