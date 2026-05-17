import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  url: z.string().url(),
  secret: z.string().optional(),
  destination: z.enum(['webhook', 'slack', 'discord']).default('webhook'),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please enter a valid webhook URL.' }, { status: 400 })
  }

  const { url, secret, destination } = parsed.data
  const target = new URL(url)
  if (!['https:', 'http:'].includes(target.protocol)) {
    return NextResponse.json({ error: 'Webhook URL must use HTTPS or HTTP.' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'x-autoreview-signature': secret } : {}),
      },
      body: JSON.stringify({
        source: 'AutoReview AI',
        event: 'integration.test',
        destination,
        message: 'This is a test payload from AutoReview AI settings.',
        sentAt: new Date().toISOString(),
      }),
    })

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      message: response.ok ? 'Test payload delivered successfully.' : `Endpoint responded with HTTP ${response.status}.`,
    }, { status: response.ok ? 200 : 502 })
  } catch (error) {
    return NextResponse.json({ error: 'Could not deliver the test payload. Check the URL and server settings.' }, { status: 502 })
  }
}
