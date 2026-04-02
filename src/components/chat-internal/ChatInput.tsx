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
    <div className="shrink-0 p-3 sm:p-4 lg:p-6 bg-gradient-to-t from-[#030308] via-[#030308] to-transparent">
      <div className="max-w-3xl mx-auto">
        {/* Uploaded Files */}
        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              className="flex flex-wrap gap-1.5 mb-2"
            >
              {uploadedFiles.map(file => (
                <motion.div
                  key={file.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.05] rounded-lg border border-white/10 group hover:border-white/20 transition-colors"
                >
                  {file.preview ? (
                    <img 
                      src={file.preview} 
                      alt={file.name}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded object-cover" 
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-white/10 flex items-center justify-center text-white/60">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                  <span className="text-[10px] font-medium truncate max-w-[80px]">{file.name}</span>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Container */}
        <div className={`relative transition-all duration-200 ${
          isFocused 
            ? 'bg-[#0f0f1d] border-primary/30 shadow-lg shadow-primary/10' 
            : 'bg-[#0f0f1d] border-white/10 shadow-inner'
        } border rounded-2xl sm:rounded-3xl`}>
          <div className="flex items-end gap-1.5 p-1.5 sm:p-2.5">
            {/* File Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 sm:p-3 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl text-white/40 hover:text-white transition-all shrink-0 active:scale-90"
              title="Attach"
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
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
              placeholder="Message Sarah..."
              className="flex-1 bg-transparent resize-none py-2.5 sm:py-3 min-h-[44px] max-h-[120px] sm:max-h-[200px] text-sm sm:text-base placeholder:text-white/20 focus:outline-none"
              rows={1}
              disabled={disabled}
            />

            {/* Voice Button */}
            <button
              onClick={onVoice}
              className={`p-2.5 sm:p-3 rounded-xl transition-all shrink-0 active:scale-90 ${
                isVoiceActive 
                  ? 'bg-red-500 animate-pulse text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-white'
              }`}
            >
              {isVoiceActive ? <StopCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Send Button */}
            <button
              onClick={() => onSend()}
              disabled={!canSend}
              className={`p-2.5 sm:p-3 rounded-xl transition-all shrink-0 active:scale-90 ${
                canSend
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white/[0.05] text-white/10 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>

          {/* Bottom Indicators */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.03]">
            <button
              onClick={onOpenModelSelector}
              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
            >
              <Wand2 className="w-2.5 h-2.5" />
              <span>{activeModel?.name} Protocol</span>
            </button>
            <div className="flex items-center gap-1.5 opacity-30">
              <Sparkles className="w-2.5 h-2.5 text-primary" />
              <span className="text-[9px] font-black uppercase tracking-widest">AI Matrix</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

