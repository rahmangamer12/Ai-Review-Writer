import React from 'react'
import { Zap, Brain, Globe, Lightbulb, Cpu, Sparkles, Rocket, Shield, Bot, Activity } from 'lucide-react'
import { LONGCAT_DEFAULT_MODEL, LONGCAT_MODEL_LABEL } from '@/lib/longcatModels'

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

export const MODELS: AIModel[] = [
  {
    id: LONGCAT_DEFAULT_MODEL,
    name: LONGCAT_MODEL_LABEL,
    shortName: '2.0 Preview',
    iconName: 'Zap',
    description: 'Current production LongCat model for chat, review replies, sentiment, and insights',
    badge: 'ACTIVE',
    badgeColor: 'emerald',
    quality: 90,
    speed: 'Fast',
    context: '128k',
    contextTokens: 128000,
    supportsVision: false,
    supportsThinking: false
  },
  {
    id: 'web-search',
    name: 'Web Search',
    shortName: 'Web Search',
    iconName: 'Globe',
    description: 'Searches the live web (DuckDuckGo) and answers with fresh, cited sources. Auto-engages when your message contains the word "search".',
    badge: 'LIVE',
    badgeColor: 'cyan',
    quality: 93,
    speed: 'Fast',
    context: '128k',
    contextTokens: 128000,
    supportsVision: false,
    supportsThinking: false
  },
  {
    id: 'agnes-2.0-flash',
    name: 'Agnes 2.0 Flash',
    shortName: 'Agnes 2.0',
    iconName: 'Sparkles',
    description: 'Agnes 2.0 Flash — fast multimodal model with search and image understanding',
    badge: 'VISION',
    badgeColor: 'violet',
    quality: 92,
    speed: 'Fast',
    context: '128k',
    contextTokens: 128000,
    supportsVision: true,
    supportsThinking: false
  },
  {
    id: 'agnes-1.5-flash',
    name: 'Agnes 1.5 Flash',
    shortName: 'Agnes 1.5',
    iconName: 'Globe',
    description: 'Agnes 1.5 Flash — lightweight model with vision support',
    badge: 'VISION',
    badgeColor: 'cyan',
    quality: 88,
    speed: 'Fast',
    context: '128k',
    contextTokens: 128000,
    supportsVision: true,
    supportsThinking: false
  }
]

export const MODEL_GROUPS = {
  speed: [LONGCAT_DEFAULT_MODEL, 'agnes-1.5-flash'] as const,
  reasoning: [LONGCAT_DEFAULT_MODEL, 'agnes-2.0-flash'] as const,
  vision: ['agnes-2.0-flash', 'agnes-1.5-flash'] as const
}

export const getModelById = (id: string): AIModel | undefined => {
  return MODELS.find(m => m.id === id)
}

export const getModelsByBadge = (badge: string): AIModel[] => {
  return MODELS.filter(m => m.badge === badge)
}

export const getModelIcon = (iconName: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    Zap: <Zap className="w-5 h-5" />,
    Brain: <Brain className="w-5 h-5" />,
    Globe: <Globe className="w-5 h-5" />,
    Lightbulb: <Lightbulb className="w-5 h-5" />,
    Cpu: <Cpu className="w-5 h-5" />,
    Sparkles: <Sparkles className="w-5 h-5" />,
    Rocket: <Rocket className="w-5 h-5" />,
    Shield: <Shield className="w-5 h-5" />,
    Bot: <Bot className="w-5 h-5" />,
    Activity: <Activity className="w-5 h-5" />,
  }
  return icons[iconName] || <Bot className="w-5 h-5" />
}
