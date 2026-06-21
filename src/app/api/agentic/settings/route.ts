import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { CreditsManager } from '@/lib/credits'

export const dynamic = 'force-dynamic'

const schema = z.object({
  agentAutoReply: z.boolean().optional(),
  agentTriageAlerts: z.boolean().optional(),
})

// GET — current automation settings + eligibility
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { agentAutoReply: true, agentTriageAlerts: true, planType: true },
  })

  const eligible = await CreditsManager.hasFeatureAccess(userId, 'auto_reply')

  return NextResponse.json({
    agentAutoReply: user?.agentAutoReply ?? false,
    agentTriageAlerts: user?.agentTriageAlerts ?? true,
    eligible,
    plan: user?.planType || 'free',
  })
}

// POST — update automation toggles
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Auto-reply automation is a Growth/Business capability.
  if (parsed.data.agentAutoReply === true) {
    const eligible = await CreditsManager.hasFeatureAccess(userId, 'auto_reply')
    if (!eligible) {
      return NextResponse.json(
        { error: 'Auto-reply automation requires the Growth or Business plan.', upgradeUrl: '/subscription' },
        { status: 403 },
      )
    }
  }

  const data: { agentAutoReply?: boolean; agentTriageAlerts?: boolean } = {}
  if (typeof parsed.data.agentAutoReply === 'boolean') data.agentAutoReply = parsed.data.agentAutoReply
  if (typeof parsed.data.agentTriageAlerts === 'boolean') data.agentTriageAlerts = parsed.data.agentTriageAlerts

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { agentAutoReply: true, agentTriageAlerts: true },
  })

  return NextResponse.json({ success: true, ...updated })
}
