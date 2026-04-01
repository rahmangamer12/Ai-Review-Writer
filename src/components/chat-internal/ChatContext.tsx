'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { ChatSession, Message, UserData, ChatSettings, Notification, AIModel } from './types'
import { DEFAULT_SETTINGS } from './types'

interface ChatContextType {
  sessions: ChatSession[]
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>
  currentSessionId: string | null
  setCurrentSessionId: (id: string | null) => void
  currentSession: ChatSession | undefined
  messages: Message[]
  userData: UserData | null
  setUserData: (data: UserData | null) => void
  settings: ChatSettings
  setSettings: React.Dispatch<React.SetStateAction<ChatSettings>>
  selectedModel: string
  setSelectedModel: (model: string) => void
  activeModel: AIModel | undefined
  addNotification: (text: string, type?: Notification['type']) => void
  notifications: Notification[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  isVoiceActive: boolean
  setIsVoiceActive: (active: boolean) => void
  isSpeaking: boolean
  setIsSpeaking: (speaking: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
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

  const currentSession = sessions.find(s => s.id === currentSessionId)
  const messages = currentSession?.messages || []

  const addNotification = useCallback((text: string, type: Notification['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2, 11)
    setNotifications(prev => [...prev, { id, text, type }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000)
  }, [])

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch('/api/user/me')
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
      console.error('Failed to fetch user data:', err)
      setUserData(null)
    }
  }, [])

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/sessions')
      const data = await res.json()
      
      if (Array.isArray(data)) {
        const hydrated = data.map((s: any) => ({
          ...s,
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.createdAt || m.timestamp)
          }))
        }))
        setSessions(hydrated)
        if (hydrated.length > 0 && !currentSessionId) {
          setCurrentSessionId(hydrated[0].id)
        }
      } else {
        setSessions([])
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
      setSessions([])
    }
  }, [currentSessionId])

  useEffect(() => {
    fetchUserData()
    fetchSessions()
  }, [fetchUserData, fetchSessions])

  useEffect(() => {
    const savedSettings = localStorage.getItem('chat-settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('chat-settings', JSON.stringify(settings))
  }, [settings])

  return (
    <ChatContext.Provider value={{
      sessions,
      setSessions,
      currentSessionId,
      setCurrentSessionId,
      currentSession,
      messages,
      userData,
      setUserData,
      settings,
      setSettings,
      selectedModel,
      setSelectedModel,
      activeModel: undefined,
      addNotification,
      notifications,
      searchQuery,
      setSearchQuery,
      isLoading,
      setIsLoading,
      isVoiceActive,
      setIsVoiceActive,
      isSpeaking,
      setIsSpeaking,
      sidebarOpen,
      setSidebarOpen
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export function useCurrentSession() {
  const { currentSession } = useChat()
  return currentSession
}

export function useMessages() {
  const { messages } = useChat()
  return messages
}
