import { NextRequest, NextResponse } from 'next/server'
import { lemonSqueezy } from '@/lib/lemonsqueezy'
import prisma from '@/lib/db'
import { sendUpgradeConfirmationEmail, sendLowCreditsEmail } from '@/lib/email'
import { CreditsManager } from '@/lib/credits'

export const dynamic = 'force-dynamic'

function isUniqueViolation(e: unknown): boolean {
  return !!e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code === 'P2002'
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
    const externalId = event.data?.id || 'unknown'
    // Idempotency key is unique per (event type, provider object). For renewals,
    // subscription_payment_success carries a distinct invoice id each cycle, so
    // legitimate recurring payments are NOT wrongly deduped.
    const idemKey = `lemonsqueezy:${eventName}:${externalId}`

    // Durable, atomic idempotency claim (DB-backed — works without Redis).
    try {
      await prisma.webhookEvent.create({
        data: { id: idemKey, provider: 'lemonsqueezy', eventName: eventName ?? null },
      })
    } catch (e) {
      if (isUniqueViolation(e)) {
        console.warn('[LemonSqueezy Webhook] Duplicate webhook, skipping:', idemKey)
        return NextResponse.json({ success: true, message: 'Already processed' })
      }
      throw e
    }

    console.log('[LemonSqueezy Webhook] Processing event:', eventName, 'key:', idemKey)

    try {
      // Handle different webhook events
      switch (eventName) {
        case 'order_created':
        case 'subscription_created':
        case 'subscription_payment_success':
          await handlePaymentSuccess(event)
          break

        case 'subscription_updated':
          console.log('[LemonSqueezy Webhook] Subscription updated:', idemKey)
          break

        case 'subscription_cancelled':
        case 'subscription_expired':
          await handleSubscriptionExpired(event)
          break

        default:
          console.log('[LemonSqueezy Webhook] Unhandled event:', eventName)
      }
    } catch (processingError) {
      // Roll back the idempotency claim so the provider's retry can reprocess.
      await prisma.webhookEvent.delete({ where: { id: idemKey } }).catch(() => {})
      throw processingError
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
  // Fail-CLOSED in production, fail-open only outside production so test webhooks
  // and local dev still work while store verification is pending (Phase 2.4).
  const failOpen = process.env.NODE_ENV !== 'production'
  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  if (!apiKey) {
    console.warn('[LemonSqueezy Webhook] API key not set — verification skipped')
    return failOpen // In production with no key, do not grant on unverifiable events
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
        console.warn('[LemonSqueezy Webhook] Could not verify order/subscription via API')
        return failOpen // Production: do not grant on unverifiable events
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
    return failOpen // Production: fail closed if the API is unreachable
  }
}

async function handlePaymentSuccess(event: any) {
  const eventId = event.data?.id
  console.log('[LemonSqueezy Webhook] Payment successful:', eventId)

  const customData = event.meta?.custom_data

  if (customData?.userId && customData?.plan) {
    const plan = customData.plan;

    // Use CreditsManager as single source of truth for credit amounts
    const planCredits = CreditsManager.getPlanCredits(plan)
    const planAgnesCredits = CreditsManager.getPlanAgnesCredits(plan)
    const planPlatforms = CreditsManager.getPlanPlatforms(plan)

    try {
      // Verify payment status via LemonSqueezy API before updating database
      console.log('[LemonSqueezy Webhook] Verifying payment for user:', customData.userId)

      // Verify the order exists and is paid via LemonSqueezy API
      const orderVerified = await verifyLemonSqueezyOrder(eventId, customData.userId)
      if (!orderVerified) {
        console.error('[LemonSqueezy Webhook] Order verification failed for event:', eventId)
        return // Don't throw — just skip processing
      }

      // Atomic plan + credit update. The increment avoids any read-then-write
      // race (C6); idempotency is guaranteed by the DB webhook claim above, so a
      // single delivery grants credits exactly once.
      const updatedUser = await prisma.$transaction(async (tx) => {
        const exists = await tx.user.findUnique({
          where: { id: customData.userId },
          select: { id: true },
        })
        if (!exists) return null

        const renewAt = new Date()
        renewAt.setMonth(renewAt.getMonth() + 1)

        const updated = await tx.user.update({
          where: { id: customData.userId },
          data: {
            planType: plan,
            maxPlatforms: planPlatforms,
            aiCredits: { increment: planCredits },
            agnesCredits: { increment: planAgnesCredits },
            creditsRenewAt: renewAt,
          },
          select: { id: true, email: true, name: true, aiCredits: true },
        })

        await tx.creditUsage.create({
          data: {
            userId: customData.userId,
            action: 'plan_upgrade',
            amount: planCredits,
            balanceAfter: updated.aiCredits,
            description: `Upgraded to ${plan} plan — granted ${planCredits} credits`,
            metadata: { eventId, plan } as any,
          },
        })

        return updated
      })

      if (!updatedUser) {
        console.error('[LemonSqueezy Webhook] User not found:', customData.userId)
        return
      }

      console.log(`✅ [LemonSqueezy Webhook] User ${customData.userId} upgraded to ${plan} (${planCredits} credits, ${planPlatforms} platforms)`)

      // 📧 Send Upgrade Confirmation Email
      if (updatedUser.email) {
        await sendUpgradeConfirmationEmail(
          updatedUser.email,
          updatedUser.name || 'there',
          plan,
          planCredits
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
      const freeCredits = CreditsManager.getPlanCredits('free')
      const freeAgnesCredits = CreditsManager.getPlanAgnesCredits('free')
      const freePlatforms = CreditsManager.getPlanPlatforms('free')

      const updatedUser = await prisma.user.update({
        where: { id: customData.userId },
        data: {
          planType: 'free',
          aiCredits: freeCredits,
          agnesCredits: freeAgnesCredits,
          maxPlatforms: freePlatforms
        }
      });

      console.log(`❌ [LemonSqueezy Webhook] User ${customData.userId} reverted to free plan (${freeCredits} credits)`)

      // 📧 Send Low Credits warning after downgrade
      if (updatedUser.email) {
        await sendLowCreditsEmail(
          updatedUser.email,
          updatedUser.name || 'there',
          freeCredits,
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

