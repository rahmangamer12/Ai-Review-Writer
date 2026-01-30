import { NextRequest, NextResponse } from 'next/server'
import { lemonSqueezy } from '@/lib/lemonsqueezy'

export async function POST(request: NextRequest) {
  try {
    const { plan, billingCycle, userEmail, userName, userId } = await request.json()

    // Validate plan
    if (!plan || !['starter', 'professional', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    // Check if Lemon Squeezy is configured
    if (!lemonSqueezy.isConfigured()) {
      console.log('Lemon Squeezy not configured - running in demo mode')
      
      // Return error so frontend can handle demo mode
      return NextResponse.json(
        { 
          error: 'Payment system not configured',
          demo: true,
          message: 'Add LEMONSQUEEZY_API_KEY to .env file for real payments'
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
