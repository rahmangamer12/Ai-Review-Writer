import { describe, it, expect } from 'vitest'
import { apiError } from '@/lib/apiError'

describe('apiError — sanitized error envelope', () => {
  it('returns the given status and a consistent body shape', async () => {
    const res = apiError('Insufficient credits', 402, { upgradeUrl: '/subscription' })
    expect(res.status).toBe(402)
    const body = await res.json()
    expect(body).toEqual({ success: false, error: 'Insufficient credits', upgradeUrl: '/subscription' })
  })

  it('defaults to 500 with no extras', async () => {
    const res = apiError('Something went wrong')
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('Something went wrong')
  })
})
