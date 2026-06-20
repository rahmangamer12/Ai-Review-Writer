/**
 * Plan entitlement enforcement — derived from the canonical src/lib/plans.ts.
 *
 * Use these helpers in API routes to enforce what each plan actually delivers
 * (Principle 6). Capability checks gate features; platform-capacity checks gate
 * how many review platforms a user may connect.
 */
import prisma from '@/lib/db'
import { getPlan, planHasCapability, type Capability } from '@/lib/plans'

export interface PlatformCapacity {
  allowed: boolean
  limit: number
  current: number
}

/**
 * Whether the user may connect (or re-connect) the given platform under their
 * plan's connection cap. Reconnecting an already-connected platform is always
 * allowed; only brand-new connections count against the cap.
 */
export async function canConnectPlatform(
  userId: string,
  platformType: string
): Promise<PlatformCapacity> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planType: true },
  })
  const limit = getPlan(user?.planType ?? 'free').platforms

  const existing = await prisma.connectedPlatform.findMany({
    where: { userId },
    select: { platformType: true, status: true },
  })

  const active = existing.filter((p) => p.status !== 'disconnected')
  const alreadyHasThis = active.some((p) => p.platformType === platformType)

  if (alreadyHasThis) {
    return { allowed: true, limit, current: active.length }
  }
  return { allowed: active.length < limit, limit, current: active.length }
}

export function platformCapError(cap: PlatformCapacity) {
  return {
    error: `Your plan allows ${cap.limit} platform connection${cap.limit === 1 ? '' : 's'}. You already have ${cap.current}. Upgrade to connect more.`,
    upgradeUrl: '/subscription',
    limit: cap.limit,
    current: cap.current,
  }
}

/** Resolve a user's plan and check a single enforced capability. */
export async function userHasCapability(
  userId: string,
  cap: Capability
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planType: true },
  })
  return planHasCapability(user?.planType ?? 'free', cap)
}
