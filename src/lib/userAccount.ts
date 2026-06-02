import prisma from '@/lib/db'

type UserAccountInput = {
  userId: string
  email: string
  name: string
}

const DEFAULT_FREE_CREDITS = 20

function creditsOrDefault(value: number | null | undefined) {
  return value ?? DEFAULT_FREE_CREDITS
}

export async function ensureUserAccount({ userId, email, name }: UserAccountInput) {
  const [byId, byEmail] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.user.findUnique({ where: { email } }).catch(() => null),
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
    }).catch(() => ({
      ...byEmail,
      aiCredits: repairedCredits,
      name: byEmail.name || name,
    }))
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
