import { NextResponse } from 'next/server'
import { ensureUserAccount } from '@/lib/userAccount'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    let userId: string | null = null
    let clerkUser: any = null
    
    try {
      const { auth, currentUser } = await import('@clerk/nextjs/server')
      const authResult = await auth()
      userId = authResult?.userId
      clerkUser = await currentUser().catch(() => null)
    } catch (authError) {
      console.warn('[User/Me API] Auth module error:', authError)
    }
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 })
    }

    const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@unknown.com`
    const userName = clerkUser?.fullName || `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || 'User'

    const user = await ensureUserAccount({ userId, email: userEmail, name: userName })

    return NextResponse.json({
      planType: user?.planType || 'free',
      aiCredits: user?.aiCredits ?? 20,
      promptCount: user?.promptCount ?? 0,
      maxPlatforms: user?.maxPlatforms || 1,
      name: user?.name || userName,
      email: user?.email || userEmail,
      imageUrl: (user as any)?.imageUrl || null
    })
  } catch (error) {
    console.error('[User/Me API] Fatal Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error'
    }, { status: 500 })
  }
}
