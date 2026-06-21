import prisma from '@/lib/db'

type UserAccountInput = {
  userId: string
  email: string
  name: string
}

const DEFAULT_FREE_CREDITS = 200
const DEFAULT_FREE_AGNES_CREDITS = 50

// Explicit column list so the generated SQL never references columns that may
// not yet exist in the production database (e.g. newly added agentic toggles
// before `prisma db push` runs). Selecting only known-deployed columns keeps
// auth/chat/profile working even when the schema is ahead of the DB.
const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  stripeCustomerId: true,
  planType: true,
  aiCredits: true,
  agnesCredits: true,
  promptCount: true,
  maxPlatforms: true,
  creditsRenewAt: true,
} as const

function creditsOrDefault(value: number | null | undefined) {
  return value ?? DEFAULT_FREE_CREDITS
}

export async function ensureUserAccount({ userId, email, name }: UserAccountInput) {
  const [byId, byEmail] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT }),
    prisma.user.findUnique({ where: { email }, select: USER_SELECT }).catch(() => null),
  ])

  if (byId) {
    const mergedCredits = byEmail && byEmail.id !== byId.id
      ? Math.max(creditsOrDefault(byId.aiCredits), creditsOrDefault(byEmail.aiCredits))
      : creditsOrDefault(byId.aiCredits)

    const updates: Record<string, any> = {
      name: byId.name || name,
      aiCredits: mergedCredits,
    }

    if (!byEmail || byEmail.id === byId.id) {
      updates.email = email
    }

    return prisma.user.update({
      where: { id: byId.id },
      data: updates,
      select: USER_SELECT,
    }).catch(() => ({
      ...byId,
      aiCredits: mergedCredits,
      name: byId.name || name,
    }))
  }

  if (byEmail) {
    const repairedCredits = creditsOrDefault(byEmail.aiCredits)

    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        name: byEmail.name || name,
        aiCredits: repairedCredits,
      },
      select: USER_SELECT,
    }).catch(() => ({
      ...byEmail,
      aiCredits: repairedCredits,
      name: byEmail.name || name,
    }))
  }

  const renewAt = new Date()
  renewAt.setMonth(renewAt.getMonth() + 1)

  return prisma.user.create({
    data: {
      id: userId,
      email,
      name,
      planType: 'free',
      aiCredits: DEFAULT_FREE_CREDITS,
      agnesCredits: DEFAULT_FREE_AGNES_CREDITS,
      promptCount: 0,
      maxPlatforms: 1,
      creditsRenewAt: renewAt,
    },
    select: USER_SELECT,
  })
}
