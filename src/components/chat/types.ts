export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model?: string
  isTyping?: boolean
  status?: 'sent' | 'error'
}

export interface ChatSession {
  id: string
  title: string
  date: string
  messages: Message[]
  isPinned?: boolean
  tags?: string[]
}

export interface UserData {
  name: string
  planType: string
  aiCredits: number
  promptCount?: number
}

export interface ChatSettings {
  enterToSend: boolean
  autoScroll: boolean
  soundEnabled: boolean
  theme: string
}

export const DEFAULT_SETTINGS: ChatSettings = {
  enterToSend: true,
  autoScroll: true,
  soundEnabled: false,
  theme: 'default'
}

export interface AIModel {
  id: string
  name: string
  shortName: string
  icon: React.ReactNode
  description: string
  badge: string
  color: string
  quality: number
  speed: string
  context: string
}

export const MODELS: AIModel[] = [
  {
    id: 'LongCat-Flash-Chat',
    name: 'Flash Chat',
    shortName: 'Flash',
    icon: null,
    description: 'High-performance general-purpose chat model',
    badge: 'GENERAL',
    color: 'emerald',
    quality: 85,
    speed: 'Ultra Fast',
    context: '128k'
  },
  {
    id: 'LongCat-Flash-Thinking',
    name: 'Flash Thinking',
    shortName: 'Thinking',
    icon: null,
    description: 'Deep-thinking & reasoning for complex logic',
    badge: 'REASONING',
    color: 'violet',
    quality: 92,
    speed: 'Balanced',
    context: '64k'
  },
  {
    id: 'LongCat-Flash-Thinking-2601',
    name: 'Thinking 2601',
    shortName: 'T-2601',
    icon: null,
    description: 'Upgraded elite thinking model (Latest)',
    badge: 'ELITE',
    color: 'amber',
    quality: 96,
    speed: 'High Quality',
    context: '128k'
  },
  {
    id: 'LongCat-Flash-Lite',
    name: 'Flash Lite',
    shortName: 'Lite',
    icon: null,
    description: 'Efficient lightweight MoE model',
    badge: 'FAST',
    color: 'blue',
    quality: 78,
    speed: 'Instant',
    context: '32k'
  },
  {
    id: 'LongCat-Flash-Omni-2603',
    name: 'Flash Omni',
    shortName: 'Omni',
    icon: null,
    description: 'MultiModal vision + text engine',
    badge: 'VISION',
    color: 'pink',
    quality: 94,
    speed: 'Advanced',
    context: '128k'
  },
  {
    id: 'deepseek-v3.2',
    name: 'DeepSeek V3.2',
    shortName: 'DeepSeek',
    icon: null,
    description: 'Advanced reasoning model via AgentRouter',
    badge: 'DEEPSEEK',
    color: 'orange',
    quality: 95,
    speed: 'Fast',
    context: '64k'
  },
  {
    id: 'deepseek-v3.1',
    name: 'DeepSeek V3.1',
    shortName: 'DeepSeek V3.1',
    icon: null,
    description: 'Latest DeepSeek model via AgentRouter',
    badge: 'DEEPSEEK',
    color: 'orange',
    quality: 96,
    speed: 'Fast',
    context: '64k'
  },
  {
    id: 'deepseek-r1-0528',
    name: 'DeepSeek R1',
    shortName: 'R1',
    icon: null,
    description: 'Reasoning model for complex tasks',
    badge: 'REASONING',
    color: 'red',
    quality: 97,
    speed: 'Medium',
    context: '128k'
  }
]

export const VOICE_LANGUAGES = [
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'ur-PK', label: 'Urdu', flag: '🇵🇰' },
  { code: 'hi-IN', label: 'Hindi', flag: '🇮🇳' },
  { code: 'ar-SA', label: 'Arabic', flag: '🇸🇦' },
  { code: 'es-ES', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', label: 'French', flag: '🇫🇷' },
  { code: 'de-DE', label: 'German', flag: '🇩🇪' },
  { code: 'zh-CN', label: 'Chinese', flag: '🇨🇳' },
  { code: 'auto', label: 'Auto Detect', flag: '🌐' },
]

export const QUICK_PROMPTS = [
  { icon: '💰', text: 'Explain your pricing plans', label: 'Pricing' },
  { icon: '🔗', text: 'How do I connect Google Reviews?', label: 'Setup' },
  { icon: '🚀', text: 'What are your best features?', label: 'Features' },
  { icon: '📈', text: 'Help me improve my review score', label: 'Growth' },
]
