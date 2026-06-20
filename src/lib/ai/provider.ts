/**
 * AI Provider Abstraction (Phase 3.1)
 *
 * The product runtime routes ALL review-AI calls through this single seam.
 * Defaults to LongCat (cost-optimized) and exposes a premium-escalation hook so
 * a stronger model (e.g. Claude Opus 4.8) can be swapped in per-request for hard
 * cases — only when explicitly requested AND configured via PREMIUM_AI_API_KEY.
 *
 * It also enforces strict payload/token guardrails at this gateway layer so an
 * oversized or malformed payload can never be forwarded to a provider verbatim.
 */
import { longcatAI } from '@/lib/longcatAI'

export const AI_GUARDRAILS = {
  /** Max review characters forwarded to any model (defense-in-depth vs route zod cap) */
  maxReviewChars: 4000,
  /** Max author-name characters */
  maxAuthorChars: 120,
} as const

export type ReplyTone =
  | 'professional'
  | 'friendly'
  | 'apologetic'
  | 'enthusiastic'
  | 'desi'

export function clampInput(text: string | null | undefined, max: number): string {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) : text
}

/** Premium model is only used when explicitly requested AND a key is configured. */
function premiumConfigured(): boolean {
  return !!process.env.PREMIUM_AI_API_KEY
}

export interface GenerateReplyParams {
  reviewText: string
  rating: number
  sentiment: string
  tone?: ReplyTone
  authorName?: string
  /** Request premium escalation for a hard/sensitive case */
  escalate?: boolean
}

export const aiProvider = {
  name: 'LongCat AI',

  hasApiKey(): boolean {
    return longcatAI.hasApiKey()
  },

  async analyzeSentiment(reviewText: string) {
    return longcatAI.analyzeSentiment(clampInput(reviewText, AI_GUARDRAILS.maxReviewChars))
  },

  async generateReviewReply(params: GenerateReplyParams) {
    const reviewText = clampInput(params.reviewText, AI_GUARDRAILS.maxReviewChars)
    const authorName = clampInput(params.authorName || 'there', AI_GUARDRAILS.maxAuthorChars)
    const tone: ReplyTone = params.tone || 'friendly'

    // Premium escalation seam. Kept honest: until a premium provider is wired,
    // we log the intent and fall back to LongCat rather than silently pretending.
    if (params.escalate) {
      if (premiumConfigured()) {
        console.log('[aiProvider] Premium escalation requested (premium routing pending) — using LongCat')
      } else {
        console.log('[aiProvider] Escalation requested but PREMIUM_AI_API_KEY not set — using LongCat')
      }
    }

    return longcatAI.generateReviewResponse(reviewText, params.rating, params.sentiment, tone, authorName)
  },
}
