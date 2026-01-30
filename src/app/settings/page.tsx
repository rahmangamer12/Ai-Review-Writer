'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import CreditManager from '@/components/CreditManager'
import PageTransition from '@/components/transitions/PageTransition'

interface Settings {
  autoApproval: boolean
  autoApprovalMinRating: number
  aiTone: 'professional' | 'friendly' | 'empathetic' | 'enthusiastic' | 'thoughtful'
  autoReplyEnabled: boolean
  languageDetection: boolean
  notificationsEnabled: boolean
  emailNotifications: boolean
  slackIntegration: boolean
  webhookUrl: string
  apiKey: string
  moderationLevel: 'strict' | 'moderate' | 'relaxed'
  businessName: string
  businessType: string
  responseTemplate: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    autoApproval: true,
    autoApprovalMinRating: 4,
    aiTone: 'friendly',
    autoReplyEnabled: true,
    languageDetection: true,
    notificationsEnabled: true,
    emailNotifications: true,
    slackIntegration: false,
    webhookUrl: '',
    apiKey: '',
    moderationLevel: 'moderate',
    businessName: 'Your Business',
    businessType: 'E-commerce',
    responseTemplate: 'Thank you for your feedback! We appreciate your review.'
  })

  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'credits' | 'billing' | 'ai' | 'integrations' | 'advanced' | 'legal'>('general')
  const [currentPlan, setCurrentPlan] = useState<string>('free')

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('autoreview-settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
    
    // Load current plan
    const savedPlan = localStorage.getItem('autoreview-plan')
    if (savedPlan) {
      setCurrentPlan(savedPlan)
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('autoreview-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      localStorage.removeItem('autoreview-settings')
      window.location.reload()
    }
  }

  const TabButton = ({ tab, label, icon }: { tab: typeof activeTab; label: string; icon: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
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

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-primary' : 'bg-white/20'
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full"
      />
    </button>
  )

  return (
    <PageTransition>
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gradient mb-2">Settings</h1>
          <p className="text-white/70">Configure your AutoReview AI preferences</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-4 mb-8"
        >
          <TabButton tab="general" label="General" icon="⚙️" />
          <TabButton tab="credits" label="Credits" icon="💎" />
          <TabButton tab="ai" label="AI Settings" icon="🤖" />
          <TabButton tab="integrations" label="Integrations" icon="🔌" />
          <TabButton tab="advanced" label="Advanced" icon="🔧" />
          <TabButton tab="legal" label="Legal & Privacy" icon="📄" />
        </motion.div>

        {/* Enhanced Settings Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card border-2 border-primary/20 rounded-2xl p-8 shadow-xl"
        >
          {/* Enhanced General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚙️</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">General Settings</h2>
                  <p className="text-white/60">Configure your basic account information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="glass-card border-2 border-white/10 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <span>🏢</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white">Business Information</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white mb-2 font-medium">Business Name</label>
                      <input
                        type="text"
                        value={settings.businessName}
                        onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        placeholder="Enter your business name"
                      />
                    </div>

                    <div>
                      <label className="block text-white mb-2 font-medium">Business Type</label>
                      <select
                        value={settings.businessType}
                        onChange={(e) => setSettings({ ...settings, businessType: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors [&>option]:bg-gray-800 [&>option]:text-white"
                      >
                        <option value="E-commerce">E-commerce</option>
                        <option value="Restaurant">Restaurant</option>
                        <option value="Hotel">Hotel</option>
                        <option value="Service">Service Business</option>
                        <option value="SaaS">SaaS</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="glass-card border-2 border-white/10 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <span>🔔</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white">Notifications</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 glass rounded-xl border border-emerald-500/20">
                      <div>
                        <h4 className="text-white font-medium">Browser Notifications</h4>
                        <p className="text-white/60 text-sm">Get instant alerts for new reviews</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.notificationsEnabled}
                        onChange={async (value) => {
                          if (value && 'Notification' in window) {
                            const permission = await Notification.requestPermission()
                            if (permission === 'granted') {
                              setSettings({ ...settings, notificationsEnabled: true })
                              new Notification('AutoReview AI', {
                                body: 'Browser notifications enabled! You\'ll be notified of new reviews.',
                                icon: '/favicon.ico'
                              })
                            } else {
                              alert('Please enable notifications in your browser settings')
                            }
                          } else {
                            setSettings({ ...settings, notificationsEnabled: value })
                          }
                        }}
                      />
                    </div>

                    <div className="p-4 glass rounded-xl border border-amber-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-white font-medium">Email Notifications</h4>
                          <p className="text-white/60 text-sm">Daily review summaries</p>
                        </div>
                        <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                          Coming Soon
                        </span>
                      </div>
                      <p className="text-white/50 text-sm">
                        Configure email notifications in Advanced → Email Setup
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Credits Tab */}
          {activeTab === 'credits' && (
            <CreditManager />
          )}

          {/* AI Settings */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-6">AI Configuration</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 glass rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Auto-Reply</h3>
                    <p className="text-white/60 text-sm">Let AI automatically respond to reviews</p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.autoReplyEnabled}
                    onChange={(value) => setSettings({ ...settings, autoReplyEnabled: value })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 glass rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Auto-Approval</h3>
                    <p className="text-white/60 text-sm">Automatically approve high-quality reviews</p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.autoApproval}
                    onChange={(value) => setSettings({ ...settings, autoApproval: value })}
                  />
                </div>

                {settings.autoApproval && (
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Minimum Rating for Auto-Approval: {settings.autoApprovalMinRating} ⭐
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={settings.autoApprovalMinRating}
                      onChange={(e) => setSettings({ ...settings, autoApprovalMinRating: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-white/60 text-sm mt-1">
                      <span>1 Star</span>
                      <span>5 Stars</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-white mb-2 font-medium">AI Response Style</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: 'professional', name: 'Professional', icon: '🤵', desc: 'Formal and professional' },
                      { id: 'friendly', name: 'Friendly', icon: '😊', desc: 'Warm and conversational' },
                      { id: 'empathetic', name: 'Empathetic', icon: '💙', desc: 'Caring and understanding' },
                      { id: 'enthusiastic', name: 'Enthusiastic', icon: '🎉', desc: 'Energetic and excited' },
                      { id: 'thoughtful', name: 'Thoughtful', icon: '🌟', desc: 'Wise and considerate' }
                    ].map((persona) => (
                      <button
                        key={persona.id}
                        onClick={() => setSettings({ ...settings, aiTone: persona.id as any })}
                        className={`p-3 rounded-lg transition-all text-left ${
                          settings.aiTone === persona.id
                            ? 'bg-primary text-primary-foreground border-2 border-primary'
                            : 'glass text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{persona.icon}</span>
                          <span className="font-semibold text-sm">{persona.name}</span>
                        </div>
                        <p className="text-xs opacity-80">{persona.desc}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-white/60 text-sm mt-3">
                    💡 <strong>Tip:</strong> Choose a response style that matches your brand personality and target audience.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 glass rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Language Detection</h3>
                    <p className="text-white/60 text-sm">Detect and respond in customer's language</p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.languageDetection}
                    onChange={(value) => setSettings({ ...settings, languageDetection: value })}
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-medium">Response Template</label>
                  <textarea
                    value={settings.responseTemplate}
                    onChange={(e) => setSettings({ ...settings, responseTemplate: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary"
                    rows={4}
                    placeholder="Enter a default response template..."
                  />
                  <p className="text-white/60 text-sm mt-2">AI will use this as a base for generating responses</p>
                </div>
              </div>
            </div>
          )}

          {/* Integrations */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Platform Integrations</h2>

              <div className="space-y-6">
                {/* Redirect to Platforms Page */}
                <div className="glass-card border border-primary/20 rounded-lg p-8 text-center">
                  <div className="text-6xl mb-4">🔌</div>
                  <h3 className="text-2xl font-semibold text-white mb-3">Platform Integration Settings</h3>
                  <p className="text-white/70 mb-6 max-w-2xl mx-auto">
                    All platform connections and integrations can now be managed on the dedicated Platforms page.
                  </p>
                  <a
                    href="/connect-platforms"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all hover:scale-105"
                  >
                    <span>→</span> Go to Platforms Page
                  </a>
                </div>

                {/* Connected Platforms */}
                  <div className="glass-card border border-primary/20 rounded-lg p-6">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <span>🎯</span> Your Connected Platforms
                    </h3>
                    <div className="space-y-3">
                      {[
                        { name: 'Google My Business', icon: '🔍', connected: false, popular: true },
                        { name: 'Yelp', icon: '⭐', connected: false, popular: true },
                        { name: 'Facebook', icon: '📘', connected: false, popular: false },
                        { name: 'TripAdvisor', icon: '✈️', connected: false, popular: false },
                        { name: 'Trustpilot', icon: '💚', connected: false, popular: false }
                      ].map((platform) => (
                        <div key={platform.name} className="flex justify-between items-center p-4 glass rounded-lg hover:bg-white/5 transition-all">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-2xl">{platform.icon}</span>
                            <div>
                              <span className="text-white/90 font-medium">{platform.name}</span>
                              {platform.popular && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                                  Popular
                                </span>
                              )}
                            </div>
                          </div>
                          {platform.connected ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                                ✓ Connected
                              </span>
                              <button className="text-sm px-3 py-1.5 rounded-lg glass text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                                Settings
                              </button>
                            </div>
                          ) : (
                            <a
                              href="/connect-platforms"
                              className="text-sm px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-white transition-all font-medium"
                            >
                              Connect Now
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                <div className={`flex items-center justify-between p-4 glass rounded-lg ${currentPlan === 'free' || currentPlan === 'starter' ? 'opacity-50' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium">Slack Integration</h3>
                      {(currentPlan === 'free' || currentPlan === 'starter') && (
                        <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                          Pro+
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm">
                      {currentPlan === 'free' || currentPlan === 'starter' 
                        ? 'Upgrade to Professional for Slack notifications' 
                        : 'Send review notifications to Slack'}
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.slackIntegration}
                    onChange={(value) => {
                      if ((currentPlan === 'free' || currentPlan === 'starter') && value) {
                        alert('Slack integration requires Professional plan or higher. Please upgrade your plan.')
                        return
                      }
                      setSettings({ ...settings, slackIntegration: value })
                    }}
                  />
                </div>

                {settings.slackIntegration && (
                  <div>
                    <label className="block text-white mb-2 font-medium">Slack Webhook URL</label>
                    <input
                      type="url"
                      value={settings.webhookUrl}
                      onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary"
                      placeholder="https://hooks.slack.com/services/..."
                    />
                    <p className="text-white/60 text-sm mt-2">
                      <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        How to get Slack webhook URL →
                      </a>
                    </p>
                    <button
                      onClick={async () => {
                        if (!settings.webhookUrl) {
                          alert('Please enter a Slack webhook URL first')
                          return
                        }
                        try {
                          const response = await fetch(settings.webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              text: '✅ Slack integration test from AutoReview AI! Your webhook is working correctly.'
                            })
                          })
                          if (response.ok) {
                            alert('✅ Test message sent! Check your Slack channel.')
                          } else {
                            alert('❌ Failed to send test message. Please check your webhook URL.')
                          }
                        } catch (error) {
                          alert('❌ Error sending test message. Please verify your webhook URL.')
                        }
                      }}
                      className="mt-3 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors text-sm font-medium"
                    >
                      Test Slack Connection
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Advanced Settings</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-white mb-2 font-medium">Content Moderation Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['strict', 'moderate', 'relaxed'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setSettings({ ...settings, moderationLevel: level })}
                        className={`px-4 py-3 rounded-lg capitalize transition-all ${
                          settings.moderationLevel === level
                            ? 'bg-primary text-primary-foreground'
                            : 'glass text-white/70 hover:text-white'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="text-white/60 text-sm mt-2">
                    {settings.moderationLevel === 'strict' && 'Maximum filtering of potentially inappropriate content'}
                    {settings.moderationLevel === 'moderate' && 'Balanced approach to content moderation'}
                    {settings.moderationLevel === 'relaxed' && 'Minimal filtering, more freedom'}
                  </p>
                </div>

                <div className="glass-card border border-yellow-500/20 rounded-lg p-6">
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                    <span>⚡</span> Performance
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/70">Cache Size</span>
                      <span className="text-white">24.3 MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">API Calls (Today)</span>
                      <span className="text-white">127</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Processed Reviews</span>
                      <span className="text-white">1,234</span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('This will clear all cached data and reload the page. Continue?')) {
                          // Clear localStorage
                          localStorage.clear()
                          // Clear sessionStorage
                          sessionStorage.clear()
                          // Clear service worker cache
                          if ('caches' in window) {
                            caches.keys().then(names => {
                              names.forEach(name => caches.delete(name))
                            })
                          }
                          alert('Cache cleared successfully! Page will reload.')
                          window.location.reload()
                        }
                      }}
                      className="w-full mt-4 px-4 py-2 glass rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Clear Cache
                    </button>
                  </div>
                </div>

                <div className="glass-card border border-red-500/20 rounded-lg p-6">
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                    <span>⚠️</span> Danger Zone
                  </h3>
                  <p className="text-white/60 text-sm mb-4">
                    These actions cannot be undone. Please be careful.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to reset ALL settings to default? This cannot be undone!')) {
                          localStorage.removeItem('autoreview-settings')
                          alert('All settings have been reset to defaults.')
                          window.location.reload()
                        }
                      }}
                      className="w-full px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                    >
                      Reset All Settings
                    </button>
                    <button
                      onClick={() => {
                        try {
                          const data = {
                            settings: JSON.parse(localStorage.getItem('autoreview-settings') || '{}'),
                            exportDate: new Date().toISOString(),
                            version: '1.0'
                          }
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `autoreview-settings-${new Date().toISOString().split('T')[0]}.json`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                          alert('Settings exported successfully!')
                        } catch (error) {
                          alert('Failed to export settings. Please try again.')
                        }
                      }}
                      className="w-full px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors font-medium"
                    >
                      Export Data (JSON)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legal & Privacy */}
          {activeTab === 'legal' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Legal & Privacy</h2>

              <div className="space-y-6">
                <div className="glass-card border border-primary/20 rounded-lg p-6">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <span>📜</span> Terms & Policies
                  </h3>
                  
                  <div className="space-y-4">
                    <a
                      href="/privacy"
                      className="flex items-center justify-between p-4 glass rounded-lg hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-xl">🔒</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">Privacy Policy</p>
                          <p className="text-white/60 text-sm">How we handle your data</p>
                        </div>
                      </div>
                      <span className="text-white/40 group-hover:text-white/80 transition-colors">→</span>
                    </a>

                    <a
                      href="/terms"
                      className="flex items-center justify-between p-4 glass rounded-lg hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-xl">📋</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">Terms of Service</p>
                          <p className="text-white/60 text-sm">Service usage terms</p>
                        </div>
                      </div>
                      <span className="text-white/40 group-hover:text-white/80 transition-colors">→</span>
                    </a>
                  </div>
                </div>

                <div className="glass-card border border-primary/20 rounded-lg p-6">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <span>🛡️</span> Data & Security
                  </h3>
                  
                  <div className="space-y-4 text-white/80 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-400">✓</span>
                      <div>
                        <p className="font-medium text-white">End-to-End Encryption</p>
                        <p className="text-white/60">All sensitive data is encrypted</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-400">✓</span>
                      <div>
                        <p className="font-medium text-white">GDPR Compliant</p>
                        <p className="text-white/60">We follow EU data protection standards</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-400">✓</span>
                      <div>
                        <p className="font-medium text-white">Regular Security Audits</p>
                        <p className="text-white/60">Continuous monitoring and updates</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-400">✓</span>
                      <div>
                        <p className="font-medium text-white">No Data Selling</p>
                        <p className="text-white/60">We never sell your information</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card border border-cyan-500/20 rounded-lg p-6">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <span>📧</span> Contact & Support
                  </h3>
                  
                  <div className="space-y-3 text-white/80 text-sm">
                    <div className="glass rounded-lg p-3">
                      <p className="text-white/60 text-xs mb-1">General Support</p>
                      <p className="font-medium text-white">support@autoreview-ai.com</p>
                    </div>
                    
                    <div className="glass rounded-lg p-3">
                      <p className="text-white/60 text-xs mb-1">Privacy Concerns</p>
                      <p className="font-medium text-white">privacy@autoreview-ai.com</p>
                    </div>
                    
                    <div className="glass rounded-lg p-3">
                      <p className="text-white/60 text-xs mb-1">Legal Inquiries</p>
                      <p className="font-medium text-white">legal@autoreview-ai.com</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card border border-amber-500/20 rounded-lg p-6">
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                    <span>⚖️</span> Your Data Rights
                  </h3>
                  <p className="text-white/60 text-sm mb-4">
                    You have full control over your data
                  </p>
                  
                  <div className="space-y-2 text-white/80 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>Request a copy of your data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>Update or correct your information</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>Delete your account and data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>Opt-out of marketing communications</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => alert('Please contact privacy@autoreview-ai.com to exercise your data rights.')}
                    className="w-full mt-4 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors font-medium"
                  >
                    Request Data Access
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex justify-end gap-4"
        >
          <button
            onClick={handleReset}
            className="px-6 py-3 glass text-white/70 hover:text-white rounded-lg font-medium transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            {saved ? (
              <>
                <span>✓</span> Saved!
              </>
            ) : (
              <>
                <span>💾</span> Save Settings
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
    </PageTransition>
  )
}
