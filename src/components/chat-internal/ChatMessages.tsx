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
}

const CodeBlock = memo(({ language, children }: { language: string; children: string }) => {
  const [copied, setCopied] = useState(false)
  
  const copy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="relative group/code my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0d0d14] shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
        <span className="text-[10px] text-white/40 font-mono uppercase tracking-[0.15em] font-semibold">
          {language || 'code'}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white transition-colors font-medium active:scale-[0.98]"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed">
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
    className="flex gap-3"
  >
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
      <Sparkles className="w-5 h-5 text-white" />
    </div>
    <div className="flex items-center gap-2.5 bg-white/[0.05] px-5 py-4 rounded-2xl border border-white/8">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-violet-400 rounded-full"
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
      <span className="text-xs text-white/40 ml-1 font-medium">Thinking...</span>
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
          className="px-1.5 py-0.5 bg-white/[0.08] text-violet-300 rounded text-[13px] font-mono"
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
    return <p className="mb-4 last:mb-0 leading-relaxed text-[15px]">{children}</p>
  },
  h1({ children }: any) {
    return <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>
  },
  h2({ children }: any) {
    return <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0">{children}</h2>
  },
  h3({ children }: any) {
    return <h3 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h3>
  },
  ul({ children }: any) {
    return <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
  },
  ol({ children }: any) {
    return <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
  },
  li({ children }: any) {
    return <li className="text-[15px]">{children}</li>
  },
  a({ href, children }: any) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
      >
        {children}
      </a>
    )
  },
  blockquote({ children }: any) {
    return (
      <blockquote className="border-l-4 border-violet-500/50 pl-4 my-4 italic text-white/70">
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
  isSpeaking
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showCopied, setShowCopied] = useState<string | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setShowCopied(id)
    setTimeout(() => setShowCopied(null), 2000)
    onCopy?.(text)
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-28 h-28 rounded-[36px] bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center mb-6 shadow-2xl shadow-violet-600/20"
        >
          <Sparkles className="w-12 h-12 text-white" />
        </motion.div>
        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-black mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent"
        >
          Sarah AI
        </motion.h2>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/40 text-base mb-8"
        >
          Welcome! How can I help you today?
        </motion.p>
        
        {/* Quick Actions */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg"
        >
          {[
            { icon: '💰', text: 'Pricing Plans', color: 'from-emerald-500 to-teal-500' },
            { icon: '🔗', text: 'Connect Platforms', color: 'from-blue-500 to-cyan-500' },
            { icon: '🚀', text: 'Features', color: 'from-violet-500 to-purple-500' },
            { icon: '📈', text: 'Improve Ratings', color: 'from-orange-500 to-amber-500' },
            { icon: '🔒', text: 'Security', color: 'from-red-500 to-rose-500' },
            { icon: '💬', text: 'Auto-Reply', color: 'from-pink-500 to-rose-500' }
          ].map((item, i) => (
            <button
              key={i}
              className={`p-4 bg-gradient-to-br ${item.color} bg-opacity-10 hover:bg-opacity-20 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10 hover:border-white/20`}
            >
              <span className="text-2xl block mb-1">{item.icon}</span>
              <span className="text-sm font-medium text-white/90">{item.text}</span>
            </button>
          ))}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      <AnimatePresence>
        {messages.map((msg, idx) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`shrink-0 w-11 h-11 rounded-[18px] flex items-center justify-center text-sm font-bold border shadow-lg ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-white/10 text-white'
                : 'bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 border-white/10 text-white shadow-violet-600/20'
            }`}>
              {msg.role === 'user' ? (
                <User className="w-5 h-5" />
              ) : (
                <Bot className="w-5 h-5" />
              )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
              {/* Meta */}
              <div className={`flex items-center gap-3 text-[11px] font-medium mb-2 ${
                msg.role === 'user' ? 'flex-row-reverse text-white/40' : 'text-violet-400/60'
              }`}>
                <span className="flex items-center gap-1.5">
                  {msg.role === 'user' ? (
                    <Smartphone className="w-3 h-3" />
                  ) : (
                    <Ghost className="w-3 h-3" />
                  )}
                  {msg.role === 'user' ? 'You' : 'Sarah AI'}
                </span>
                <span className="text-white/20">•</span>
                <span className="text-white/30">{formatTime(msg.timestamp)}</span>
                {msg.model && msg.role === 'assistant' && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-400 rounded text-[10px]">
                      {msg.model}
                    </span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div className={`relative p-5 rounded-[24px] border shadow-xl transition-all ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border-violet-500/20 rounded-tr-md'
                  : 'bg-gradient-to-br from-white/[0.04] to-white/[0.02] border-white/8 rounded-tl-md'
              }`}>
                <div className="prose prose-invert max-w-none prose-sm">
                  {msg.role === 'assistant' && msg.content ? (
                    <ReactMarkdown components={MarkdownComponents}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>

                {/* Typing Indicator */}
                {msg.isTyping && (
                  <div className="flex gap-2 mt-4 items-center">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    </div>
                    <span className="text-[10px] font-medium text-white/20 uppercase tracking-[0.2em] ml-2">
                      Processing...
                    </span>
                  </div>
                )}

                {/* Error State */}
                {msg.status === 'error' && (
                  <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                    <X className="w-4 h-4" />
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 mt-3"
                >
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl text-white/40 hover:text-white transition-colors border border-white/5 active:scale-[0.98]"
                    title="Copy"
                  >
                    {showCopied === msg.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => isSpeaking ? onStopSpeaking?.() : onSpeak?.(msg.content)}
                    className={`p-2 rounded-xl transition-colors border active:scale-[0.98] ${
                      isSpeaking
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-white border-white/5'
                    }`}
                    title={isSpeaking ? 'Stop' : 'Read aloud'}
                  >
                    {isSpeaking ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: 'Sarah AI', text: msg.content })
                      } else {
                        handleCopy(msg.content, msg.id)
                      }
                    }}
                    className="p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl text-white/40 hover:text-white transition-colors border border-white/5 active:scale-[0.98]"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    className="p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl text-white/40 hover:text-white transition-colors border border-white/5 active:scale-[0.98]"
                    title="More"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* User Message Actions */}
              {msg.role === 'user' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 mt-3 justify-end"
                >
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl text-white/40 hover:text-white transition-colors border border-white/5 active:scale-[0.98]"
                    title="Copy"
                  >
                    {showCopied === msg.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(msg.content)
                    }}
                    className="p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl text-white/40 hover:text-white transition-colors border border-white/5 active:scale-[0.98]"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {isLoading && <TypingIndicator />}
      
      <div ref={messagesEndRef} className="h-4" />
    </div>
  )
}
