'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PanelLeft, HelpCircle, ChevronDown, Download, Share2, 
  MoreVertical, Copy, Check, Sparkles, Zap, Brain, Globe,
  Activity, Settings, Bell
} from 'lucide-react'
import type { ChatSession, AIModel } from './types'

interface ChatHeaderProps {
  currentSession: ChatSession | undefined
  selectedModel: AIModel | undefined
  onOpenModelSelector: () => void
  onExport: () => void
  onShare: () => void
  onHelp: () => void
  onNewChat: () => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const getModelIcon = (badgeColor: string) => {
  switch (badgeColor) {
    case 'emerald': return <Zap className="w-4 h-4" />
    case 'violet': return <Brain className="w-4 h-4" />
    case 'pink': return <Globe className="w-4 h-4" />
    default: return <Activity className="w-4 h-4" />
  }
}

const getBadgeColor = (color: string) => {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return colors[color] || 'bg-white/10 text-white/60 border-white/10'
}

export default function ChatHeader({
  currentSession,
  selectedModel,
  onOpenModelSelector,
  onExport,
  onShare,
  onHelp,
  onNewChat,
  sidebarOpen,
  setSidebarOpen
}: ChatHeaderProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    if (currentSession?.title) {
      navigator.clipboard.writeText(currentSession.title)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <header className="shrink-0 h-16 sm:h-18 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 bg-[#08080f]/80 backdrop-blur-2xl z-[350]">
      {/* Left Section */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors active:scale-[0.98]"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold truncate max-w-[150px] sm:max-w-[250px] lg:max-w-md">
            {currentSession?.title || 'New Chat'}
          </h2>
          {currentSession?.isPinned && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-medium rounded-full">
              <Zap className="w-3 h-3" /> Pinned
            </span>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Model Selector Button */}
        <button
          onClick={onOpenModelSelector}
          className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group active:scale-[0.98]"
        >
          {selectedModel && (
            <span className={`${getBadgeColor(selectedModel.badgeColor).split(' ')[1]} group-hover:text-white transition-colors`}>
              {getModelIcon(selectedModel.badgeColor)}
            </span>
          )}
          <span className="text-sm font-semibold">{selectedModel?.shortName || 'Select Model'}</span>
          <ChevronDown className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
        </button>

        {/* Action Buttons */}
        <button
          onClick={onExport}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors active:scale-[0.98]"
          title="Export chat"
        >
          <Download className="w-5 h-5" />
        </button>
        
        <button
          onClick={onShare}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors active:scale-[0.98]"
          title="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
        
        <button
          onClick={onHelp}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors active:scale-[0.98]"
          title="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Mobile New Chat */}
        <button
          onClick={onNewChat}
          className="lg:hidden p-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors active:scale-[0.98]"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        {/* More Menu */}
        <button
          className="hidden md:block p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors active:scale-[0.98]"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
