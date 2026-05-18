import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient, currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(120).optional(),
  bio: z.string().trim().max(280).optional(),
  location: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  website: z.string().trim().max(200).optional(),
  company: z.string().trim().max(120).optional(),
  role: z.string().trim().max(120).optional(),
  industry: z.string().trim().max(120).optional(),
  preferences: z.object({
    theme: z.string().optional(),
    language: z.string().optional(),
    notifications: z.boolean().optional(),
    autoReply: z.boolean().optional(),
    selectedPersona: z.string().optional(),
  }).optional(),
})

function profileMeta(user: Awaited<ReturnType<typeof currentUser>>) {
  const metadata = (user?.publicMetadata?.profile || {}) as Record<string, any>
  return {
    bio: metadata.bio || '',
    location: metadata.location || '',
    phone: metadata.phone || '',
    website: metadata.website || '',
    company: metadata.company || '',
    role: metadata.role || '',
    industry: metadata.industry || '',
    preferences: {
      theme: metadata.preferences?.theme || 'dark',
      language: metadata.preferences?.language || 'english',
      notifications: metadata.preferences?.notifications ?? true,
      autoReply: metadata.preferences?.autoReply ?? false,
      selectedPersona: metadata.preferences?.selectedPersona || 'friendly',
    },
  }
}

function buildAchievements(stats: {
  totalReviews: number
  totalReplies: number
  responseRate: number
  avgRating: number
  platformsConnected: number
}) {
  const now = new Date().toISOString()
  return [
    {
      id: 'first-review',
      title: 'First Review Managed',
      description: 'Import or add your first customer review.',
      icon: 'Review',
      unlocked: stats.totalReviews >= 1,
      date: stats.totalReviews >= 1 ? now : undefined,
    },
    {
      id: 'first-reply',
      title: 'First Reply Sent',
      description: 'Save your first AI-assisted review reply.',
      icon: 'Reply',
      unlocked: stats.totalReplies >= 1,
      date: stats.totalReplies >= 1 ? now : undefined,
    },
    {
      id: 'connected-platform',
      title: 'Platform Connected',
      description: 'Connect at least one review platform.',
      icon: 'Link',
      unlocked: stats.platformsConnected >= 1,
      date: stats.platformsConnected >= 1 ? now : undefined,
    },
    {
      id: 'response-rate-80',
      title: 'Responsive Business',
      description: 'Reach an 80% review response rate.',
      icon: 'Rate',
      unlocked: stats.totalReviews > 0 && stats.responseRate >= 80,
      date: stats.totalReviews > 0 && stats.responseRate >= 80 ? now : undefined,
    },
    {
      id: 'rating-45',
      title: 'Excellent Rating',
      description: 'Maintain a 4.5+ average rating.',
      icon: 'Star',
      unlocked: stats.totalReviews > 0 && stats.avgRating >= 4.5,
      date: stats.totalReviews > 0 && stats.avgRating >= 4.5 ? now : undefined,
    },
    {
      id: 'review-volume-25',
      title: 'Review Momentum',
      description: 'Manage 25 total reviews.',
      icon: 'Growth',
      unlocked: stats.totalReviews >= 25,
      date: stats.totalReviews >= 25 ? now : undefined,
    },
  ]
}

