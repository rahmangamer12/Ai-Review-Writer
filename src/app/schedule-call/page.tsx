'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Video, Mail, Phone, User, Building2, MessageSquare } from 'lucide-react'
import { useForm, ValidationError } from '@formspree/react'

export default function ScheduleCallPage() {
  const [state, handleSubmit] = useForm("xreqgero") // Use same Formspree ID or create new one

  if (state.succeeded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card border-2 border-primary/20 rounded-2xl p-8 max-w-md text-center"
        >
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Call Scheduled!</h2>
          <p className="text-white/70 mb-6">
            Thank you for scheduling a consultation. We&apos;ll contact you within 24 hours to confirm your preferred time.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-linear-to-r from-primary to-accent text-white rounded-xl font-semibold hover:opacity-90 transition-all"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient mb-4">
            Schedule a Free Consultation
          </h1>
          <p className="text-white/70 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
            Book a 30-minute call with our team. We&apos;ll help you choose the right plan and answer all your questions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Consultation Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card border-2 border-primary/20 rounded-2xl p-6 sm:p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Book Your Call</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-white mb-2 font-medium text-sm">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    id="name"
                    type="text"
                    name="name"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <ValidationError prefix="Name" field="name" errors={state.errors} />
              </div>

              <div>
                <label htmlFor="email" className="block text-white mb-2 font-medium text-sm">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
                <ValidationError prefix="Email" field="email" errors={state.errors} />
              </div>

              <div>
                <label htmlFor="phone" className="block text-white mb-2 font-medium text-sm">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary transition-colors"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <ValidationError prefix="Phone" field="phone" errors={state.errors} />
              </div>

              <div>
                <label htmlFor="business" className="block text-white mb-2 font-medium text-sm">
                  Business Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    id="business"
                    type="text"
                    name="business"
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Your Business Name"
                  />
                </div>
                <ValidationError prefix="Business" field="business" errors={state.errors} />
              </div>

              <div>
                <label htmlFor="preferredTime" className="block text-white mb-2 font-medium text-sm">
                  Preferred Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <select
                    id="preferredTime"
                    name="preferredTime"
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="morning" style={{ backgroundColor: '#1f2937', color: 'white' }}>Morning (9 AM - 12 PM)</option>
                    <option value="afternoon" style={{ backgroundColor: '#1f2937', color: 'white' }}>Afternoon (12 PM - 5 PM)</option>
                    <option value="evening" style={{ backgroundColor: '#1f2937', color: 'white' }}>Evening (5 PM - 8 PM)</option>
                  </select>
                </div>
                <ValidationError prefix="Preferred Time" field="preferredTime" errors={state.errors} />
              </div>

              <div>
                <label htmlFor="message" className="block text-white mb-2 font-medium text-sm">
                  What would you like to discuss?
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-white/40" />
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Tell us about your business and what you need help with..."
                  />
                </div>
                <ValidationError prefix="Message" field="message" errors={state.errors} />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={state.submitting}
                className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-linear-to-r from-primary to-accent text-white hover:opacity-90 ${
                  state.submitting ? 'opacity-50 cursor-wait' : ''
                }`}
              >
                {state.submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    Schedule Call
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Info Section */}
          <div className="space-y-6">
            {/* What to Expect */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card border-2 border-primary/20 rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">What to Expect</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <p className="text-white/70 text-sm">
                    30-minute personalized consultation with our team
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <p className="text-white/70 text-sm">
                    Review your business needs and goals
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <p className="text-white/70 text-sm">
                    Get personalized plan recommendations
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <p className="text-white/70 text-sm">
                    Live demo of AutoReview AI features
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <p className="text-white/70 text-sm">
                    Q&A session for all your questions
                  </p>
                </li>
              </ul>
            </motion.div>

            {/* Availability */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card border-2 border-cyan-500/20 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Video className="w-6 h-6 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Video Call Details</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-white/60" />
                  <div>
                    <p className="text-white font-medium text-sm">Duration</p>
                    <p className="text-white/60 text-sm">30 minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-white/60" />
                  <div>
                    <p className="text-white font-medium text-sm">Availability</p>
                    <p className="text-white/60 text-sm">Monday - Friday, 9 AM - 6 PM EST</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-white/60" />
                  <div>
                    <p className="text-white font-medium text-sm">Platform</p>
                    <p className="text-white/60 text-sm">Google Meet / Zoom (we'll send link)</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card border-2 border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Need Help?</h3>
              <div className="space-y-3">
                <a
                  href="mailto:support@autoreview-ai.com"
                  className="flex items-center gap-3 text-white/70 hover:text-primary transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span className="text-sm">support@autoreview-ai.com</span>
                </a>
                <a
                  href="tel:+15551234567"
                  className="flex items-center gap-3 text-white/70 hover:text-primary transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span className="text-sm">+1 (555) 123-4567</span>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
