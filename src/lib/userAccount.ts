import prisma from '@/lib/db'

type UserAccountInput = {
  userId: string
  email: string
  name: string
}

const DEFAULT_FREE_CREDITS = 20

export async function ensureUserAccount({ userId, email, name }: UserAccountInput) {
  const [byId, byEmail] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.user.findUnique({ where: { email } }).catch(() => null),
  ])

  if (byId) {
    const planFloor = byId.planType === 'free' ? DEFAULT_FREE_CREDITS : 0
    const mergedCredits = byEmail && byEmail.id !== byId.id
      ? Math.max(byId.aiCredits ?? 0, byEmail.aiCredits ?? 0, planFloor)
      : Math.max(byId.aiCredits ?? 0, planFloor)

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
    }).catch(() => ({
      ...byId,
      aiCredits: mergedCredits,
      name: byId.name || name,
    }))
  }

  if (byEmail) {
    const planFloor = byEmail.planType === 'free' ? DEFAULT_FREE_CREDITS : 0
    return prisma.user.update({
      where: { email },
      data: {
        id: userId,
        name: byEmail.name || name,
        aiCredits: Math.max(byEmail.aiCredits ?? 0, planFloor),
      },
    }).catch(() => byEmail)
  }

  return prisma.user.create({
    data: {
      id: userId,
      email,
      name,
      planType: 'free',
      aiCredits: DEFAULT_FREE_CREDITS,
      promptCount: 0,
      maxPlatforms: 1,
    },
  })
}
