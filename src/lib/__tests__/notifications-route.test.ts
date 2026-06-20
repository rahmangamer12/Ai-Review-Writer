import { describe, it, expect, vi, beforeEach } from 'vitest'

// Route-integration test: exercises the real route handler with Clerk + Prisma mocked.
const authMock = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({ auth: () => authMock() }))
vi.mock('@/lib/db', () => ({
  default: { notification: { findMany: vi.fn(), create: vi.fn() } },
}))

import { GET, POST } from '@/app/api/notifications/route'
import prisma from '@/lib/db'

const db = prisma as unknown as {
  notification: { findMany: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
}

function makeReq(body?: unknown) {
  return new Request('http://localhost/api/notifications', {
    method: body ? 'POST' : 'GET',
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'content-type': 'application/json' },
  }) as unknown as Parameters<typeof GET>[0]
}

describe('notifications route — auth + ownership + validation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue({ userId: null })
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it('GET only queries the current user\'s notifications (ownership scoping)', async () => {
    authMock.mockResolvedValue({ userId: 'u1' })
    db.notification.findMany.mockResolvedValue([
      { id: 'n1', userId: 'u1', title: 't', message: 'm', type: 'info', read: false },
    ])
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body[0].id).toBe('n1')
    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } })
    )
  })

  it('POST returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue({ userId: null })
    const res = await POST(makeReq({ title: 'Hi', message: 'Yo' }))
    expect(res.status).toBe(401)
  })

  it('POST rejects invalid input via Zod (empty title)', async () => {
    authMock.mockResolvedValue({ userId: 'u1' })
    const res = await POST(makeReq({ title: '', message: 'Yo' }))
    expect(res.status).toBe(400)
    expect(db.notification.create).not.toHaveBeenCalled()
  })

  it('POST creates a notification bound to the authenticated user', async () => {
    authMock.mockResolvedValue({ userId: 'u1' })
    db.notification.create.mockResolvedValue({
      id: 'n2', userId: 'u1', title: 'Hi', message: 'Yo', type: 'info', read: false,
    })
    const res = await POST(makeReq({ title: 'Hi', message: 'Yo' }))
    expect(res.status).toBe(200)
    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'u1' }) })
    )
  })
})
