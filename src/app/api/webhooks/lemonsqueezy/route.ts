import { NextRequest, NextResponse } from 'next/server'
import { lemonSqueezy } from '@/lib/lemonsqueezy'
import prisma from '@/lib/db'
import { sendUpgradeConfirmationEmail, sendLowCreditsEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

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
      case 'subscription_created':
      case 'subscription_payment_success':
        await handlePaymentSuccess(event)
        break
      
      case 'subscription_updated':
        break
      
      case 'subscription_cancelled':
      case 'subscription_expired':
        await handleSubscriptionExpired(event)
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

async function handlePaymentSuccess(event: any) {
  console.log('Payment successful:', event.data.id)
  const customData = event.meta?.custom_data
  
  if (customData?.userId && customData?.plan) {
    const plan = customData.plan;
    
    let aiCredits = 20;
    let maxPlatforms = 1;
    
    if (plan === 'starter') {
      aiCredits = 100;
      maxPlatforms = 3;
    } else if (plan === 'professional' || plan === 'growth') {
      aiCredits = 500;
      maxPlatforms = 10;
    } else if (plan === 'enterprise' || plan === 'business') {
      aiCredits = 5000;
      maxPlatforms = 100;
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: customData.userId },
        data: {
          planType: plan,
          aiCredits: aiCredits,
          maxPlatforms: maxPlatforms
        }
      });
      console.log(`✅ User ${customData.userId} upgraded to ${plan}`)

      // 📧 Send Upgrade Confirmation Email
      if (updatedUser.email) {
        await sendUpgradeConfirmationEmail(
          updatedUser.email,
          updatedUser.name || 'there',
          plan,
          aiCredits
        )
      }
    } catch (e) {
      console.error(`❌ Failed to update user in DB:`, e)
    }
  }
}

async function handleSubscriptionExpired(event: any) {
  console.log('Subscription cancelled/expired:', event.data.id)
  const customData = event.meta?.custom_data
  
  if (customData?.userId) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: customData.userId },
        data: {
          planType: 'free',
          aiCredits: 20,
          maxPlatforms: 1
        }
      });
      console.log(`❌ User ${customData.userId} reverted to free plan`)

      // 📧 Send Low Credits warning after downgrade
      if (updatedUser.email) {
        await sendLowCreditsEmail(
          updatedUser.email,
          updatedUser.name || 'there',
          20,
          'free'
        )
      }
    } catch (e) {
      console.error(`❌ Failed to downgrade user in DB:`, e)
    }
  }
}

