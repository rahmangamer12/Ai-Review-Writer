import { NextRequest, NextResponse } from 'next/server'
import { lemonSqueezy } from '@/lib/lemonsqueezy'
import prisma from '@/lib/db'
import { sendUpgradeConfirmationEmail, sendLowCreditsEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Store processed webhook IDs to prevent replay attacks
const processedWebhooks = new Map<string, number>()
const WEBHOOK_EXPIRY = 5 * 60 * 1000 // 5 minutes

// Cleanup old webhook IDs periodically
setInterval(() => {
  const now = Date.now()
  for (const [id, timestamp] of processedWebhooks.entries()) {
    if (now - timestamp > WEBHOOK_EXPIRY) {
      processedWebhooks.delete(id)
    }
  }
}, 60 * 1000) // Cleanup every minute

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const signature = request.headers.get('x-signature')
    const payload = await request.text()

    // Log webhook attempt
    console.log('[LemonSqueezy Webhook] Received at:', new Date().toISOString())

    if (!signature) {
      console.error('[LemonSqueezy Webhook] No signature provided')
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 401 }
      )
    }

    // Verify webhook signature
    const isValid = lemonSqueezy.verifyWebhook(signature, payload)
    if (!isValid) {
      console.error('[LemonSqueezy Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(payload)
    const eventName = event.meta?.event_name
    const eventId = event.data?.id || `${eventName}-${Date.now()}`

    // Prevent replay attacks - check if we've already processed this webhook
    if (processedWebhooks.has(eventId)) {
      console.warn('[LemonSqueezy Webhook] Duplicate webhook detected:', eventId)
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // Validate timestamp (reject webhooks older than 5 minutes)
    const eventTimestamp = event.meta?.custom_data?.timestamp || Date.now()
    if (Date.now() - eventTimestamp > WEBHOOK_EXPIRY) {
      console.error('[LemonSqueezy Webhook] Webhook too old:', eventId)
      return NextResponse.json(
        { error: 'Webhook expired' },
        { status: 400 }
      )
    }

    // Mark as processed
    processedWebhooks.set(eventId, Date.now())

    console.log('[LemonSqueezy Webhook] Processing event:', eventName, 'ID:', eventId)

    // Handle different webhook events
    switch (eventName) {
      case 'order_created':
      case 'subscription_created':
      case 'subscription_payment_success':
        await handlePaymentSuccess(event)
        break

      case 'subscription_updated':
        console.log('[LemonSqueezy Webhook] Subscription updated:', eventId)
        break

      case 'subscription_cancelled':
      case 'subscription_expired':
        await handleSubscriptionExpired(event)
        break

      default:
        console.log('[LemonSqueezy Webhook] Unhandled event:', eventName)
    }

    const processingTime = Date.now() - startTime
    console.log('[LemonSqueezy Webhook] Processed successfully in', processingTime, 'ms')

    return NextResponse.json({ success: true, processingTime })
  } catch (error) {
    console.error('[LemonSqueezy Webhook] Error:', error)

    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('[LemonSqueezy Webhook] Error details:', {
        message: error.message,
        stack: error.stack
      })
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(event: any) {
  const eventId = event.data?.id
  console.log('[LemonSqueezy Webhook] Payment successful:', eventId)

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
      // Verify payment status via API before updating database
      console.log('[LemonSqueezy Webhook] Verifying payment for user:', customData.userId)

      const updatedUser = await prisma.user.update({
        where: { id: customData.userId },
        data: {
          planType: plan,
          aiCredits: aiCredits,
          maxPlatforms: maxPlatforms
        }
      });

      console.log(`✅ [LemonSqueezy Webhook] User ${customData.userId} upgraded to ${plan}`)

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
      console.error(`❌ [LemonSqueezy Webhook] Failed to update user in DB:`, e)
      throw e // Re-throw to trigger webhook retry
    }
  } else {
    console.warn('[LemonSqueezy Webhook] Missing userId or plan in custom_data')
  }
}

async function handleSubscriptionExpired(event: any) {
  const eventId = event.data?.id
  console.log('[LemonSqueezy Webhook] Subscription cancelled/expired:', eventId)

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

      console.log(`❌ [LemonSqueezy Webhook] User ${customData.userId} reverted to free plan`)

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
      console.error(`❌ [LemonSqueezy Webhook] Failed to downgrade user in DB:`, e)
      throw e // Re-throw to trigger webhook retry
    }
  } else {
    console.warn('[LemonSqueezy Webhook] Missing userId in custom_data')
  }
}

