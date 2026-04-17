import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    let userId = null
    
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const authResult = await auth()
      userId = authResult?.userId
    } catch (authError) {
      console.warn('[User/Me API] Auth module error:', authError)
    }
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        planType: true,
        aiCredits: true,
        promptCount: true,
        maxPlatforms: true,
        name: true,
        email: true
      }
    })

    if (!user) {
      let userEmail = `${userId}@unknown.com`
      let userName = 'User'
      try {
        const { currentUser } = await import('@clerk/nextjs/server')
        const clerkUser = await currentUser()
        userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || userEmail
        userName = `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || 'User'

        user = await prisma.user.create({
          data: {
            id: userId,
            email: userEmail,
            name: userName,
            planType: 'free',
            aiCredits: 20,
            promptCount: 0,
            maxPlatforms: 1,
          },
          select: {
            id: true,
            planType: true,
            aiCredits: true,
            promptCount: true,
            maxPlatforms: true,
            name: true,
            email: true
          }
        })
      } catch (e) {
        console.warn('[User/Me API] Clerk user error:', e)
      }
    }

    return NextResponse.json({
      planType: user?.planType || 'free',
      aiCredits: user?.aiCredits || 20,
      promptCount: user?.promptCount || 0,
      maxPlatforms: user?.maxPlatforms || 1,
      name: user?.name || 'User',
      imageUrl: (user as any)?.imageUrl || null
    })
  } catch (error) {
    console.error('[User/Me API] Fatal Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error'
    }, { status: 500 })
  }
}
