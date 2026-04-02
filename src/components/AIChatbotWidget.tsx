'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Send, User, Sparkles, Loader2, Bot, 
  RefreshCw, ChevronDown, Copy, Check, Volume2, VolumeX,
  MessageSquare, Maximize2, Minimize2, Paperclip, Mic, Globe,
  Shield, Zap, History, Trash2, Sliders, Smartphone, MoreHorizontal
} from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function AIChatbotWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  
  // Hide on chat page to prevent redundancy
  if (pathname === '/chat') return null

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 group" suppressHydrationWarning>
        <motion.button
          drag
          dragConstraints={{ left: -300, right: 0, top: -500, bottom: 0 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.4)] border border-white/20 relative"
        >
          <Sparkles className="w-6 h-6 text-white" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0f] animate-pulse" />
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-[90vw] max-w-[400px] h-[600px] max-h-[70vh] bg-[#0f0f18]/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl z-[1000] flex flex-col overflow-hidden"
          >
            {/* Minimal Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Sarah AI</h3>
                  <p className="text-[10px] text-emerald-400 font-bold">NODE_OPERATIONAL</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl text-white/40">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Placeholder for messages */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-sm text-white/40 font-medium">Initializing secure link...</p>
              <button onClick={() => window.location.href='/chat'} className="mt-6 px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest">
                Switch to Full Matrix
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
