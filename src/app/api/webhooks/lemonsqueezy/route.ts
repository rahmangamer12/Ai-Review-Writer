import { NextRequest, NextResponse } from 'next/server'
import { lemonSqueezy } from '@/lib/lemonsqueezy'
import { CreditsManager } from '@/lib/credits'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-signature')
    const payload = await request.text()

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 401 }
      )
    }

    // Verify webhook signature
    const isValid = lemonSqueezy.verifyWebhook(signature, payload)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(payload)
    const eventName = event.meta?.event_name

    // Handle different webhook events
    switch (eventName) {
      case 'order_created':
        await handleOrderCreated(event)
        break
      
      case 'subscription_created':
        await handleSubscriptionCreated(event)
        break
      
      case 'subscription_updated':
        await handleSubscriptionUpdated(event)
        break
      
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(event)
        break
      
      case 'subscription_payment_success':
        await handlePaymentSuccess(event)
        break
      
      default:
        console.log('Unhandled webhook event:', eventName)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleOrderCreated(event: any) {
  console.log('Order created:', event.data.id)
  const customData = event.meta?.custom_data
  
  if (customData?.userId && customData?.plan) {
    // Activate plan and add credits
    const planCredits = CreditsManager.getPlanCredits(customData.plan)
    CreditsManager.addCredits(customData.userId, planCredits, `Purchased ${customData.plan} plan`)
  }
}

async function handleSubscriptionCreated(event: any) {
  console.log('Subscription created:', event.data.id)
  const customData = event.meta?.custom_data
  
  if (customData?.userId && customData?.plan) {
    // Store subscription details
    if (typeof window !== 'undefined') {
      localStorage.setItem('autoreview-subscription', JSON.stringify({
        id: event.data.id,
        plan: customData.plan,
        status: event.data.attributes.status,
        renewsAt: event.data.attributes.renews_at
      }))
    }
  }
}

async function handleSubscriptionUpdated(event: any) {
  console.log('Subscription updated:', event.data.id)
  // Handle plan changes, status updates, etc.
}

async function handleSubscriptionCancelled(event: any) {
  console.log('Subscription cancelled:', event.data.id)
  // Handle cancellation logic
}

async function handlePaymentSuccess(event: any) {
  console.log('Payment successful:', event.data.id)
  const customData = event.meta?.custom_data
  
  if (customData?.userId && customData?.plan) {
    // Renew credits for the billing cycle
    const planCredits = CreditsManager.getPlanCredits(customData.plan)
    CreditsManager.addCredits(customData.userId, planCredits, `Monthly renewal - ${customData.plan} plan`)
  }
}
