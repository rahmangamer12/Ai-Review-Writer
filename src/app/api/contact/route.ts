import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/ratelimit'
import { sendContactEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Contact + schedule-call submissions land here. Stored in the Feedback table
// (no migration needed) so a message is never lost, and emailed to the owner
// when RESEND_API_KEY + CONTACT_EMAIL are configured.
const schema = z.object({
  type: z.enum(['contact', 'schedule']).default('contact'),
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('A valid email is required').max(254),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  subject: z.string().trim().max(120).optional().or(z.literal('')),
  business: z.string().trim().max(120).optional().or(z.literal('')),
  preferredTime: z.string().trim().max(60).optional().or(z.literal('')),
  message: z.string().trim().max(4000).optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const rl = await rateLimit(`contact:${ip}`, RATE_LIMITS.AUTH)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rl) }
      )
    }

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Please check the form and try again.' },
        { status: 400 }
      )
    }
    const d = parsed.data

    const detail = [
      d.subject ? `Subject: ${d.subject}` : null,
      d.business ? `Business: ${d.business}` : null,
      d.phone ? `Phone/WhatsApp: ${d.phone}` : null,
      d.preferredTime ? `Preferred time: ${d.preferredTime}` : null,
      '',
      d.message || '(no message provided)',
    ]
      .filter((l) => l !== null)
      .join('\n')

    await prisma.feedback.create({
      data: {
        userId: null,
        rating: 0,
        category: d.type === 'schedule' ? 'schedule' : 'contact',
        message: `[${d.name} · ${d.email}]\n${detail}`,
        email: d.email,
        pageUrl: null,
        userAgent: req.headers.get('user-agent')?.slice(0, 500) || null,
      },
      select: { id: true },
    })

    // Best-effort owner notification — never blocks the success response.
    await sendContactEmail({
      type: d.type,
      name: d.name,
      email: d.email,
      phone: d.phone || '',
      subject: d.subject || '',
      business: d.business || '',
      preferredTime: d.preferredTime || '',
      message: d.message || '',
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Contact API] Error:', error)
    return NextResponse.json(
      { error: 'Could not send your message. Please try again.' },
      { status: 500 }
    )
  }
}
