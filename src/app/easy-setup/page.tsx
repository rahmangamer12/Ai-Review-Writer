'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { managedOAuthService } from '@/lib/oauth-helper'
import { useToast } from '@/components/ui/Toast'

export default function EasySetupPage() {
  const [step, setStep] = useState<'choose' | 'managed' | 'call' | 'success'>('choose')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    contactEmail: '',
    phoneNumber: '',
    platform: '',
    preferredTime: '',
    platforms: [] as string[]
  })
  const { error: toastError } = useToast()

  const handleManagedSetup = async () => {
    setLoading(true)
    try {
      const result = await managedOAuthService.requestManagedSetup({
        businessName: formData.businessName,
        businessEmail: formData.contactEmail,
        platform: formData.platform,
        phoneNumber: formData.phoneNumber
      })

      if (result.success) {
        setStep('success')
      } else {
        toastError('Setup Failed', result.message)
      }
    } catch {
      toastError('Setup Failed', 'Error submitting request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleCall = async () => {
    setLoading(true)
    try {
      const result = await managedOAuthService.scheduleSetupCall(formData)

      if (result.success) {
        setStep('success')
      } else {
        toastError('Booking Failed', result.message)
      }
    } catch {
      toastError('Booking Failed', 'Error scheduling call. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back to Platforms Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <a
            href="/connect-platforms"
            className="inline-flex items-center gap-2 px-4 py-2 glass text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <span>←</span> Back to Platforms
          </a>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold text-gradient mb-2">Easy Setup</h1>
          <p className="text-white/70">Need help with technical setup? We&apos;ve got you covered! 😊</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 1: Choose Setup Method */}
          {step === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Option 1: Managed Setup */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass-card border border-primary/20 rounded-xl p-8 cursor-pointer"
                onClick={() => setStep('managed')}
              >
                <div className="text-6xl mb-4 text-center">🛠️</div>
                <h2 className="text-2xl font-bold text-white mb-4 text-center">Managed Setup</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400">✓</span>
                    <p className="text-white/80">We&apos;ll handle complete setup</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400">✓</span>
                    <p className="text-white/80">API keys management included</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400">✓</span>
                    <p className="text-white/80">Ready within 24-48 hours</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400">✓</span>
                    <p className="text-white/80">You don&apos;t need to do anything</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary mb-2">$8 one-time</p>
                  <p className="text-white/60 text-sm">Complete setup included</p>
                </div>
              </motion.div>

              {/* Option 2: Schedule Call */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass-card border border-primary/20 rounded-xl p-8 cursor-pointer"
                onClick={() => setStep('call')}
              >
                <div className="text-6xl mb-4 text-center">📞</div>
                <h2 className="text-2xl font-bold text-white mb-4 text-center">Video Call Setup</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400">✓</span>
                    <p className="text-white/80">Live screen sharing session</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400">✓</span>
                    <p className="text-white/80">Step-by-step guided setup</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400">✓</span>
                    <p className="text-white/80">Complete within 30 minutes</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400">✓</span>
                    <p className="text-white/80">Real-time expert help</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyan-400 mb-2">FREE</p>
                  <p className="text-white/60 text-sm">With Professional plan</p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Step 2: Managed Setup Form */}
          {step === 'managed' && (
            <motion.div
              key="managed"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card border border-primary/20 rounded-xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Managed Setup Request</h2>
              <p className="text-white/70 mb-6">
                Fill the form below, and we&apos;ll set up your platforms within 24-48 hours.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-white mb-2 font-medium">Business Name *</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary"
                    placeholder="Your business name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-medium">Contact Email *</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-medium">Phone Number (WhatsApp)</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary"
                    placeholder="+92 300 1234567"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-medium">Platform *</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary [&>option]:bg-slate-800 [&>option]:text-white"
                    required
                  >
                    <option value="" className="bg-slate-800 text-white">Select platform</option>
                    <option value="google" className="bg-slate-800 text-white">Google My Business</option>
                    <option value="yelp" className="bg-slate-800 text-white">Yelp</option>
                    <option value="facebook" className="bg-slate-800 text-white">Facebook</option>
                    <option value="tripadvisor" className="bg-slate-800 text-white">TripAdvisor</option>
                    <option value="trustpilot" className="bg-slate-800 text-white">Trustpilot</option>
                    <option value="all" className="bg-slate-800 text-white">All Platforms (Additional cost)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('choose')}
                  className="flex-1 px-6 py-3 glass text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleManagedSetup}
                  disabled={loading || !formData.businessName || !formData.contactEmail || !formData.platform}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Request →'}
                </button>
              </div>

              <div className="mt-6 p-4 glass rounded-lg">
                <p className="text-white/60 text-sm">
                  💡 <strong>Payment:</strong> We&apos;ll send you a payment link via email. Payment is due only after setup is complete.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 3: Schedule Call Form */}
          {step === 'call' && (
            <motion.div
              key="call"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card border border-primary/20 rounded-xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Schedule Setup Call</h2>
              <p className="text-white/70 mb-6">
                Schedule a video call, we&apos;ll help you with live setup assistance.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-white mb-2 font-medium">Business Name *</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary"
                    placeholder="Your business name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-medium">Contact Email *</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-medium">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary"
                    placeholder="+92 300 1234567"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-medium">Preferred Time *</label>
                  <select
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary [&>option]:bg-slate-800 [&>option]:text-white"
                    required
                  >
                    <option value="" className="bg-slate-800 text-white">Select time</option>
                    <option value="morning" className="bg-slate-800 text-white">Morning (9 AM - 12 PM)</option>
                    <option value="afternoon" className="bg-slate-800 text-white">Afternoon (12 PM - 4 PM)</option>
                    <option value="evening" className="bg-slate-800 text-white">Evening (4 PM - 8 PM)</option>
                    <option value="weekend" className="bg-slate-800 text-white">Weekend</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('choose')}
                  className="flex-1 px-6 py-3 glass text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleScheduleCall}
                  disabled={loading || !formData.businessName || !formData.contactEmail || !formData.phoneNumber || !formData.preferredTime}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Scheduling...' : 'Schedule Call →'}
                </button>
              </div>

              <div className="mt-6 p-4 glass rounded-lg">
                <p className="text-white/60 text-sm">
                  💡 <strong>Platform:</strong> Google Meet or Zoom. Link will be sent via email.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card border border-emerald-500/20 rounded-xl p-8 text-center"
            >
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold text-white mb-4">Request Submitted!</h2>
              <p className="text-white/70 mb-6 max-w-2xl mx-auto">
                Your request has been received. We&apos;ll contact you within 24 hours.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="glass p-4 rounded-lg">
                  <div className="text-2xl mb-2">📧</div>
                  <p className="text-white/80 text-sm">Email confirmation sent</p>
                </div>
                <div className="glass p-4 rounded-lg">
                  <div className="text-2xl mb-2">⏰</div>
                  <p className="text-white/80 text-sm">Response in 24 hours</p>
                </div>
                <div className="glass p-4 rounded-lg">
                  <div className="text-2xl mb-2">✅</div>
                  <p className="text-white/80 text-sm">Setup completion guaranteed</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <a
                  href="/dashboard"
                  className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-center"
                >
                  Go to Dashboard
                </a>
                <a
                  href="/connect-platforms"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2 glass text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  <span>←</span> Back to Platforms
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
