import React from 'react'
import { Zap, Brain, Globe, Lightbulb, Cpu, Sparkles, Rocket, Shield, Bot, Activity } from 'lucide-react'

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
    id: 'LongCat-Flash-Chat',
    name: 'Flash Chat',
    shortName: 'Flash',
    iconName: 'Zap',
    description: 'High-performance general-purpose chat model for everyday tasks',
    badge: 'GENERAL',
    badgeColor: 'emerald',
    quality: 85,
    speed: 'Ultra Fast',
    context: '128k',
    contextTokens: 128000,
    supportsVision: false,
    supportsThinking: false
  },
  {
    id: 'LongCat-Flash-Thinking',
    name: 'Flash Thinking',
    shortName: 'Thinking',
    iconName: 'Brain',
    description: 'Deep-thinking & reasoning model for complex logic and analysis',
    badge: 'REASONING',
    badgeColor: 'violet',
    quality: 92,
    speed: 'Balanced',
    context: '64k',
    contextTokens: 64000,
    supportsVision: false,
    supportsThinking: true
  },
  {
    id: 'LongCat-Flash-Thinking-2601',
    name: 'Thinking 2601',
    shortName: 'T-2601',
    iconName: 'Rocket',
    description: 'Upgraded elite thinking model with advanced reasoning capabilities',
    badge: 'ELITE',
    badgeColor: 'amber',
    quality: 96,
    speed: 'High Quality',
    context: '128k',
    contextTokens: 128000,
    supportsVision: false,
    supportsThinking: true
  },
  {
    id: 'LongCat-Flash-Lite',
    name: 'Flash Lite',
    shortName: 'Lite',
    iconName: 'Cpu',
    description: 'Efficient lightweight MoE model for quick, simple tasks',
    badge: 'FAST',
    badgeColor: 'blue',
    quality: 78,
    speed: 'Instant',
    context: '32k',
    contextTokens: 32000,
    supportsVision: false,
    supportsThinking: false
  },
  // {
  //   id: 'LongCat-Flash-Omni-2603',
  //   name: 'Flash Omni',
  //   shortName: 'Omni',
  //   iconName: 'Globe',
  //   description: 'Multimodal vision + text engine for image analysis and understanding',
  //   badge: 'VISION',
  //   badgeColor: 'pink',
  //   quality: 94,
  //   speed: 'Advanced',
  //   context: '128k',
  //   contextTokens: 128000,
  //   supportsVision: true,
  //   supportsThinking: false
  // }, // Disabled - LongCat API returns "json format error"
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    shortName: 'Flash 2.0',
    iconName: 'Globe',
    description: 'Advanced Google multimodal AI. Faster and more reliable than 1.5. Analyzes text, PDFs, and files perfectly. Supports live web search!',
    badge: 'VISION (FREE)',
    badgeColor: 'blue',
    quality: 95,
    speed: 'Ultra Fast',
    context: '1M',
    contextTokens: 1048576,
    supportsVision: true,
    supportsThinking: false
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    shortName: 'Pro 2.5',
    iconName: 'Brain',
    description: 'Elite Google AI with complex reasoning and high-fidelity multimodal understanding. Best for deep analysis.',
    badge: 'ELITE (PRO)',
    badgeColor: 'purple',
    quality: 98,
    speed: 'High Quality',
    context: '2M',
    contextTokens: 2097152,
    supportsVision: true,
    supportsThinking: true
  }
]

export const MODEL_GROUPS = {
  speed: [
    'LongCat-Flash-Lite',
    'LongCat-Flash-Chat',
    'LongCat-Flash-Thinking',
    // 'LongCat-Flash-Omni-2603' // Disabled
  ] as const,
  reasoning: [
    'LongCat-Flash-Thinking',
    'LongCat-Flash-Thinking-2601'
  ] as const,
  vision: [
    'gemini-2.0-flash',
    'gemini-2.5-pro'
  ] as const
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
