'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, LayoutDashboard, Database, Shield, Zap, Globe, 
  Link as LinkIcon, Bell, Bot, Settings as SettingsIcon, 
  AlertCircle, CheckCircle2, RefreshCcw, ExternalLink, Save,
  ChevronRight, Sliders, Share2, Trash2, Github, Slack, Hash
} from 'lucide-react'
import { PlatformIntegrationManager } from '@/lib/platformIntegrations'
import CreditManager from '@/components/CreditManager'
import PageTransition from '@/components/transitions/PageTransition'
import LocationPermission from '@/components/LocationPermission'
import NotificationManager from '@/components/NotificationManager'

type TabType = 'general' | 'credits' | 'notifications' | 'ai' | 'integrations' | 'advanced'

function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  return hydrated
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? 'bg-primary' : 'bg-white/10'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [saved, setSaved] = useState(false)
  const hydrated = useHydrated()
  const [settings, setSettings] = useState({
    businessName: '',
    businessType: 'Restaurant',
    responseTemplate: '',
    aiTone: 'professional',
    autoReplyEnabled: true,
    chatbotEnabled: true,
    webhookUrl: '',
    webhookSecret: '',
    slackIntegration: false,
    discordIntegration: false,
    aiTemperature: 0.7,
    maxTokens: 500,
    piiRedaction: true,
    dataRetentionDays: 90,
    betaFeatures: false
  })

  useEffect(() => {
    const savedSettings = localStorage.getItem('autoreview-settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('autoreview-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      const defaults = {
        businessName: '',
        businessType: 'Restaurant',
        responseTemplate: '',
        aiTone: 'professional',
        autoReplyEnabled: true,
        chatbotEnabled: true,
        webhookUrl: '',
        webhookSecret: '',
        slackIntegration: false,
        discordIntegration: false,
        aiTemperature: 0.7,
        maxTokens: 500,
        piiRedaction: true,
        dataRetentionDays: 90,
        betaFeatures: false
      }
      setSettings(defaults)
      localStorage.setItem('autoreview-settings', JSON.stringify(defaults))
    }
  }

  if (!hydrated) return null

  return (
    <PageTransition>
      <div className="min-h-[100dvh] bg-[#030308] text-white overflow-x-hidden w-full pb-[calc(100px+env(safe-area-inset-bottom))]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="pt-[calc(20px+env(safe-area-inset-top))] mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">System Configuration</h1>
            <p className="text-white/40 text-sm mt-1">Manage your global AI nodes and business logic</p>
          </motion.div>

          {/* Native Pill Navigation */}
          <div className="flex overflow-x-auto pb-4 gap-2 mb-8 no-scrollbar snap-x touch-pan-x">
            {[
              { id: 'general', label: 'General', icon: '⚙️' },
              { id: 'ai', label: 'AI Core', icon: '🤖' },
              { id: 'notifications', label: 'Alerts', icon: '🔔' },
              { id: 'integrations', label: 'Integrations', icon: '🔌' },
              { id: 'credits', label: 'Credits', icon: '💎' },
              { id: 'advanced', label: 'Expert', icon: '🔧' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as TabType)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all whitespace-nowrap text-sm font-bold snap-start active:scale-95 ${
                  activeTab === t.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div key="general" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">Business Identity</h3>
                    <div className="bg-white/5 rounded-3xl border border-white/5 divide-y divide-white/5 overflow-hidden backdrop-blur-md">
                      <div className="p-5 sm:p-6">
                        <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Legal Business Name</label>
                        <input
                          type="text"
                          value={settings.businessName}
                          onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                          className="w-full bg-transparent text-white text-base font-bold focus:outline-none"
                          placeholder="e.g. The Stove Club"
                        />
                      </div>
                      <div className="p-5 sm:p-6">
                        <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Industry Sector</label>
                        <select
                          value={settings.businessType}
                          onChange={(e) => setSettings({ ...settings, businessType: e.target.value })}
                          className="w-full bg-transparent text-white text-base font-bold focus:outline-none appearance-none"
                        >
                          <option value="Restaurant">Restaurant & Cafe</option>
                          <option value="E-commerce">E-commerce</option>
                          <option value="SaaS">SaaS & Tech</option>
                          <option value="Retail">Retail Store</option>
                          <option value="Hospitality">Hospitality</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">Default Logic</h3>
                    <div className="bg-white/5 rounded-3xl border border-white/5 p-5 sm:p-6 backdrop-blur-md">
                      <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Global Fallback Template</label>
                      <textarea
                        value={settings.responseTemplate}
                        onChange={(e) => setSettings({ ...settings, responseTemplate: e.target.value })}
                        rows={4}
                        className="w-full bg-transparent text-white text-base font-medium focus:outline-none resize-none leading-relaxed"
                        placeholder="Default message when AI is offline..."
                      />
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">Context Sensors</h3>
                    <div className="bg-white/5 rounded-3xl border border-white/5 p-2 backdrop-blur-md">
                      <LocationPermission />
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'ai' && (
                <motion.div key="ai" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">Autonomous Modes</h3>
                    <div className="bg-white/5 rounded-3xl border border-white/5 divide-y divide-white/5 overflow-hidden backdrop-blur-md">
                      <div className="flex items-center justify-between p-5 sm:p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                            <Bot className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">Floating AI Assistant</p>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-tight">On-screen companion</p>
                          </div>
                        </div>
                        <ToggleSwitch
                          enabled={settings.chatbotEnabled}
                          onChange={(v) => {
                            setSettings({ ...settings, chatbotEnabled: v })
                            window.dispatchEvent(new CustomEvent('chatbot-toggle', { detail: { enabled: v } }))
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between p-5 sm:p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                            <Zap className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">Review Auto-Pilot</p>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-tight">Instant reply generation</p>
                          </div>
                        </div>
                        <ToggleSwitch enabled={settings.autoReplyEnabled} onChange={(v) => setSettings({ ...settings, autoReplyEnabled: v })} />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">Persona Matrix</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['Professional', 'Friendly', 'Empathetic', 'Enthusiastic', 'Concise'].map((tone) => (
                        <button
                          key={tone}
                          onClick={() => setSettings({ ...settings, aiTone: tone.toLowerCase() })}
                          className={`p-5 rounded-3xl text-center transition-all border font-bold text-sm active:scale-95 ${
                            settings.aiTone === tone.toLowerCase() 
                              ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' 
                              : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div key="notifications" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <NotificationManager />
                </motion.div>
              )}

              {activeTab === 'integrations' && (
                <motion.div key="integrations" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  {/* Platform Grid - All features restored */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {PlatformIntegrationManager.getPlatforms().map((platform) => (
                      <div key={platform.id} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-md relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <span className="text-4xl">{platform.icon}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                            {platform.icon}
                          </div>
                          <div>
                            <h4 className="text-white font-black">{platform.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className={`w-2 h-2 rounded-full ${platform.connected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-white/20'}`} />
                              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                {platform.connected ? 'Synchronized' : 'Offline'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Link 
                          href="/connect-platforms"
                          className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center block transition-all active:scale-[0.98] ${
                            platform.connected 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-primary text-white shadow-lg shadow-primary/20'
                          }`}
                        >
                          {platform.connected ? 'Manage Sync' : 'Initialize Connection'}
                        </Link>
                      </div>
                    ))}
                  </div>

                  {/* External Hubs - RESTORED */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">Event Distribution</h3>
                    <div className="bg-white/5 rounded-3xl border border-white/5 divide-y divide-white/5 overflow-hidden backdrop-blur-md">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                              <Slack className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold">Slack Webhook</span>
                          </div>
                          <ToggleSwitch enabled={settings.slackIntegration} onChange={(v) => setSettings({...settings, slackIntegration: v})} />
                        </div>
                        <input
                          type="url"
                          placeholder="https://hooks.slack.com/services/..."
                          className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-xs font-mono text-white/70 focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                              <Hash className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold">Discord Notification Hub</span>
                          </div>
                          <ToggleSwitch enabled={settings.discordIntegration} onChange={(v) => setSettings({...settings, discordIntegration: v})} />
                        </div>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'credits' && (
                <motion.div key="credits" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <CreditManager />
                </motion.div>
              )}

              {activeTab === 'advanced' && (
                <motion.div key="advanced" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">AI Hyperparameters</h3>
                    <div className="bg-white/5 rounded-[2.5rem] border border-white/5 p-6 sm:p-8 backdrop-blur-md space-y-10">
                      <div>
                        <div className="flex justify-between items-end mb-4">
                          <div>
                            <p className="text-white font-bold text-sm">Temperature (Variance)</p>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-tight">Creativity vs Precision</p>
                          </div>
                          <span className="text-primary font-black text-xl">{settings.aiTemperature.toFixed(1)}</span>
                        </div>
                        <input
                          type="range" min="0" max="1" step="0.1" value={settings.aiTemperature}
                          onChange={(e) => setSettings({ ...settings, aiTemperature: parseFloat(e.target.value) })}
                          className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-primary cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-end mb-4">
                          <div>
                            <p className="text-white font-bold text-sm">Token Threshold</p>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-tight">Maximum response length</p>
                          </div>
                          <span className="text-primary font-black text-xl">{settings.maxTokens}</span>
                        </div>
                        <input
                          type="range" min="100" max="2000" step="100" value={settings.maxTokens}
                          onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-primary cursor-pointer"
                        />
                      </div>
                    </div>
                  </section>

                  {/* RESTORED WEBHOOK SECTION */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">Raw API Webhooks</h3>
                    <div className="bg-white/5 rounded-3xl border border-white/5 p-6 backdrop-blur-md space-y-4">
                      <div>
                        <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Endpoint URL</label>
                        <input
                          type="url"
                          value={settings.webhookUrl}
                          onChange={(e) => setSettings({...settings, webhookUrl: e.target.value})}
                          className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm font-mono text-white/70"
                          placeholder="https://api.yourdomain.com/webhook"
                        />
                      </div>
                      <div>
                        <label className="block text-white/50 text-[10px] font-black uppercase tracking-wider mb-2">Signing Secret (AES-256)</label>
                        <input
                          type="password"
                          value={settings.webhookSecret}
                          onChange={(e) => setSettings({...settings, webhookSecret: e.target.value})}
                          className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm font-mono text-white/70"
                          placeholder="whsec_..."
                        />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/50 mb-3 ml-1">Terminal Zone</h3>
                    <div className="bg-rose-500/5 rounded-3xl border border-rose-500/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-center sm:text-left">
                        <p className="text-rose-500 font-bold text-sm">Destructive Reset</p>
                        <p className="text-rose-500/40 text-[10px] font-bold uppercase tracking-tight">Purge all configurations permanently</p>
                      </div>
                      <button 
                        onClick={handleReset}
                        className="w-full sm:w-auto px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.95]"
                      >
                        Reset Factory
                      </button>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Floating Global Save */}
          <div className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] left-0 right-0 px-6 flex justify-center pointer-events-none z-[100] lg:relative lg:bottom-0 lg:px-0 lg:mt-12 lg:justify-end">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="px-8 py-4 bg-primary text-white rounded-3xl font-black text-sm tracking-widest uppercase shadow-[0_0_40px_rgba(99,102,241,0.4)] pointer-events-auto active:bg-primary/90 flex items-center gap-3"
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
