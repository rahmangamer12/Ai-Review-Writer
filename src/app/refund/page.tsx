'use client'

import { motion } from 'framer-motion'

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gradient mb-2">Refund Policy</h1>
          <p className="text-white/70">Last updated: June 2026</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card border border-primary/20 rounded-xl p-8 space-y-6"
        >
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Overview</h2>
            <div className="text-white/80 space-y-3">
              <p>AutoReview AI is a subscription-based software service (SaaS). This Refund Policy explains when you are eligible for a refund on payments made for our subscription plans and credits. Payments are processed securely by our authorized payment provider (Paddle), which acts as the Merchant of Record for your purchase.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. 14-Day Money-Back Guarantee</h2>
            <div className="text-white/80 space-y-3">
              <p>We offer a 14-day money-back guarantee on your first purchase of any paid subscription plan. If you are not satisfied with the service, you may request a full refund within 14 days of your initial payment, provided the request meets the conditions in this policy.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Eligibility</h2>
            <div className="text-white/80 space-y-3">
              <p>You are eligible for a refund when:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The refund is requested within 14 days of your first paid charge.</li>
                <li>You were charged in error or charged twice for the same billing period.</li>
                <li>A documented technical fault on our side prevented you from using the core service and we were unable to resolve it.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Non-Refundable Cases</h2>
            <div className="text-white/80 space-y-3">
              <p>Refunds are generally not provided when:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>More than 14 days have passed since the charge.</li>
                <li>A subscription renewal was not cancelled before the renewal date (see Cancellations below).</li>
                <li>AI credits included in a plan have already been substantially consumed.</li>
                <li>The account was suspended or terminated for violating our Terms of Service.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Cancellations &amp; Renewals</h2>
            <div className="text-white/80 space-y-3">
              <p>You can cancel your subscription at any time from your account settings. When you cancel, you keep access until the end of your current paid billing period, and you will not be charged again.</p>
              <p>To avoid being charged for the next period, please cancel before your renewal date. Charges for a period that has already started are generally non-refundable except as described above.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. How to Request a Refund</h2>
            <div className="text-white/80 space-y-3">
              <p>To request a refund, email us with your account email and the date of the charge. We aim to respond within 3 business days.</p>
              <p>Approved refunds are issued to your original payment method through Paddle. It may take 5–10 business days for the amount to appear, depending on your bank or card provider.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Contact</h2>
            <div className="text-white/80">
              <p>For refund requests or billing questions, please contact:</p>
              <div className="mt-3 glass rounded-lg p-4">
                <p className="font-medium">Email: support@autoreview-ai.com</p>
                <p className="font-medium">Billing: billing@autoreview-ai.com</p>
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
