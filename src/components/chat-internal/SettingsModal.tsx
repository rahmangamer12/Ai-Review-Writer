'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Settings, User, MessageSquare, Palette, Check
} from 'lucide-react'
import type { ChatSettings } from './types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: ChatSettings
  setSettings: React.Dispatch<React.SetStateAction<ChatSettings>>
  userData?: {
    name?: string
    email?: string
    planType?: string
    aiCredits?: number
  }
}

const Toggle = ({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) => (
  <label className="flex items-center justify-between cursor-pointer group py-2">
    <div>
      <p className="text-sm font-medium group-hover:text-white transition-colors">{label}</p>
      {description && <p className="text-xs text-white/40 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors ${
        checked ? 'bg-violet-600' : 'bg-white/10'
      }`}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </button>
  </label>
)

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  setSettings,
  userData
}: SettingsModalProps) {
  if (!isOpen) return null

  const updateSetting = <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md max-h-[85vh] bg-[#0c0c18] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/5 bg-gradient-to-b from-[#0c0c18] to-[#0a0a14]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Settings</h2>
                  <p className="text-xs text-white/40">Customize your experience</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Chat Settings */}
            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                <h3 className="font-semibold text-sm">Chat</h3>
              </div>
              <Toggle
                label="Enter to send"
                description="Press Enter to send, Shift+Enter for new line"
                checked={settings.enterToSend}
                onChange={(v) => updateSetting('enterToSend', v)}
              />
              <Toggle
                label="Auto-scroll"
                description="Automatically scroll to new messages"
                checked={settings.autoScroll}
                onChange={(v) => updateSetting('autoScroll', v)}
              />
              <Toggle
                label="Streaming response"
                description="Show AI responses in real-time"
                checked={settings.streamingResponse}
                onChange={(v) => updateSetting('streamingResponse', v)}
              />
            </div>

            {/* Display Settings */}
            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-violet-400" />
                <h3 className="font-semibold text-sm">Display</h3>
              </div>
              <Toggle
                label="Code highlighting"
                description="Syntax highlighting for code blocks"
                checked={settings.codeHighlighting}
                onChange={(v) => updateSetting('codeHighlighting', v)}
              />
              <Toggle
                label="Markdown rendering"
                description="Render markdown formatting"
                checked={settings.markdownRendering}
                onChange={(v) => updateSetting('markdownRendering', v)}
              />
            </div>

            {/* Account Info */}
            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-violet-400" />
                <h3 className="font-semibold text-sm">Account</h3>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{userData?.name || 'User'}</p>
                  <p className="text-xs text-white/40">{userData?.email || 'No email'}</p>
                </div>
                <span className="px-3 py-1 bg-violet-600/20 text-violet-400 text-xs font-medium rounded-full">
                  {userData?.planType || 'Free'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-white/5 mt-2">
                <span className="text-sm text-white/50">AI Credits</span>
                <span className="text-lg font-bold text-violet-400">{userData?.aiCredits ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/5 bg-[#0a0a14]">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
