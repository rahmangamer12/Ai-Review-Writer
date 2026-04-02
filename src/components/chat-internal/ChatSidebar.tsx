'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Plus, Search, MessageSquare, Pin, Trash2, Edit3,
  Settings, LogOut, X
} from 'lucide-react'
import type { ChatSession, UserData } from './types'

interface ChatSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  setCurrentSessionId: (id: string | null) => void
  createNewSession: () => void
  deleteSession: (id: string) => void
  togglePin: (id: string) => void
  editTitle: (id: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  userData: UserData | null
  isMobile: boolean
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const formatRelativeDate = (dateInput: string | Date) => {
  const date = new Date(dateInput)
  const now = new Date()
  
  if (isNaN(date.getTime())) return 'Unknown'
  
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ChatSidebar({
  sessions,
  currentSessionId,
  setCurrentSessionId,
  createNewSession,
  deleteSession,
  togglePin,
  editTitle,
  searchQuery,
  setSearchQuery,
  userData,
  isMobile,
  sidebarOpen,
  setSidebarOpen
}: ChatSidebarProps) {
  const [localSearch, setLocalSearch] = useState('')
  
  const filteredSessions = useMemo(() => {
    const query = localSearch || searchQuery
    if (!query) return sessions
    return sessions.filter(s => 
      s.title.toLowerCase().includes(query.toLowerCase())
    )
  }, [sessions, searchQuery, localSearch])

  const sortedSessions = useMemo(() => {
    return [...filteredSessions].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }, [filteredSessions])

  const handleSessionClick = (id: string) => {
    setCurrentSessionId(id)
    if (isMobile) setSidebarOpen(false)
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Delete this chat?')) {
      deleteSession(id)
    }
  }

  const handlePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    togglePin(id)
  }

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    editTitle(id)
  }

  const sidebarContent = (
    <motion.aside
      {...(isMobile ? {
        initial: { y: '100%' },
        animate: { y: 0 },
        exit: { y: '100%' },
        drag: "y",
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0, bottom: 0.5 },
        onDragEnd: (_, info) => {
          if (info.offset.y > 100) setSidebarOpen(false)
        }
      } : {
        initial: { x: -320 },
        animate: { x: 0 },
      })}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className={`
        ${isMobile ? 'fixed inset-x-0 bottom-0 z-[400] rounded-t-[2.5rem] max-h-[85vh]' : 'relative flex-shrink-0'} 
        w-full lg:w-[320px] xl:w-[340px] 
        h-full bg-gradient-to-b from-[#0a0a12] via-[#08080f] to-[#060609] 
        border-r border-t border-white/5 flex flex-col overflow-hidden
      `}
    >
      {/* Mobile Handle */}
      {isMobile && (
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 flex-shrink-0" />
      )}

      {/* Header */}
      <div className="p-3 sm:p-4 lg:p-5 border-b border-white/5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/25">
              <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight">Sarah Matrix</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Node Active</span>
              </div>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg active:scale-90"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
          )}
        </div>

        <button
          onClick={createNewSession}
          className="w-full py-2.5 sm:py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
        >
          Initialize New Protocol
        </button>

        {/* Search */}
        <div className="relative mt-3 sm:mt-4">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 sm:w-4 h-3.5 sm:h-4 text-white/30" />
          <input
            type="text"
            placeholder="Scan memory logs..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/8 rounded-lg sm:rounded-xl pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 text-xs sm:text-sm placeholder:text-white/30 focus:border-primary/40 focus:outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 sm:px-3 py-2 space-y-1">
        {sortedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5 text-white/10" />
            </div>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-none">No Logs Found</p>
          </div>
        ) : (
          sortedSessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => handleSessionClick(session.id)}
              className={`group relative p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all border ${
                currentSessionId === session.id
                  ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/5'
                  : 'hover:bg-white/[0.02] border-transparent hover:border-white/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${currentSessionId === session.id ? 'text-primary' : 'text-white/20'}`}>
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {session.isPinned && <Pin className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />}
                    <p className={`text-xs sm:text-sm font-bold truncate ${currentSessionId === session.id ? 'text-white' : 'text-white/60'}`}>{session.title}</p>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-0.5">{formatRelativeDate(session.date)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={(e) => handlePin(e, session.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/20 hover:text-amber-400 transition-colors">
                  <Pin className={`w-3 h-3 ${session.isPinned ? 'fill-current' : ''}`} />
                </button>
                <button onClick={(e) => handleEdit(e, session.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/20 hover:text-blue-400 transition-colors">
                  <Edit3 className="w-3 h-3" />
                </button>
                <button onClick={(e) => handleDelete(e, session.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Profile Section */}
      <div className="p-2 sm:p-3 lg:p-4 border-t border-white/5 bg-black/20">
        <div className="p-3 sm:p-4 rounded-[1.5rem] bg-white/[0.03] border border-white/5 shadow-inner">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-emerald-500/20">
              {userData?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate">{userData?.name || 'User'}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{userData?.planType || 'Free'} PROTOCOL</p>
            </div>
            <button
              onClick={() => window.location.href = '/settings'}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all active:scale-90"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span className="text-[9px] font-black uppercase tracking-tighter text-white/40">Credits</span>
            </div>
            <span className="text-xs font-black text-violet-400 tracking-tight">{userData?.aiCredits ?? 0}</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <button
              onClick={() => window.location.href = '/subscription'}
              className="py-2 bg-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              Upgrade
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="py-2 bg-white/5 text-white/40 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 hover:text-white transition-all"
            >
              <LogOut className="w-3 h-3" />
              Exit
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  )

  return (
    <>
      {/* Desktop sidebar - always visible */}
      {!isMobile && sidebarContent}
      
      {/* Mobile sidebar - toggle with overlay */}
      {isMobile && (
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[350] bg-black/60 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
              {sidebarContent}
            </>
          )}
        </AnimatePresence>
      )}
    </>
  )
}
