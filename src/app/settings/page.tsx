'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, LayoutDashboard, Database, Shield, Zap, Globe, Link as LinkIcon, Bell, Bot, Settings as SettingsIcon, AlertCircle, CheckCircle2, RefreshCcw, ExternalLink, Save } from 'lucide-react'
import { PlatformIntegrationManager } from '@/lib/platformIntegrations'
import CreditManager from '@/components/CreditManager'
import PageTransition from '@/components/transitions/PageTransition'
import LocationPermission from '@/components/LocationPermission'
import NotificationManager from '@/components/NotificationManager'

function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  return hydrated
}

type TabType = 'general' | 'credits' | 'notifications' | 'location' | 'billing' | 'ai' | 'integrations' | 'advanced' | 'legal'

function TabButton({ tab, label, icon, activeTab, onClick }: { tab: TabType; label: string; icon: string; activeTab: TabType; onClick: (t: TabType) => void }) {
  return (
    <button
      onClick={() => onClick(tab)}
      className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-lg transition-all text-sm md:text-base ${
        activeTab === tab
          ? 'bg-primary text-primary-foreground'
          : 'glass text-white/70 hover:text-white hover:bg-white/10'
      }`}
    >
      <span className="text-lg md:text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  )
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      type="button"
      className={`relative w-12 h-6 rounded-full transition-colors flex items-center ${
        enabled ? 'bg-primary' : 'bg-white/20'
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 26 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-4 h-4 bg-white rounded-full mx-0.5"
      />
    </button>
  )
}

interface Settings {
  autoApproval: boolean
  autoApprovalMinRating: number
  aiTone: 'professional' | 'friendly' | 'empathetic' | 'enthusiastic' | 'thoughtful'
  autoReplyEnabled: boolean
  languageDetection: boolean
  notificationsEnabled: boolean
  emailNotifications: boolean
  slackIntegration: boolean
  discordIntegration: boolean
  webhookUrl: string
  webhookSecret: string
  apiKey: string
  moderationLevel: 'strict' | 'moderate' | 'relaxed'
  businessName: string
  businessType: string
  responseTemplate: string
  chatbotEnabled: boolean
  aiTemperature: number
  maxTokens: number
  piiRedaction: boolean
  dataRetentionDays: number
  betaFeatures: boolean
}

const defaultSettings: Settings = {
  autoApproval: true,
  autoApprovalMinRating: 4,
  aiTone: 'friendly',
  autoReplyEnabled: true,
  languageDetection: true,
  notificationsEnabled: true,
  emailNotifications: true,
  slackIntegration: false,
  discordIntegration: false,
  webhookUrl: '',
  webhookSecret: '',
  apiKey: '',
  moderationLevel: 'moderate',
  businessName: 'Your Business',
  businessType: 'E-commerce',
  responseTemplate: 'Thank you for your feedback! We appreciate your review.',
  chatbotEnabled: true,
  aiTemperature: 0.7,
  maxTokens: 500,
  piiRedaction: true,
  dataRetentionDays: 90,
  betaFeatures: false
}

export default function SettingsPage() {
  const hydrated = useHydrated()
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [currentPlan, setCurrentPlan] = useState<string>('free')

  useEffect(() => {
    if (!hydrated) return
    const savedSettings = localStorage.getItem('autoreview-settings')
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) })
      } catch (e) {
        console.error('Failed to parse settings', e)
      }
    }
  }, [hydrated])

  const handleSave = () => {
    localStorage.setItem('autoreview-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    // Dispatch event to update other components
    window.dispatchEvent(new CustomEvent('autoreview-settings-updated', { detail: settings }))
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      localStorage.removeItem('autoreview-settings')
      window.location.reload()
    }
  }

  if (!hydrated) return null

  return (
    <PageTransition>
      <div className="min-h-[100dvh] bg-[#030308] text-white overflow-x-hidden w-full pb-[calc(80px+env(safe-area-inset-bottom))]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Native Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="pt-[calc(20px+env(safe-area-inset-top))] mb-8"
          >
            <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">Settings</h1>
            <p className="text-white/40 text-sm mt-1">Configure your AutoReview AI experience</p>
          </motion.div>

          {/* Horizontal Pill Tabs - More Native */}
          <div className="flex overflow-x-auto pb-4 gap-2 mb-6 hide-scrollbar snap-x no-scrollbar">
            {[
              { id: 'general', label: 'General', icon: '⚙️' },
              { id: 'credits', label: 'Credits', icon: '💎' },
              { id: 'notifications', label: 'Alerts', icon: '🔔' },
              { id: 'ai', label: 'AI', icon: '🤖' },
              { id: 'integrations', label: 'Nodes', icon: '🔌' },
              { id: 'advanced', label: 'Core', icon: '🔧' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap text-sm font-semibold snap-start active:scale-95 ${
                  activeTab === t.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Settings Content - Section Based for Mobile */}
          <div className="space-y-6">
            {activeTab === 'general' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">Business Identity</h3>
                  <div className="bg-white/5 rounded-3xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                    <div className="p-4 sm:p-6">
                      <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Business Name</label>
                      <input
                        type="text"
                        value={settings.businessName}
                        onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                        className="w-full bg-transparent text-white text-base font-medium focus:outline-none"
                        placeholder="e.g. The Stove Club"
                      />
                    </div>
                    <div className="p-4 sm:p-6">
                      <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Business Category</label>
                      <select
                        value={settings.businessType}
                        onChange={(e) => setSettings({ ...settings, businessType: e.target.value })}
                        className="w-full bg-transparent text-white text-base font-medium focus:outline-none appearance-none"
                      >
                        <option value="Restaurant">Restaurant</option>
                        <option value="E-commerce">E-commerce</option>
                        <option value="SaaS">SaaS</option>
                        <option value="Retail">Retail</option>
                        <option value="Hospitality">Hospitality</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">AI Response Logic</h3>
                  <div className="bg-white/5 rounded-3xl border border-white/5 p-4 sm:p-6">
                    <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Fallback Template</label>
                    <textarea
                      value={settings.responseTemplate}
                      onChange={(e) => setSettings({ ...settings, responseTemplate: e.target.value })}
                      rows={3}
                      className="w-full bg-transparent text-white text-base font-medium focus:outline-none resize-none"
                      placeholder="Default message for reviews..."
                    />
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">Regional Context</h3>
                  <div className="bg-white/5 rounded-3xl border border-white/5 p-2 overflow-hidden">
                    <LocationPermission />
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'credits' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <CreditManager />
              </motion.div>
            )}
            
            {activeTab === 'notifications' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <NotificationManager />
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">Sarah AI Engine</h3>
                  <div className="bg-white/5 rounded-3xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                    <div className="flex items-center justify-between p-4 sm:p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">Floating Assistant</p>
                          <p className="text-white/40 text-[10px] font-medium uppercase tracking-tight">On-screen chatbot</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        enabled={settings.chatbotEnabled}
                        onChange={(value) => {
                          setSettings({ ...settings, chatbotEnabled: value })
                          window.dispatchEvent(new CustomEvent('chatbot-toggle', { detail: { enabled: value } }))
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 sm:p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                          <Zap className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">Auto-Pilot</p>
                          <p className="text-white/40 text-[10px] font-medium uppercase tracking-tight">Instant AI responses</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        enabled={settings.autoReplyEnabled}
                        onChange={(value) => setSettings({ ...settings, autoReplyEnabled: value })}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">Conversational Style</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['professional', 'friendly', 'empathetic', 'enthusiastic', 'thoughtful'].map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setSettings({ ...settings, aiTone: tone as any })}
                        className={`p-4 rounded-3xl text-left transition-all border active:scale-95 ${
                          settings.aiTone === tone 
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                            : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        <span className="capitalize text-sm font-bold tracking-tight">{tone}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'integrations' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-gradient-to-br from-primary/20 to-violet-600/20 rounded-3xl p-6 border border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white">Node Matrix</h3>
                    <p className="text-white/50 text-xs">Bi-directional sync status</p>
                  </div>
                  <button onClick={() => window.location.reload()} className="p-3 bg-white/5 rounded-2xl text-white active:scale-90">
                    <RefreshCcw className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PlatformIntegrationManager.getPlatforms().map((platform) => (
                    <div key={platform.id} className="bg-white/5 p-5 rounded-3xl border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{platform.icon}</div>
                          <p className="text-white font-bold">{platform.name}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${platform.connected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/20'}`} />
                      </div>
                      <Link 
                        href="/connect-platforms"
                        className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center block transition-all active:scale-[0.98] ${
                          platform.connected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/10 text-white/50 border border-white/5'
                        }`}
                      >
                        {platform.connected ? 'Manage Node' : 'Initialize'}
                      </Link>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'advanced' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">AI Hyperparameters</h3>
                  <div className="bg-white/5 rounded-3xl border border-white/5 p-6 space-y-8">
                    <div>
                      <div className="flex justify-between mb-4">
                        <span className="text-white/50 text-[10px] font-black uppercase tracking-wider">Variance</span>
                        <span className="text-primary text-xs font-black">{settings.aiTemperature.toFixed(1)}</span>
                      </div>
                      <input
                        type="range" min="0" max="1" step="0.1" value={settings.aiTemperature}
                        onChange={(e) => setSettings({ ...settings, aiTemperature: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-primary"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-4">
                        <span className="text-white/50 text-[10px] font-black uppercase tracking-wider">Context Limit</span>
                        <span className="text-primary text-xs font-black">{settings.maxTokens}</span>
                      </div>
                      <input
                        type="range" min="100" max="2000" step="100" value={settings.maxTokens}
                        onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-primary"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/50 mb-3 ml-1">Terminal Zone</h3>
                  <div className="bg-rose-500/5 rounded-3xl border border-rose-500/10 p-4">
                    <button 
                      onClick={handleReset}
                      className="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98]"
                    >
                      Purge All Configurations
                    </button>
                  </div>
                </section>
              </motion.div>
            )}
          </div>

          {/* Floating Save Button - Native Feel */}
          <div className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] left-0 right-0 px-6 flex justify-center pointer-events-none z-[100] lg:relative lg:bottom-0 lg:px-0 lg:mt-8 lg:justify-end">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="px-8 py-4 bg-primary text-white rounded-3xl font-black text-sm tracking-widest uppercase shadow-2xl shadow-primary/40 pointer-events-auto active:bg-primary/90 flex items-center gap-3"
            >
              {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {saved ? 'Synchronized' : 'Commit Changes'}
            </motion.button>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
