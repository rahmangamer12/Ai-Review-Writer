'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronDown, MessageCircle, CreditCard, Shield, 
  Zap, Globe, HelpCircle, Mail, Search
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FAQ {
  category: string
  questions: {
    q: string
    a: string
  }[]
}

const faqData: FAQ[] = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What is AutoReview AI?",
        a: "AutoReview AI is an AI-powered platform that helps businesses automatically respond to customer reviews on Google, Facebook, Yelp, and other platforms. It saves you time while maintaining a professional online presence."
      },
      {
        q: "How do I get started?",
        a: "Simply sign up for a free account, connect your review platforms (Google My Business, Facebook, etc.), and start generating AI-powered responses. No technical knowledge required!"
      },
      {
        q: "Is there a free trial?",
        a: "Yes. The Free plan gives you 20 AI credits per month to test core features. No credit card is required to sign up."
      },
      {
        q: "How long does setup take?",
        a: "Most users are up and running in less than 5 minutes. Just connect your accounts and you're ready to go!"
      }
    ]
  },
  {
    category: "Features & Usage",
    questions: [
      {
        q: "How does the AI generate replies?",
        a: "Our AI analyzes the review content, sentiment, and your business context to generate personalized, professional responses. You can review and edit before posting, or set up auto-approval for positive reviews."
      },
      {
        q: "Which review platforms are supported?",
        a: "Google Business Profile is the primary supported OAuth integration. Facebook can be connected through platform keys or user-provided Meta app keys, but public Facebook OAuth still depends on Meta app approval. Yelp, TripAdvisor, and Trustpilot can be configured through their API credentials where available."
      },
      {
        q: "Can I customize the AI responses?",
        a: "Yes. You can set tone preferences and edit AI replies before saving. Growth and Business plans are intended for deeper analytics, more credits, and advanced workflows."
      },
      {
        q: "What languages are supported?",
        a: "AutoReview AI supports 20+ languages including English, Spanish, Hindi, Urdu, Arabic, French, German, Chinese, Japanese, and more. The AI will respond in the same language as the review."
      },
      {
        q: "How does auto-reply work?",
        a: "You can set up rules to automatically reply to reviews that meet certain criteria (e.g., 4-5 star reviews with positive sentiment). Negative or complex reviews can be flagged for manual review."
      }
    ]
  },
  {
    category: "Pricing & Billing",
    questions: [
      {
        q: "How do credits work?",
        a: "Each AI-generated response uses 1 credit. Analytics features may use additional credits based on complexity. Credits reset monthly based on your plan."
      },
      {
        q: "What happens if I run out of credits?",
        a: "You can upgrade your plan at any time, or purchase additional credits. Your account will remain active even if you hit your monthly limit."
      },
      {
        q: "Can I change plans?",
        a: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features and credits."
      },
      {
        q: "What payment methods are accepted?",
        a: "Payments are handled through Lemon Squeezy checkout. Available payment methods depend on your country and Lemon Squeezy configuration."
      },
      {
        q: "Is there a refund policy?",
        a: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with our service, contact us within 30 days for a full refund."
      }
    ]
  },
  {
    category: "Security & Privacy",
    questions: [
      {
        q: "Is my data secure?",
        a: "Sensitive platform credentials are encrypted server-side and raw card details are never collected by AutoReview AI. Payments are processed by Lemon Squeezy. We are not claiming SOC 2 certification at this stage."
      },
      {
        q: "Do you store my review data?",
        a: "Reviews you import or save are stored in your account so the dashboard, analytics, and AI replies can work. You can delete reviews from the app or request account data deletion."
      },
      {
        q: "Who has access to my account?",
        a: "Only you and team members you explicitly invite. We never access your account without permission, except for technical support when requested."
      },
      {
        q: "Is the AI response content safe?",
        a: "Our AI is trained specifically for professional business communication and includes content filters. All responses are appropriate for business use."
      }
    ]
  },
  {
    category: "Support",
    questions: [
      {
        q: "How can I get help?",
        a: "Email rahman.mac.apple@gamil.com or abdulmoto656@gmail.com. For call support, include your phone or WhatsApp number and preferred time."
      },
      {
        q: "Do you offer training?",
        a: "We provide documentation and scheduled onboarding help when needed. Business customers get priority setup guidance."
      },
      {
        q: "What are your support hours?",
        a: "The support inbox is monitored daily. We usually reply within 24 hours, with billing and production issues handled first."
      },
      {
        q: "Can I schedule a walkthrough?",
        a: "Absolutely! Visit our Schedule a Call page to book a personalized product walkthrough with our team. We'll walk you through all features and answer your questions."
      }
    ]
  }
]