function buildActivity(reviews: any[], platforms: any[]) {
  const items = [
    ...reviews.slice(0, 10).map((review) => ({
      id: `review-${review.id}`,
      type: review.aiReplyText ? 'reply_saved' : 'review_received',
      description: review.aiReplyText
        ? `Saved a reply for ${review.authorName}'s ${review.rating}-star review`
        : `Received a ${review.rating}-star review from ${review.authorName}`,
      timestamp: (review.updatedAt || review.createdAt).toISOString(),
      icon: review.aiReplyText ? 'Reply' : 'Review',
    })),
    ...platforms.slice(0, 5).map((platform) => ({
      id: `platform-${platform.id}`,
      type: 'platform_connected',
      description: `${platform.platformType} platform is ${platform.status}`,
      timestamp: (platform.updatedAt || platform.createdAt).toISOString(),
      icon: 'Link',
    })),
  ]

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20)
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@unknown.com`
  const fullName = clerkUser?.fullName || clerkUser?.firstName || 'User'

  const [dbUser, reviews, platforms] = await Promise.all([
    prisma.user.upsert({
      where: { id: userId },
      update: { email, name: fullName },
      create: { id: userId, email, name: fullName, planType: 'free', aiCredits: 20, promptCount: 0, maxPlatforms: 1 },
    }),
    prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { platform: { select: { platformType: true, status: true } } },
    }),
    prisma.connectedPlatform.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  const meta = profileMeta(clerkUser)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const totalReviews = reviews.length
  const totalReplies = reviews.filter((review) => Boolean(review.aiReplyText) || review.status === 'AI_replied').length
  const reviewsThisMonth = reviews.filter((review) => (review.sourceDate || review.createdAt) >= monthStart).length
  const avgRating = totalReviews ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0
  const responseRate = totalReviews ? (totalReplies / totalReviews) * 100 : 0
  const responseTimes = reviews
    .filter((review) => review.aiReplyText || review.status === 'AI_replied')
    .map((review) => Math.max(0, review.updatedAt.getTime() - (review.sourceDate || review.createdAt).getTime()))
    .filter((ms) => ms > 0)
  const avgResponseMinutes = responseTimes.length
    ? Math.round(responseTimes.reduce((sum, ms) => sum + ms, 0) / responseTimes.length / 60000)
    : 0

  const stats = {
    totalReviews,
    totalReplies,
    reviewsThisMonth,
    avgRating: Number(avgRating.toFixed(1)),
    responseRate: Number(responseRate.toFixed(1)),
    avgResponseTime: avgResponseMinutes,
    platformsConnected: platforms.filter((platform) => platform.status === 'connected').length,
    satisfactionScore: totalReviews === 0 ? 0 : Math.min(100, Math.max(0, Math.round(avgRating * 18 + responseRate * 0.1))),
  }

  return NextResponse.json({
    profile: {
      id: userId,
      email,
      full_name: fullName,
      avatar_url: clerkUser?.imageUrl || null,
      bio: meta.bio,
      location: meta.location,
      phone: meta.phone,
      website: meta.website,
      company: meta.company,
      role: meta.role,
      industry: meta.industry,
      plan: dbUser.planType,
      credits: dbUser.aiCredits,
      joined_date: dbUser.createdAt.toISOString(),
      preferences: meta.preferences,
      stats: {
        total_reviews: stats.totalReviews,
        reviews_this_month: stats.reviewsThisMonth,
        avg_rating: stats.avgRating,
        response_rate: stats.responseRate,
        avg_response_time: stats.avgResponseTime,
        total_replies: stats.totalReplies,
        platforms_connected: stats.platformsConnected,
        satisfaction_score: stats.satisfactionScore,
      },
      achievements: buildAchievements(stats),
      activity: buildActivity(reviews, platforms),
    },
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      created_at: review.createdAt.toISOString(),
      source_date: review.sourceDate.toISOString(),
      status: review.status,
      ai_reply_text: review.aiReplyText,
      platform: review.platform?.platformType || 'manual',
    })),
  })
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = profileSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid profile data.' }, { status: 400 })
  }

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const previousProfile = (clerkUser.publicMetadata?.profile || {}) as Record<string, any>
  const nextProfile = { ...previousProfile, ...parsed.data }

  if (parsed.data.full_name) {
    const [firstName, ...rest] = parsed.data.full_name.split(' ')
    await client.users.updateUser(userId, {
      firstName,
      lastName: rest.join(' ') || undefined,
    })
    await prisma.user.update({ where: { id: userId }, data: { name: parsed.data.full_name } }).catch(() => null)
  }

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...clerkUser.publicMetadata,
      profile: nextProfile,
    },
  })

  return NextResponse.json({ success: true })
}
