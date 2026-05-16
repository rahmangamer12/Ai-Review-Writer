import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import { withCSRFProtection } from '@/lib/csrfProtection'

export const dynamic = 'force-dynamic'

const reviewSchema = z.object({
  id: z.string().min(1).max(300),
  content: z.string().max(5000).optional(),
  text: z.string().max(5000).optional(),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  author: z.string().max(200).optional(),
  author_name: z.string().max(200).optional(),
  date: z.string().max(100).optional(),
  sentimentLabel: z.enum(['positive', 'negative', 'neutral']).optional(),
})

const syncSchema = z.object({
  platformId: z.string().uuid(),
  newReviews: z.array(reviewSchema).max(100),
})

function buildInternalReviewId(userId: string, platformId: string, externalId: string) {
  return `${userId}:${platformId}:${externalId}`.slice(0, 500)
}

function parseSourceDate(value?: string) {
  if (!value) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

async function handler(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { platformId, newReviews } = syncSchema.parse(body)

    const platform = await prisma.connectedPlatform.findFirst({
      where: { id: platformId, userId },
      select: { id: true },
    })

    if (!platform) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 })
    }

    let successCount = 0;
    for (const rw of newReviews) {
      try {
        const internalReviewId = buildInternalReviewId(userId, platformId, rw.id)

        await prisma.review.upsert({
          where: {
            id: internalReviewId,
          },
          update: {
            content: rw.content || rw.text || '',
            rating: rw.rating,
            authorName: rw.author || rw.author_name || 'Anonymous',
            sourceDate: parseSourceDate(rw.date),
          },
          create: {
            id: internalReviewId,
            userId,
            platformId,
            authorName: rw.author || rw.author_name || 'Anonymous',
            content: rw.content || rw.text || '',
            rating: rw.rating,
            sourceDate: parseSourceDate(rw.date),
            sentimentLabel: rw.sentimentLabel || 'neutral',
            status: 'pending'
          }
        })
        successCount++;
      } catch (upsertError) {
        console.error(`Failed to upsert review ${rw.id}:`, upsertError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synced ${successCount} reviews from ${platformId}` 
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid sync payload', details: error.issues }, { status: 400 })
    }
    console.error('Platform sync error:', error)
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 })
  }
}

export const POST = withCSRFProtection(handler)
