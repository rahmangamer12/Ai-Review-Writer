import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Input validation schemas
const reviewIdSchema = z.string().uuid()
const createReviewSchema = z.object({
  content: z.string().min(1).max(5000),
  rating: z.number().min(1).max(5),
  author_name: z.string().max(200).optional(),
  author_email: z.string().email().optional(),
  platform: z.enum(['google', 'facebook', 'yelp', 'tripadvisor', 'trustpilot', 'manual']).default('manual'),
  sentiment_label: z.enum(['positive', 'neutral', 'negative']).optional()
})
const updateReviewSchema = z.object({
  reviewId: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected'])
})

// GET - Analyze a single review or get review details
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reviewId = searchParams.get('id')

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
    }

    // Validate UUID format
    const validatedId = reviewIdSchema.parse(reviewId)

    const { data: review, error } = await (supabase
      .from('reviews')
      .select('*') )
      .eq('id', validatedId)
      .eq('user_id', userId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get reply if exists
    const { data: reply } = await (supabase
      .from('replies')
      .select('*') )
      .eq('review_id', validatedId)
      .single()

    return NextResponse.json({ ...review, reply })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid review ID format', details: (error as any).issues || [] }, { status: 400 })
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

// POST - Create a new review
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createReviewSchema.parse(body)

    const {
      content,
      rating,
      author_name,
      author_email,
      platform,
      sentiment_label
    } = validated

    const { data: review, error } = await (supabase
      .from('reviews')
      .insert({
        user_id: userId,
        review_text: content,
        rating,
        reviewer_name: author_name,
        reviewer_email: author_email,
        platform,
        sentiment_label: sentiment_label || getSentimentFromRating(rating),
        status: 'pending',
      }) )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(review)
  } catch (error: unknown) { const message = error instanceof Error ? error.message : "Unknown error"; return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH - Update review status
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = updateReviewSchema.parse(body)

    const { reviewId, status } = validated

    // Verify review belongs to user
    const { data: existing } = await (supabase
      .from('reviews')
      .select('id') )
      .eq('id', reviewId)
      .eq('user_id', userId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const { data: review, error } = await (supabase
      .from('reviews')
      .update({ status, updated_at: new Date().toISOString() }) )
      .eq('id', reviewId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(review)
  } catch (error: unknown) { const message = error instanceof Error ? error.message : "Unknown error"; return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE - Delete a review
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reviewId = searchParams.get('id')

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
    }

    // Validate UUID format
    const validatedId = reviewIdSchema.parse(reviewId)

    // Verify review belongs to user
    const { data: existing } = await (supabase
      .from('reviews')
      .select('id') )
      .eq('id', validatedId)
      .eq('user_id', userId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Delete replies first (cascade should handle this but being explicit)
    await (supabase.from('replies').delete() ).eq('review_id', validatedId)

    // Delete review
    const { error } = await (supabase
      .from('reviews')
      .delete() )
      .eq('id', validatedId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid review ID format', details: (error as any).issues || [] }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function getSentimentFromRating(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive'
  if (rating === 3) return 'neutral'
  return 'negative'
}
