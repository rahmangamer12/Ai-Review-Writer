import { NextRequest, NextResponse } from 'next/server'
import { lemonSqueezy } from '@/lib/lemonsqueezy'
import prisma from '@/lib/db'
import { sendUpgradeConfirmationEmail, sendLowCreditsEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const WEBHOOK_EXPIRY = 5 * 60 * 1000 // 5 minutes

// Redis client for webhook storage (prevents replay attacks in serverless)
async function getRedisClient() {
  const { Redis } = await import('@upstash/redis')
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  
  if (!url || !token) return null
  return new Redis({ url, token })
}

// Check if webhook was already processed (using Redis for persistence)
async function isWebhookProcessed(eventId: string): Promise<boolean> {
  try {
    const redis = await getRedisClient()
    if (redis) {
      const result = await redis.exists(`webhook:${eventId}`)
      return result === 1
    }
  } catch {
    // Redis not available, continue
  }
  return false
}

// Mark webhook as processed
async function markWebhookProcessed(eventId: string): Promise<void> {
  try {
    const redis = await getRedisClient()
    if (redis) {
      await redis.set(`webhook:${eventId}`, 'processed', { ex: 300 })
    }
  } catch {
    // Redis not available, continue
  }
}

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

    // Prevent replay attacks - check if we've already processed this webhook (Redis-based)
    const alreadyProcessed = await isWebhookProcessed(eventId)
    if (alreadyProcessed) {
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

    // Mark as processed in Redis
    await markWebhookProcessed(eventId)

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

/**
 * Verify order/subscription with LemonSqueezy API to prevent spoofed webhooks
 */
async function verifyLemonSqueezyOrder(eventId: string, expectedUserId: string): Promise<boolean> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  if (!apiKey) {
    console.warn('[LemonSqueezy Webhook] API key not set — skipping verification (dev mode)')
    return true // Allow in dev mode when API key isn't configured
  }

  try {
    // Try to fetch the order from LemonSqueezy API
    const response = await fetch(`https://api.lemonsqueezy.com/v1/orders/${eventId}`, {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      // If order endpoint fails, try subscription endpoint
      const subResponse = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${eventId}`, {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${apiKey}`
        }
      })
      if (!subResponse.ok) {
        console.warn('[LemonSqueezy Webhook] Could not verify order/subscription via API — allowing (may be test webhook)')
        return true // Allow test webhooks from LemonSqueezy dashboard
      }
      const subData = await subResponse.json()
      const subUserId = subData.data?.attributes?.meta?.custom_data?.userId
      return !subUserId || subUserId === expectedUserId
    }

    const orderData = await response.json()
    const orderUserId = orderData.data?.attributes?.meta?.custom_data?.userId
    const orderStatus = orderData.data?.attributes?.status

    // Verify the user ID matches and order is paid
    if (orderUserId && orderUserId !== expectedUserId) {
      console.error('[LemonSqueezy Webhook] User ID mismatch:', { expected: expectedUserId, got: orderUserId })
      return false
    }

    if (orderStatus && orderStatus !== 'paid' && orderStatus !== 'complete') {
      console.warn('[LemonSqueezy Webhook] Order status not paid:', orderStatus)
      return false
    }

    console.log('[LemonSqueezy Webhook] Order verified successfully')
    return true
  } catch (error) {
    console.error('[LemonSqueezy Webhook] Verification error:', error)
    return true // Fail open — allow the webhook if API is unreachable
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
      // Verify payment status via LemonSqueezy API before updating database
      console.log('[LemonSqueezy Webhook] Verifying payment for user:', customData.userId)

      // Verify the order exists and is paid via LemonSqueezy API
      const orderVerified = await verifyLemonSqueezyOrder(eventId, customData.userId)
      if (!orderVerified) {
        console.error('[LemonSqueezy Webhook] Order verification failed for event:', eventId)
        return // Don't throw — just skip processing
      }

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