const quickLinks = [
  { icon: <MessageCircle className="w-5 h-5" />, label: "Contact Support", href: "/contact" },
  { icon: <Zap className="w-5 h-5" />, label: "View Pricing", href: "/subscription" },
  { icon: <Globe className="w-5 h-5" />, label: "Platform Integrations", href: "/connect-platforms" },
  { icon: <Shield className="w-5 h-5" />, label: "Privacy Policy", href: "/privacy" },
]

export default function FAQPage() {
  const router = useRouter()
  const [openCategory, setOpenCategory] = useState<string>("Getting Started")
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFAQs = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm mb-6">
            <HelpCircle className="w-4 h-4" />
            <span>Help Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Everything you need to know about AutoReview AI. 
            Can&apos;t find what you&apos;re looking for? Contact our support team.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-primary transition-colors"
          />
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {quickLinks.map((link, index) => (
            <button
              key={index}
              onClick={() => router.push(link.href)}
              className="flex items-center gap-3 p-4 glass-card border border-white/10 rounded-xl hover:border-primary/30 transition-all text-left"
            >
              <div className="text-primary">{link.icon}</div>
              <span className="text-white text-sm font-medium">{link.label}</span>
            </button>
          ))}
        </motion.div>

        {/* FAQ Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {(searchQuery ? filteredFAQs : faqData).map((category, catIndex) => (
            <div key={catIndex} className="glass-card border border-white/10 rounded-2xl overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => setOpenCategory(openCategory === category.category ? '' : category.category)}
                className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <h2 className="text-xl font-semibold text-white">{category.category}</h2>
                <ChevronDown 
                  className={`w-5 h-5 text-white/60 transition-transform ${openCategory === category.category ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Questions */}
              {(searchQuery || openCategory === category.category) && (
                <div className="divide-y divide-white/10">
                  {category.questions.map((item, qIndex) => (
                    <div key={qIndex} className="border-t border-white/10">
                      <button
                        onClick={() => setOpenQuestion(openQuestion === `${catIndex}-${qIndex}` ? null : `${catIndex}-${qIndex}`)}
                        className="w-full flex items-start justify-between p-6 text-left hover:bg-white/5 transition-colors"
                      >
                        <span className="text-white/90 font-medium pr-4">{item.q}</span>
                        <ChevronDown 
                          className={`w-5 h-5 text-white/40 shrink-0 transition-transform ${openQuestion === `${catIndex}-${qIndex}` ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {openQuestion === `${catIndex}-${qIndex}` && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="px-6 pb-6"
                        >
                          <p className="text-white/70 leading-relaxed">{item.a}</p>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* No Results */}
        {searchQuery && filteredFAQs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <HelpCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
            <p className="text-white/60 mb-6">Try searching with different keywords or contact support.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              Clear Search
            </button>
          </motion.div>
        )}

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 glass-card border-2 border-primary/20 rounded-2xl p-8 text-center"
        >
          <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Still have questions?</h2>
          <p className="text-white/70 mb-6">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/contact')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Contact Support
            </button>
            <button
              onClick={() => router.push('/schedule-call')}
              className="px-6 py-3 glass text-white rounded-xl font-medium hover:bg-white/10 transition-colors border border-white/20"
            >
              Schedule a Call
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
