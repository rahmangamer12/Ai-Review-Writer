import { NextRequest, NextResponse } from 'next/server';
import { longcatAI } from '@/lib/longcatAI';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewText, rating, authorName, platform = 'google', tone = 'friendly', language = 'en' } = body;

    if (!reviewText || typeof reviewText !== 'string') {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 });
    }

    console.log(`[Generate Reply API] Generating reply for ${platform} review`);

    const sentimentResult = await longcatAI.analyzeSentiment(reviewText);

    const toneDescriptions: Record<string, string> = {
      professional: 'formal and courteous',
      friendly: 'warm and conversational',
      apologetic: 'sincere and empathetic',
      enthusiastic: 'energetic and grateful',
      desi: 'warm desi style with local expressions',
    };

    const prompt = `Generate a reply to this customer review:

Review: "${reviewText}"
Rating: ${rating || 3}/5 stars
Customer: ${authorName || 'Customer'}
Tone: ${toneDescriptions[tone] || tone}
Language: ${language}

Keep it under 300 characters, address the customer by name, and be authentic.

Return JSON: {"reply": "text", "confidence": 0.9, "needs_human_review": boolean}`;

    const aiResponse = await longcatAI.chat(
      [
        { role: 'system', content: 'You are a customer service expert. Write perfect review replies. Return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      'LongCat-Flash-Chat',
      { temperature: 0.8, max_tokens: 500 }
    );

    let replyData;
    try {
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);
      replyData = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : { reply: aiResponse.trim() };
    } catch {
      replyData = { reply: aiResponse.trim(), confidence: 0.7, needs_human_review: true };
    }

    const result = {
      reply: replyData.reply || aiResponse.trim(),
      metadata: {
        original_rating: rating,
        detected_sentiment: sentimentResult.sentiment,
        confidence: sentimentResult.confidence,
        tone_used: tone,
        platform,
        language,
        generated_at: new Date().toISOString(),
        needs_human_review: replyData.needs_human_review || sentimentResult.sentiment === 'negative',
      }
    };

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error('[Generate Reply API Error]:', error);
    return NextResponse.json({ error: 'Failed to generate reply', details: error.message, success: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Reply Generation API is running',
    supported_platforms: ['google', 'facebook', 'yelp', 'tripadvisor', 'trustpilot'],
    supported_tones: ['professional', 'friendly', 'apologetic', 'enthusiastic', 'desi'],
    timestamp: new Date().toISOString()
  });
}
