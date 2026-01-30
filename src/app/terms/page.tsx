'use client'

import { motion } from 'framer-motion'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gradient mb-2">Terms of Service</h1>
          <p className="text-white/70">Last updated: January 2026</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card border border-primary/20 rounded-xl p-8 space-y-6"
        >
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <div className="text-white/80 space-y-3">
              <p>By accessing and using AutoReview AI, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Service Description</h2>
            <div className="text-white/80 space-y-3">
              <p>AutoReview AI provides:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>AI-powered review response generation</li>
                <li>Automated review management across multiple platforms</li>
                <li>Sentiment analysis and insights</li>
                <li>Analytics and reporting tools</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities</h2>
            <div className="text-white/80 space-y-3">
              <p>You agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate account information</li>
                <li>Keep your login credentials secure</li>
                <li>Use the service in compliance with all applicable laws</li>
                <li>Review AI-generated responses before posting</li>
                <li>Not misuse or abuse the service</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. AI-Generated Content</h2>
            <div className="text-white/80 space-y-3">
              <p>You acknowledge that:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>AI responses are suggestions and may require editing</li>
                <li>You are responsible for all content posted under your account</li>
                <li>We are not liable for the accuracy of AI-generated responses</li>
                <li>You should review responses before publishing</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Payment and Billing</h2>
            <div className="text-white/80 space-y-3">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Subscription fees are billed in advance</li>
                <li>Prices are subject to change with notice</li>
                <li>Refunds are provided according to our refund policy</li>
                <li>You can cancel your subscription at any time</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>
            <div className="text-white/80 space-y-3">
              <p>All rights to AutoReview AI software, design, and content remain with us. You may not:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Copy or redistribute our software</li>
                <li>Reverse engineer our technology</li>
                <li>Use our branding without permission</li>
                <li>Create derivative works</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Service Availability</h2>
            <div className="text-white/80 space-y-3">
              <p>We strive for 99.9% uptime but do not guarantee uninterrupted service. We may perform maintenance, updates, or modifications as needed.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
            <div className="text-white/80 space-y-3">
              <p>AutoReview AI is not liable for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Indirect or consequential damages</li>
                <li>Loss of profits or business opportunities</li>
                <li>Data loss or corruption</li>
                <li>Third-party platform issues</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Termination</h2>
            <div className="text-white/80 space-y-3">
              <p>We may suspend or terminate your account if you:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate these terms</li>
                <li>Engage in fraudulent activity</li>
                <li>Abuse the service</li>
                <li>Fail to pay subscription fees</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to Terms</h2>
            <div className="text-white/80">
              <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Information</h2>
            <div className="text-white/80">
              <p>For questions about these terms, please contact:</p>
              <div className="mt-3 glass rounded-lg p-4">
                <p className="font-medium">Email: legal@autoreview-ai.com</p>
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
