import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { longcatAI } from '@/lib/longcatAI'

// POST - Generate test reviews with REAL AI
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { count = 5, platform = 'google', ratingRange = 'mixed', businessType = 'restaurant' } = body

    console.log(`[Generate Test Reviews] Generating ${count} reviews using REAL LongCat AI`)

    const reviews = []

    for (let i = 0; i < count; i++) {
      let rating: number
      if (ratingRange === 'mixed') {
        rating = Math.floor(Math.random() * 5) + 1
      } else {
        rating = parseInt(ratingRange)
      }

      try {
        // Use REAL LongCat AI to generate review
        const generated = await longcatAI.generateTestReview(platform, rating, businessType)
        
        reviews.push({
          id: `ai-${Date.now()}-${i}`,
          author_name: generated.author_name,
          platform,
          rating,
          content: generated.content,
          sentiment_label: generated.sentiment,
          ai_reply: generated.ai_reply,
          status: 'pending',
        })
        
        console.log(`[Generate Test Reviews] Generated review ${i + 1}/${count}`)
      } catch (aiError) {
        console.error(`[Generate Test Reviews] AI failed for review ${i + 1}, using fallback:`, aiError)
        
        // Fallback if AI fails
        const sampleNames = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Brown', 'David Wilson']
        const templates: Record<number, string[]> = {
          5: [
            'Absolutely amazing experience! The service was top-notch and exceeded all my expectations.',
            'Highly recommend! Great quality and friendly staff. Will definitely come back.',
            'Outstanding! Everything was perfect from start to finish.',
          ],
          4: [
            'Great experience overall. Minor improvements could be made but very satisfied.',
            'Really enjoyed my visit. Good service and quality.',
          ],
          3: [
            'It was okay. Nothing special but met my basic expectations.',
            'Average experience. Some good points but room for improvement.',
          ],
          2: [
            'Below average experience. Had some issues during my visit.',
            'Not what I expected. Disappointed with several aspects.',
          ],
          1: [
            'Very disappointed with the experience. Would not recommend.',
            'Terrible service and quality. Expected much better.',
          ],
        }
        
        const content = templates[rating]?.[Math.floor(Math.random() * templates[rating].length)] || 'Average experience.'
        const sentiment = rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative'
        const name = sampleNames[Math.floor(Math.random() * sampleNames.length)]
        
        // Generate fallback AI reply
        let aiReply = ''
        if (rating >= 4) {
          aiReply = `Thank you ${name.split(' ')[0]} for your wonderful review! We're thrilled you had such a great experience with us.`
        } else if (rating === 3) {
          aiReply = `Thank you ${name.split(' ')[0]} for your feedback. We appreciate you taking the time to share your experience.`
        } else {
          aiReply = `Hi ${name.split(' ')[0]}, we sincerely apologize for your experience. Please contact us so we can make this right.`
        }
        
        reviews.push({
          id: `ai-${Date.now()}-${i}`,
          author_name: name,
          platform,
          rating,
          content,
          sentiment_label: sentiment,
          ai_reply: aiReply,
          status: 'pending',
        })
      }
    }

    console.log(`[Generate Test Reviews] Successfully generated ${reviews.length} reviews`)

    return NextResponse.json({ 
      success: true, 
      reviews: reviews.map(r => ({
        ...r,
        is_fake: true,
        is_test: true,
        source: 'test_generator'
      })),
      ai_provider: 'LongCat AI',
      generated_at: new Date().toISOString(),
      warning: 'These are TEST/FAKE reviews for demonstration only. Do not post to production platforms.'
    })
  } catch (error: unknown) {
    console.error('[Generate Test Reviews Error]:', error)
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: message,
      success: false 
    }, { status: 500 })
  }
}

// GET - API status
export async function GET() {
  return NextResponse.json({
    status: 'Test Review Generator API is running',
    ai_provider: 'LongCat AI',
    max_reviews: 20,
    timestamp: new Date().toISOString()
  })
}
