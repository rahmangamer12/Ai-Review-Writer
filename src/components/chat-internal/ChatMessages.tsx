'use client'

import React, { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  User, Bot, Clock, Copy, Volume2, VolumeX, RefreshCw,
  Check, X, Smartphone, Ghost, Sparkles, Share2, Edit3,
  ThumbsUp, ThumbsDown, MoreHorizontal, FileText, Image
} from 'lucide-react'
import type { Message } from './types'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
  onRetry?: (messageId: string) => void
  onCopy?: (text: string) => void
  onSpeak?: (text: string) => void
  onStopSpeaking?: () => void
  isSpeaking: boolean
  onReaction?: (messageId: string, reaction: 'like' | 'dislike') => void
}

const CodeBlock = memo(({ language, children }: { language: string; children: string }) => {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group/code my-2 sm:my-3 lg:my-4 rounded-lg sm:rounded-xl overflow-hidden border border-white/10 bg-[#0d0d14] shadow-2xl">
      <div className="flex items-center justify-between px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
        <span className="text-[9px] sm:text-[10px] text-white/40 font-mono uppercase tracking-[0.15em] font-semibold">
          {language || 'code'}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] text-white/40 hover:text-white transition-colors font-medium active:scale-[0.98]"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
              <span className="text-emerald-400 hidden xs:inline">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-2.5 sm:p-3 lg:p-4 overflow-x-auto text-[11px] sm:text-[12px] lg:text-[13px] leading-relaxed">
        <code className="font-mono text-blue-300">{children}</code>
      </pre>
    </div>
  )
})

CodeBlock.displayName = 'CodeBlock'

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex gap-2 sm:gap-3"
  >
    <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20 shrink-0">
      <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 text-white" />
    </div>
    <div className="flex items-center gap-2 sm:gap-2.5 bg-white/[0.05] px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl border border-white/8">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-violet-400 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
      <span className="text-[10px] sm:text-xs text-white/40 ml-0.5 sm:ml-1 font-medium whitespace-nowrap">Thinking...</span>
    </div>
  </motion.div>
)

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const MarkdownComponents = {
  code({ className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '')
    const isInline = !match && !String(children).includes('\n')

    if (isInline) {
      return (
        <code
          className="px-1 sm:px-1.5 py-0.5 bg-white/[0.08] text-violet-300 rounded text-[11px] sm:text-[12px] lg:text-[13px] font-mono"
          {...props}
        >
          {children}
        </code>
      )
    }

    return match ? (
      <CodeBlock language={match[1]}>
        {String(children).replace(/\n$/, '')}
      </CodeBlock>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    )
  },
  p({ children }: any) {
    return <p className="mb-3 sm:mb-4 last:mb-0 leading-relaxed text-[13px] sm:text-[14px] lg:text-[15px]">{children}</p>
  },
  h1({ children }: any) {
    return <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 mt-4 sm:mt-5 lg:mt-6 first:mt-0">{children}</h1>
  },
  h2({ children }: any) {
    return <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-3 mt-3 sm:mt-4 lg:mt-5 first:mt-0">{children}</h2>
  },
  h3({ children }: any) {
    return <h3 className="text-sm sm:text-base lg:text-lg font-bold mb-1.5 sm:mb-2 mt-2 sm:mt-3 lg:mt-4 first:mt-0">{children}</h3>
  },
  ul({ children }: any) {
    return <ul className="list-disc list-inside mb-3 sm:mb-4 space-y-0.5 sm:space-y-1">{children}</ul>
  },
  ol({ children }: any) {
    return <ol className="list-decimal list-inside mb-3 sm:mb-4 space-y-0.5 sm:space-y-1">{children}</ol>
  },
  li({ children }: any) {
    return <li className="text-[13px] sm:text-[14px] lg:text-[15px]">{children}</li>
  },
  a({ href, children }: any) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-violet-400 hover:text-violet-300 underline underline-offset-2 break-all"
      >
        {children}
      </a>
    )
  },
  blockquote({ children }: any) {
    return (
      <blockquote className="border-l-2 sm:border-l-4 border-violet-500/50 pl-2 sm:pl-3 lg:pl-4 my-2 sm:my-3 lg:my-4 italic text-white/70">
        {children}
      </blockquote>
    )
  }
}

