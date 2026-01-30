'use client'

import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock, Send, Calendar } from 'lucide-react'
import { useForm, ValidationError } from '@formspree/react'

export default function ContactPage() {
  const [state, handleSubmit] = useForm("xreqgero")
  
  if (!state) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-white">Loading form...</div>
    </div>
  }

  const handleScheduleCall = () => {
    // Demo mode - show alert
    alert('📅 Schedule a Call\n\nThis feature would open a calendar booking system (like Calendly).\n\nFor demo purposes, you can contact us at:\nsupport@autoreview-ai.com\n\nWe typically respond within 24 hours!')
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
            
            {state.succeeded ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✓</span>
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
                  <ValidationError prefix="Name" field="name" errors={state.errors} />
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
                  <ValidationError prefix="Email" field="email" errors={state.errors} />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-white mb-2 font-medium text-sm sm:text-base">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary transition-colors"
                    placeholder="+1 (555) 123-4567"
                  />
                  <ValidationError prefix="Phone" field="phone" errors={state.errors} />
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
                  <ValidationError prefix="Subject" field="subject" errors={state.errors} />
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
                  <ValidationError prefix="Message" field="message" errors={state.errors} />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={state.submitting}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-linear-to-r from-primary to-accent text-white hover:from-primary/90 hover:to-accent/90 ${state.submitting ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {state.submitting ? (
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
                Book a free 30-minute consultation with our team. We&apos;ll help you choose the right plan and answer any questions.
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
                Available Monday-Friday, 9 AM - 6 PM EST
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
                    <p className="text-white/60 text-sm mb-1">Email</p>
                    <a href="mailto:support@autoreview-ai.com" className="text-white hover:text-primary transition-colors font-medium">
                      support@autoreview-ai.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Phone</p>
                    <a href="tel:+15551234567" className="text-white hover:text-cyan-400 transition-colors font-medium">
                      +1 (555) 123-4567
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Address</p>
                    <p className="text-white font-medium">
                      123 AI Street, Suite 100<br />
                      San Francisco, CA 94105
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Business Hours</p>
                    <p className="text-white font-medium">
                      Monday - Friday: 9 AM - 6 PM EST<br />
                      Saturday - Sunday: Closed
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
                  → Help Center & FAQ
                </a>
                <a href="/subscription" className="block text-white/70 hover:text-primary transition-colors text-sm">
                  → Pricing & Plans
                </a>
                <a href="/privacy" className="block text-white/70 hover:text-primary transition-colors text-sm">
                  → Privacy Policy
                </a>
                <a href="/terms" className="block text-white/70 hover:text-primary transition-colors text-sm">
                  → Terms of Service
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
                We typically respond to all inquiries within 24 hours during business days. Priority support plans receive responses within 12 hours.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-2">Do you offer technical support?</h3>
              <p className="text-white/70 text-sm">
                Yes! Our technical support team is available to help with integration, setup, and troubleshooting.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-2">Can I schedule a demo?</h3>
              <p className="text-white/70 text-sm">
                Absolutely! Use the &quot;Schedule a Call&quot; button to book a personalized demo of our platform.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-2">What about enterprise support?</h3>
              <p className="text-white/70 text-sm">
                Enterprise customers get dedicated account managers and priority phone support. Contact us to learn more.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
