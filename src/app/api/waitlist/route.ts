import { NextRequest, NextResponse } from 'next/server'

// In-memory waitlist (persists per server instance)
// When DB is configured, swap this with a Prisma/Supabase insert
const waitlist: Array<{ email: string; plan: string; addedAt: string }> = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, plan } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Check for duplicate
    const exists = waitlist.find(w => w.email.toLowerCase() === email.toLowerCase())
    if (!exists) {
      waitlist.push({
        email: email.toLowerCase().trim(),
        plan: (plan || 'unknown').toLowerCase(),
        addedAt: new Date().toISOString()
      })
      console.log(`[Waitlist] New signup: ${email} (${plan}) — Total: ${waitlist.length}`)
    }

    return NextResponse.json({ success: true, message: 'Added to waitlist' })
  } catch (error) {
    console.error('[Waitlist] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  // Simple admin endpoint to view waitlist count
  return NextResponse.json({ count: waitlist.length })
}
