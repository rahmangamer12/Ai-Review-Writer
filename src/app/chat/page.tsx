'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import type { Message, ChatSession, UserData, ChatSettings, Notification, UploadedFile } from '@/components/chat-internal/types'
import { DEFAULT_SETTINGS } from '@/components/chat-internal/types'
import { getModelById, getModelIcon } from '@/components/chat-internal/models'
import { LONGCAT_DEFAULT_MODEL } from '@/lib/longcatModels'

import ChatSidebar from '@/components/chat-internal/ChatSidebar'
import ChatMessages from '@/components/chat-internal/ChatMessages'
import ChatInput from '@/components/chat-internal/ChatInput'
import ModelSelector from '@/components/chat-internal/ModelSelector'
import CreditPills from '@/components/CreditPills'
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
  const [selectedModel, setSelectedModel] = useState<string>(LONGCAT_DEFAULT_MODEL)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStartedAt, setLoadingStartedAt] = useState<number | null>(null)
  const [loadingSeconds, setLoadingSeconds] = useState(0)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [input, setInput] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

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

  const shouldGenerateTitle = useCallback((session?: ChatSession) => {
    if (!session) return true
    const normalizedTitle = session.title.trim().toLowerCase()
    return session.messages.length === 0 || normalizedTitle === 'new chat' || normalizedTitle === 'new conversation'
  }, [])

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
      if (res.status === 401 || res.status === 500) return
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
        setSessions(prev => {
          const localById = new Map(prev.map(session => [session.id, session]))
          return hydrated.map((serverSession: ChatSession) => {
            const localSession = localById.get(serverSession.id)
            if (localSession && localSession.messages.length > serverSession.messages.length) {
              return { ...serverSession, ...localSession }
            }
            return serverSession
          })
        })
        setCurrentSessionId(prev => prev || hydrated[0]?.id || null)
      }
    } catch (err) {}
  }, [])

  const generateAndSaveTitle = useCallback(async (sessionId: string, firstMessage: string) => {
    try {
      const response = await fetch('/api/chat/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: firstMessage }),
      })
      const data = await response.json().catch(() => ({}))
      const title = typeof data.title === 'string' && data.title.trim()
        ? data.title.trim()
        : firstMessage.slice(0, 42).trim() || 'New Chat'

      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s))
      await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, title })
      })
    } catch (err) {
      console.warn('Failed to generate chat title:', err)
    }
  }, [])

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText || input).trim()
    if ((!text && uploadedFiles.length === 0) || isLoading) return

    if (uploadedFiles.length > 0 && !activeModel?.supportsVision) {
      addNotification('File analysis is temporarily unavailable while vision models are under maintenance.', 'warning')
      return
    }

    let sId = currentSessionId || uuidv4()
    const titleNeedsAi = !currentSessionId || shouldGenerateTitle(currentSession)

    if (!currentSessionId) {
      const chatTitle = 'New Chat'
      const newSession: ChatSession = { id: sId, title: chatTitle, date: new Date().toISOString(), messages: [], isPinned: false }

      // Save new session to backend first
      try {
        await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sId, title: chatTitle, messages: [] })
        })
      } catch (err) {
        console.error('Failed to create session:', err)
      }

      setSessions(prev => [newSession, ...prev])
      setCurrentSessionId(sId)
    }

    // Build message content with files if uploaded
    let messageContent: any = text || 'Analyze files'
    let displayContent = text || 'Analyze files'

    if (uploadedFiles.length > 0) {
      displayContent = `${text || 'Analyzing'} [${uploadedFiles.length} image${uploadedFiles.length > 1 ? 's' : ''}]`
      messageContent = [
        { type: 'text', text: text || 'Please analyze these files' },
        ...uploadedFiles.map(file => ({
          type: 'image_url',
          image_url: { url: file.preview }
        }))
      ]
    }

    const userMsg: Message = { id: uuidv4(), role: 'user', content: displayContent, timestamp: new Date() }
    const aiId = uuidv4()
    const aiMsg: Message = { id: aiId, role: 'assistant', content: '', timestamp: new Date(), model: activeModel?.name, isTyping: true }

    setSessions(prev => prev.map(s => s.id === sId ? { ...s, messages: [...s.messages, userMsg, aiMsg] } : s))
    if (text && titleNeedsAi) {
      generateAndSaveTitle(sId, text)
    }
    setInput('')
    setUploadedFiles([]) // Clear uploaded files
    setIsLoading(true)
    setLoadingStartedAt(Date.now())
    setLoadingSeconds(0)

    try {
      // Build API message with actual content (text or multimodal)
      const apiMessage = {
        role: 'user',
        content: messageContent
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sId },
        body: JSON.stringify({ messages: [...messages.map(m => ({ role: m.role, content: m.content })), apiMessage], model: selectedModel })
      })

      if (!res.ok) {
        const contentType = res.headers.get('content-type') || ''
        const detail = contentType.includes('application/json')
          ? await res.json().catch(() => null)
          : await res.text().catch(() => '')
        const message = typeof detail === 'string'
          ? detail
          : detail?.error || detail?.message || `Chat request failed (${res.status})`
        throw new Error(message)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('Response body is null')

      const decoder = new TextDecoder()
      let accumulatedContent = ''
      
      // Update UI initially to show connection established
      setSessions(prev => prev.map(s => s.id === sId ? { ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, isTyping: true } : m) } : s))

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulatedContent += chunk

        setSessions(prev => prev.map(s => s.id === sId ? { ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, content: accumulatedContent } : m) } : s))
      }

      setSessions(prev => prev.map(s => s.id === sId ? {
        ...s,
        messages: s.messages.map(m => m.id === aiId ? { ...m, isTyping: false } : m)
      } : s))

      // Save to backend after successful response
      setSessions(prev => {
        const currentSession = prev.find(s => s.id === sId)
        if (currentSession) {
          fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sId,
              title: currentSession.title,
              messages: currentSession.messages
            })
          }).catch(err => console.error('Failed to save session:', err))
        }
        return prev
      })

    } catch (err) {
      console.error('Chat error:', err)
      const message = err instanceof Error ? err.message : 'Failed to connect. Please try again.'
      addNotification(message, 'error')
      setSessions(prev => prev.map(s => s.id === sId ? { ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, content: message, isTyping: false, status: 'error' } : m) } : s))
    } finally {
      setIsLoading(false)
      setLoadingStartedAt(null)
      setLoadingSeconds(0)
    }
  }, [input, uploadedFiles, isLoading, currentSessionId, currentSession, messages, selectedModel, activeModel, shouldGenerateTitle, generateAndSaveTitle, addNotification])

  const handleVoice = useCallback(async () => {
    if (isVoiceActive) {
      recognitionRef.current?.stop()
      setIsVoiceActive(false)
      return
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      addNotification('Voice input not supported in this browser. Try Chrome.', 'error')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      addNotification('Microphone access is unavailable on this browser or connection.', 'error')
      return
    }

    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err: any) {
      const message = err?.name === 'NotAllowedError'
        ? 'Microphone permission is blocked. Enable microphone access in browser settings.'
        : err?.name === 'NotFoundError'
          ? 'No microphone was found on this device.'
          : 'Microphone access failed. Please check browser permissions.'
      addNotification(message, 'error')
      return
    } finally {
      stream?.getTracks().forEach(track => track.stop())
    }

    const rec = new SpeechRecognition()
    rec.lang = navigator.language || 'en-US'
    rec.interimResults = true
    rec.continuous = false
    rec.maxAlternatives = 1
    const startingInput = input.trim()
    rec.onstart = () => {
      setIsVoiceActive(true)
      addNotification('Listening...', 'info')
    }
    rec.onresult = (e: any) => {
      const transcriptParts: string[] = []
      for (let i = 0; i < e.results.length; i++) {
        transcriptParts.push(e.results[i][0].transcript)
      }

      const transcript = transcriptParts.join(' ').replace(/\s+/g, ' ').trim()
      if (transcript) {
        setInput(startingInput ? `${startingInput} ${transcript}` : transcript)
      }
    }
    rec.onerror = (e: any) => {
      console.warn('Voice error:', e.error)
      const message = e.error === 'not-allowed'
        ? 'Microphone permission is blocked. Enable it in browser settings.'
        : e.error === 'no-speech'
          ? 'No speech detected. Try speaking closer to the microphone.'
          : e.error === 'audio-capture'
            ? 'Microphone was not detected.'
            : 'Voice recognition failed. Please try again.'
      addNotification(message, 'error')
      setIsVoiceActive(false)
    }
    rec.onend = () => setIsVoiceActive(false)
    recognitionRef.current = rec
    try {
      rec.start()
    } catch (err) {
      setIsVoiceActive(false)
      addNotification('Voice recognition could not start. Please try again.', 'error')
    }
  }, [isVoiceActive, input, addNotification])

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

  useEffect(() => {
    if (!loadingStartedAt) return
    const interval = window.setInterval(() => {
      setLoadingSeconds(Math.max(0, Math.floor((Date.now() - loadingStartedAt) / 1000)))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [loadingStartedAt])

  // --- 6. RENDER ---
  if (!isMounted || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-57px-env(safe-area-inset-top))] lg:h-[100dvh] w-full md:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] md:-mx-6 lg:-mx-8 bg-[#030308] text-white overflow-hidden relative">
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        createNewSession={async () => {
          const id = uuidv4()
          const newSession = { id, title: 'New Chat', date: new Date().toISOString(), messages: [], isPinned: false }

          try {
            // Save to backend
            await fetch('/api/chat/sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: id, title: 'New Chat', messages: [] })
            })

            // Add to frontend state
            setSessions(prev => [newSession, ...prev])
            setCurrentSessionId(id)
            if (isMobile) setSidebarOpen(false)
            addNotification('New chat created', 'success')
          } catch (err) {
            addNotification('Failed to create chat', 'error')
          }
        }}
        deleteSession={async (id) => {
          try {
            // Delete from backend
            await fetch(`/api/chat/sessions?id=${id}`, { method: 'DELETE' })
            // Delete from frontend state
            setSessions(prev => prev.filter(s => s.id !== id))
            // If deleted session was current, switch to first available
            if (currentSessionId === id) {
              const remaining = sessions.filter(s => s.id !== id)
              setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null)
            }
            addNotification('Chat deleted', 'success')
          } catch (err) {
            addNotification('Failed to delete chat', 'error')
          }
        }}
        togglePin={(id) => setSessions(prev => prev.map(s => s.id === id ? { ...s, isPinned: !s.isPinned } : s))}
        editTitle={(id) => {
          const session = sessions.find(s => s.id === id)
          if (session) {
            setRenamingId(id)
            setRenameValue(session.title)
          }
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        userData={userData}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 flex flex-col min-w-0 w-full relative z-10">
        <header className="fixed lg:sticky top-[50px] lg:top-0 left-0 right-0 lg:left-auto lg:right-auto shrink-0 h-16 lg:h-20 border-b border-white/5 flex items-center justify-between px-4 lg:px-8 bg-[#08080f]/95 backdrop-blur-2xl z-[60]">
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
            <CreditPills className="hidden sm:flex mr-1" refreshKey={messages.length} />
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
        <div className="h-16 shrink-0 lg:hidden" />

        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 sm:px-4 lg:px-12 pb-[180px] sm:pb-[150px] md:pb-[110px] lg:pb-16">
          <div className="max-w-4xl mx-auto w-full py-8">
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              loadingModelName={activeModel?.name}
              loadingSeconds={loadingSeconds}
              onRetry={() => handleSend()}
              onCopy={(t) => navigator.clipboard.writeText(t)}
              onSpeak={(t) => {
                setIsSpeaking(true)
              }}
              onStopSpeaking={() => {
                window.speechSynthesis?.cancel()
                setIsSpeaking(false)
              }}
              isSpeaking={isSpeaking}
              onQuickPrompt={(prompt) => handleSend(prompt)}
            />
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>

        <div className="shrink-0 fixed bottom-0 left-0 right-0 z-[29] bg-gradient-to-t from-[#030308] via-[#030308]/95 to-transparent pb-[calc(80px+env(safe-area-inset-bottom))] lg:pb-6 pt-3 px-3 sm:px-4 lg:px-12 lg:ml-[calc(16rem+320px)] xl:ml-[calc(18rem+340px)] pointer-events-none">
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

      {/* Inline Rename Modal — replaces prompt() */}
      <AnimatePresence>
        {renamingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setRenamingId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0c0c18] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-white font-semibold mb-4">Rename Chat</h3>
              <input
                autoFocus
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && renameValue.trim()) {
                    setSessions(prev => prev.map(s => s.id === renamingId ? { ...s, title: renameValue.trim() } : s))
                    setRenamingId(null)
                  }
                  if (e.key === 'Escape') setRenamingId(null)
                }}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 text-sm mb-4"
                placeholder="Chat title..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setRenamingId(null)}
                  className="flex-1 py-2 text-sm text-white/50 hover:text-white bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (renameValue.trim()) {
                      setSessions(prev => prev.map(s => s.id === renamingId ? { ...s, title: renameValue.trim() } : s))
                      setRenamingId(null)
                    }
                  }}
                  className="flex-1 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors"
                >
                  Rename
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
