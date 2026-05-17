import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { longcatAI } from '@/lib/longcatAI'

const generateTestSchema = z.object({
  count: z.coerce.number().int().min(1).max(20).default(5),
  platform: z.enum(['google', 'facebook', 'yelp', 'tripadvisor', 'trustpilot', 'manual']).default('google'),
  ratingRange: z.string().default('mixed'),
  businessType: z.string().min(2).max(80).default('restaurant'),
})

const names = [
  'Ayesha Khan',
  'Michael Carter',
  'Sajid Iqbal',
  'Fatima Noor',
  'Daniel Brooks',
  'Mian Hassan',
  'Sarah Wilson',
  'Hina Ahmed',
]

function ratingFromRange(range: string, index: number): number {
  const fixed = Number(range)
  if (Number.isInteger(fixed) && fixed >= 1 && fixed <= 5) return fixed
  const mixed = [5, 4, 3, 2, 5, 4, 1, 3]
  return mixed[index % mixed.length]
}

function sentimentFromRating(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive'
  if (rating <= 2) return 'negative'
  return 'neutral'
}

function fallbackReview(platform: string, rating: number, businessType: string, index: number) {
  const sentiment = sentimentFromRating(rating)
  const author = names[index % names.length]
  const positive = `Great experience at this ${businessType}. The team was helpful, everything felt smooth, and I would happily come back again.`
  const neutral = `The ${businessType} was okay overall. Some parts were good, but there is room to improve the speed and consistency.`
  const negative = `I was disappointed with my visit to this ${businessType}. The service felt slow and the issue was not handled as well as I expected.`
  const content = sentiment === 'positive' ? positive : sentiment === 'negative' ? negative : neutral
  const aiReply = sentiment === 'positive'
    ? `Thank you ${author} for your kind feedback. We are glad you had a smooth experience and look forward to serving you again.`
    : sentiment === 'negative'
      ? `Hi ${author}, we are sorry your experience did not meet expectations. Please contact us directly so we can understand what happened and make it right.`
      : `Thank you ${author} for sharing your feedback. We appreciate the honest comments and will use them to improve.`

  return {
    id: `generated-${Date.now()}-${index}`,
    author_name: author,
    platform,
    rating,
    content,
    sentiment_label: sentiment,
    ai_reply: aiReply,
    status: 'pending',
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth().catch(() => ({ userId: null }))
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const body = generateTestSchema.parse(await request.json())
    const reviews = []

    for (let i = 0; i < body.count; i++) {
      const rating = ratingFromRange(body.ratingRange, i)

      if (longcatAI.hasApiKey()) {
        try {
          const generated = await longcatAI.generateTestReview(body.platform, rating, body.businessType)
          reviews.push({
            id: `generated-${Date.now()}-${i}`,
            author_name: generated.author_name || names[i % names.length],
            platform: body.platform,
            rating,
            content: generated.content,
            sentiment_label: generated.sentiment || sentimentFromRating(rating),
            ai_reply: generated.ai_reply,
            status: 'pending',
          })
          continue
        } catch (error) {
          console.warn('[Generate Test Reviews] AI failed, using fallback:', error)
        }
      }

      reviews.push(fallbackReview(body.platform, rating, body.businessType, i))
    }

    return NextResponse.json({
      success: true,
      reviews,
      usedFallback: !longcatAI.hasApiKey(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid generator settings', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to generate test reviews' }, { status: 500 })
  }
}
