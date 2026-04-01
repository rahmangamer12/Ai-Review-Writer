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
  {
    id: 'LongCat-Flash-Omni-2603',
    name: 'Flash Omni',
    shortName: 'Omni',
    iconName: 'Globe',
    description: 'Multimodal vision + text engine for image analysis and understanding',
    badge: 'VISION',
    badgeColor: 'pink',
    quality: 94,
    speed: 'Advanced',
    context: '128k',
    contextTokens: 128000,
    supportsVision: true,
    supportsThinking: false
  },
  {
    id: 'deepseek-v3.2',
    name: 'DeepSeek V3.2',
    shortName: 'DS V3.2',
    iconName: 'Lightbulb',
    description: 'Advanced reasoning model via AgentRouter with superior intelligence',
    badge: 'DEEPSEEK',
    badgeColor: 'orange',
    quality: 95,
    speed: 'Fast',
    context: '64k',
    contextTokens: 64000,
    supportsVision: false,
    supportsThinking: true
  },
  {
    id: 'deepseek-v3.1',
    name: 'DeepSeek V3.1',
    shortName: 'DS V3.1',
    iconName: 'Sparkles',
    description: 'Latest DeepSeek model with enhanced capabilities',
    badge: 'DEEPSEEK',
    badgeColor: 'orange',
    quality: 96,
    speed: 'Fast',
    context: '64k',
    contextTokens: 64000,
    supportsVision: false,
    supportsThinking: true
  },
  {
    id: 'deepseek-r1-0528',
    name: 'DeepSeek R1',
    shortName: 'R1',
    iconName: 'Shield',
    description: 'Advanced reasoning model for complex multi-step tasks',
    badge: 'REASONING',
    badgeColor: 'red',
    quality: 97,
    speed: 'Medium',
    context: '128k',
    contextTokens: 128000,
    supportsVision: false,
    supportsThinking: true
  }
]

export const MODEL_GROUPS = {
  speed: [
    'LongCat-Flash-Lite',
    'LongCat-Flash-Chat',
    'LongCat-Flash-Thinking',
    'LongCat-Flash-Omni-2603'
  ],
  reasoning: [
    'LongCat-Flash-Thinking',
    'LongCat-Flash-Thinking-2601',
    'deepseek-v3.2',
    'deepseek-v3.1',
    'deepseek-r1-0528'
  ],
  vision: [
    'LongCat-Flash-Omni-2603'
  ]
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
