'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Send, User, Sparkles, Loader2, Bot, 
  RefreshCw, ChevronDown, Copy, Check, Download,
  Zap, Brain, Lightbulb, Rocket, Globe
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  model?: string
  isTyping?: boolean
}

interface ChatResponse {
  content: string
  model: string
  error?: string
}

const SARAH_PROFILE = {
  name: 'Sarah',
  title: 'AI Assistant',
  avatar: '👩‍💼',
  status: 'Powered by LongCat AI'
}

// System prompt to make AI behave like Sarah
const SYSTEM_PROMPT = `You are Sarah, the God-Tier AI Assistant for "AutoReview AI" platform. 
You possess absolute, expert-level knowledge of everything related to AutoReview AI—our platform imports, manages, and automatically replies to reviews from Google, Yelp, Facebook, etc., and uses LongCat AI to save businesses hours of work daily. Our plans: Free ($0), Starter ($10/m), Pro ($19/m), Enterprise ($39/m).

CRITICAL INSTRUCTIONS FOR YOU:
1. You are a God-Tier general purpose AI as well. If the user asks ANY question—whether it be coding, general knowledge, math, science, philosophy, or writing—you MUST answer it perfectly and enthusiastically. NEVER say "I only answer questions about AutoReview AI."
2. Always maintain a warm, helpful, and highly intelligent CSM persona. Use emojis occasionally.
3. Be transparent, direct, and incredibly thorough. Give the most informative and accurate answers possible!
4. Always respond in the exact language the user queries you in.`

const LongCatModels = [
  { id: 'LongCat-Flash-Chat', name: 'Flash Chat', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'LongCat-Flash-Thinking', name: 'Flash Thinking', icon: <Brain className="w-3.5 h-3.5" /> },
  { id: 'LongCat-Flash-Thinking-2601', name: 'Thinking 2601', icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { id: 'LongCat-Flash-Lite', name: 'Flash Lite', icon: <Rocket className="w-3.5 h-3.5" /> },
  { id: 'LongCat-Flash-Omni-2603', name: 'Flash Omni', icon: <Globe className="w-3.5 h-3.5" /> }
]

// Custom Typewriter Component for Markdown
const TypewriterMarkdown = ({ content, onComplete }: { content: string, onComplete: () => void }) => {
  const [displayLength, setDisplayLength] = useState(0)

  useEffect(() => {
    if (displayLength < content.length) {
      const timer = setTimeout(() => {
        // Faster typing effect
        setDisplayLength(prev => Math.min(prev + 1 + Math.floor(Math.random() * 3), content.length)) 
      }, 10)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => onComplete(), 200) // Small delay before finishing
      return () => clearTimeout(timer)
    }
  }, [content, displayLength, onComplete])

  const visibleContent = content.substring(0, displayLength)

  return (
    <div className="whitespace-pre-wrap">
      {visibleContent.split('\n').map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold mt-2 mb-1">{line.replace(/\*\*/g, '')}</p>
        if (line.match(/^\d️⃣/)) return <p key={i} className="ml-1">{line}</p>
        if (line.startsWith('•') || line.startsWith('-')) return <p key={i} className="ml-2 text-sm">{line}</p>
        if (line.trim() === '') return <br key={i} />
        return <p key={i}>{line}</p>
      })}
      {displayLength < content.length && (
         <span className="inline-block w-1.5 h-3.5 bg-violet-500 animate-pulse ml-1 align-middle" />
      )}
    </div>
  )
}

import { usePathname } from 'next/navigation'

