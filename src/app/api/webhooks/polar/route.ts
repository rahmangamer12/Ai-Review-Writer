import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { polar } from '@/lib/polar'
import { CreditsManager } from '@/lib/credits'
import { sendUpgradeConfirmationEmail, sendLowCreditsEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

function isUniqueViolation(e: unknown): boolean {
  return !!e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code === 'P2002'
}

const PAID_PLANS = new Set(['starter', 'growth', 'business'])

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const payload = await request.text()

    if (!polar.webhookConfigured()) {
      console.error('[Polar Webhook] POLAR_WEBHOOK_SECRET not set — rejecting')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
    }

    if (!polar.verifyWebhook(request.headers, payload)) {
      console.error('[Polar Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(payload)
    const eventType: string = event?.type || 'unknown'
    const data = event?.data || {}
    const objectId: string = data?.id || 'unknown'

    // Idempotency: keyed by event type + the provider object id. For order.paid
    // each invoice (initial + each renewal) has a distinct order id, so genuine
    // recurring payments are NOT wrongly deduped; duplicate deliveries are.
    const idemKey = `polar:${eventType}:${objectId}`

    try {
      await prisma.webhookEvent.create({
        data: { id: idemKey, provider: 'polar', eventName: eventType },
      })
    } catch (e) {
      if (isUniqueViolation(e)) {
        console.warn('[Polar Webhook] Duplicate webhook, skipping:', idemKey)
        return NextResponse.json({ success: true, message: 'Already processed' })
      }
      throw e
    }

    console.log('[Polar Webhook] Processing:', eventType, 'key:', idemKey)

    try {
      switch (eventType) {
        // Money event — fires on initial purchase AND every renewal payment.
        case 'order.paid':
          await handlePaid(data)
          break

        // Subscription ended/refunded/charge-backed → revert to free.
        case 'subscription.revoked':
        case 'subscription.canceled':
          await handleRevoked(data)
          break

        default:
          console.log('[Polar Webhook] Unhandled event:', eventType)
      }
    } catch (processingError) {
      // Roll back the idempotency claim so Polar's retry can reprocess.
      await prisma.webhookEvent.delete({ where: { id: idemKey } }).catch(() => {})
      throw processingError
    }

    const processingTime = Date.now() - startTime
    console.log('[Polar Webhook] Done in', processingTime, 'ms')
    return NextResponse.json({ success: true, processingTime })
  } catch (error) {
    console.error('[Polar Webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePaid(data: any) {
  const { userId, plan } = polar.extractMeta(data)
  const orderId = data?.id

  if (!userId || !plan || !PAID_PLANS.has(plan)) {
    console.warn('[Polar Webhook] order.paid missing/invalid userId or plan:', { userId, plan })
    return
  }

  const planCredits = CreditsManager.getPlanCredits(plan)
  const planAgnesCredits = CreditsManager.getPlanAgnesCredits(plan)
  const planPlatforms = CreditsManager.getPlanPlatforms(plan)

  const updatedUser = await prisma.$transaction(async (tx) => {
    const exists = await tx.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!exists) return null

    const renewAt = new Date()
    renewAt.setMonth(renewAt.getMonth() + 1)

    const updated = await tx.user.update({
      where: { id: userId },
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
        userId,
        action: 'plan_upgrade',
        amount: planCredits,
        balanceAfter: updated.aiCredits,
        description: `Upgraded to ${plan} plan via Polar — granted ${planCredits} credits`,
        metadata: { orderId, plan, provider: 'polar' } as any,
      },
    })

    return updated
  })

  if (!updatedUser) {
    console.error('[Polar Webhook] User not found:', userId)
    return
  }

  console.log(`✅ [Polar Webhook] User ${userId} upgraded to ${plan} (+${planCredits} credits)`)

  if (updatedUser.email) {
    await sendUpgradeConfirmationEmail(
      updatedUser.email,
      updatedUser.name || 'there',
      plan,
      planCredits
    ).catch((e) => console.error('[Polar Webhook] upgrade email failed:', e))
  }
}

async function handleRevoked(data: any) {
  const { userId } = polar.extractMeta(data)
  if (!userId) {
    console.warn('[Polar Webhook] revoke event missing userId')
    return
  }

  const freeCredits = CreditsManager.getPlanCredits('free')
  const freeAgnesCredits = CreditsManager.getPlanAgnesCredits('free')
  const freePlatforms = CreditsManager.getPlanPlatforms('free')

  const updatedUser = await prisma.user
    .update({
      where: { id: userId },
      data: {
        planType: 'free',
        aiCredits: freeCredits,
        agnesCredits: freeAgnesCredits,
        maxPlatforms: freePlatforms,
      },
      select: { id: true, email: true, name: true },
    })
    .catch((e) => {
      console.error('[Polar Webhook] downgrade failed:', e)
      throw e
    })

  console.log(`❌ [Polar Webhook] User ${userId} reverted to free plan`)

  if (updatedUser?.email) {
    await sendLowCreditsEmail(
      updatedUser.email,
      updatedUser.name || 'there',
      freeCredits,
      'free'
    ).catch((e) => console.error('[Polar Webhook] downgrade email failed:', e))
  }
}
