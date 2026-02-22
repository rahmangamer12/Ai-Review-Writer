'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Chrome, Download, Zap, Shield, Code, Smartphone, Laptop, CheckCircle, Star, ArrowRight, Copy, Check, ExternalLink, AlertCircle } from 'lucide-react'

const ExtensionPage = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('installation')

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(text.substring(0, 20))
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600">
              <Chrome className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Chrome Extension
              </h1>
              <p className="text-gray-400 text-lg mt-2">Generate AI replies directly on review platforms</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          <div className="glass-card border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">95%</h3>
            <p className="text-sm text-gray-400">User Satisfaction</p>
          </div>
          <div className="glass-card border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">8s</h3>
            <p className="text-sm text-gray-400">Avg Reply Time</p>
          </div>
          <div className="glass-card border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">24/7</h3>
            <p className="text-sm text-gray-400">Availability</p>
          </div>
          <div className="glass-card border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">100%</h3>
            <p className="text-sm text-gray-400">Secure</p>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
        >
          <div className="glass-card border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">One-Click AI Replies</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Generate professional responses to customer reviews with a single click directly on review platforms.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Instant reply generation
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Context-aware responses
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Multiple tone options
              </li>
            </ul>
          </div>

          <div className="glass-card border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Multi-Platform Support</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Works seamlessly across all major review platforms with platform-specific optimization.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Google Maps & Business
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Facebook Business Pages
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Yelp, TripAdvisor, Trustpilot
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Installation Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('installation')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'installation'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Installation
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'features'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Features
            </button>
            <button
              onClick={() => setActiveTab('troubleshooting')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'troubleshooting'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Troubleshooting
            </button>
          </div>

          <div className="glass-card border border-white/10 rounded-2xl p-8">
            {activeTab === 'installation' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6">Installation Steps</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Open Chrome Extensions</h4>
                      <p className="text-gray-400 text-sm">Go to <code className="bg-white/10 px-2 py-0.5 rounded text-xs">chrome://extensions/</code></p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Enable Developer Mode</h4>
                      <p className="text-gray-400 text-sm">Toggle "Developer mode" in top-right corner</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Load Unpacked</h4>
                      <p className="text-gray-400 text-sm">Click "Load unpacked" button</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Select Extension Folder</h4>
                      <p className="text-gray-400 text-sm">Select the <code className="bg-white/10 px-2 py-0.5 rounded text-xs">chrome-extension</code> folder (you may see a security warning, click "Keep" or "Retain")</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold text-purple-400">Security Note</h4>
                  </div>
                  <p className="text-gray-400 text-sm">
                    The extension only accesses review content when you click the AI Reply button.
                    No personal data is collected or stored. All processing happens securely through our API.
                  </p>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <h4 className="font-semibold text-amber-400">Installation Help</h4>
                  </div>
                  <p className="text-gray-400 text-sm">
                    When installing, Chrome may show a security warning. This is normal for extensions not in Chrome Web Store.
                    Simply click "Keep" or "Retain" when prompted, then install via "Load Unpacked".
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6">Extension Features</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-3">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">AI Reply Generation</h4>
                    <p className="text-gray-400 text-sm">
                      Generate context-aware replies using advanced AI that understands the review content and matches your brand tone.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mb-3">
                      <Code className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">Platform Detection</h4>
                    <p className="text-gray-400 text-sm">
                      Automatically detects supported platforms and adjusts scraping logic accordingly.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-3">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">Secure API</h4>
                    <p className="text-gray-400 text-sm">
                      All data is securely transmitted to and from our API using encrypted connections.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mb-3">
                      <Copy className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">Auto-Copy</h4>
                    <p className="text-gray-400 text-sm">
                      Generated replies automatically copy to clipboard with one-click regenerations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'troubleshooting' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6">Troubleshooting</h3>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <h4 className="font-semibold text-white mb-2">Extension not detecting reviews</h4>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• Try refreshing the page</li>
                      <li>• Check if the review is fully loaded</li>
                      <li>• Ensure you're on a supported platform</li>
                      <li>• Clear browser cache and restart</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5">
                    <h4 className="font-semibold text-white mb-2">API errors</h4>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• Check internet connection</li>
                      <li>• Verify AutoReview AI backend is running</li>
                      <li>• Check browser console for detailed errors</li>
                      <li>• Ensure API endpoint is correctly configured</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5">
                    <h4 className="font-semibold text-white mb-2">Reply not copying</h4>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• Check clipboard permissions in browser</li>
                      <li>• Try manual copy from the modal</li>
                      <li>• Verify auto-copy setting is enabled</li>
                      <li>• Check for browser extensions conflicts</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5">
                    <h4 className="font-semibold text-white mb-2">Button not appearing</h4>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• Ensure the extension is enabled</li>
                      <li>• Check if the page has fully loaded</li>
                      <li>• Try disabling other extensions temporarily</li>
                      <li>• Restart browser after installation</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Code Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h3 className="text-2xl font-bold text-white mb-6">API Integration Examples</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-white">JavaScript API Call</h4>
                <button
                  onClick={() => copyToClipboard(`// Generate AI Reply
const response = await fetch('/api/reviews/generate-reply', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reviewText: 'Great service and friendly staff!',
    rating: 5,
    authorName: 'John Doe',
    platform: 'google',
    tone: 'friendly',
    language: 'en'
  })
});

const data = await response.json();
console.log('AI Reply:', data.reply);`)}
                  className="flex items-center gap-2 px-3 py-1 text-sm rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {copiedCode === 'Generate AI Reply' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-gray-900 rounded-lg p-4 text-sm overflow-x-auto">
                <code>{`// Generate AI Reply
const response = await fetch('/api/reviews/generate-reply', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reviewText: 'Great service and friendly staff!',
    rating: 5,
    authorName: 'John Doe',
    platform: 'google',
    tone: 'friendly',
    language: 'en'
  })
});

const data = await response.json();
console.log('AI Reply:', data.reply);`}</code>
              </pre>
            </div>

            <div className="glass-card border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-white">Content Script Example</h4>
                <button
                  onClick={() => copyToClipboard(`// Content Script Review Detection
function scrapeReviews() {
  const reviews = [];
  const reviewElements = document.querySelectorAll('[data-review-id]');

  reviewElements.forEach((el, index) => {
    try {
      const author = el.querySelector('.d4r55')?.textContent?.trim();
      const text = el.querySelector('[class*="wiI7pd"]')?.textContent?.trim();

      if (text) {
        reviews.push({
          id: Date.now() + index,
          author,
          text,
          element: el
        });
      }
    } catch (e) {
      console.error('Error scraping review:', e);
    }
  });

  return reviews;
}`)}
                  className="flex items-center gap-2 px-3 py-1 text-sm rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {copiedCode === 'Content Script Review Detection' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-gray-900 rounded-lg p-4 text-sm overflow-x-auto">
                <code>{`// Content Script Review Detection
function scrapeReviews() {
  const reviews = [];
  const reviewElements = document.querySelectorAll('[data-review-id]');

  reviewElements.forEach((el, index) => {
    try {
      const author = el.querySelector('.d4r55')?.textContent?.trim();
      const text = el.querySelector('[class*="wiI7pd"]')?.textContent?.trim();

      if (text) {
        reviews.push({
          id: Date.now() + index,
          author,
          text,
          element: el
        });
      }
    } catch (e) {
      console.error('Error scraping review:', e);
    }
  });

  return reviews;
}`}</code>
              </pre>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="glass-card border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
            <Chrome className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Transform Your Review Management?</h3>
            <p className="text-gray-400 mb-6">
              Install the AutoReview AI Chrome Extension today and start generating professional responses to customer reviews in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/autoreview-ai-extension.zip"
                download="autoreview-ai-extension.zip"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                <Download className="w-5 h-5" />
                Download Extension
              </a>
              <Link href="/docs" className="flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-xl font-medium hover:bg-white/10 transition-colors">
                <ExternalLink className="w-5 h-5" />
                View Documentation
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ExtensionPage