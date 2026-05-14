import { NextRequest, NextResponse } from 'next/server'
import { lemonSqueezy } from '@/lib/lemonsqueezy'
import { auth } from '@clerk/nextjs/server'
import { withCSRFProtection } from '@/lib/csrfProtection'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/ratelimit'

async function checkoutHandler(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting for checkout
    const rateLimitResult = await rateLimit(userId, RATE_LIMITS.API_STANDARD)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    const body = await request.json()
    const { plan, billingCycle, userEmail, userName } = body

    // Validate plan
    if (!plan || !['starter', 'growth', 'business', 'professional', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    // Check if Lemon Squeezy is configured
    if (!lemonSqueezy.isConfigured()) {
      console.log('Lemon Squeezy not configured')
      
      return NextResponse.json(
        { 
          error: 'Payment system is currently under maintenance. Please try again later.',
          success: false
        },
        { status: 503 }
      )
    }


    // Create checkout session with Lemon Squeezy
    const checkout = await lemonSqueezy.createCheckout(plan, {
      userEmail,
      userName,
      customData: {
        userId,
        plan,
        billingCycle
      }
    })

    if (!checkout) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.url,
      checkoutId: checkout.id
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Payment processing failed. Please try again.' },
      { status: 503 }
    )
  }
}

export const POST = withCSRFProtection(checkoutHandler)

