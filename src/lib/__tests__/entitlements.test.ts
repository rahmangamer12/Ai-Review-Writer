import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Prisma client so this runs without a database.
vi.mock('@/lib/db', () => ({
  default: {
    user: { findUnique: vi.fn() },
    connectedPlatform: { findMany: vi.fn() },
  },
}))

import prisma from '@/lib/db'
import { canConnectPlatform } from '@/lib/entitlements'

const mock = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> }
  connectedPlatform: { findMany: ReturnType<typeof vi.fn> }
}

describe('canConnectPlatform — plan cap enforcement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('blocks a new platform when free plan (cap 1) already has 1 connected', async () => {
    mock.user.findUnique.mockResolvedValue({ planType: 'free' })
    mock.connectedPlatform.findMany.mockResolvedValue([{ platformType: 'google', status: 'connected' }])
    const res = await canConnectPlatform('u1', 'facebook')
    expect(res.allowed).toBe(false)
    expect(res.limit).toBe(1)
    expect(res.current).toBe(1)
  })

  it('allows RE-connecting an already-connected platform even at the cap', async () => {
    mock.user.findUnique.mockResolvedValue({ planType: 'free' })
    mock.connectedPlatform.findMany.mockResolvedValue([{ platformType: 'google', status: 'connected' }])
    const res = await canConnectPlatform('u1', 'google')
    expect(res.allowed).toBe(true)
  })

  it('growth plan (cap 10) allows a 4th platform', async () => {
    mock.user.findUnique.mockResolvedValue({ planType: 'growth' })
    mock.connectedPlatform.findMany.mockResolvedValue([
      { platformType: 'google', status: 'connected' },
      { platformType: 'facebook', status: 'connected' },
      { platformType: 'yelp', status: 'connected' },
    ])
    const res = await canConnectPlatform('u1', 'trustpilot')
    expect(res.allowed).toBe(true)
    expect(res.limit).toBe(10)
  })

  it('disconnected platforms do NOT count toward the cap', async () => {
    mock.user.findUnique.mockResolvedValue({ planType: 'free' })
    mock.connectedPlatform.findMany.mockResolvedValue([{ platformType: 'google', status: 'disconnected' }])
    const res = await canConnectPlatform('u1', 'facebook')
    expect(res.allowed).toBe(true)
    expect(res.current).toBe(0)
  })

  it('defaults to free plan cap when the user has no plan row', async () => {
    mock.user.findUnique.mockResolvedValue(null)
    mock.connectedPlatform.findMany.mockResolvedValue([])
    const res = await canConnectPlatform('u1', 'google')
    expect(res.limit).toBe(1)
    expect(res.allowed).toBe(true)
  })
})
