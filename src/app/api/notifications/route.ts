import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

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

    const body = await req.json()
    const { title, message, type = 'info' } = body

    const data = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        read: false,
      },
    })

    return NextResponse.json(normalizeNotification(data))
  } catch (error: unknown) {
    console.error('[Notifications API Error]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
