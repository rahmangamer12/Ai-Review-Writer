'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  X, 
  Send, 
  User, 
  Sparkles,
  Loader2,
  Bot,
  RefreshCw,
  BrainCircuit
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  model?: string
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
const SYSTEM_PROMPT = `You are Sarah, a friendly and helpful Customer Success Manager at AutoReview AI. 

Your personality:
- Warm, conversational, and professional
- Use emojis occasionally to be friendly
- Give detailed but easy-to-understand answers
- Always be helpful and encouraging

About AutoReview AI:
- AI-powered review management tool for businesses
- Automatically responds to Google, Facebook, Yelp reviews
- Saves businesses 5-10 hours per week
- Pricing: Free ($0), Starter ($10/month), Pro ($19/month), Enterprise ($39/month)
- Supports 100+ languages

When greeting, be warm and welcoming.
When explaining features, be clear and helpful.
When discussing pricing, be transparent.
If you don't know something, be honest and suggest contacting support.

Always respond in the same language the user is using.`

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useThinkingModel, setUseThinkingModel] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-hide tooltip
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 6000)
    return () => clearTimeout(timer)
  }, [])

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
        setHasStarted(true)
        // Send welcome message
        setTimeout(() => {
          const welcomeMsg: Message = {
            id: 'welcome',
            role: 'assistant',
            content: "👋 **Hey there!**\n\nI'm **Sarah**, your AI assistant powered by LongCat AI! 🤖✨\n\nI can help you with:\n• How AutoReview AI works\n• Pricing & plans\n• Setting up your account\n• Connecting review platforms\n• Any questions you have!\n\n**Try asking me anything** - I understand 100+ languages! 🌍",
            timestamp: new Date(),
            model: 'LongCat-Flash-Chat'
          }
          setMessages([welcomeMsg])
        }, 500)
      }
    }
  }, [isOpen, hasStarted])

  // Call LongCat AI API
  const callLongCatAPI = async (userMessage: string, history: Message[]): Promise<ChatResponse> => {
    try {
      // Build messages array for API
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.slice(-10).map(m => ({ 
          role: m.role, 
          content: m.content 
        })),
        { role: 'user', content: userMessage }
      ]

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: useThinkingModel ? 'LongCat-Flash-Thinking' : 'LongCat-Flash-Chat',
          temperature: 0.7,
          max_tokens: 2000
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      return {
        content: data.content || data.message || 'Sorry, I could not process that.',
        model: data.model || (useThinkingModel ? 'LongCat-Flash-Thinking' : 'LongCat-Flash-Chat')
      }
    } catch (err: unknown) {
      console.error('API Error:', err)
      return {
        content: '',
        model: '',
        error: err instanceof Error ? err.message : 'Connection failed. Please try again.'
      }
    }
  }

  const handleSend = async (e?: React.FormEvent, quickText?: string) => {
    e?.preventDefault()
    const text = quickText || input
    if (!text.trim() || isLoading) return

    setError(null)

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMsg])
    if (!quickText) setInput('')
    setIsLoading(true)

    // Call API
    const response = await callLongCatAPI(text, messages)

    if (response.error) {
      setError(response.error)
      setIsLoading(false)
      return
    }

    // Add AI response
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      model: response.model
    }
    
    setMessages(prev => [...prev, aiMsg])
    setIsLoading(false)
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
    setHasStarted(false)
    setTimeout(() => {
      const welcomeMsg: Message = {
        id: 'welcome',
        role: 'assistant',
        content: "👋 **Fresh start!**\n\nI'm **Sarah** - How can I help you today?",
        timestamp: new Date(),
        model: 'LongCat-Flash-Chat'
      }
      setMessages([welcomeMsg])
    }, 100)
  }

  const quickQuestions = [
    { text: 'What is AutoReview AI?', icon: '🤔' },
    { text: 'How much does it cost?', icon: '💰' },
    { text: 'How do I get started?', icon: '🚀' },
    { text: 'Which platforms work?', icon: '🌐' }
  ]

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full right-0 mb-3"
            >
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-2xl shadow-lg text-sm font-medium whitespace-nowrap flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Ask me anything! I&apos;m Sarah
                <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-violet-600" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className={`${isOpen ? 'hidden' : 'flex'} items-center gap-3 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white pl-5 pr-3 py-3 rounded-full shadow-lg hover:shadow-xl transition-all`}
        >
          <span className="font-semibold">Ask Sarah</span>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm">
            {SARAH_PROFILE.avatar}
          </div>
        </motion.button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-[95vw] md:w-[480px] max-w-[480px] z-50"
            >
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[750px] border border-gray-200 dark:border-white/10">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl border-2 border-white/30 backdrop-blur-sm">
                          {SARAH_PROFILE.avatar}
                        </div>
                        <motion.span 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white" 
                        />
                      </div>
                      
                      <div>
                        <h3 className="text-white font-bold text-lg">{SARAH_PROFILE.name}</h3>
                        <p className="text-white/80 text-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {SARAH_PROFILE.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Model Toggle */}
                      <button
                        onClick={() => setUseThinkingModel(!useThinkingModel)}
                        className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          useThinkingModel 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                        title="Toggle thinking mode for complex questions"
                      >
                        <BrainCircuit className="w-3.5 h-3.5" />
                        {useThinkingModel ? 'Thinking' : 'Fast'}
                      </button>

                      {/* Clear Chat */}
                      <button
                        onClick={clearChat}
                        className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                        title="Clear conversation"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>

                      {/* Close */}
                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[480px] bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
                  {!hasStarted ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="flex items-center gap-3 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Starting conversation...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, index) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                          {/* Avatar */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            msg.role === 'assistant' 
                              ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-md' 
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            {msg.role === 'assistant' ? (
                              <span className="text-base">{SARAH_PROFILE.avatar}</span>
                            ) : (
                              <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            )}
                          </div>

                          {/* Message */}
                          <div className={`max-w-[82%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                              msg.role === 'assistant'
                                ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-white/5'
                                : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none'
                            }`}>
                              {/* Format content with markdown-like styling */}
                              <div className="whitespace-pre-wrap">
                                {msg.content.split('\n').map((line, i) => {
                                  // Bold text
                                  if (line.startsWith('**') && line.endsWith('**')) {
                                    return <p key={i} className="font-bold mt-2 mb-1">{line.replace(/\*\*/g, '')}</p>
                                  }
                                  // List items
                                  if (line.match(/^\d️⃣/)) {
                                    return <p key={i} className="ml-1">{line}</p>
                                  }
                                  if (line.startsWith('•') || line.startsWith('-')) {
                                    return <p key={i} className="ml-2 text-sm">{line}</p>
                                  }
                                  // Empty lines
                                  if (line.trim() === '') {
                                    return <br key={i} />
                                  }
                                  return <p key={i}>{line}</p>
                                })}
                              </div>
                            </div>
                            
                            {/* Timestamp & Model */}
                            <div className="flex items-center gap-2 mt-1 px-1">
                              <span className="text-[10px] text-gray-400">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.model && msg.role === 'assistant' && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full">
                                  {msg.model.includes('Thinking') ? '🧠 Thinking' : '⚡ Flash'}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {/* Loading */}
                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex gap-3"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <span className="text-base">{SARAH_PROFILE.avatar}</span>
                          </div>
                          <div className="bg-white dark:bg-gray-800 px-5 py-3.5 rounded-2xl rounded-tl-none border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">
                                {useThinkingModel ? 'Thinking deeply' : 'Sarah is typing'}
                              </span>
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Error */}
                      {error && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-center"
                        >
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-center max-w-[90%]">
                            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                            <button 
                              onClick={() => setError(null)}
                              className="text-red-500 text-xs mt-1 hover:underline"
                            >
                              Try again
                            </button>
                          </div>
                        </motion.div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Quick Questions */}
                {messages.length < 5 && messages.length > 0 && !isLoading && (
                  <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/5">
                    <p className="text-gray-400 text-xs mb-2.5 font-medium">Popular questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {quickQuestions.map(q => (
                        <button
                          key={q.text}
                          onClick={() => handleSend(undefined, q.text)}
                          disabled={isLoading}
                          className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 transition-all disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <span>{q.icon}</span>
                          {q.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-white/10">
                  {/* Mobile Model Toggle */}
                  <div className="sm:hidden flex items-center gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setUseThinkingModel(!useThinkingModel)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        useThinkingModel 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      <BrainCircuit className="w-3.5 h-3.5" />
                      {useThinkingModel ? 'Thinking Mode' : 'Fast Mode'}
                    </button>
                    <span className="text-[10px] text-gray-400">
                      {useThinkingModel ? 'Better for complex questions' : 'Quick responses'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={useThinkingModel ? "Ask a complex question..." : "Type your message..."}
                      disabled={isLoading}
                      className="flex-1 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl px-4 py-3.5 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all flex items-center justify-center min-w-[52px]"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Send className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      Powered by LongCat AI • 100+ languages
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-400">
                        {messages.length} messages
                      </span>
                    </div>
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
