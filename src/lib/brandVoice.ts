/**
 * Brand Voice RAG (Retrieval-Augmented Generation)
 *
 * Builds context from past approved AI replies to maintain consistent brand voice.
 * Instead of vector embeddings (complex), we use a simple but effective approach:
 * 1. Fetch past approved replies for the user
 * 2. Extract tone patterns and common phrases
 * 3. Include as context in AI prompts
 */

import prisma from '@/lib/db'

interface BrandVoiceContext {
  tone: string
  sampleReplies: string[]
  commonPhrases: string[]
  doNotUse: string[]
}

/**
 * Build brand voice context from past approved replies
 */
export async function buildBrandVoiceContext(userId: string): Promise<BrandVoiceContext> {
  // Fetch past approved replies
  const approvedReplies = await prisma.review.findMany({
    where: {
      userId,
      status: 'approved',
      aiReplyText: { not: null },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    select: {
      aiReplyText: true,
      rating: true,
    },
  })

  if (approvedReplies.length === 0) {
    return {
      tone: 'professional yet warm',
      sampleReplies: [],
      commonPhrases: [],
      doNotUse: ['robotic language', 'overly formal', 'defensive tone'],
    }
  }

  // Extract sample replies
  const sampleReplies = approvedReplies
    .map(r => r.aiReplyText!)
    .filter(Boolean)
    .slice(0, 5)

  // Analyze tone patterns
  const allText = approvedReplies.map(r => r.aiReplyText!).join(' ').toLowerCase()

  // Detect common greeting patterns
  const greetings: string[] = []
  if (allText.includes('hi ')) greetings.push('Hi')
  if (allText.includes('hello')) greetings.push('Hello')
  if (allText.includes('hey')) greetings.push('Hey')
  if (allText.includes('dear')) greetings.push('Dear')
  if (allText.includes('thank you')) greetings.push('Thank you')
  if (allText.includes('thanks')) greetings.push('Thanks')

  // Detect common closings
  const closings: string[] = []
  if (allText.includes('best regards')) closings.push('Best regards')
  if (allText.includes('sincerely')) closings.push('Sincerely')
  if (allText.includes('warmly')) closings.push('Warmly')
  if (allText.includes('cheers')) closings.push('Cheers')

  // Determine tone
  let tone = 'professional'
  if (allText.includes('!') && allText.includes('love')) {
    tone = 'enthusiastic and warm'
  } else if (allText.includes('appreciate') || allText.includes('grateful')) {
    tone = 'appreciative'
  } else if (allText.includes('sorry') || allText.includes('apologize')) {
    tone = 'empathetic and apologetic'
  }

  // Common phrases to reuse
  const commonPhrases = [...greetings, ...closings].filter(Boolean)

  return {
    tone,
    sampleReplies,
    commonPhrases,
    doNotUse: [
      'robotic language',
      'overly formal',
      'defensive tone',
      'generic responses',
      'ignoring specific concerns',
    ],
  }
}

/**
 * Generate AI prompt with brand voice context
 */
export function generatePromptWithBrandVoice(
  basePrompt: string,
  brandVoice: BrandVoiceContext
): string {
  if (brandVoice.sampleReplies.length === 0) {
    return basePrompt
  }

  const contextSection = `
## Brand Voice Guidelines
Based on your past approved replies, follow these patterns:

**Tone:** ${brandVoice.tone}

**Sample replies from your business:**
${brandVoice.sampleReplies.map((reply, i) => `${i + 1}. "${reply}"`).join('\n')}

**Common phrases to use:**
${brandVoice.commonPhrases.map(p => `- ${p}`).join('\n')}

**Avoid:**
${brandVoice.doNotUse.map(d => `- ${d}`).join('\n')}
`

  return basePrompt + '\n' + contextSection
}

/**
 * Analyze sentiment trends for a user
 */
export async function analyzeSentimentTrends(userId: string) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const reviews = await prisma.review.findMany({
    where: {
      userId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      rating: true,
      sentimentLabel: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (reviews.length === 0) {
    return {
      trend: 'neutral' as const,
      avgRating: 0,
      totalReviews: 0,
      sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
      recommendation: 'No recent reviews to analyze.',
    }
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  const sentimentBreakdown = {
    positive: reviews.filter(r => r.sentimentLabel === 'positive').length,
    negative: reviews.filter(r => r.sentimentLabel === 'negative').length,
    neutral: reviews.filter(r => r.sentimentLabel === 'neutral').length,
  }

  // Determine trend
  let trend: 'improving' | 'declining' | 'neutral' = 'neutral'
  if (reviews.length >= 5) {
    const recentHalf = reviews.slice(0, Math.floor(reviews.length / 2))
    const olderHalf = reviews.slice(Math.floor(reviews.length / 2))

    const recentAvg = recentHalf.reduce((sum, r) => sum + r.rating, 0) / recentHalf.length
    const olderAvg = olderHalf.reduce((sum, r) => sum + r.rating, 0) / olderHalf.length

    if (recentAvg > olderAvg + 0.3) trend = 'improving'
    else if (recentAvg < olderAvg - 0.3) trend = 'declining'
  }

  // Generate recommendation
  let recommendation = ''
  if (avgRating >= 4.5) {
    recommendation = 'Excellent rating! Keep up the great work. Consider asking happy customers for more reviews.'
  } else if (avgRating >= 3.5) {
    recommendation = 'Good rating with room for improvement. Focus on addressing negative feedback promptly.'
  } else {
    recommendation = 'Rating needs attention. Prioritize responding to negative reviews and improving customer experience.'
  }

  if (sentimentBreakdown.negative > sentimentBreakdown.positive) {
    recommendation += ' Negative reviews outnumber positive ones — urgent action needed.'
  }

  return {
    trend,
    avgRating: Number(avgRating.toFixed(1)),
    totalReviews: reviews.length,
    sentimentBreakdown,
    recommendation,
  }
}
