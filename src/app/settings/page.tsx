'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, LayoutDashboard, Database, Shield, Zap, Globe, Link as LinkIcon, Bell, Bot, Settings as SettingsIcon, AlertCircle, CheckCircle2, RefreshCcw, ExternalLink } from 'lucide-react'
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
      <div className="min-h-[100dvh] p-6 overflow-x-hidden w-full">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-bold text-gradient mb-2">Settings</h1>
            <p className="text-white/70">Configure your AutoReview AI preferences</p>
          </motion.div>

          {/* Tabs */}
          <div className="flex overflow-x-auto pb-4 gap-2 sm:gap-4 mb-4 sm:mb-8 hide-scrollbar snap-x">
            <div className="flex gap-2 sm:gap-4 snap-start">
              <TabButton tab="general" label="General" icon="⚙️" activeTab={activeTab} onClick={setActiveTab} />
              <TabButton tab="credits" label="Credits" icon="💎" activeTab={activeTab} onClick={setActiveTab} />
              <TabButton tab="notifications" label="Notifications" icon="🔔" activeTab={activeTab} onClick={setActiveTab} />
              <TabButton tab="ai" label="AI Settings" icon="🤖" activeTab={activeTab} onClick={setActiveTab} />
              <TabButton tab="integrations" label="Integrations" icon="🔌" activeTab={activeTab} onClick={setActiveTab} />
              <TabButton tab="advanced" label="Advanced" icon="🔧" activeTab={activeTab} onClick={setActiveTab} />
            </div>
          </div>

          {/* Settings Content */}
          <div className="glass-card border-2 border-primary/20 rounded-2xl p-4 sm:p-8 shadow-xl">
            {activeTab === 'general' && (
              <div className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="glass-card border-2 border-white/10 rounded-2xl p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Business Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white mb-2 text-sm font-medium">Business Name</label>
                        <input
                          type="text"
                          value={settings.businessName}
                          onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors"
                          placeholder="e.g. The Stove Club"
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2 text-sm font-medium">Business Type</label>
                        <select
                          value={settings.businessType}
                          onChange={(e) => setSettings({ ...settings, businessType: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors"
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
                  </div>

                  <div className="glass-card border-2 border-white/10 rounded-2xl p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">AI Context</h3>
                    <div>
                      <label className="block text-white mb-2 text-sm font-medium">Auto-Reply Template</label>
                      <textarea
                        value={settings.responseTemplate}
                        onChange={(e) => setSettings({ ...settings, responseTemplate: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors"
                        placeholder="Default message for reviews..."
                      />
                      <p className="text-[10px] sm:text-xs text-white/40 mt-2">This is the fallback message used if AI generation is disabled.</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card border-2 border-white/10 rounded-2xl p-4 sm:p-6 overflow-hidden">
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Location Settings</h3>
                  <div className="overflow-x-hidden">
                    <LocationPermission />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'credits' && <CreditManager />}
            
            {activeTab === 'notifications' && <NotificationManager />}

            {activeTab === 'ai' && (
              <div className="space-y-8">
                <div className="glass-card border-2 border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">AI Conversational Settings</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 glass rounded-xl border border-primary/20 bg-primary/5">
                      <div>
                        <h4 className="text-white font-medium flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          Show Sarah AI Chatbot
                        </h4>
                        <p className="text-white/60 text-xs">Toggle the floating chat widget on all pages</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.chatbotEnabled}
                        onChange={(value) => {
                          setSettings({ ...settings, chatbotEnabled: value })
                          window.dispatchEvent(new CustomEvent('chatbot-toggle', { detail: { enabled: value } }))
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 glass rounded-xl border border-white/10">
                      <div>
                        <h4 className="text-white font-medium">Auto-Reply System</h4>
                        <p className="text-white/60 text-xs">Let AI automatically respond to incoming reviews</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.autoReplyEnabled}
                        onChange={(value) => setSettings({ ...settings, autoReplyEnabled: value })}
                      />
                    </div>

                    <div>
                      <label className="block text-white mb-3 text-sm font-medium">AI Persona & Tone</label>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {['professional', 'friendly', 'empathetic', 'enthusiastic', 'thoughtful'].map((tone) => (
                          <button
                            key={tone}
                            onClick={() => setSettings({ ...settings, aiTone: tone as any })}
                            className={`p-3 rounded-xl text-left transition-all border ${
                              settings.aiTone === tone 
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            <span className="capitalize text-sm font-medium">{tone}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pb-12"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden p-8 rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-blue-600/20 backdrop-blur-xl -z-10" />
                  <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay -z-10" />
                  <div className="flex items-center gap-5 z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                      <Zap className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tight">Global Platform Matrix</h3>
                      <p className="text-indigo-200/80 font-medium mt-1 text-sm">Real-time bi-directional sync active across all connected nodes</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-all text-sm border border-white/10 hover:border-white/30 shadow-xl z-10 backdrop-blur-md"
                  >
                    <RefreshCcw className="w-4 h-4" /> Force Sync
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {PlatformIntegrationManager.getPlatforms().map((platform) => (
                    <motion.div 
                      whileHover={undefined}
                      key={platform.id} 
                      className={`relative overflow-hidden p-6 rounded-3xl transition-all border-2 ${
                        platform.connected 
                          ? 'border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
                          : 'border-white/5 hover:border-indigo-500/30 shadow-xl'
                      }`}
                    >
                      <div className={`absolute inset-0 opacity-10 -z-10 ${platform.connected ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-indigo-500 to-purple-500'}`} />
                      
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                            platform.connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5'
                          }`}>
                            {platform.icon}
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-base tracking-wide">{platform.name}</h4>
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">Auto-Sync: Active</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                          platform.connected 
                            ? 'bg-emerald-500 text-white shadow-emerald-500/40' 
                            : 'bg-white/5 text-white/40 border border-white/10'
                        }`}>
                          {platform.connected ? <CheckCircle2 className="w-3 h-3" /> : null}
                          {platform.connected ? 'Live' : 'Offline'}
                        </div>
                      </div>
                      <p className="text-xs text-white/60 mb-6 leading-relaxed min-h-[40px]">
                        {platform.description}
                      </p>
                      <Link 
                        href="/connect-platforms"
                        className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                          platform.connected 
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400' 
                            : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                        }`}
                      >
                        {platform.connected ? 'Configure Node' : 'Initialize Connection'}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="relative overflow-hidden p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <LinkIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Advanced Webhooks</h3>
                        <p className="text-xs text-indigo-300/70 font-medium">Real-time event streaming</p>
                      </div>
                    </div>
                    <div className="space-y-5 relative z-10">
                      <div>
                        <label className="block text-indigo-200 text-xs mb-2 font-bold uppercase tracking-widest">Endpoint URL</label>
                        <input
                          type="url"
                          value={settings.webhookUrl}
                          onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                          className="w-full px-5 py-4 bg-black/50 border border-indigo-500/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium shadow-inner"
                          placeholder="https://api.yourservice.com/webhook"
                        />
                      </div>
                      <div>
                        <label className="block text-indigo-200 text-xs mb-2 font-bold uppercase tracking-widest">Secret Key (AES-256)</label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={settings.webhookSecret}
                            onChange={(e) => setSettings({ ...settings, webhookSecret: e.target.value })}
                            className="flex-1 px-5 py-4 bg-black/50 border border-indigo-500/20 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-mono shadow-inner"
                            placeholder="RE-xxxxxxxxxxxxxxxx"
                          />
                          <button className="px-5 py-4 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-500/20 transition-all shadow-lg">
                            Rotate
                          </button>
                        </div>
                      </div>
                      <div className="pt-4">
                        <button className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25">
                          Transmit Test Payload
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md">
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <Bell className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Alert Destinations</h3>
                        <p className="text-xs text-emerald-300/70 font-medium">Instant notification routing</p>
                      </div>
                    </div>
                    <div className="space-y-4 relative z-10">
                      <div className="flex items-center justify-between p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#4A154B] to-[#3B113C] rounded-xl flex items-center justify-center text-lg font-black text-white shadow-lg">S</div>
                          <div>
                            <p className="text-white text-sm font-bold">Slack Workspace</p>
                            <p className="text-[10px] text-white/50 font-medium uppercase tracking-widest mt-1">Route to #alerts</p>
                          </div>
                        </div>
                        <ToggleSwitch enabled={settings.slackIntegration} onChange={(v) => setSettings({ ...settings, slackIntegration: v })} />
                      </div>

                      <div className="flex items-center justify-between p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#5865F2] to-[#4752C4] rounded-xl flex items-center justify-center text-lg font-black text-white shadow-lg">D</div>
                          <div>
                            <p className="text-white text-sm font-bold">Discord Server</p>
                            <p className="text-[10px] text-white/50 font-medium uppercase tracking-widest mt-1">Real-time community alerts</p>
                          </div>
                        </div>
                        <ToggleSwitch enabled={settings.discordIntegration} onChange={(v) => setSettings({ ...settings, discordIntegration: v })} />
                      </div>

                      <div className="pt-4">
                        <p className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-widest text-center">
                          Enterprise users: Contact support for custom API routing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'advanced' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pb-12"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative overflow-hidden p-8 rounded-3xl border border-white/10 bg-[#05050A] backdrop-blur-md shadow-2xl">
                     <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">AI Engine Tuning</h3>
                        <p className="text-xs text-primary/60 font-bold uppercase tracking-widest mt-1">Neural Network Parameters</p>
                      </div>
                    </div>
                    
                    <div className="space-y-10 relative z-10">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-white text-xs font-black uppercase tracking-widest">Creativity Variance</label>
                          <span className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-black shadow-lg shadow-primary/30">{settings.aiTemperature.toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.aiTemperature}
                          onChange={(e) => setSettings({ ...settings, aiTemperature: parseFloat(e.target.value) })}
                          className="w-full h-3 bg-black rounded-lg appearance-none cursor-pointer accent-primary shadow-inner border border-white/5"
                        />
                        <div className="flex justify-between text-[9px] text-white/40 mt-3 font-black uppercase tracking-widest">
                          <span>Rigid (0.0)</span>
                          <span>Creative (1.0)</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-white text-xs font-black uppercase tracking-widest">Context Window (Tokens)</label>
                          <span className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-xs font-black shadow-lg shadow-indigo-500/30">{settings.maxTokens}</span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="2000"
                          step="100"
                          value={settings.maxTokens}
                          onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                          className="w-full h-3 bg-black rounded-lg appearance-none cursor-pointer accent-indigo-400 shadow-inner border border-white/5"
                        />
                        <div className="flex justify-between text-[9px] text-white/40 mt-3 font-black uppercase tracking-widest">
                          <span>Concise (100)</span>
                          <span>Verbose (2000)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-5 bg-primary/5 rounded-2xl border border-primary/20">
                        <div>
                          <p className="text-white text-sm font-bold flex items-center gap-2">
                            Beta Algorithms <span className="px-2 py-0.5 bg-primary text-white rounded text-[9px] font-black uppercase tracking-widest shadow-sm">Early Access</span>
                          </p>
                          <p className="text-xs text-white/50 mt-1 font-medium">Next-gen sentiment neural parsing</p>
                        </div>
                        <ToggleSwitch enabled={settings.betaFeatures} onChange={(v) => setSettings({ ...settings, betaFeatures: v })} />
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden p-8 rounded-3xl border border-white/10 bg-[#05050A] backdrop-blur-md shadow-2xl">
                     <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">Trust & Security</h3>
                        <p className="text-xs text-emerald-400/60 font-bold uppercase tracking-widest mt-1">Compliance & Privacy</p>
                      </div>
                    </div>

                    <div className="space-y-8 relative z-10">
                      <div className="flex items-center justify-between p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                        <div>
                          <p className="text-white text-sm font-bold">Aggressive PII Redaction</p>
                          <p className="text-xs text-white/50 mt-1 font-medium">Deep scrub of names/emails before AI processing</p>
                        </div>
                        <ToggleSwitch enabled={settings.piiRedaction} onChange={(v) => setSettings({ ...settings, piiRedaction: v })} />
                      </div>

                      <div>
                        <label className="block text-white text-xs mb-3 font-black uppercase tracking-widest">Data Retention Lifecycle</label>
                        <select
                          value={settings.dataRetentionDays}
                          onChange={(e) => setSettings({ ...settings, dataRetentionDays: parseInt(e.target.value) })}
                          className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-all text-sm font-bold pr-10 appearance-none shadow-inner"
                        >
                          <option value="30">30 Days (Strict Compliance)</option>
                          <option value="90">90 Days (Industry Standard)</option>
                          <option value="365">365 Days (Long-term Analysis)</option>
                          <option value="0">Indefinite (Unlimited Storage)</option>
                        </select>
                      </div>

                      <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-2xl border border-emerald-500/20 shadow-inner">
                        <p className="text-xs text-emerald-400 font-black flex items-center gap-2 mb-2 uppercase tracking-widest">
                          <CheckCircle2 className="w-4 h-4" /> Enterprise Grade Security
                        </p>
                        <p className="text-[11px] text-emerald-100/60 leading-relaxed font-medium">
                          Data is encrypted at rest using AES-256-GCM. AutoReview AI maintains strict GDPR and CCPA compliance. We never monetize your customer data.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="relative p-8 rounded-3xl border border-white/10 bg-[#05050A] shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/30">
                        <Database className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Data Portability</h3>
                        <p className="text-xs text-blue-400/60 font-bold uppercase tracking-widest mt-1">Export Architecture</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => {
                          const data = JSON.stringify({ settings, timestamp: new Date().toISOString() }, null, 2);
                          const blob = new Blob([data], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `autoreview-config-${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                        }}
                        className="p-6 bg-black/40 hover:bg-blue-500/10 rounded-2xl border border-white/5 hover:border-blue-500/40 flex flex-col items-center gap-4 transition-all group shadow-inner"
                      >
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all">
                          <ExternalLink className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-black text-white uppercase tracking-widest group-hover:text-blue-400">JSON Archive</span>
                      </button>
                      <button className="p-6 bg-black/40 hover:bg-emerald-500/10 rounded-2xl border border-white/5 hover:border-emerald-500/40 flex flex-col items-center gap-4 transition-all group shadow-inner">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          <RefreshCcw className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-black text-white uppercase tracking-widest group-hover:text-emerald-400">CSV Matrix</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative overflow-hidden p-8 rounded-3xl border border-rose-500/20 bg-[#1A0505] shadow-[0_0_30px_rgba(225,29,72,0.05)]">
                    <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay -z-10" />
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/30">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-rose-500 tracking-tight">Danger Zone</h3>
                        <p className="text-xs text-rose-500/60 font-bold uppercase tracking-widest mt-1">Irreversible Actions</p>
                      </div>
                    </div>
                    <p className="text-rose-200/60 text-xs mb-8 leading-relaxed font-medium">
                      Executing these commands will permanently obliterate your current configuration state. Ensure you have secured a JSON archive before proceeding.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={handleReset}
                        className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-600/30"
                      >
                        Factory Reset
                      </button>
                      <button className="flex-1 py-4 bg-black/40 hover:bg-white/5 text-white/60 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-rose-500/20">
                        Purge Cache
                      </button>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent text-center">
                  <h4 className="text-white font-black text-xl mb-3 tracking-tight">AutoReview AI <span className="text-primary">v4.0.2 Premium</span></h4>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest leading-relaxed font-bold">
                    Core Engine Build: stable.260329-0330 <br />
                    Encrypted with AES-256-GCM. Network Environment: <span className="text-emerald-400">{process.env.NEXT_PUBLIC_VERCEL_ENV || 'Production Cluster'}</span>
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 flex justify-end gap-4">
            <button onClick={handleReset} className="px-6 py-3 glass text-white/70 hover:text-white rounded-lg">Reset</button>
            <button onClick={handleSave} className="px-8 py-3 bg-primary text-white rounded-lg font-bold">
              {saved ? '✓ Saved!' : '💾 Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
