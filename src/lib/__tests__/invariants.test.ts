import { describe, it, expect } from 'vitest'
import { PLANS, PLAN_ORDER, type Capability } from '@/lib/plans'
import { normalizeLongCatModel, LONGCAT_DEFAULT_MODEL } from '@/lib/longcatModels'

describe('plan capabilities are monotonic (higher tier ⊇ lower tier)', () => {
  it('each plan includes every capability of the plan below it', () => {
    for (let i = 1; i < PLAN_ORDER.length; i++) {
      const lower = new Set<Capability>(PLANS[PLAN_ORDER[i - 1]].capabilities)
      const higher = new Set<Capability>(PLANS[PLAN_ORDER[i]].capabilities)
      for (const cap of lower) {
        expect(higher.has(cap), `${PLAN_ORDER[i]} should include "${cap}" from ${PLAN_ORDER[i - 1]}`).toBe(true)
      }
    }
  })

  it('higher tiers cost more (monthly price strictly increases)', () => {
    for (let i = 1; i < PLAN_ORDER.length; i++) {
      expect(PLANS[PLAN_ORDER[i]].monthlyPrice).toBeGreaterThan(PLANS[PLAN_ORDER[i - 1]].monthlyPrice)
    }
  })

  it('higher tiers grant more credits', () => {
    for (let i = 1; i < PLAN_ORDER.length; i++) {
      expect(PLANS[PLAN_ORDER[i]].credits).toBeGreaterThan(PLANS[PLAN_ORDER[i - 1]].credits)
    }
  })
})

describe('LongCat model normalization', () => {
  it('passes through the allowed model', () => {
    expect(normalizeLongCatModel(LONGCAT_DEFAULT_MODEL)).toBe(LONGCAT_DEFAULT_MODEL)
  })
  it('falls back to default for unknown/empty models', () => {
    expect(normalizeLongCatModel('gpt-4o')).toBe(LONGCAT_DEFAULT_MODEL)
    expect(normalizeLongCatModel(null)).toBe(LONGCAT_DEFAULT_MODEL)
    expect(normalizeLongCatModel(undefined)).toBe(LONGCAT_DEFAULT_MODEL)
  })
})
