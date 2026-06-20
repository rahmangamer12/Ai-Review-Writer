import { describe, it, expect } from 'vitest'
import { clampInput, AI_GUARDRAILS } from '@/lib/ai/provider'

describe('ai provider gateway guardrails', () => {
  it('clampInput truncates oversized payloads', () => {
    const big = 'x'.repeat(10_000)
    expect(clampInput(big, AI_GUARDRAILS.maxReviewChars).length).toBe(AI_GUARDRAILS.maxReviewChars)
  })

  it('clampInput leaves short input unchanged', () => {
    expect(clampInput('hello', 100)).toBe('hello')
  })

  it('clampInput handles null/undefined safely', () => {
    expect(clampInput(null, 100)).toBe('')
    expect(clampInput(undefined, 100)).toBe('')
  })

  it('guardrail limits are sane', () => {
    expect(AI_GUARDRAILS.maxReviewChars).toBeGreaterThan(0)
    expect(AI_GUARDRAILS.maxAuthorChars).toBeGreaterThan(0)
  })
})
