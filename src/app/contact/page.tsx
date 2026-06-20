'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Mail, Phone, MapPin, Clock, Send, Calendar } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function ContactPage() {
  const { info: toastInfo } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          name: String(fd.get('name') || ''),
          email: String(fd.get('email') || ''),
          phone: String(fd.get('phone') || ''),
          subject: String(fd.get('subject') || ''),
          message: String(fd.get('message') || ''),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not send your message.')
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleScheduleCall = () => {
    toastInfo('Schedule a Call', 'Email rahman.mac.apple@gmail.com or abdulmoto656@gmail.com with your preferred time and phone or WhatsApp number.')
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient mb-4">Contact Us</h1>
          <p className="text-white/70 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
            We&apos;re here to help! Reach out to our team for support, questions, or consultation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card border-2 border-primary/20 rounded-2xl p-6 sm:p-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Send us a Message</h2>
            
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-9 h-9 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-white/70">Your message has been sent successfully. We&apos;ll get back to you soon!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="name" className="block text-white mb-2 font-medium text-sm sm:text-base">Name *</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-white mb-2 font-medium text-sm sm:text-base">Email *</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-white mb-2 font-medium text-sm sm:text-base">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Phone or WhatsApp number"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-white mb-2 font-medium text-sm sm:text-base">Subject *</label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
                    style={{ colorScheme: 'dark', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <option value="general" style={{ backgroundColor: '#1f2937', color: 'white' }}>General Inquiry</option>
                    <option value="support" style={{ backgroundColor: '#1f2937', color: 'white' }}>Technical Support</option>
                    <option value="billing" style={{ backgroundColor: '#1f2937', color: 'white' }}>Billing Question</option>
                    <option value="feature" style={{ backgroundColor: '#1f2937', color: 'white' }}>Feature Request</option>
                    <option value="partnership" style={{ backgroundColor: '#1f2937', color: 'white' }}>Partnership Opportunity</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-white mb-2 font-medium text-sm sm:text-base">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-linear-to-r from-primary to-accent text-white hover:from-primary/90 hover:to-accent/90 ${submitting ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </motion.div>

          {/* Contact Info & Schedule Call */}
          <div className="space-y-6">
            {/* Schedule a Call */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card border-2 border-cyan-500/30 rounded-2xl p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Schedule a Call</h2>
              </div>
              
              <p className="text-white/70 mb-6 text-sm sm:text-base">
                Book a free consultation by sharing your preferred time, email, and phone or WhatsApp number.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleScheduleCall}
                className="w-full px-6 py-3 bg-linear-to-r from-cyan-500 to-cyan-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Book a Consultation
              </motion.button>

              <div className="mt-4 text-center text-white/60 text-xs sm:text-sm">
                We respond by email first, then schedule a call if needed.
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card border-2 border-primary/20 rounded-2xl p-6 sm:p-8"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Contact Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Primary Email</p>
                    <a href="mailto:rahman.mac.apple@gmail.com?cc=abdulmoto656@gmail.com" className="text-white hover:text-primary transition-colors font-medium">
                      rahman.mac.apple@gmail.com
                    </a>
                    <a href="mailto:abdulmoto656@gmail.com" className="mt-1 block text-white/70 hover:text-primary transition-colors text-sm">
                      abdulmoto656@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Phone / WhatsApp</p>
                    <p className="text-white font-medium">Add your number in the form and we will contact you directly.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Location</p>
                    <p className="text-white font-medium">Remote support for international customers</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Business Hours</p>
                    <p className="text-white font-medium">
                      Email support: daily<br />
                      Calls: scheduled after request
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card border-2 border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
              <div className="space-y-2">
                <a href="/settings" className="block text-white/70 hover:text-primary transition-colors text-sm">
                  Help Center & FAQ
                </a>
                <a href="/subscription" className="block text-white/70 hover:text-primary transition-colors text-sm">
                  Pricing & Plans
                </a>
                <a href="/privacy" className="block text-white/70 hover:text-primary transition-colors text-sm">
                  Privacy Policy
                </a>
                <a href="/terms" className="block text-white/70 hover:text-primary transition-colors text-sm">
                  Terms of Service
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card border-2 border-primary/20 rounded-2xl p-6 sm:p-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-semibold mb-2">How quickly will I get a response?</h3>
              <p className="text-white/70 text-sm">
                We usually respond within 24 hours. Billing and production issues are prioritized first.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-2">Do you offer technical support?</h3>
              <p className="text-white/70 text-sm">
                Yes. We help with Google OAuth, Lemon Squeezy setup, Chrome extension issues, and review sync troubleshooting.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-2">Can I schedule a walkthrough?</h3>
              <p className="text-white/70 text-sm">
                Absolutely! Use the &quot;Schedule a Call&quot; button to book a personalized product walkthrough of our platform.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-2">What about enterprise support?</h3>
              <p className="text-white/70 text-sm">
                Business customers get priority email support and scheduled call support when needed.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
