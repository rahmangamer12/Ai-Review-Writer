'use client'

import React, { memo, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Plus, MessageSquare, Star, Trash2, Settings, Shield,
  CreditCard, LogOut, PanelLeftClose, PanelLeft, Sparkles
} from 'lucide-react'
import { useChat, useCurrentSession } from './ChatContext'
import { ChatSession } from './types'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onCreateSession: () => void
  onDeleteSession: (id: string) => void
  onTogglePin: (id: string) => void
  isMobile: boolean
}

function SidebarComponent({ isOpen, onClose, onCreateSession, onDeleteSession, onTogglePin, isMobile }: SidebarProps) {
  const router = useRouter()
  const { sessions, currentSessionId, setCurrentSessionId, userData, searchQuery, setSearchQuery } = useChat()

  const filteredSessions = useMemo(() => {
    const filtered = sessions.filter((s: ChatSession) => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    return {
      pinned: filtered.filter((s: ChatSession) => s.isPinned),
      recent: filtered.filter((s: ChatSession) => !s.isPinned)
    }
  }, [sessions, searchQuery])

  const handleSelectSession = useCallback((id: string) => {
    setCurrentSessionId(id)
    if (isMobile) onClose()
  }, [setCurrentSessionId, isMobile, onClose])

  return (
    <motion.aside
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -320, opacity: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      className="fixed lg:relative z-[300] w-[300px] sm:w-[320px] h-full flex flex-col bg-[#08080f]/95 backdrop-blur-xl border-r border-white/5"
    >
      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-4 cursor-pointer">
            <div className="w-10 sm:w-12 rounded-[18px] bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight">Sarah Intel</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Online</span>
              </div>
            </div>
          </motion.div>
          {isMobile && (
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl">
              <PanelLeftClose className="w-5 h-5 text-white/40" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          <button 
            onClick={onCreateSession}
            className="w-full flex items-center justify-center gap-3 py-3 sm:py-4 px-6 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600 hover:to-indigo-600 rounded-2xl text-[13px] font-black border border-violet-500/30 transition-all group active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> New Interaction
          </button>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              id="sidebar-search"
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f0f1d] border border-white/5 rounded-2xl pl-11 pr-4 py-3 sm:py-3.5 text-[12px] text-white placeholder:text-white/10 focus:outline-none focus:border-violet-500/40"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-8 space-y-4">
        {filteredSessions.pinned.length > 0 && (
          <div className="space-y-2">
            <p className="px-3 sm:px-4 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
              <Star className="w-3 h-3" /> Pinned
            </p>
            {filteredSessions.pinned.map(s => (
              <SessionItem 
                key={s.id} 
                session={s}
                isActive={currentSessionId === s.id}
                onSelect={() => handleSelectSession(s.id)}
                onDelete={() => onDeleteSession(s.id)}
                onTogglePin={() => onTogglePin(s.id)}
              />
            ))}
          </div>
        )}

        {filteredSessions.recent.length > 0 && (
          <div className="space-y-2">
            {filteredSessions.pinned.length > 0 && (
              <p className="px-3 sm:px-4 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Recent</p>
            )}
            {filteredSessions.recent.map(s => (
              <SessionItem 
                key={s.id} 
                session={s}
                isActive={currentSessionId === s.id}
                onSelect={() => handleSelectSession(s.id)}
                onDelete={() => onDeleteSession(s.id)}
                onTogglePin={() => onTogglePin(s.id)}
              />
            ))}
          </div>
        )}

        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageSquare className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-[12px] text-white/30">No conversations yet</p>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 mt-auto">
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 space-y-4">
          <div className="flex gap-3 items-center">
            <div className="w-10 sm:w-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 p-0.5">
              <div className="w-full h-full rounded-[10px] bg-[#08080f] flex items-center justify-center text-xs sm:text-sm font-black text-emerald-400">
                {userData?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] sm:text-[14px] font-black truncate">{userData?.name || 'User'}</p>
              <p className="text-[10px] text-white/30 truncate uppercase tracking-widest font-black flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" /> {userData?.planType || 'Free'} Plan
              </p>
            </div>
            <button onClick={() => router.push('/settings')} className="p-2 hover:bg-white/10 rounded-xl">
              <Settings className="w-5 h-5 text-white/40" />
            </button>
          </div>
          
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/30 font-black uppercase">Credits</span>
            <span className="text-violet-400 font-black px-2 py-1 bg-violet-400/10 rounded-lg">
              {userData?.aiCredits || 0} T-Units
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => router.push('/subscription')}
              className="flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-[10px] font-black uppercase transition-all"
            >
              <CreditCard className="w-3.5 h-3.5" /> Boost
            </button>
            <button 
              onClick={() => router.push('/')}
              className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase text-white/40 hover:text-red-400 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" /> Eject
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}

interface SessionItemProps {
  session: { id: string; title: string; date: string; isPinned?: boolean }
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onTogglePin: () => void
}

const SessionItem = memo(function SessionItem({ session, isActive, onSelect, onDelete, onTogglePin }: SessionItemProps) {
  return (
    <motion.div 
      layout
      onClick={onSelect}
      className={`group relative flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 rounded-[18px] sm:rounded-[20px] cursor-pointer transition-all border ${isActive ? 'bg-violet-600/20 border-violet-500/40' : 'hover:bg-white/5 border-transparent'}`}
    >
      <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-400' : 'text-white/20'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-[12px] sm:text-[13px] font-bold truncate ${isActive ? 'text-white' : 'text-white/40'}`}>{session.title}</p>
        <p className="text-[10px] text-white/10 mt-0.5">{new Date(session.date).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={(e) => { e.stopPropagation(); onTogglePin() }} className="p-1.5 hover:bg-white/10 rounded-lg">
          <Star className={`w-3.5 h-3.5 ${session.isPinned ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-500/40">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
})

export const Sidebar = memo(SidebarComponent)
