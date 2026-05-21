import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  category: z.enum(['bug', 'feature', 'general', 'support']).default('general'),
  message: z.string().trim().min(3, 'Feedback message is required').max(2000),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  pageUrl: z.string().trim().url().max(1000).optional().or(z.literal('')),
})

async function ensureUser(userId: string) {
  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (existing) return existing

  const clerkUser = await currentUser().catch(() => null)
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress

  if (!email) return null

  return prisma.user.upsert({
    where: { email },
    update: {
      name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || undefined,
    },
    create: {
      id: userId,
      email,
      name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || null,
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit(`feedback:${clientIp}`, RATE_LIMITS.AUTH)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    const parsed = feedbackSchema.safeParse(await req.json())

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid feedback',
          message: parsed.error.issues[0]?.message || 'Please check your feedback and try again.',
        },
        { status: 400 }
      )
    }

    const { userId } = await auth().catch(() => ({ userId: null }))
    const authedUser = userId ? await ensureUser(userId).catch(() => null) : null
    const data = parsed.data

    const feedback = await prisma.feedback.create({
      data: {
        userId: authedUser?.id || null,
        rating: data.rating,
        category: data.category,
        message: data.message,
        email: data.email || null,
        pageUrl: data.pageUrl || null,
        userAgent: req.headers.get('user-agent')?.slice(0, 500) || null,
      },
      select: { id: true },
    })

    if (userId) {
      await prisma.notification
        .create({
          data: {
            userId,
            type: 'feedback',
            title: 'Feedback submitted',
            message: `${data.category}: ${data.message.slice(0, 240)}`,
          },
        })
        .catch(() => null)
    }

    return NextResponse.json({
      success: true,
      id: feedback.id,
      message: 'Feedback submitted successfully.',
    })
  } catch (error) {
    console.error('[Feedback API] Error:', error)
    return NextResponse.json(
      { error: 'Server error', message: 'Feedback could not be submitted. Please try again later.' },
      { status: 500 }
    )
  }
}
