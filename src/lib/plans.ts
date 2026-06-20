/**
 * Canonical plan definitions — the SINGLE source of truth for:
 *   - pricing & marketing copy (subscription page)
 *   - credit allotments (CreditsManager)
 *   - platform connection caps (entitlements + connect enforcement)
 *   - enforced capabilities (entitlements / feature gating)
 *
 * Principle 6 (truthful product): every marketing feature here is either
 * `available: true` (built + enforced) or `available: false` (rendered as
 * "Coming soon" and NOT sold as working). Capabilities listed in `capabilities`
 * are the ones actually enforced server-side.
 */

export type PlanId = 'free' | 'starter' | 'growth' | 'business'

export interface PlanFeature {
  label: string
  /** false => shown as "Coming soon", never advertised as functional */
  available: boolean
}

export type Capability =
  | 'ai_replies'
  | 'sentiment'
  | 'dashboard'
  | 'bulk_replies'
  | 'templates'
  | 'analytics'
  | 'auto_reply'
  | 'custom_tone'
  | 'sentiment_reports'
  | 'weekly_insights'
  | 'triage'
  | 'advanced_analytics'

export interface PlanDef {
  id: PlanId
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  /** AI responses granted per month (1 credit = 1 AI response) */
  credits: number
  /** Maximum connected review platforms. Business is effectively unlimited. */
  platforms: number
  popular?: boolean
  /** Marketing copy with honest availability flags */
  features: PlanFeature[]
  /** Server-enforced capabilities */
  capabilities: Capability[]
}

const f = (label: string, available = true): PlanFeature => ({ label, available })

/** Sentinel for "effectively unlimited" platform connections (Business). */
export const UNLIMITED_PLATFORMS = 1_000_000

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started at no cost',
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: 20,
    platforms: 1,
    features: [
      f('20 AI responses per month'),
      f('1 platform connection'),
      f('Basic dashboard'),
      f('Email support'),
      f('No credit card required'),
    ],
    capabilities: ['ai_replies', 'sentiment', 'dashboard'],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small business',
    monthlyPrice: 9,
    yearlyPrice: 90,
    credits: 100,
    platforms: 3,
    popular: true,
    features: [
      f('100 AI responses per month'),
      f('3 platform connections'),
      f('Bulk reply generation'),
      f('Response templates'),
      f('Analytics dashboard'),
      f('All Free features'),
    ],
    capabilities: ['ai_replies', 'sentiment', 'dashboard', 'bulk_replies', 'templates', 'analytics'],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    description: 'For growing businesses',
    monthlyPrice: 19,
    yearlyPrice: 190,
    credits: 300,
    platforms: 10,
    features: [
      f('300 AI responses per month'),
      f('Up to 10 platform connections'),
      f('Auto-draft replies'),
      f('Sentiment reports'),
      f('Weekly insight emails'),
      f('Priority support'),
      f('Slack notifications', false),
      f('All Starter features'),
    ],
    capabilities: [
      'ai_replies', 'sentiment', 'dashboard', 'bulk_replies', 'templates', 'analytics',
      'auto_reply', 'custom_tone', 'sentiment_reports', 'weekly_insights', 'triage',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'For multi-location teams',
    monthlyPrice: 39,
    yearlyPrice: 390,
    credits: 1000,
    platforms: UNLIMITED_PLATFORMS,
    features: [
      f('1000 AI responses per month'),
      f('Unlimited platform connections'),
      f('Advanced analytics'),
      f('Priority support (4h SLA)'),
      f('API access', false),
      f('Team members', false),
      f('Custom integrations', false),
      f('All Growth features'),
    ],
    capabilities: [
      'ai_replies', 'sentiment', 'dashboard', 'bulk_replies', 'templates', 'analytics',
      'auto_reply', 'custom_tone', 'sentiment_reports', 'weekly_insights', 'triage',
      'advanced_analytics',
    ],
  },
}

export const PLAN_ORDER: PlanId[] = ['free', 'starter', 'growth', 'business']

export function getPlan(planId: string): PlanDef {
  return PLANS[(planId as PlanId)] ?? PLANS.free
}

export function planHasCapability(planId: string, cap: Capability): boolean {
  return getPlan(planId).capabilities.includes(cap)
}

/** Display helper: render the platform cap as a human string. */
export function platformsLabel(planId: string): string {
  const n = getPlan(planId).platforms
  return n >= UNLIMITED_PLATFORMS ? 'Unlimited' : String(n)
}
