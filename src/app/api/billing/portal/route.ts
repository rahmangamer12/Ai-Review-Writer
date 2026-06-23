import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { polar } from '@/lib/polar'

export const dynamic = 'force-dynamic'

/**
 * Returns a Polar customer portal URL for the signed-in user so they can manage
 * or cancel their subscription. 404 if no Polar customer exists yet (the user
 * hasn't purchased through Polar).
 */
export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!polar.isConfigured()) {
    return NextResponse.json({ error: 'Billing is not available right now.' }, { status: 503 })
  }

  const url = await polar.createPortalUrl(userId)
  if (!url) {
    return NextResponse.json(
      { error: 'No active subscription found to manage yet.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ url })
}
