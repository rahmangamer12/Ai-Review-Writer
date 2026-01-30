'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Download, Chrome, CheckCircle, ArrowRight, Star, 
  MessageSquare, Zap, Globe, Copy, Check, Sparkles,
  Shield, RefreshCw, Clock
} from 'lucide-react'
import PageTransition from '@/components/transitions/PageTransition'

export default function ChromeExtensionPage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      title: 'Download Extension',
      description: 'Click the download button to get the extension ZIP file',
      icon: Download,
    },
    {
      title: 'Extract ZIP File',
      description: 'Extract the downloaded ZIP file to a folder on your computer',
      icon: CheckCircle,
    },
    {
      title: 'Open Chrome Extensions',
      description: 'Type chrome://extensions in your Chrome address bar',
      icon: Chrome,
    },
    {
      title: 'Enable Developer Mode',
      description: 'Toggle "Developer mode" ON in the top right corner',
      icon: Zap,
    },
    {
      title: 'Load Extension',
      description: 'Click "Load unpacked" and select the extracted folder',
      icon: CheckCircle,
    },
  ]

  const features = [
    { 
      icon: MessageSquare, 
      title: 'One-Click AI Replies', 
      desc: 'Generate perfect responses to reviews directly on Google Maps, Facebook, Yelp',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      icon: Globe, 
      title: 'All Platforms', 
      desc: 'Works seamlessly on Google My Business, Facebook Pages, Yelp, TripAdvisor',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      icon: Zap, 
      title: 'Instant Replies', 
      desc: 'Get AI-generated responses in under 2 seconds with one click',
      color: 'from-amber-500 to-orange-500'
    },
    { 
      icon: Shield, 
      title: 'Secure & Private', 
      desc: 'Your data stays on your device. No tracking or data collection',
      color: 'from-emerald-500 to-teal-500'
    },
  ]

  const handleDownload = () => {
    setDownloading(true)
    // Create download link
    const link = document.createElement('a')
    link.href = '/autoreview-ai-extension.zip'
    link.download = 'autoreview-ai-extension.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => setDownloading(false), 2000)
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0a0a0f]">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-400 text-sm mb-8"
              >
                <Sparkles className="w-4 h-4" />
                <span>100% Free - No Registration Required</span>
              </motion.div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                AutoReview AI
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Chrome Extension
                </span>
              </h1>
              
              <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
                Reply to customer reviews <strong className="text-white">10x faster</strong> with AI. 
                Works on Google Maps, Facebook, Yelp, and more.
              </p>

              {/* Download Button */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  onClick={handleDownload}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={downloading}
                  className="group px-8 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all flex items-center gap-3"
                >
                  {downloading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Download className="w-6 h-6 group-hover:animate-bounce" />
                  )}
                  {downloading ? 'Downloading...' : 'Download Extension'}
                  <span className="text-sm font-normal opacity-80">.zip</span>
                </motion.button>
                
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold text-lg transition-all flex items-center gap-3 border border-white/10"
                >
                  Open Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
                <div className="flex items-center gap-2 text-white/40">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>Free Forever</span>
                </div>
                <div className="flex items-center gap-2 text-white/40">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>No Registration</span>
                </div>
                <div className="flex items-center gap-2 text-white/40">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>Open Source</span>
                </div>
                <div className="flex items-center gap-2 text-white/40">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>AI-Powered</span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">10x</p>
                  <p className="text-white/50 text-sm">Faster Replies</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">20+</p>
                  <p className="text-white/50 text-sm">Languages</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">5+</p>
                  <p className="text-white/50 text-sm">Platforms</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">100%</p>
                  <p className="text-white/50 text-sm">Free</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-white/60">Three simple steps to reply to reviews with AI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                step: '01', 
                title: 'Install Extension', 
                desc: 'Download and install the Chrome Extension in under 1 minute',
                icon: Download
              },
              { 
                step: '02', 
                title: 'Open Review Page', 
                desc: 'Navigate to Google Maps, Facebook, or Yelp reviews',
                icon: Globe
              },
              { 
                step: '03', 
                title: 'Click AI Reply', 
                desc: 'Click the "AI Reply" button and copy the generated response',
                icon: Zap
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-3xl p-8 h-full">
                  <span className="text-6xl font-bold text-purple-500/20 absolute top-4 right-4">
                    {item.step}
                  </span>
                  <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                    <item.icon className="w-7 h-7 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-white/60">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="bg-white/5 border-y border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Powerful Features</h2>
              <p className="text-white/60">Everything you need to manage reviews efficiently</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/60">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Installation Steps */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Installation Guide</h2>
            <p className="text-white/60">Follow these steps to install the extension</p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${
                  activeStep === index 
                    ? 'bg-purple-500/10 border-purple-500/30' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  activeStep === index ? 'bg-purple-500/30' : 'bg-white/10'
                }`}>
                  <step.icon className={`w-6 h-6 ${activeStep === index ? 'text-purple-400' : 'text-white/60'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-purple-400">STEP {index + 1}</span>
                    {activeStep === index && <span className="text-xs text-emerald-400">● Active</span>}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-white/60 text-sm">{step.description}</p>
                </div>
                <ArrowRight className={`w-5 h-5 transition-all ${
                  activeStep === index ? 'text-purple-400 translate-x-1' : 'text-white/20'
                }`} />
              </motion.div>
            ))}
          </div>

          {/* Download CTA */}
          <div className="mt-10 text-center">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 disabled:opacity-50 text-white rounded-2xl font-bold text-lg transition-all inline-flex items-center gap-3"
            >
              {downloading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {downloading ? 'Downloading...' : 'Download Extension Now'}
            </button>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/20 rounded-3xl p-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to save hours every week?</h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">
              Join thousands of business owners who use AutoReview AI to respond to reviews 
              faster and better.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleDownload}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all inline-flex items-center gap-3"
              >
                <Download className="w-5 h-5" />
                Download Free Extension
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold text-lg transition-all"
              >
                Explore Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-white/40 text-sm">
                © 2025 AutoReview AI. Free and open source.
              </p>
              <div className="flex items-center gap-6">
                <button onClick={() => router.push('/privacy')} className="text-white/40 hover:text-white text-sm transition-colors">
                  Privacy
                </button>
                <button onClick={() => router.push('/terms')} className="text-white/40 hover:text-white text-sm transition-colors">
                  Terms
                </button>
                <a href="mailto:support@autoreview-ai.com" className="text-white/40 hover:text-white text-sm transition-colors">
                  Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