export default function ChatMessages({
  messages,
  isLoading,
  onRetry,
  onCopy,
  onSpeak,
  onStopSpeaking,
  isSpeaking,
  onReaction
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showCopied, setShowCopied] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Record<string, 'like' | 'dislike' | null>>({})

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setShowCopied(id)
    setTimeout(() => setShowCopied(null), 2000)
    onCopy?.(text)
  }

  const handleReaction = (messageId: string, reaction: 'like' | 'dislike') => {
    const currentReaction = reactions[messageId]
    const newReaction = currentReaction === reaction ? null : reaction
    setReactions(prev => ({ ...prev, [messageId]: newReaction }))
    if (newReaction) {
      onReaction?.(messageId, newReaction)
    }
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] sm:min-h-[60vh] text-center px-3 sm:px-4 lg:px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl sm:rounded-3xl lg:rounded-[36px] bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center mb-4 sm:mb-5 lg:mb-6 shadow-2xl shadow-violet-600/20 will-change-transform"
        >
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
        </motion.div>
        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-xl sm:text-2xl lg:text-3xl font-black mb-1.5 sm:mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent"
        >
          Sarah AI
        </motion.h2>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-white/40 text-sm sm:text-base mb-6 sm:mb-8"
        >
          Welcome! How can I help you today?
        </motion.p>

        {/* Quick Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-w-full sm:max-w-lg w-full"
        >
          {[
            { icon: '💰', text: 'Pricing Plans', color: 'from-emerald-500 to-teal-500' },
            { icon: '🔗', text: 'Connect Platforms', color: 'from-blue-500 to-cyan-500' },
            { icon: '🚀', text: 'Features', color: 'from-violet-500 to-purple-500' },
            { icon: '📈', text: 'Improve Ratings', color: 'from-orange-500 to-amber-500' },
            { icon: '🔒', text: 'Security', color: 'from-red-500 to-rose-500' },
            { icon: '💬', text: 'Auto-Reply', color: 'from-pink-500 to-rose-500' }
          ].map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              className={`p-3 sm:p-4 bg-gradient-to-br ${item.color} bg-opacity-10 hover:bg-opacity-20 rounded-xl sm:rounded-2xl text-left transition-all border border-white/10 hover:border-white/20 will-change-transform`}
            >
              <span className="text-xl sm:text-2xl block mb-0.5 sm:mb-1">{item.icon}</span>
              <span className="text-xs sm:text-sm font-medium text-white/90 line-clamp-1">{item.text}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full mx-auto space-y-3 sm:space-y-4 lg:space-y-6 py-2 sm:py-4 lg:py-6 px-2 sm:px-3 lg:px-4">
      <AnimatePresence>
        {messages.map((msg, idx) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05, ease: [0.4, 0, 0.2, 1] }}
            className={`flex gap-2 sm:gap-3 lg:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} w-full will-change-transform`}
          >
            {/* Avatar */}
            <div className={`shrink-0 w-7 h-7 sm:w-9 sm:h-9 lg:w-11 lg:h-11 rounded-lg sm:rounded-xl lg:rounded-[18px] flex items-center justify-center text-xs sm:text-sm font-bold border shadow-lg ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-white/10 text-white'
                : 'bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 border-white/10 text-white shadow-violet-600/20'
            }`}>
              {msg.role === 'user' ? (
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              ) : (
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 min-w-0 max-w-[calc(100%-3rem)] sm:max-w-[85%] lg:max-w-[80%] ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
              {/* Meta */}
              <div className={`flex items-center gap-1.5 sm:gap-2 lg:gap-3 text-[9px] sm:text-[10px] lg:text-[11px] font-medium mb-1 sm:mb-1.5 flex-wrap ${
                msg.role === 'user' ? 'flex-row-reverse text-white/40' : 'text-violet-400/60'
              }`}>
                <span className="flex items-center gap-1 shrink-0">
                  {msg.role === 'user' ? (
                    <Smartphone className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  ) : (
                    <Ghost className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  )}
                  <span className="whitespace-nowrap">{msg.role === 'user' ? 'You' : 'Sarah AI'}</span>
                </span>
                <span className="text-white/20 hidden xs:inline">•</span>
                <span className="text-white/30 whitespace-nowrap hidden xs:inline">{formatTime(msg.timestamp)}</span>
                {msg.model && msg.role === 'assistant' && (
                  <>
                    <span className="text-white/20 hidden sm:inline">•</span>
                    <span className="hidden sm:inline px-1.5 py-0.5 bg-violet-500/20 text-violet-400 rounded text-[9px] whitespace-nowrap truncate max-w-[100px]">
                      {msg.model}
                    </span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div className={`relative p-2.5 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl lg:rounded-[24px] border shadow-xl transition-all duration-300 w-full ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border-violet-500/20 rounded-tr-md'
                  : 'bg-gradient-to-br from-white/[0.04] to-white/[0.02] border-white/8 rounded-tl-md'
              }`}>
                <div className="prose prose-invert max-w-none prose-xs sm:prose-sm overflow-x-auto break-words">
                  {msg.role === 'assistant' && msg.content ? (
                    <ReactMarkdown components={MarkdownComponents}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-xs sm:text-sm lg:text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                  )}
                </div>

                {/* Typing Indicator */}
                {msg.isTyping && (
                  <div className="flex gap-2 mt-3 sm:mt-4 items-center">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-medium text-white/20 uppercase tracking-[0.2em] ml-2">
                      Processing...
                    </span>
                  </div>
                )}

                {/* Error State */}
                {msg.status === 'error' && (
                  <div className="mt-2 sm:mt-3 flex items-center gap-2 text-red-400 text-xs sm:text-sm flex-wrap">
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>Failed to send. </span>
                    <button
                      onClick={() => onRetry?.(msg.id)}
                      className="text-violet-400 hover:text-violet-300 underline active:scale-[0.98]"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {msg.role === 'assistant' && !msg.isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-3 flex-wrap"
                >
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="p-1.5 sm:p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-lg sm:rounded-xl text-white/40 hover:text-white transition-colors border border-white/5 active:scale-[0.98]"
                    title="Copy"
                  >
                    {showCopied === msg.id ? (
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => isSpeaking ? onStopSpeaking?.() : onSpeak?.(msg.content)}
                    className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-colors border active:scale-[0.98] ${
                      isSpeaking
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-white border-white/5'
                    }`}
                    title={isSpeaking ? 'Stop' : 'Read aloud'}
                  >
                    {isSpeaking ? (
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </button>

                  {/* Reaction Buttons */}
                  <button
                    onClick={() => handleReaction(msg.id, 'like')}
                    className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all border active:scale-[0.98] ${
                      reactions[msg.id] === 'like'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-emerald-400 border-white/5'
                    }`}
                    title="Like"
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${reactions[msg.id] === 'like' ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleReaction(msg.id, 'dislike')}
                    className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all border active:scale-[0.98] ${
                      reactions[msg.id] === 'dislike'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-red-400 border-white/5'
                    }`}
                    title="Dislike"
                  >
                    <ThumbsDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${reactions[msg.id] === 'dislike' ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: 'Sarah AI', text: msg.content })
                      } else {
                        handleCopy(msg.content, msg.id)
                      }
                    }}
                    className="p-1.5 sm:p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-lg sm:rounded-xl text-white/40 hover:text-white transition-colors border border-white/5 active:scale-[0.98]"
                    title="Share"
                  >
                    <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>

                  <button
                    className="p-1.5 sm:p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-lg sm:rounded-xl text-white/40 hover:text-white transition-colors border border-white/5 active:scale-[0.98]"
                    title="More"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </motion.div>
              )}

              {/* User Message Actions */}
              {msg.role === 'user' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-3 justify-end flex-wrap"
                >
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="p-1.5 sm:p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-lg sm:rounded-xl text-white/40 hover:text-white transition-colors border border-white/5 active:scale-[0.98]"
                    title="Copy"
                  >
                    {showCopied === msg.id ? (
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(msg.content)
                    }}
                    className="p-1.5 sm:p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-lg sm:rounded-xl text-white/40 hover:text-white transition-colors border border-white/5 active:scale-[0.98]"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {isLoading && <TypingIndicator />}

      <div ref={messagesEndRef} className="h-2 sm:h-4" />
    </div>
  )
}
