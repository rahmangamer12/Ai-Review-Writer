'use client'

import { motion } from 'framer-motion'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gradient mb-2">Privacy Policy</h1>
          <p className="text-white/70">Last updated: January 2026</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card border border-primary/20 rounded-xl p-8 space-y-6"
        >
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <div className="text-white/80 space-y-3">
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Account information (name, email, business details)</li>
                <li>Review platform credentials (encrypted and securely stored)</li>
                <li>Customer reviews and responses</li>
                <li>Usage data and analytics</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <div className="text-white/80 space-y-3">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and improve our AI-powered review management services</li>
                <li>Generate automated responses to customer reviews</li>
                <li>Analyze sentiment and provide insights</li>
                <li>Send you service updates and notifications</li>
                <li>Ensure platform security and prevent fraud</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Data Security</h2>
            <div className="text-white/80 space-y-3">
              <p>We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>End-to-end encryption for sensitive data</li>
                <li>Secure cloud storage with regular backups</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing</h2>
            <div className="text-white/80 space-y-3">
              <p>We do not sell your personal information. We may share data with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Review platforms (to post responses on your behalf)</li>
                <li>AI service providers (for response generation)</li>
                <li>Analytics providers (to improve our service)</li>
                <li>Legal authorities (when required by law)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Your Rights</h2>
            <div className="text-white/80 space-y-3">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Request data correction or deletion</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Close your account at any time</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies and Tracking</h2>
            <div className="text-white/80 space-y-3">
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Maintain your session and preferences</li>
                <li>Analyze usage patterns</li>
                <li>Improve user experience</li>
                <li>Provide personalized content</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Changes to This Policy</h2>
            <div className="text-white/80">
              <p>We may update this privacy policy from time to time. We will notify you of any significant changes via email or through our platform.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
            <div className="text-white/80">
              <p>If you have questions about this privacy policy or our data practices, please contact us at:</p>
              <div className="mt-3 glass rounded-lg p-4">
                <p className="font-medium">Email: privacy@autoreview-ai.com</p>
                <p className="font-medium">Support: support@autoreview-ai.com</p>
              </div>
            </div>
          </section>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <a
            href="/settings"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            ← Back to Settings
          </a>
        </motion.div>
      </div>
    </div>
  )
}
