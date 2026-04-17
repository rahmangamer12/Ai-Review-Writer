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
  email?: string
  imageUrl?: string | null
  planType: string
  aiCredits: number
  promptCount?: number
}

export interface ChatSettings {
  enterToSend: boolean
  autoScroll: boolean
  soundEnabled: boolean
  theme: 'dark' | 'light' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  codeHighlighting: boolean
  markdownRendering: boolean
  streamingResponse: boolean
}

export interface AIModel {
  id: string
  name: string
  shortName: string
  iconName: string
  description: string
  badge: string
  badgeColor: string
  quality: number
  speed: string
  context: string
  contextTokens: number
  supportsVision: boolean
  supportsThinking: boolean
}

export interface Notification {
  id: string
  text: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  preview?: string
  file?: File
}

export interface VoiceState {
  isRecording: boolean
  transcript: string
  language: string
  isSupported: boolean
}

export interface SpeechState {
  isSpeaking: boolean
  isPaused: boolean
  currentText: string
  voices: SpeechSynthesisVoice[]
}

export const DEFAULT_SETTINGS: ChatSettings = {
  enterToSend: true,
  autoScroll: true,
  soundEnabled: false,
  theme: 'dark',
  fontSize: 'medium',
  codeHighlighting: true,
  markdownRendering: true,
  streamingResponse: true
}

export const VOICE_LANGUAGES = [
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'ur-PK', label: 'Urdu', flag: '🇵🇰' },
  { code: 'hi-IN', label: 'Hindi', flag: '🇮🇳' },
  { code: 'ar-SA', label: 'Arabic', flag: '🇸🇦' },
  { code: 'es-ES', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', label: 'French', flag: '🇫🇷' },
  { code: 'de-DE', label: 'German', flag: '🇩🇪' },
  { code: 'zh-CN', label: 'Chinese', flag: '🇨🇳' },
  { code: 'ja-JP', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', label: 'Korean', flag: '🇰🇷' },
  { code: 'auto', label: 'Auto Detect', flag: '🌐' },
]

export const QUICK_PROMPTS = [
  { icon: '💰', text: 'Explain your pricing plans', label: 'Pricing' },
  { icon: '🔗', text: 'How do I connect Google Reviews?', label: 'Setup' },
  { icon: '🚀', text: 'What are your best features?', label: 'Features' },
  { icon: '📈', text: 'Help me improve my review score', label: 'Growth' },
  { icon: '🔒', text: 'How secure is my data?', label: 'Security' },
  { icon: '💬', text: 'How does auto-reply work?', label: 'AutoReply' },
]
