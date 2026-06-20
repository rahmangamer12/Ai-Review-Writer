import { describe, it, expect, vi, beforeEach } from 'vitest'

const authMock = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({ auth: () => authMock() }))
vi.mock('@/lib/db', () => ({
  default: { notification: { findFirst: vi.fn(), update: vi.fn() } },
}))

import { POST } from '@/app/api/notifications/[id]/read/route'
import prisma from '@/lib/db'

const db = prisma as unknown as {
  notification: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
}

function req() {
  return new Request('http://localhost/api/notifications/n1/read', { method: 'POST' }) as never
}
const params = { params: Promise.resolve({ id: 'n1' }) }

describe('notifications/[id]/read — ownership enforcement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('401 when unauthenticated', async () => {
    authMock.mockResolvedValue({ userId: null })
    const res = await POST(req(), params)
    expect(res.status).toBe(401)
    expect(db.notification.update).not.toHaveBeenCalled()
  })

  it("404 (no update) when the notification belongs to ANOTHER user", async () => {
    authMock.mockResolvedValue({ userId: 'attacker' })
    // ownership query (id + userId) finds nothing because it's not theirs
    db.notification.findFirst.mockResolvedValue(null)
    const res = await POST(req(), params)
    expect(res.status).toBe(404)
    // critically: the update must NOT run for a non-owned notification
    expect(db.notification.update).not.toHaveBeenCalled()
    expect(db.notification.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'n1', userId: 'attacker' } })
    )
  })

  it('marks read when the caller owns the notification', async () => {
    authMock.mockResolvedValue({ userId: 'owner' })
    db.notification.findFirst.mockResolvedValue({ id: 'n1' })
    db.notification.update.mockResolvedValue({ id: 'n1', read: true })
    const res = await POST(req(), params)
    expect(res.status).toBe(200)
    expect(db.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'n1' }, data: { read: true } })
    )
  })
})
