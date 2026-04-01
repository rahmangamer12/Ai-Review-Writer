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
  const { isLoaded, isSignedIn, userId } = useAuth()
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY RETURNS!
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

  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  const currentSession = useMemo(() => sessions.find(s => s.id === currentSessionId), [sessions, currentSessionId])
  const messages = useMemo(() => currentSession?.messages || [], [currentSession])
  const activeModel = useMemo(() => getModelById(selectedModel), [selectedModel])

  const addNotification = useCallback((text: string, type: Notification['type'] = 'success') => {
    const id = uuidv4()
    setNotifications(prev => [...prev, { id, text, type }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000)
  }, [])

  // Auth check - redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=/chat')
    }
  }, [isLoaded, isSignedIn, router])

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Please sign in to access chat</p>
          <button 
            onClick={() => router.push('/sign-in?redirect_url=/chat')}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch('/api/user/me', { cache: 'no-store' })
      const text = await res.text()
      
      const isJson = text.trim().startsWith('{') || text.trim().startsWith('[')
      if (!isJson) {
        setUserData(null)
        return
      }
      
      const data = JSON.parse(text)
      if (data.planType) {
        setUserData(data)
      } else {
        setUserData(null)
      }
    } catch (err) { 
      setUserData(null)
    }
  }, [])

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/sessions', { cache: 'no-store' })
      const text = await res.text()
      
      const isJson = text.trim().startsWith('{') || text.trim().startsWith('[')
      if (!isJson) {
        setSessions([])
        return
      }
      
      const data = JSON.parse(text)
      
      if (Array.isArray(data)) {
        const hydrated = data.map((s: any) => ({
          ...s,
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.createdAt || m.timestamp) }))
        }))
        setSessions(hydrated)
        if (hydrated.length > 0 && !currentSessionId) setCurrentSessionId(hydrated[0].id)
      } else {
        setSessions([])
      }
    } catch (err) { 
      setSessions([])
    }
  }, [currentSessionId])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchUserData()
    fetchSessions()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    const saved = localStorage.getItem('chat-settings')
    if (saved) {
      try { setSettings(JSON.parse(saved)) } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('chat-settings', JSON.stringify(settings))
  }, [settings])

  // Close more menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false)
      }
    }
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreMenu])

  const createNewSession = useCallback(() => {
    const id = uuidv4()
    const newSession: ChatSession = { id, title: 'New Chat', date: new Date().toISOString(), messages: [], isPinned: false }
    setSessions(prev => [newSession, ...prev])
    setCurrentSessionId(id)
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    if (currentSessionId === id) setCurrentSessionId(null)
    addNotification('Chat deleted', 'success')
  }, [currentSessionId, addNotification])

  const togglePin = useCallback((id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isPinned: !s.isPinned } : s).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }))
    addNotification('Chat pinned', 'success')
  }, [addNotification])

  const editTitle = useCallback((id: string) => {
    const session = sessions.find(s => s.id === id)
    if (!session) return
    const newTitle = prompt('Edit title:', session.title)
    if (newTitle?.trim()) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle.trim() } : s))
      addNotification('Title updated', 'success')
    }
  }, [sessions, addNotification])

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText || input).trim()
    if ((!text && uploadedFiles.length === 0) || isLoading) return

    let sId = currentSessionId || uuidv4()
    if (!currentSessionId) {
      const newSession: ChatSession = { id: sId, title: text?.slice(0, 30) || 'File Analysis', date: new Date().toISOString(), messages: [] }
      setSessions(prev => [newSession, ...prev])
      setCurrentSessionId(sId)
    }

    const content = text || 'Please analyze these files.'
    const userMsg: Message = { id: uuidv4(), role: 'user', content, timestamp: new Date() }
    const aiId = uuidv4()
    const aiMsg: Message = { id: aiId, role: 'assistant', content: '', timestamp: new Date(), model: activeModel?.name, isTyping: true }

    setSessions(prev => prev.map(s => s.id === sId ? { ...s, messages: [...s.messages, userMsg, aiMsg] } : s))
    setInput('')
    setUploadedFiles([])
    setIsLoading(true)

    try {
      const messagesToSend = [...messages, userMsg]
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sId },
        body: JSON.stringify({ messages: messagesToSend, model: selectedModel })
      })
      
      const contentType = res.headers.get('content-type') || ''
      
      // Check if response is HTML error page
      const text = await res.text()
      if (!contentType.includes('text/plain') && !contentType.includes('application/json')) {
        throw new Error('Invalid response')
      }
      
      // If it's JSON error response
      if (contentType.includes('application/json')) {
        const errData = JSON.parse(text)
        setSessions(prev => prev.map(s => s.id === sId ? { ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, content: errData.error || 'Error', isTyping: false, status: 'error' } : m) } : s))
        setIsLoading(false)
        return
      }
      
      // Handle streaming response
      const reader = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder()
          controller.enqueue(encoder.encode(text))
          controller.close()
        }
      }).getReader()
      
      let acc = text
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        acc += new TextDecoder().decode(value)
        setSessions(prev => prev.map(s => s.id === sId ? { ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, content: acc } : m) } : s))
      }
      setSessions(prev => prev.map(s => s.id === sId ? { ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, isTyping: false } : m) } : s))
      fetchUserData()
    } catch {
      setSessions(prev => prev.map(s => s.id === sId ? { ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, content: 'Error. Please try again.', isTyping: false, status: 'error' } : m) } : s))
      addNotification('Error sending message', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [input, uploadedFiles.length, isLoading, currentSessionId, messages, selectedModel, activeModel, fetchUserData, addNotification])

  const handleVoice = useCallback(() => {
    if (isVoiceActive) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      setIsVoiceActive(false)
      return
    }

    if (!('webkitSpeechRecognition' in window)) {
      addNotification('Voice not supported. Use Chrome!', 'error')
      return
    }

    // @ts-ignore
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      addNotification('Voice not supported. Use Chrome!', 'error')
      return
    }
    
    const recognition = new SpeechRecognition()
    
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.maxAlternatives = 1

    let finalTranscript = ''

    recognition.onstart = () => {
      setIsVoiceActive(true)
      finalTranscript = ''
    }

    recognition.onend = () => {
      setIsVoiceActive(false)
      if (finalTranscript.trim()) {
        setInput(prev => prev + (prev ? ' ' : '') + finalTranscript.trim())
        addNotification('Voice captured!', 'success')
      }
      recognitionRef.current = null
    }

    recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error)
      setIsVoiceActive(false)
      if (event.error !== 'no-speech') {
        addNotification('Voice error: ' + event.error, 'error')
      }
      recognitionRef.current = null
    }

    recognition.onresult = (event: any) => {
      const result = event.results[0]
      if (result.isFinal) {
        finalTranscript = result[0].transcript
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isVoiceActive, addNotification])

  const speakMessage = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      speechSynthesis.speak(utterance)
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    }
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

  const handleRetry = useCallback((messageId: string) => {
    const msg = messages.find(m => m.id === messageId)
    if (msg && msg.status === 'error') {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.filter(m => m.id !== messageId) } : s))
      handleSend(msg.content)
    }
  }, [messages, currentSessionId, handleSend])

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    addNotification('Copied!', 'success')
  }, [addNotification])

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

  return (
    <div className="flex h-[100dvh] w-full bg-[#030308] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[200px]" />
      </div>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-[500] flex flex-col gap-2">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className={`px-4 py-3 rounded-xl border backdrop-blur-xl flex items-center gap-2 shadow-lg ${
                n.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {n.type === 'error' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              <span className="text-sm font-medium">{n.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative z-10">
        {/* Header */}
        <header className="shrink-0 h-14 sm:h-16 border-b border-white/5 flex items-center justify-between px-3 sm:px-5 bg-[#08080f]/90 backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <h2 className="text-base sm:text-lg font-bold truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px]">
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
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Model Selector Button */}
            <button
              onClick={() => setShowModelSelector(true)}
              className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
            >
              {activeModel && (
                <span className={`${getBadgeColor(activeModel.badgeColor).split(' ')[1]} transition-colors`}>
                  {getModelIcon(activeModel.iconName)}
                </span>
              )}
              <span className="text-xs sm:text-sm font-semibold hidden xs:inline">{activeModel?.shortName || 'Model'}</span>
              <ChevronDown className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white/30" />
            </button>

            {/* Mobile Model Button */}
            <button
              onClick={() => setShowModelSelector(true)}
              className="sm:hidden p-2 bg-white/5 hover:bg-white/10 rounded-xl"
            >
              <Sparkles className="w-5 h-5 text-violet-400" />
            </button>

            {/* Action Buttons */}
            <button
              onClick={exportHistory}
              className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              title="Export chat"
            >
              <Download className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
            
            <button
              onClick={handleShare}
              className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              title="Share"
            >
              <Share2 className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
            
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              title="Help"
            >
              <HelpCircle className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              title="Settings"
            >
              <Settings className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>

            {/* More Menu */}
            <div className="relative hidden md:block" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-[#0f0f1d] border border-white/10 rounded-xl shadow-xl shadow-black/30 overflow-hidden z-[550]"
                  >
                    <button onClick={createNewSession} className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3">
                      <Plus className="w-4 h-4" /> New Chat
                    </button>
                    <button onClick={() => { setShowSettings(true); setShowMoreMenu(false) }} className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3">
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button onClick={() => { setShowHelp(true); setShowMoreMenu(false) }} className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3">
                      <HelpCircle className="w-4 h-4" /> Help
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile New Chat */}
            <button
              onClick={createNewSession}
              className="lg:hidden p-2 sm:p-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors"
            >
              <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar">
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            onRetry={handleRetry}
            onCopy={handleCopy}
            onSpeak={speakMessage}
            onStopSpeaking={stopSpeaking}
            isSpeaking={isSpeaking}
          />
        </div>

        {/* Input Area */}
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
      </main>

      {/* Modals */}
      <ModelSelector
        isOpen={showModelSelector}
        onClose={() => setShowModelSelector(false)}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        setSettings={setSettings}
        userData={userData || undefined}
      />

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0a14] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-black">Sarah AI Help</h2>
                </div>
                <button 
                  onClick={() => setShowHelp(false)} 
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 text-sm text-white/60">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <h3 className="font-bold mb-3 text-white flex items-center gap-2">
                    <Brain className="w-4 h-4 text-violet-400" />
                    Keyboard Shortcuts
                  </h3>
                  <ul className="space-y-2 text-xs">
                    <li className="flex justify-between"><span className="text-violet-400">Enter</span> <span>Send message</span></li>
                    <li className="flex justify-between"><span className="text-violet-400">Shift + Enter</span> <span>New line</span></li>
                    <li className="flex justify-between"><span className="text-violet-400">Ctrl + K</span> <span>Quick search</span></li>
                  </ul>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <h3 className="font-bold mb-3 text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    Voice Commands
                  </h3>
                  <p className="text-xs">Click the microphone button and speak clearly. Use Chrome browser for best results.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <h3 className="font-bold mb-3 text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-400" />
                    Available Models
                  </h3>
                  <p className="text-xs">Flash Chat, Flash Thinking, Flash Lite, Flash Omni, DeepSeek V3.2, DeepSeek R1</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHelp(false)}
                className="w-full mt-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close more menu on outside click */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-[490]" onClick={() => setShowMoreMenu(false)} />
      )}
    </div>
  )
}
