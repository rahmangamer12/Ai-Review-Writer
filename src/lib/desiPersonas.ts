/**
 * Response Personas - Unique Response Styles for Reply Generation
 * Choose the perfect tone for your brand
 */

import { longcatAI } from './longcatAI'

export interface Persona {
  id: string
  name: string
  nameUrdu: string
  icon: string
  description: string
  tone: string
  examples: {
    positive: string
    negative: string
  }
}

export const desiPersonas: Persona[] = [
  {
    id: 'professional',
    name: 'Professional',
    nameUrdu: 'Professional',
    icon: '🤵',
    description: 'Formal and professional tone - Perfect for business clients',
    tone: 'Highly formal and professional with business etiquette',
    examples: {
      positive: 'We are delighted to receive your positive feedback. Your satisfaction is our utmost priority, and we look forward to serving you again in the near future.',
      negative: 'We sincerely apologize for the inconvenience you have experienced. We are taking immediate steps to rectify this matter and ensure it does not recur. Your feedback is invaluable to us.'
    }
  },
  {
    id: 'friendly',
    name: 'Friendly',
    nameUrdu: 'Friendly',
    icon: '😊',
    description: 'Warm and friendly tone - Like talking to a friend',
    tone: 'Casual, friendly, and conversational',
    examples: {
      positive: 'Thank you so much! We\'re really happy you enjoyed your experience. Hope to see you again soon! 🙌',
      negative: 'We\'re really sorry about this. We\'re working on fixing it right away. Thanks for your patience! 🙏'
    }
  },
  {
    id: 'empathetic',
    name: 'Empathetic',
    nameUrdu: 'Empathetic',
    icon: '💙',
    description: 'Caring and understanding - Shows genuine empathy',
    tone: 'Warm, understanding, and compassionate',
    examples: {
      positive: 'Thank you so much for your kind words! Your happiness means the world to us. We truly appreciate you! 💙',
      negative: 'We deeply regret this experience. We understand your frustration and are committed to making this right. Thank you for bringing this to our attention. 🙏'
    }
  },
  {
    id: 'enthusiastic',
    name: 'Enthusiastic',
    nameUrdu: 'Enthusiastic',
    icon: '🎉',
    description: 'Energetic and excited - Shows genuine enthusiasm',
    tone: 'Extremely enthusiastic and grateful with lots of positive energy',
    examples: {
      positive: 'OMG! Thank you SO much! 🎉 You just made our day! We\'re absolutely thrilled that you loved everything! Can\'t wait to see you again! ⭐✨',
      negative: 'Oh no! We\'re so sorry this happened! 😢 We\'re on it right away and will make sure this never happens again! Please give us another chance to wow you! 💪'
    }
  },
  {
    id: 'thoughtful',
    name: 'Thoughtful',
    nameUrdu: 'Thoughtful',
    icon: '🌟',
    description: 'Wise and considerate - Thoughtful and measured responses',
    tone: 'Wise, thoughtful, and understanding',
    examples: {
      positive: 'Your kind words truly mean a lot to us. We\'re grateful for customers like you who appreciate our efforts. Looking forward to serving you again! 🌟',
      negative: 'We take full responsibility for this mistake. We\'re carefully reviewing what went wrong and taking steps to ensure it doesn\'t happen again. Thank you for your understanding. 🙏'
    }
  }
]

/**
 * Generate reply using selected persona
 */
export async function generatePersonaReply(
  reviewText: string,
  rating: number,
  personaId: string
): Promise<string> {
  const persona = desiPersonas.find(p => p.id === personaId)
  
  if (!persona) {
    throw new Error('Persona not found')
  }

  const sentiment = rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative'
  const example = sentiment === 'positive' ? persona.examples.positive : persona.examples.negative

  const prompt = `You are "${persona.name}" - ${persona.description}

Tone to use: ${persona.tone}

Example of your style:
"${example}"

Now generate a reply to this review in the same style and tone:
Review (${rating}/5 stars): "${reviewText}"

Generate ONLY the reply text, nothing else. Match the persona's style exactly.`

  try {
    const reply = await longcatAI.chat(
      [
        {
          role: 'system',
          content: `You are a persona-based reply generator. Generate responses that match the exact style and tone of the given persona.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      'LongCat-Flash-Chat',
      { temperature: 0.85, max_tokens: 400 }
    )

    return reply.trim()
  } catch (error) {
    console.error('Persona reply generation error:', error)
    throw error
  }
}

/**
 * Get persona by ID
 */
export function getPersona(id: string): Persona | undefined {
  return desiPersonas.find(p => p.id === id)
}

/**
 * Get all personas
 */
export function getAllPersonas(): Persona[] {
  return desiPersonas
}
