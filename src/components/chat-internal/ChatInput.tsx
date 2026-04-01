'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Paperclip, Mic, MicOff, Loader2, ArrowUp, X, FileText,
  Image, File, Upload, Wand2, Sparkles, Send, StopCircle
} from 'lucide-react'
import type { UploadedFile } from './types'

interface ChatInputProps {
  input: string
  setInput: (text: string) => void
  onSend: (text?: string) => void
  onVoice: () => void
  isLoading: boolean
  isVoiceActive: boolean
  activeModel?: {
    id: string
    name: string
    supportsVision: boolean
  }
  onOpenModelSelector: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  uploadedFiles: UploadedFile[]
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>
  disabled?: boolean
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image className="w-5 h-5" />
  if (type.includes('pdf')) return <FileText className="w-5 h-5" />
  return <File className="w-5 h-5" />
}

export default function ChatInput({
  input,
  setInput,
  onSend,
  onVoice,
  isLoading,
  isVoiceActive,
  activeModel,
  onOpenModelSelector,
  fileInputRef,
  uploadedFiles,
  setUploadedFiles,
  disabled
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() || uploadedFiles.length > 0) {
        onSend()
      }
    }
  }

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: UploadedFile[] = Array.from(files)
      .filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          console.warn(`File ${file.name} is too large (max 10MB)`)
          return false
        }
        return true
      })
      .map(file => {
        const fileInfo: UploadedFile = {
          id: Math.random().toString(36).substring(2, 11),
          name: file.name,
          size: file.size,
          type: file.type,
          file
        }
        
        // Generate preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = () => {
            setUploadedFiles(prev => 
              prev.map(f => f.id === fileInfo.id ? { ...f, preview: reader.result as string } : f)
            )
          }
          reader.readAsDataURL(file)
        }
        
        return fileInfo
      })

    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Auto-switch to Omni model for file uploads
    if (newFiles.length > 0 && activeModel && !activeModel.id.includes('Omni')) {
      // Trigger model switch via parent - for now just log
      console.log('Consider switching to Omni for file analysis')
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [activeModel, fileInputRef, setUploadedFiles])

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  const canSend = (input.trim() || uploadedFiles.length > 0) && !isLoading && !disabled

  return (
    <div className="shrink-0 p-4 sm:p-6 bg-gradient-to-t from-[#030308] via-[#030308] to-transparent">
      <div className="max-w-3xl mx-auto">
        {/* Uploaded Files */}
        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              className="flex flex-wrap gap-2 mb-3"
            >
              {uploadedFiles.map(file => (
                <motion.div
                  key={file.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-2 bg-white/[0.05] rounded-xl border border-white/10 group hover:border-white/20 transition-colors"
                >
                  {file.preview ? (
                    <img 
                      src={file.preview} 
                      alt={file.name}
                      className="w-8 h-8 rounded-lg object-cover" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-medium truncate max-w-[100px]">{file.name}</span>
                    <span className="text-[10px] text-white/40">{formatFileSize(file.size)}</span>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Container */}
        <div className={`relative transition-all duration-200 ${
          isFocused 
            ? 'bg-[#0f0f1d] border-violet-500/30 shadow-lg shadow-violet-600/10' 
            : 'bg-[#0f0f1d] border-white/10'
        } border rounded-2xl`}>
          <div className="flex items-end gap-2 p-2">
            {/* File Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl text-white/50 hover:text-white transition-colors"
              title="Attach files"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json"
            />

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type your message..."
              className="flex-1 bg-transparent resize-none py-3 min-h-[48px] max-h-[200px] text-[15px] placeholder:text-white/30 focus:outline-none"
              rows={1}
              disabled={disabled}
            />

            {/* Voice Button */}
            <button
              onClick={onVoice}
              className={`p-3 rounded-xl transition-all ${
                isVoiceActive 
                  ? 'bg-red-500 animate-pulse text-white' 
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/50 hover:text-white'
              }`}
              title={isVoiceActive ? 'Stop recording' : 'Voice input'}
            >
              {isVoiceActive ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Send Button */}
            <button
              onClick={() => onSend()}
              disabled={!canSend}
              className={`p-3 rounded-xl transition-all ${
                canSend
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/20'
                  : 'bg-white/[0.05] text-white/20 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.05]">
            <div className="flex items-center gap-3 text-[11px] text-white/30">
              <button
                onClick={onOpenModelSelector}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{activeModel?.name || 'Select Model'}</span>
              </button>
              <span>•</span>
              <span>Enter to send • Shift+Enter for new line</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span className="text-[10px] text-violet-400 font-medium">AI Powered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
