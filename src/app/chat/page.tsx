'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import type { Message, ChatSession, UserData, ChatSettings, Notification, UploadedFile } from '@/components/chat-internal/types'
import { DEFAULT_SETTINGS } from '@/components/chat-internal/types'
import { getModelById, getModelIcon } from '@/components/chat-internal/models'

import ChatSidebar from '@/components/chat-internal/ChatSidebar'
import ChatMessages from '@/components/chat-internal/ChatMessages'
import ChatInput from '@/components/chat-internal/ChatInput'
import ModelSelector from '@/components/chat-internal/ModelSelector'
import SettingsModal from '@/components/chat-internal/SettingsModal'

import {
  PanelLeft, Plus, Sparkles, Download, Share2, HelpCircle, 
  MoreHorizontal, Settings, ChevronDown, Wand2, X, Check,
  Zap, Brain
} from 'lucide-react'

export default function ChatPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  
  // --- 1. STATE HOOKS (Top Level) ---
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedModel, setSelectedModel] = useState('LongCat-Flash-Chat')
  const [isLoading, setIsLoading] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [input, setInput] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  // --- 2. REFS ---
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  // --- 3. CALLBACKS ---
  const addNotification = useCallback((text: string, type: Notification['type'] = 'success') => {
    const id = uuidv4()
    setNotifications(prev => [...prev, { id, text, type }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000)
  }, [])

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch('/api/user/me', { cache: 'no-store' })
      const data = await res.json()
      if (data.planType) setUserData(data)
    } catch (err) {}
  }, [])

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/sessions', { cache: 'no-store' })
      const data = await res.json()
      if (Array.isArray(data)) {
        const hydrated = data.map((s: any) => ({
          ...s,
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.createdAt || m.timestamp) }))
        }))
        setSessions(hydrated)
        if (hydrated.length > 0 && !currentSessionId) setCurrentSessionId(hydrated[0].id)
      }
    } catch (err) {}
  }, [currentSessionId])

  const createNewSession = useCallback(() => {
    const id = uuidv4()
    setSessions(prev => [{ id, title: 'New Chat', date: new Date().toISOString(), messages: [], isPinned: false }, ...prev])
    setCurrentSessionId(id)
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    if (currentSessionId === id) setCurrentSessionId(null)
  }, [currentSessionId])

  const togglePin = useCallback((id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isPinned: !s.isPinned } : s))
  }, [])

  const editTitle = useCallback((id: string) => {
    const session = sessions.find(s => s.id === id)
    if (!session) return
    const newTitle = prompt('Edit title:', session.title)
    if (newTitle?.trim()) setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle.trim() } : s))
  }, [sessions])

  const handleSend = useCallback(async () => { /* Real logic placeholder */ }, [])
  const handleVoice = useCallback(() => { /* Real logic placeholder */ }, [])
  const speakMessage = useCallback(() => { /* Real logic placeholder */ }, [])
  const stopSpeaking = useCallback(() => { /* Real logic placeholder */ }, [])
  const exportHistory = useCallback(() => { /* Real logic placeholder */ }, [])
  const handleShare = useCallback(() => { /* Real logic placeholder */ }, [])
  const handleRetry = useCallback(() => { /* Real logic placeholder */ }, [])
  const handleCopy = useCallback(() => { /* Real logic placeholder */ }, [])

  // --- 4. EFFECTS ---
  useEffect(() => {
    setIsMounted(true)
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(true)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isMounted) {
      fetchUserData()
      fetchSessions()
    }
  }, [isMounted, fetchUserData, fetchSessions])

  useEffect(() => {
    if (isLoaded && !isSignedIn && isMounted) {
      router.push('/sign-in?redirect_url=/chat')
    }
  }, [isLoaded, isSignedIn, isMounted, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentSessionId, isLoading])

  // --- 5. MEMOIZED ---
  const currentSession = useMemo(() => sessions.find(s => s.id === currentSessionId), [sessions, currentSessionId])
  const messages = useMemo(() => currentSession?.messages || [], [currentSession])
  const activeModel = useMemo(() => getModelById(selectedModel), [selectedModel])

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
    return colors[color] || 'bg-white/10 text-white/60 border-white/20'
  }

  // --- 6. RENDER ---
  if (!isMounted || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] w-screen bg-[#030308] text-white overflow-hidden relative">
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        createNewSession={createNewSession}
        deleteSession={deleteSession}
        togglePin={togglePin}
        editTitle={editTitle}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        userData={userData}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 flex flex-col min-w-0 w-full relative z-10 lg:pl-0">
        <header className="shrink-0 h-16 lg:h-20 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-[#08080f]/80 backdrop-blur-2xl">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 bg-white/5 rounded-xl lg:hidden flex items-center justify-center border border-white/5"
            >
              <PanelLeft className="w-5 h-5 text-white/70" />
            </button>
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm lg:text-lg font-black tracking-tight truncate max-w-[150px] sm:max-w-none">
                {currentSession?.title || 'Sarah Matrix'}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Link Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => setShowModelSelector(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 rounded-2xl border border-white/10 transition-all active:scale-95 shadow-lg"
            >
              {activeModel && (
                <span className={getBadgeColor(activeModel.badgeColor).split(' ')[1]}>
                  {getModelIcon(activeModel.iconName)}
                </span>
              )}
              <span className="text-[10px] font-black hidden md:inline uppercase tracking-widest">{activeModel?.shortName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/30" />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 bg-white/5 rounded-xl border border-white/5"
            >
              <Settings className="w-4.5 h-4.5 text-white/60" />
            </button>

            <button
              onClick={createNewSession}
              className="px-4 py-2 bg-violet-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-violet-600/20 active:scale-95 ml-1"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-transparent px-4 lg:px-12">
          <div className="max-w-4xl mx-auto w-full py-8 lg:py-12">
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              onRetry={handleRetry}
              onCopy={handleCopy}
              onSpeak={speakMessage}
              onStopSpeaking={stopSpeaking}
              isSpeaking={isSpeaking}
            />
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>

        <div className="shrink-0 w-full px-4 lg:px-12 pb-6 lg:pb-10 bg-gradient-to-t from-[#030308] to-transparent">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              input={input}
              setInput={setInput}
              onSend={handleSend}
              onVoice={handleVoice}
              isLoading={isLoading}
              isVoiceActive={isVoiceActive}
              activeModel={activeModel}
              onOpenModelSelector={() => setShowModelSelector(true)}
              fileInputRef={fileInputRef}
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
            />
          </div>
        </div>
      </main>

      <ModelSelector isOpen={showModelSelector} onClose={() => setShowModelSelector(false)} selectedModel={selectedModel} onSelectModel={setSelectedModel} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} settings={settings} setSettings={setSettings} userData={userData || undefined} />
    </div>
  )
}
