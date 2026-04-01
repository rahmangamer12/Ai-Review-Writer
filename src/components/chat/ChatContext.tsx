'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ChatSession, UserData, ChatSettings, DEFAULT_SETTINGS } from './types'

interface ChatContextType {
  sessions: ChatSession[]
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>
  currentSessionId: string | null
  setCurrentSessionId: (id: string | null) => void
  userData: UserData | null
  setUserData: (data: UserData | null) => void
  settings: ChatSettings
  setSettings: React.Dispatch<React.SetStateAction<ChatSettings>>
  addNotification: (text: string, type?: 'success' | 'error') => void
  notifications: { id: string; text: string; type: 'success' | 'error' }[]
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS)
  const [notifications, setNotifications] = useState<{ id: string; text: string; type: 'success' | 'error' }[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const addNotification = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications(prev => [...prev, { id, text, type }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000)
  }, [])

  return (
    <ChatContext.Provider value={{
      sessions,
      setSessions,
      currentSessionId,
      setCurrentSessionId,
      userData,
      setUserData,
      settings,
      setSettings,
      addNotification,
      notifications,
      searchQuery,
      setSearchQuery
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
  const { sessions, currentSessionId } = useChat()
  return sessions.find(s => s.id === currentSessionId) || null
}

export function useMessages() {
  const session = useCurrentSession()
  return session?.messages || []
}
