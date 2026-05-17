'use client'

import { motion } from 'framer-motion'

const sections = [
  {
    title: '1. Information We Collect',
    body: [
      'We collect account information such as your name, email address, business profile details, plan status, and settings you choose inside AutoReview AI.',
      'When you connect a review platform, we may store encrypted access tokens, platform account identifiers, page or location names, review content, ratings, review dates, and reply history.',
      'We also collect technical information such as device type, browser, approximate usage activity, error logs, and security events so we can operate and improve the service.',
    ],
  },
  {
    title: '2. How We Use Information',
    body: [
      'We use your data to provide review management, AI reply generation, sentiment analysis, analytics, platform sync, account support, security monitoring, billing, and product improvement.',
      'If you choose Google or Facebook OAuth, we use the permission only to connect your selected business/page data and manage review workflows you request.',
      'We do not sell your customer reviews, business data, or connected platform credentials.',
    ],
  },
  {
    title: '3. Google, Meta, and Third-Party Platforms',
    body: [
      'AutoReview AI may connect with Google Business Profile, Facebook Pages, and other review platforms. These integrations are optional and require your consent.',
      'Connected platform access can be removed from AutoReview AI settings, from your Google Account permissions, or from Meta/Facebook app permissions.',
      'Use of Google data is limited to providing user-facing review management features. We do not use Google user data for advertising.',
    ],
  },
  {
    title: '4. AI Processing',
    body: [
      'Review text and related context may be sent to AI providers only to generate replies, classify sentiment, summarize feedback, or power requested AI features.',
      'You are responsible for reviewing AI-generated replies before publishing them to a public review platform.',
      'Where available, we redact sensitive personal information before AI processing based on your settings.',
    ],
  },
  {
    title: '5. Security',
    body: [
      'Sensitive credentials and access tokens are encrypted before storage. We use access controls, authentication, HTTPS, audit logging, and least-privilege practices.',
      'No internet service can guarantee perfect security, but we design AutoReview AI to reduce risk and protect your business data.',
    ],
  },
  {
    title: '6. Data Sharing',
    body: [
      'We share data only with service providers needed to run AutoReview AI, such as hosting, database, authentication, payments, analytics, AI processing, and connected review platforms.',
      'We may disclose information if required by law, to protect users, investigate abuse, or enforce our Terms of Service.',
    ],
  },
  {
    title: '7. Retention and Deletion',
    body: [
      'We keep account and review data while your account is active or as needed to provide the service, comply with law, resolve disputes, and maintain security.',
      'You can request deletion of your account data and connected platform credentials by contacting support. Some records may remain temporarily in backups or logs.',
      'You can also export or delete local settings from the Settings page.',
    ],
  },
  {
    title: '8. Your Choices and Rights',
    body: [
      'Depending on your location, you may have rights to access, correct, export, restrict, or delete your personal information.',
      'You can disconnect OAuth access at any time. You can opt out of non-essential communications where applicable.',
    ],
  },
  {
    title: '9. Cookies and Local Storage',
    body: [
      'We use cookies and browser storage to keep you signed in, remember preferences, support PWA features, measure usage, and protect the platform.',
      'You can control cookies through your browser settings, but some features may stop working if essential cookies are disabled.',
    ],
  },
  {
    title: '10. Changes to This Policy',
    body: [
      'We may update this Privacy Policy as the product, laws, or integrations change. Material changes will be posted on this page or communicated through the service.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-primary/70">AutoReview AI Legal</p>
          <h1 className="mb-3 text-4xl font-bold text-gradient sm:text-5xl">Privacy Policy</h1>
          <p className="text-white/70">Last updated: May 17, 2026</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card space-y-7 rounded-2xl border border-primary/20 p-5 sm:p-8"
        >
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-3 text-xl font-semibold text-white">Summary</h2>
            <p className="leading-relaxed text-white/75">
              AutoReview AI helps businesses manage reviews and generate AI-assisted replies. We collect only the data needed to provide the service, keep sensitive platform credentials encrypted, and do not sell your business or customer review data.
            </p>
          </section>

          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-2xl font-semibold text-white">{section.title}</h2>
              <div className="space-y-3 text-white/80">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="leading-relaxed">{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">11. Contact</h2>
            <div className="space-y-3 text-white/80">
              <p>For privacy requests, platform data deletion, or questions about our data practices, contact us at:</p>
              <div className="glass rounded-xl border border-white/10 p-4">
                <p className="font-medium">Privacy: privacy@autoreview-ai.com</p>
                <p className="font-medium">Support: support@autoreview-ai.com</p>
              </div>
            </div>
          </section>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex flex-col items-center justify-center gap-3 text-center sm:flex-row"
        >
          <a href="/terms" className="text-primary transition-colors hover:text-primary/80">Terms of Service</a>
          <span className="hidden text-white/20 sm:inline">/</span>
          <a href="/settings" className="text-primary transition-colors hover:text-primary/80">Back to Settings</a>
        </motion.div>
      </div>
    </div>
  )
}