export default function AIChatbot() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedModel, setSelectedModel] = useState('LongCat-Flash-Chat')
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  const [hasStarted, setHasStarted] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isEnabled, setIsEnabled] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Auto-hide tooltip
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 6000)
    return () => clearTimeout(timer)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Load from sessionStorage instead of localStorage for security
  useEffect(() => {
    // 1. Check if disabled in global settings (still use localStorage for settings)
    const settings = localStorage.getItem('autoreview-settings')
    if (settings) {
      try {
        const parsed = JSON.parse(settings)
        if (parsed.chatbotEnabled === false) setIsEnabled(false)
      } catch (e) {}
    }

    // 2. Load open state from sessionStorage (temporary)
    const savedOpen = sessionStorage.getItem('autoreview-chatbot-open')
    if (savedOpen === 'true') setIsOpen(true)

    // 3. Load history from sessionStorage (cleared on browser close)
    const saved = sessionStorage.getItem('autoreview-chatbot-history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const hydrated = parsed.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
          isTyping: false // Never show typing for old history
        }))
        if (hydrated.length > 0) {
          setHasStarted(true)
        }
      } catch (e) {
        console.error('Failed to parse chat history', e)
      }
    }
  }, [])

  // Listen for global toggle
  useEffect(() => {
    const handleToggle = (e: any) => {
      const enabled = e.detail?.enabled
      setIsEnabled(enabled)
      if (!enabled) setIsOpen(false)
    }
    const handleSettingsUpdate = (e: any) => {
      const settings = e.detail
      if (settings && typeof settings.chatbotEnabled === 'boolean') {
        setIsEnabled(settings.chatbotEnabled)
        if (!settings.chatbotEnabled) setIsOpen(false)
      }
    }
    window.addEventListener('chatbot-toggle', handleToggle)
    window.addEventListener('autoreview-settings-updated', handleSettingsUpdate)
    return () => {
      window.removeEventListener('chatbot-toggle', handleToggle)
      window.removeEventListener('autoreview-settings-updated', handleSettingsUpdate)
    }
  }, [])

  // Persist Open State to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('autoreview-chatbot-open', isOpen.toString())
  }, [isOpen])

  // Save to sessionStorage (cleared on browser close for security)
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('autoreview-chatbot-history', JSON.stringify({ messages }))
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
      if (!hasStarted) {
        // Only set the initial message on the client to avoid hydration mismatch
        setHasStarted(true)
        setTimeout(() => {
          const welcomeMsg: Message = {
            id: 'welcome',
            role: 'assistant',
            content: "👋 **Hey there!**\n\nI'm **Sarah**, your AI assistant powered by LongCat AI! 🤖✨\n\nI can help you with:\n• How AutoReview AI works\n• Pricing & plans\n• Setting up your account\n• Connecting review platforms\n• Any questions you have!\n\n**Try asking me anything** - I understand 100+ languages! 🌍",
            timestamp: new Date(),
            model: 'LongCat-Flash-Chat',
            isTyping: true
          }
          setMessages([welcomeMsg])
        }, 500)
      }
    }
  }, [isOpen, hasStarted])

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const exportChat = () => {
    let text = "AutoReview AI - Sarah Chat History\\n=================================\\n\\n"
    messages.forEach(m => {
      text += `[${m.timestamp.toLocaleString()}] ${m.role === 'user' ? 'You' : 'Sarah'}:\\n${m.content}\\n\\n`
    })
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Sarah_Chat_${new Date().toISOString().split('T')[0]}.txt`
    a.click()
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
    setHasStarted(false)
    sessionStorage.removeItem('autoreview-chatbot-history')
    setTimeout(() => {
      const welcomeMsg: Message = {
        id: 'welcome',
        role: 'assistant',
        content: "👋 **Fresh start!**\n\nI'm **Sarah** - How can I help you today?",
        timestamp: new Date(),
        model: 'LongCat-Flash-Chat',
        isTyping: true
      }
      setMessages([welcomeMsg])
    }, 100)
  }

  const handleSend = async (e?: React.FormEvent, quickText?: string) => {
    e?.preventDefault()
    const text = quickText || input
    if (!text.trim() || isLoading) return

    setError(null)

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMsg])
    if (!quickText) setInput('')
    setIsLoading(true)

    try {
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-10).map(m => ({ 
          role: m.role, 
          content: m.content 
        })),
        { role: 'user', content: text }
      ]

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel,
          temperature: 0.7,
          max_tokens: 2000
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Connection failed. Please try again.'
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json()
            errorMessage = data.error || errorMessage
          } else {
            const text = await response.text()
            // Check if it's the "simulated" plain text error
            if (text.includes('API Connection Missing')) {
              errorMessage = "⚠️ AI API is currently in simulation mode. Please check your LONGCAT_AI_API_KEY."
            } else {
              errorMessage = text || errorMessage
            }
          }
        } catch (e) {
          console.error('[Chatbot Error Parsing]:', e)
        }
        throw new Error(errorMessage)
      }

      const aiMsgId = (Date.now() + 1).toString();
      const aiMsg: Message = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        model: selectedModel,
        isTyping: false // Let's just stream the text directly, it looks cooler!
      }
      
      setMessages(prev => [...prev, aiMsg])

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Response body is null')

      const decoder = new TextDecoder()
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulatedContent += chunk
        
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: accumulatedContent } : m))
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const quickQuestions = [
    { text: 'What is AutoReview AI?', icon: '🤔' },
    { text: 'How much does it cost?', icon: '💰' },
    { text: 'How do I get started?', icon: '🚀' },
    { text: 'Which platforms work?', icon: '🌐' }
  ]

  const activeModel = LongCatModels.find(m => m.id === selectedModel)
  const isChatPage = pathname?.startsWith('/chat')

  return (
    <>
      <div
        className={`fixed z-[35] right-4 lg:right-8 ${isChatPage ? 'bottom-[120px] lg:bottom-8' : 'bottom-20 lg:bottom-8'}`}
        suppressHydrationWarning
      >
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full right-0 mb-2 hidden sm:block"
              suppressHydrationWarning
            >
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-3 py-2 rounded-xl sm:rounded-2xl shadow-lg text-xs font-medium whitespace-nowrap flex items-center gap-2" suppressHydrationWarning>
                <Sparkles className="w-3 h-3" />
                Ask me anything! I&apos;m Sarah
                <div className="absolute -bottom-1.5 right-5 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-violet-600" suppressHydrationWarning />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            setIsOpen(true)
          }}
          className={`${isOpen ? 'hidden' : 'flex'} items-center gap-2 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-full shadow-lg hover:shadow-xl transition-all touch-manipulation cursor-pointer`}
          suppressHydrationWarning
        >
          <span className="font-semibold text-xs sm:text-sm md:text-base pointer-events-none" suppressHydrationWarning>Ask Sarah</span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center text-lg sm:text-xl md:text-2xl backdrop-blur-sm pointer-events-none" suppressHydrationWarning>
            {SARAH_PROFILE.avatar}
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[44]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 sm:inset-auto sm:bottom-3 sm:right-3 md:bottom-4 md:right-4 lg:bottom-6 lg:right-6 w-full h-full sm:w-[90vw] sm:max-w-[400px] md:max-w-[440px] lg:max-w-[480px] sm:h-auto sm:max-h-[85vh] md:max-h-[650px] lg:max-h-[700px] z-[45] flex flex-col"
            >
              <div className="bg-white dark:bg-gray-900 rounded-none sm:rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full min-h-0 border-0 sm:border border-gray-200 dark:border-white/10">
                
                {/* Premium Header */}
                <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-3 sm:p-4 shrink-0 relative flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl border-2 border-white/30 backdrop-blur-sm">
                          {SARAH_PROFILE.avatar}
                        </div>
                        <motion.span 
                          animate={{ 
                            scale: [1, 1.3, 1],
                            opacity: [1, 0.7, 1]
                          }}
                          transition={{ repeat: Infinity, duration: 2.5 }}
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm" 
                        />
                      </div>
                      
                      <div>
                        <h3 className="text-white font-bold text-base">{SARAH_PROFILE.name}</h3>
                        <p className="text-white/80 text-[10px] flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{SARAH_PROFILE.status}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                       {/* Custom Premium Dropdown (Framer Motion) */}
                       <div className="relative z-50 hidden md:block" ref={dropdownRef}>
                        <button 
                          onClick={() => setShowModelDropdown(!showModelDropdown)}
                          className="flex bg-white/10 hover:bg-white/20 transition-all rounded-full items-center px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm border border-white/10"
                        >
                          <span className="mr-1.5">{activeModel?.icon}</span>
                          <span className="text-white text-[10px] font-medium mr-1.5 truncate max-w-[80px]">
                            {activeModel?.name}
                          </span>
                          <ChevronDown className={`w-3 h-3 text-white/70 transition-transform duration-300 ${showModelDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {showModelDropdown && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              transition={{ duration: 0.15 }}
                              className="absolute top-full right-0 mt-2 w-[180px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden"
                            >
                               {LongCatModels.map(model => (
                                 <button
                                   key={model.id}
                                   onClick={() => {
                                     setSelectedModel(model.id);
                                     setShowModelDropdown(false);
                                   }}
                                   className={`w-full text-left px-3 py-2.5 text-xs flex items-center gap-2 hover:bg-violet-50 dark:hover:bg-violet-900/40 transition-colors ${
                                     selectedModel === model.id ? 'bg-violet-50 dark:bg-violet-900/30 font-semibold text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300'
                                   }`}
                                 >
                                   <span>{model.icon}</span>
                                   <span>{model.name}</span>
                                 </button>
                               ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        onClick={exportChat}
                        className="p-1.5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                        title="Download Chat History"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={clearChat}
                        className="p-1.5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                        title="Refresh Conversation"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Mobile Mobile Select Fallback */}
                  <div className="md:hidden w-full bg-white/10 rounded-lg p-0.5 mt-2 flex items-center">
                    <span className="pl-2 pr-1">{activeModel?.icon}</span>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-transparent text-white text-[11px] font-medium py-1.5 px-1 focus:outline-none appearance-none [&>option]:text-gray-900"
                      >
                        {LongCatModels.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-white/50 mr-2 shrink-0 pointer-events-none" />
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 max-h-[calc(100vh-220px)] sm:max-h-[450px] md:max-h-[480px] bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900 min-h-0">
                  {!hasStarted ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="flex items-center gap-3 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Connecting to Sarah...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-2 sm:gap-3 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                          {/* Avatar */}
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 ${
                            msg.role === 'assistant' 
                              ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-md' 
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            {msg.role === 'assistant' ? (
                              <span className="text-sm">{SARAH_PROFILE.avatar}</span>
                            ) : (
                              <User className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                            )}
                          </div>

                          {/* Message Body */}
                          <div className={`max-w-[80%] sm:max-w-[85%] w-full break-words relative ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            
                            <div className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm block ${
                              msg.role === 'assistant'
                                ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-white/5'
                                : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none'
                            }`}>
                              {/* Content Routing */}
                              {msg.isTyping ? (
                                <TypewriterMarkdown 
                                  content={msg.content} 
                                  onComplete={() => {
                                    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isTyping: false } : m))
                                  }} 
                                />
                              ) : (
                                <div className="whitespace-pre-wrap">
                                  {msg.content.split('\n').map((line, i) => {
                                    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold mt-2 mb-1">{line.replace(/\*\*/g, '')}</p>
                                    if (line.match(/^\d️⃣/)) return <p key={i} className="ml-1">{line}</p>
                                    if (line.startsWith('•') || line.startsWith('-')) return <p key={i} className="ml-2 text-sm">{line}</p>
                                    if (line.trim() === '') return <br key={i} />
                                    return <p key={i}>{line}</p>
                                  })}
                                </div>
                              )}
                            </div>
                            
                            {/* Toolbar under message */}
                            <div className={`flex items-center gap-2 mt-1 px-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[9px] text-gray-400">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              
                              {msg.model && msg.role === 'assistant' && (
                                <span className="text-[8px] sm:text-[9px] px-1 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full truncate flex items-center">
                                  {LongCatModels.find(m => m.id === msg.model)?.icon || <Zap className="w-3 h-3" />}
                                  <span className="ml-[2px]">{LongCatModels.find(m => m.id === msg.model)?.name || 'Model'}</span>
                                </span>
                              )}

                              {/* Copy Button! */}
                              {msg.role === 'assistant' && !msg.isTyping && (
                                <button 
                                  onClick={() => copyToClipboard(msg.content, msg.id)}
                                  className="text-gray-400 hover:text-violet-500 transition-colors ml-1 p-0.5 opacity-0 group-hover:opacity-100 flex items-center"
                                  title="Copy text"
                                >
                                  {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {/* Loading Input Indicator */}
                      {isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <span className="text-sm">{SARAH_PROFILE.avatar}</span>
                          </div>
                          <div className="bg-white dark:bg-gray-800 px-5 py-3.5 rounded-2xl rounded-tl-none border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                {activeModel?.icon} Sarah is typing...
                              </span>
                              <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Error */}
                      {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-center max-w-[90%]">
                            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                            <button onClick={() => setError(null)} className="text-red-500 text-xs mt-1 hover:underline">Try again</button>
                          </div>
                        </motion.div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Quick Questions */}
                {messages.length < 5 && messages.length > 0 && !isLoading && (
                  <div className="px-3 py-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/5">
                    <p className="text-gray-400 text-[10px] mb-2 font-medium">Popular questions:</p>
                    <div className="flex flex-wrap gap-2 max-w-full overflow-x-auto pb-1 no-scrollbar">
                      {quickQuestions.map(q => (
                        <button
                          key={q.text}
                          onClick={() => handleSend(undefined, q.text)}
                          disabled={isLoading}
                          className="text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-800 hover:bg-violet-50 border border-transparent hover:border-violet-300 px-3 py-1.5 rounded-xl text-gray-700 dark:text-gray-300 transition-all flex items-center gap-1 whitespace-nowrap"
                        >
                          <span>{q.icon}</span>
                          <span>{q.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-white/10 shrink-0">
                  <div className="flex gap-2 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={selectedModel.includes('Thinking') ? "Give me a complex task..." : "Message Sarah..."}
                      disabled={isLoading}
                      className="flex-1 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-violet-400 rounded-xl px-4 py-3 text-xs sm:text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all disabled:opacity-50 min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="aspect-square h-[44px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md flex items-center justify-center shrink-0"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Send className="w-5 h-5 text-white ml-0.5" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2.5 px-1">
                    <span className="text-[9px] text-gray-400 flex items-center gap-1 truncate">
                      <Bot className="w-3 h-3 flex-shrink-0" />
                      Powered by LongCat AI • Secure Local History
                    </span>
                    <span className="text-[9px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {messages.length} msg
                    </span>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
