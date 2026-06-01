import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { z } from 'zod'
import { LONGCAT_DEFAULT_MODEL } from '@/lib/longcatModels'

export const dynamic = 'force-dynamic'

const titleSchema = z.object({
  message: z.string().trim().min(1).max(2000),
})

const longcat = createOpenAI({
  apiKey: process.env.LONGCAT_AI_API_KEY,
  baseURL: 'https://api.longcat.chat/openai/v1',
})

function fallbackTitle(message: string) {
  const cleaned = message
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s?!.:-]/g, '')
    .trim()

  if (!cleaned) return 'New Chat'
  return cleaned.length > 42 ? `${cleaned.slice(0, 39).trim()}...` : cleaned
}

function cleanTitle(title: string, message: string) {
  const cleaned = title
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/^(title|chat title)\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned || cleaned.toLowerCase() === 'new chat') return fallbackTitle(message)
  return cleaned.length > 42 ? cleaned.slice(0, 42).trim() : cleaned
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = titleSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ title: 'New Chat' }, { status: 400 })
    }

    if (!process.env.LONGCAT_AI_API_KEY) {
      return NextResponse.json({ title: fallbackTitle(parsed.data.message), generated: false })
    }

    const result = await generateText({
      model: longcat.chat(LONGCAT_DEFAULT_MODEL),
      temperature: 0.2,
      maxOutputTokens: 24,
      prompt: `Create a short, clear chat title from this first user message.
Rules:
- 3 to 6 words
- Same language as the message when possible
- No quotes
- No punctuation at the end

Message: ${parsed.data.message}`,
    })

    return NextResponse.json({
      title: cleanTitle(result.text, parsed.data.message),
      generated: true,
    })
  } catch (error) {
    console.error('[Chat Title API] Error:', error)
    return NextResponse.json({ title: 'New Chat', generated: false }, { status: 200 })
  }
}
