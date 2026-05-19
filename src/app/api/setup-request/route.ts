import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { z } from 'zod'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

const setupRequestSchema = z.object({
  requestType: z.enum(['managed', 'video']),
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().email('Valid email is required'),
  business: z.string().trim().min(2, 'Business name is required'),
  phone: z.string().trim().optional().default(''),
  platforms: z.union([z.array(z.string()), z.string()]).optional(),
  preferred_time: z.string().trim().optional().default(''),
  timezone: z.string().trim().optional().default(''),
  message: z.string().trim().optional().default(''),
})

function normalizePlatforms(platforms: string[] | string | undefined) {
  if (Array.isArray(platforms)) return platforms.filter(Boolean).join(', ')
  return platforms?.trim() || 'Not specified'
}

async function ensureUser(userId: string, email: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (existing) return existing

  try {
    const existingByEmail = await prisma.user.findUnique({ where: { email } })
    if (existingByEmail) {
      return await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { name: existingByEmail.name || name },
      })
    }

    return await prisma.user.create({ data: { id: userId, email, name } })
  } catch (error: any) {
    if (error?.code !== 'P2002') {
      console.error('[Setup Request API] User ensure failed:', error)
      return null
    }

    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in before submitting a setup request.' },
        { status: 401 }
      )
    }

    const parsed = setupRequestSchema.safeParse(await req.json())

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: parsed.error.issues[0]?.message || 'Please check the form and try again.',
        },
        { status: 400 }
      )
    }

    const data = parsed.data
    const clerkUser = await currentUser().catch(() => null)
    const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || data.email
    const userName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || data.name
    const requestLabel = data.requestType === 'managed' ? 'Managed Setup' : 'Video Call Support'
    const platforms = normalizePlatforms(data.platforms)

    await ensureUser(userId, userEmail, userName)

    const requestMessage = [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Business: ${data.business}`,
      `Phone: ${data.phone || 'Not provided'}`,
      `Platforms: ${platforms}`,
      data.preferred_time ? `Preferred time: ${data.preferred_time}` : null,
      data.timezone ? `Timezone: ${data.timezone}` : null,
      data.message ? `Message: ${data.message}` : null,
      'Support emails: rahman.mac.apple@gamil.com, abdulmoto656@gmail.com',
    ]
      .filter(Boolean)
      .join('\n')

    try {
      await prisma.notification.create({
        data: {
          userId,
          type: data.requestType === 'managed' ? 'setup' : 'support',
          title: `${requestLabel} request submitted`,
          message: requestMessage,
        },
      })
    } catch (notificationError) {
      console.error('[Setup Request API] Notification save failed, request accepted:', {
        requestType: data.requestType,
        requestMessage,
        notificationError,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Setup request submitted successfully.',
    })
  } catch (error) {
    console.error('[Setup Request API] Error:', error)
    return NextResponse.json(
      {
        error: 'Server error',
        message: 'The request could not be submitted. Please try again later.',
      },
      { status: 500 }
    )
  }
}
