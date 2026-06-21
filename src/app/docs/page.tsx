'use client'

import { useState } from 'react'
import { ChevronRight, BookOpen, Code, Database, CreditCard, Chrome, Shield, Zap, Star, Users, BarChart3, MessageSquare, Bot, ArrowLeft, Copy, Check, Search, Download, ExternalLink, Smartphone } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const DocumentationPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('overview')

  const documentationSections = [
    {
      id: 'overview',
      title: 'Overview',
      icon: <Star className="w-5 h-5" />,
      content: `
# AutoReview AI - Local Review Management Guide

AutoReview AI helps local service businesses organize real customer reviews, generate editable AI reply drafts, run autonomous review agents, and keep all review work in one authenticated dashboard.

## Why AutoReview AI?

- **Reply Faster**: Draft professional responses without starting from a blank page.
- **Stay in Control**: Review, edit, approve, reject, or delete AI replies before using them publicly.
- **Track Sentiment**: Understand positive, neutral, and negative review patterns.
- **Use Real Data**: Every page is built around your saved platform reviews and manual customer reviews.

## What's New

- **Dual AI engines**: LongCat for fast text replies and Agnes for image analysis and web-aware answers in chat.
- **Agentic AI**: An Agent Command Center that reads, triages, and drafts replies as one pipeline.
- **Chrome Extension v1.2.0**: Cleaner reply modal, more resilient scraping, and one-click AI replies on five platforms.
      `
    },
    {
      id: 'credits-models',
      title: 'Credits & AI Models',
      icon: <CreditCard className="w-5 h-5" />,
      content: `
# Credits & AI Models

AutoReview AI runs on two separate monthly credit pools so the right model is used for the right job.

## The Two Pools

- **LongCat credits**: power text replies, sentiment analysis, and the agentic agents.
- **Agnes credits**: power image analysis and web-aware (search) answers inside chat.

The chat experience **auto-switches** to Agnes the moment you attach an image or ask something that needs fresh, search-style context. You always see both balances in the chat header and in the AI assistant widget.

## Monthly Credits By Plan

- **Free**: 200 LongCat + 50 Agnes
- **Starter**: 500 LongCat + 150 Agnes
- **Growth**: 1,500 LongCat + 400 Agnes
- **Business**: 5,000 LongCat + 1,500 Agnes

Credits renew each month. When a pool runs low, the app shows an inline upgrade path on the **Subscription** page.

## How Credits Are Spent

- Each AI reply or agent action deducts from the matching pool and is written to your credit history.
- If a pool reaches zero, that capability pauses until renewal or upgrade — your data is never affected.
      `
    },
    {
      id: 'agentic',
      title: 'Agentic AI',
      icon: <Zap className="w-5 h-5" />,
      content: `
# Agentic AI: The Agent Command Center

The **Agentic** page runs autonomous agents over your reviews. Every agent shows a live pipeline graph and a streaming execution console, and every action is logged and held for your approval.

> Agentic agents require the **Growth** or **Business** plan.

## Auto-Reply Agent

Reads up to five pending reviews per run, analyses sentiment, and drafts a brand-tone reply for each. Replies are saved as **drafts** — never posted publicly without you.

## Triage / Damage Control

Scans for unanswered 1-2 star reviews, scores urgency (including risk keywords), and recommends a response so you can act before reputation damage spreads.

## Weekly Insight Email

Every Monday an agent summarises your week - trends, sentiment shift, and one concrete suggestion - and emails it to you automatically.

## Guardrails

- AI replies always save as drafts; nothing is auto-posted publicly.
- Every action is written to your credit and audit history.
- Per-run caps keep credit spend predictable.
      `
    },
    {
      id: 'chrome-extension',
      title: 'Chrome Extension',
      icon: <Chrome className="w-5 h-5" />,
      content: `
# Chrome Extension: Reply Directly on Platforms

The AutoReview AI Chrome Extension (**v1.2.0**) injects "AI Reply" buttons directly into Google Maps, Yelp, Facebook, TripAdvisor, and Trustpilot, so you can generate replies without ever leaving the review platform. The download on this site is always the latest build.

## Supported Platforms
- **Google Maps & Business**
- **Facebook Pages**
- **Yelp Business**
- **TripAdvisor**
- **Trustpilot**

## How to Install (Developer Mode)
1. Download the **[AutoReview AI Extension (.zip)](/autoreview-ai-extension.zip)**.
2. Extract the ZIP file to a folder on your desktop.
3. Open Chrome and navigate to \`chrome://extensions/\`.
4. Turn on **Developer Mode** (top-right toggle).
5. Click **Load Unpacked** and select the extracted folder.
6. The extension is now active. Visit any supported review page to see the AI Reply buttons.

## Using It
- Click **AI Reply** on any detected review to open the reply modal.
- Pick a tone (Friendly, Professional, Apologetic, Enthusiastic, or Desi Style) and regenerate as needed.
- Edit the draft, then copy it with one click. Replies are generated by your AutoReview backend, not a local template.
      `
    },
    {
      id: 'mobile-pwa',
      title: 'Mobile & PWA',
      icon: <Smartphone className="w-5 h-5" />,
      content: `
# Mobile Experience (PWA)

AutoReview AI is built as a **Progressive Web App (PWA)**. This means you don't need a separate app from the Play Store or App Store to manage your business on the go.

## How to Install on Mobile
1. Open **autoreview-ai.com** in Safari (iOS) or Chrome (Android).
2. Tap the **Share** button (iOS) or **Menu** button (Android).
3. Select **"Add to Home Screen"**.
4. AutoReview AI will now appear as an app on your phone with:
   - **Offline Support**: Access your reviews even without internet.
   - **Push Notifications**: Get notified the moment a new review arrives.
   - **Fast Loading**: App-like speed and smooth transitions.
      `
    },
    {
      id: 'ai-personas',
      title: 'AI Personas',
      icon: <Bot className="w-5 h-5" />,
      content: `
# Mastering AI Personas

AutoReview AI doesn't just generate generic replies. You can choose from multiple "Personas" to match your specific business vibe:

- **The Professional**: Formal, polite, and detail-oriented.
- **The Friendly**: Warm, welcoming, and uses emojis.
- **The Apologetic**: Empathetic and focuses on conflict resolution.
- **The Enthusiastic**: High energy for your biggest fans.
- **The Desi Style**: Localized tone for South Asian businesses.

You can set a default Persona in your **Settings** or switch them on-the-fly in the Dashboard.
      `
    },
    {
      id: 'api-usage',
      title: 'API & Integration',
      icon: <Code className="w-5 h-5" />,
      content: `
# Developer API

Integrate AutoReview AI directly into your own custom CRM or website.

### Endpoint: \`/api/reviews/generate-reply\`
**Method**: POST
**Auth**: Bearer Token (Clerk Session)

**Request Body**:
\`\`\`json
{
  "reviewText": "The food was amazing but the service was slow.",
  "rating": 4,
  "platform": "google",
  "tone": "friendly"
}
\`\`\`

**Response**:
\`\`\`json
{
  "success": true,
  "reply": "Thank you for your feedback! We're glad you enjoyed the food..."
}
\`\`\`
      `
    }
  ]

  const filteredSections = documentationSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(text.substring(0, 50))
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const renderMarkdown = (content: string) => {
    const elements: React.ReactNode[] = []
    const lines = content.split('\n')
    let inCodeBlock = false
    let codeContent = ''
    let codeLang = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div key={`code-${i}`} className="bg-[#0a0a0f] border border-white/10 rounded-xl my-5 overflow-hidden shadow-lg w-full max-w-full">
              {codeLang && <div className="bg-white/5 border-b border-white/5 px-4 py-2 text-xs font-mono text-purple-400 capitalize">{codeLang}</div>}
              <pre className="p-4 overflow-x-auto custom-scrollbar text-sm w-full">
                <code className="text-gray-300 font-mono inline-block min-w-full">{codeContent.trimEnd()}</code>
              </pre>
            </div>
          )
          inCodeBlock = false
          codeContent = ''
        } else {
          inCodeBlock = true
          codeLang = line.substring(3).trim()
        }
        continue
      }

      if (inCodeBlock) {
        codeContent += line + '\n'
        continue
      }

      if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-2xl sm:text-3xl font-bold text-white mb-6 mt-8 break-words">{line.substring(2)}</h1>)
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-xl sm:text-2xl font-semibold text-white mb-4 mt-8 break-words">{line.substring(3)}</h2>)
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-lg sm:text-xl font-medium text-white mb-3 mt-6 break-words">{line.substring(4)}</h3>)
      } else if (line.startsWith('- ')) {
        elements.push(<li key={i} className="text-gray-300 mb-2 ml-4 list-disc break-words leading-relaxed">{line.substring(2)}</li>)
      } else if (line.match(/^\d+\.\s/)) {
        elements.push(<li key={i} className="text-gray-300 mb-2 ml-4 list-decimal break-words leading-relaxed">{line.replace(/^\d+\.\s/, '')}</li>)
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-4" />)
      } else {
        elements.push(<p key={i} className="text-gray-300 mb-3 leading-relaxed break-words">{line}</p>)
      }
    }
    return elements
  }

  return (
    <div className="min-h-screen bg-[#030308] text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-8 shadow-2xl">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-violet-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 shadow-lg shadow-violet-500/20">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200/70">Knowledge base</p>
                <h1 className="text-3xl sm:text-5xl font-black text-white">Documentation</h1>
                <p className="mt-2 max-w-2xl text-white/55">Setup guides, platform workflows, AI reply rules, and extension instructions for local review teams.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <a 
                href="/autoreview-ai-extension.zip"
                download
                className="flex items-center gap-2 px-4 py-3 bg-white text-black rounded-2xl transition-all font-bold hover:bg-cyan-50"
              >
                <Download className="w-4 h-4" />
                Download Extension
              </a>
            </div>
          </div>

          {/* Search */}
          <div className="mt-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white/10 bg-black/25 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-8 bg-white/[0.04] border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-300" />
                Contents
              </h3>
              <nav className="space-y-2">
                {documentationSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 ${
                      activeSection === section.id
                        ? 'bg-violet-600/20 border border-violet-500/30 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-cyan-300">{section.icon}</span>
                    <span className="text-sm">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {filteredSections.map((section) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-12 ${activeSection !== section.id ? 'hidden' : ''}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-300">{section.icon}</span>
                    <span>{section.title}</span>
                  </h2>
                </div>

                <div className="prose prose-invert max-w-none bg-white/[0.035] p-5 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
                  {renderMarkdown(section.content)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentationPage
