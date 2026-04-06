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
  Zap, Brain, Upload
} from 'lucide-react'

export default function ChatPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  
  // --- 1. STATE HOOKS ---
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
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

  // --- 3. MEMOIZED ---
  const currentSession = useMemo(() => sessions.find(s => s.id === currentSessionId), [sessions, currentSessionId])
  const messages = useMemo(() => currentSession?.messages || [], [currentSession])
  const activeModel = useMemo(() => getModelById(selectedModel), [selectedModel])

  // --- 4. CALLBACKS ---
  const addNotification = useCallback((text: string, type: Notification['type'] = 'success') => {
    const id = uuidv4()
    setNotifications(prev => [...prev, { id, text, type }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000)
  }, [])

  const getBadgeColor = useCallback((color: string) => {
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
  }, [])

  const exportHistory = useCallback(() => {
    if (!currentSession) return
    const text = messages.map(m => `[${m.role.toUpperCase()}] ${new Date(m.timestamp).toLocaleString()}:\n${m.content}\n`).join('\n---\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat_${currentSession.id.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    addNotification('Chat exported!', 'success')
  }, [currentSession, messages, addNotification])

  const handleShare = useCallback(() => {
    if (!currentSession) return
    const text = `Check out my chat with Sarah AI: ${currentSession.title}`
    if (navigator.share) {
      navigator.share({ title: 'Sarah AI', text })
    } else {
      navigator.clipboard.writeText(text)
      addNotification('Copied to clipboard!', 'success')
    }
  }, [currentSession, addNotification])

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
          date: s.date || s.createdAt || new Date().toISOString(),
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.createdAt || m.timestamp) }))
        }))
        setSessions(hydrated)
        if (hydrated.length > 0 && !currentSessionId) setCurrentSessionId(hydrated[0].id)
      }
    } catch (err) {}
  }, [currentSessionId])

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText || input).trim()
    if ((!text && uploadedFiles.length === 0) || isLoading) return

    let sId = currentSessionId || uuidv4()
    if (!currentSessionId) {
      const newSession: ChatSession = { id: sId, title: text?.slice(0, 30) || 'Analyze files', date: new Date().toISOString(), messages: [], isPinned: false }
      setSessions(prev => [newSession, ...prev])
      setCurrentSessionId(sId)
    }

    const userMsg: Message = { id: uuidv4(), role: 'user', content: text || 'Analyze files', timestamp: new Date() }
    const aiId = uuidv4()
    const aiMsg: Message = { id: aiId, role: 'assistant', content: '', timestamp: new Date(), model: activeModel?.name, isTyping: true }

    setSessions(prev => prev.map(s => s.id === sId ? { ...s, messages: [...s.messages, userMsg, aiMsg] } : s))
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sId },
        body: JSON.stringify({ messages: [...messages, userMsg], model: selectedModel })
      })

      if (!res.ok) throw new Error('API Error')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('Response body is null')

      const decoder = new TextDecoder()
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulatedContent += chunk

        setSessions(prev => prev.map(s => s.id === sId ? { ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, content: accumulatedContent } : m) } : s))
      }

      setSessions(prev => prev.map(s => s.id === sId ? { ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, isTyping: false } : m) } : s))

    } catch {
      addNotification('Error sending message', 'error')
      setSessions(prev => prev.map(s => s.id === sId ? { ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, content: 'Failed to connect. Please try again.', isTyping: false } : m) } : s))
    } finally {
      setIsLoading(false)
    }
  }, [input, uploadedFiles, isLoading, currentSessionId, messages, selectedModel, activeModel, addNotification])

  const handleVoice = useCallback(() => {
    if (isVoiceActive) {
      recognitionRef.current?.stop()
      setIsVoiceActive(false)
      return
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) return addNotification('Voice not supported', 'error')
    const rec = new SpeechRecognition()
    rec.onstart = () => setIsVoiceActive(true)
    rec.onresult = (e: any) => setInput(e.results[0][0].transcript)
    rec.onend = () => setIsVoiceActive(false)
    recognitionRef.current = rec
    rec.start()
  }, [isVoiceActive, addNotification])

  // --- 5. EFFECTS ---
  useEffect(() => {
    setIsMounted(true)
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
      else setSidebarOpen(true)
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // --- 6. RENDER ---
  if (!isMounted || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-129px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] lg:h-[100dvh] w-full bg-[#030308] text-white overflow-hidden relative">
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        createNewSession={() => {
          const id = uuidv4()
          setSessions(prev => [{ id, title: 'New Chat', date: new Date().toISOString(), messages: [], isPinned: false }, ...prev])
          setCurrentSessionId(id)
          if (isMobile) setSidebarOpen(false)
        }}
        deleteSession={(id) => setSessions(prev => prev.filter(s => s.id !== id))}
        togglePin={(id) => setSessions(prev => prev.map(s => s.id === id ? { ...s, isPinned: !s.isPinned } : s))}
        editTitle={(id) => {
          const newTitle = prompt('New title?')
          if (newTitle) setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s))
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        userData={userData}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 flex flex-col min-w-0 w-full relative z-10">
        <header className="shrink-0 h-16 lg:h-20 border-b border-white/5 flex items-center justify-between px-4 lg:px-8 bg-[#08080f]/80 backdrop-blur-2xl sticky top-0 z-40">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 active:scale-95 transition-all">
              <PanelLeft className="w-5 h-5 text-white/70" />
            </button>
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm lg:text-lg font-black tracking-tight truncate max-w-[150px] sm:max-w-none">
                {currentSession?.title || 'Sarah Matrix'}
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden md:flex items-center gap-2 mr-2 border-r border-white/10 pr-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={exportHistory} className="p-2.5 bg-white/5 rounded-2xl flex items-center justify-center active:bg-white/10" title="Export">
                <Download className="w-4 h-4 text-white/70" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleShare} className="p-2.5 bg-white/5 rounded-2xl flex items-center justify-center active:bg-white/10" title="Share">
                <Share2 className="w-4 h-4 text-white/70" />
              </motion.button>
            </div>
            
            <button onClick={() => setShowModelSelector(true)} className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 rounded-xl sm:rounded-2xl border border-white/5 active:scale-95 shadow-lg">
              {activeModel && <span className="text-xl">{getModelIcon(activeModel.iconName)}</span>}
              <span className="text-[10px] sm:text-xs font-semibold hidden lg:inline tracking-tight">{activeModel?.shortName}</span>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/30" />
            </button>

            <button onClick={() => setShowSettings(true)} className="p-1.5 sm:p-2.5 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center active:bg-white/10">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
            </button>

            <div className="md:hidden relative" ref={moreMenuRef}>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-1.5 sm:p-2.5 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center active:bg-white/10">
                <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
              </motion.button>
              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 top-full mt-2 w-48 bg-[#0c0c18] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
                    <div className="py-2">
                      <button onClick={() => { exportHistory(); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left">
                        <Download className="w-4 h-4 text-white/60" />
                        <span className="text-sm font-medium">Export</span>
                      </button>
                      <button onClick={() => { handleShare(); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left">
                        <Share2 className="w-4 h-4 text-white/60" />
                        <span className="text-sm font-medium">Share</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 lg:px-12 pb-[140px] md:pb-[100px]">
          <div className="max-w-4xl mx-auto w-full py-8">
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              onRetry={() => handleSend()}
              onCopy={(t) => navigator.clipboard.writeText(t)}
              onSpeak={(t) => {}}
              onStopSpeaking={() => {}}
              isSpeaking={isSpeaking}
            />
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>

        <div className="shrink-0 fixed bottom-0 left-0 right-0 z-[29] bg-gradient-to-t from-[#030308] via-[#030308]/95 to-transparent pb-[calc(84px+env(safe-area-inset-bottom))] lg:pb-8 pt-4 px-4 lg:px-12 lg:ml-[calc(16rem+320px)] xl:ml-[calc(18rem+340px)] pointer-events-none">
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-3 pointer-events-auto">
            <div className="lg:hidden flex items-center justify-between px-2">
               <button onClick={() => setSidebarOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/40 active:scale-95 backdrop-blur-md">
                 <PanelLeft className="w-3 h-3" /> Logs
               </button>
               <button onClick={() => setShowModelSelector(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-violet-400 active:scale-95 backdrop-blur-md">
                 <Sparkles className="w-3 h-3" /> {activeModel?.shortName || 'Model'}
               </button>
            </div>
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
