import { NextRequest, NextResponse } from 'next/server'
import { lemonSqueezy } from '@/lib/lemonsqueezy'
import { polar } from '@/lib/polar'
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
    if (!plan || !['starter', 'growth', 'business'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    const paidPlan = plan as 'starter' | 'growth' | 'business'
    const cycle = billingCycle === 'yearly' ? 'yearly' : 'monthly'

    // Prefer Polar when configured (Merchant of Record). Falls back to
    // LemonSqueezy below only when Polar is not set up.
    if (polar.isConfigured()) {
      const polarCheckout = await polar.createCheckout(paidPlan, cycle, {
        userId,
        userEmail,
        userName,
      })

      if (!polarCheckout) {
        return NextResponse.json(
          { error: 'Failed to create checkout session. Please try again shortly.' },
          { status: 502 }
        )
      }

      return NextResponse.json({
        success: true,
        checkoutUrl: polarCheckout.url,
        checkoutId: polarCheckout.id,
        provider: 'polar',
      })
    }

    // Check if Lemon Squeezy is configured
    if (!lemonSqueezy.isConfigured()) {
      console.log('Lemon Squeezy not configured')
      
      return NextResponse.json(
        { 
          error: 'Payment system is currently under maintenance. Please try again later.',
          missing: lemonSqueezy.getMissingForPlan(paidPlan),
          success: false
        },
        { status: 503 }
      )
    }


    // Create checkout session with Lemon Squeezy
    const checkout = await lemonSqueezy.createCheckout(paidPlan, {
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
        {
          error: 'Failed to create checkout session. Check Lemon Squeezy API key, store ID, variant ID, and store verification status.',
          missing: lemonSqueezy.getMissingForPlan(paidPlan),
        },
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

