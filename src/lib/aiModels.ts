/**
 * Unified chat model catalog + provider resolver.
 *
 * Both the main chat (/api/chat) and the floating widget pick a model id from
 * here; the route uses resolveChatProvider() to get the correct OpenAI-compatible
 * base URL + API key for that model. Adding a model is a single entry here.
 */
import { LONGCAT_DEFAULT_MODEL, LONGCAT_MODEL_LABEL } from '@/lib/longcatModels'

export type ChatProvider = 'longcat' | 'agnes'

export interface ChatModel {
  id: string
  label: string
  provider: ChatProvider
  /** Supports image input (vision) */
  vision?: boolean
  /** Short capability hint for the picker */
  hint?: string
}

export const CHAT_MODELS: ChatModel[] = [
  { id: LONGCAT_DEFAULT_MODEL, label: LONGCAT_MODEL_LABEL, provider: 'longcat', hint: 'Default' },
  { id: 'agnes-2.0-flash', label: 'Agnes 2.0 Flash', provider: 'agnes', vision: true, hint: 'Search & vision' },
  { id: 'agnes-1.5-flash', label: 'Agnes 1.5 Flash', provider: 'agnes', vision: true, hint: 'Fast • vision' },
]

const AGNES_BASE_URL = process.env.AGNES_AI_BASE_URL || 'https://apihub.agnes-ai.com/v1'
const LONGCAT_BASE_URL = 'https://api.longcat.chat/openai/v1'

export function getChatModel(id?: string | null): ChatModel {
  return CHAT_MODELS.find((m) => m.id === id) ?? CHAT_MODELS[0]
}

export interface ResolvedProvider {
  model: string
  baseURL: string
  apiKey: string
  provider: ChatProvider
  vision: boolean
}

/** Resolve the base URL + server-side API key for a requested model id. */
export function resolveChatProvider(id?: string | null): ResolvedProvider {
  const m = getChatModel(id)
  if (m.provider === 'agnes') {
    return {
      model: m.id,
      baseURL: AGNES_BASE_URL,
      apiKey: process.env.AGNES_AI_API_KEY || '',
      provider: 'agnes',
      vision: !!m.vision,
    }
  }
  return {
    model: m.id,
    baseURL: LONGCAT_BASE_URL,
    apiKey: process.env.LONGCAT_AI_API_KEY || '',
    provider: 'longcat',
    vision: !!m.vision,
  }
}
