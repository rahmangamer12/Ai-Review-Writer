import { auth, currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { ensureUserAccount } from '@/lib/userAccount'

/**
 * Just-in-time (JIT) user provisioning.
 *
 * The Prisma `User` row is normally created by the Clerk `user.created` webhook.
 * If that webhook never fired (misconfigured endpoint, timing gap, new project),
 * the authenticated Clerk user has NO Prisma row — and every credit/AI operation
 * fails with `user_not_found`. This helper guarantees a row exists before any
 * credit-bound work, making the system resilient to webhook gaps.
 *
 * Cheap path: a single indexed `findUnique` when the row already exists.
 * Slow path (first request only): fetch Clerk profile + idempotent upsert.
 */
export async function ensureUserProvisioned(userId: string): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (existing) return

  const clerkUser = await currentUser().catch(() => null)
  const email =
    clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@autoreview.local`
  const name = clerkUser?.fullName || clerkUser?.firstName || 'there'

  await ensureUserAccount({ userId, email, name }).catch((e) => {
    console.warn('[ensureUserProvisioned] upsert failed:', e)
  })
}

/**
 * Resolve the current Clerk user id and guarantee a Prisma row exists.
 * Returns null when the request is unauthenticated.
 */
export async function requireDbUser(): Promise<{ userId: string } | null> {
  const { userId } = await auth().catch(() => ({ userId: null as string | null }))
  if (!userId) return null
  await ensureUserProvisioned(userId)
  return { userId }
}
