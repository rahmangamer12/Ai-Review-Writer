import { describe, it, expect, vi } from 'vitest'

// CreditsManager imports the Prisma client at module load; mock it so the pure
// logic can be tested without a database.
vi.mock('@/lib/db', () => ({
  default: { user: {}, creditUsage: {}, $transaction: vi.fn() },
}))

import { CreditsManager } from '@/lib/credits'

describe('CreditsManager — pure logic', () => {
  it('credit costs per action', () => {
    expect(CreditsManager.getCreditCost('ai_response')).toBe(1)
    expect(CreditsManager.getCreditCost('bulk_response')).toBe(5)
    expect(CreditsManager.getCreditCost('review_analysis')).toBe(2)
    expect(CreditsManager.getCreditCost('unknown_action')).toBe(1) // safe default
  })

  it('plan credits are derived from the canonical plans (no drift)', () => {
    expect(CreditsManager.getPlanCredits('free')).toBe(200)
    expect(CreditsManager.getPlanCredits('starter')).toBe(500)
    expect(CreditsManager.getPlanCredits('growth')).toBe(1500)
    expect(CreditsManager.getPlanCredits('business')).toBe(5000)
    expect(CreditsManager.getPlanCredits('bogus')).toBe(200) // falls back to free
  })

  it('Agnes plan credits are exposed too', () => {
    expect(CreditsManager.getPlanAgnesCredits('free')).toBe(50)
    expect(CreditsManager.getPlanAgnesCredits('business')).toBe(1500)
  })

  it('rejects non-positive deductions before hitting the database', async () => {
    const zero = await CreditsManager.useCredits('u1', 0, 'ai_response')
    const neg = await CreditsManager.useCredits('u1', -5, 'ai_response')
    expect(zero.success).toBe(false)
    expect(neg.success).toBe(false)
  })

  it('rejects non-positive grants before hitting the database', async () => {
    const res = await CreditsManager.grantCredits('u1', 0, 'plan_upgrade')
    expect(res.success).toBe(false)
  })
})
