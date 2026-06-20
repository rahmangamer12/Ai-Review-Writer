import { describe, it, expect } from 'vitest'
import {
  PLANS,
  PLAN_ORDER,
  getPlan,
  planHasCapability,
  platformsLabel,
  UNLIMITED_PLATFORMS,
} from '@/lib/plans'

describe('plans — canonical single source of truth', () => {
  it('has all four plans in order', () => {
    expect(PLAN_ORDER).toEqual(['free', 'starter', 'growth', 'business'])
    for (const id of PLAN_ORDER) expect(PLANS[id]).toBeDefined()
  })

  it('credit allotments match the advertised model (1 credit = 1 response)', () => {
    expect(PLANS.free.credits).toBe(20)
    expect(PLANS.starter.credits).toBe(100)
    expect(PLANS.growth.credits).toBe(300)
    expect(PLANS.business.credits).toBe(1000)
  })

  it('platform caps are real numbers, business effectively unlimited', () => {
    expect(PLANS.free.platforms).toBe(1)
    expect(PLANS.starter.platforms).toBe(3)
    expect(PLANS.growth.platforms).toBe(10)
    expect(PLANS.business.platforms).toBe(UNLIMITED_PLATFORMS)
    expect(platformsLabel('growth')).toBe('10')
    expect(platformsLabel('business')).toBe('Unlimited')
  })

  it('TRUTHFUL PRODUCT: unbuilt features are flagged available:false', () => {
    const comingSoon = Object.values(PLANS)
      .flatMap((p) => p.features)
      .filter((f) => !f.available)
      .map((f) => f.label.toLowerCase())
    // These were previously advertised as working but are not built yet.
    expect(comingSoon.some((l) => l.includes('slack'))).toBe(true)
    expect(comingSoon.some((l) => l.includes('api access'))).toBe(true)
    expect(comingSoon.some((l) => l.includes('team'))).toBe(true)
  })

  it('NEVER advertises "unlimited platforms" as an available feature when capped', () => {
    // growth must not claim unlimited (its real cap is 10)
    const growthLabels = PLANS.growth.features.map((f) => f.label.toLowerCase())
    expect(growthLabels.some((l) => l.includes('unlimited platform'))).toBe(false)
  })

  it('capability gating reflects plan tier', () => {
    expect(planHasCapability('free', 'auto_reply')).toBe(false)
    expect(planHasCapability('growth', 'auto_reply')).toBe(true)
    expect(planHasCapability('business', 'advanced_analytics')).toBe(true)
    expect(planHasCapability('starter', 'advanced_analytics')).toBe(false)
  })

  it('getPlan falls back to free for unknown plan ids', () => {
    expect(getPlan('nonsense').id).toBe('free')
  })
})
