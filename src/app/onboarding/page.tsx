'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [platformSelected, setPlatformSelected] = useState<string[]>([])
  const router = useRouter()

  const platforms = [
    { id: 'google', name: 'Google My Business', icon: '🔍', popular: true },
    { id: 'yelp', name: 'Yelp', icon: '⭐', popular: true },
    { id: 'facebook', name: 'Facebook', icon: '📘', popular: false },
    { id: 'tripadvisor', name: 'TripAdvisor', icon: '✈️', popular: false },
    { id: 'trustpilot', name: 'Trustpilot', icon: '💚', popular: false },
  ]

  const handleComplete = () => {
    // Save onboarding completion
    localStorage.setItem('onboarding-completed', 'true')
    localStorage.setItem('selected-platforms', JSON.stringify(platformSelected))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/70 text-sm">Step {step} of 4</span>
            <span className="text-white/70 text-sm">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-linear-to-r from-primary to-accent rounded-full"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card border border-primary/20 rounded-xl p-8 text-center"
            >
              <div className="text-6xl mb-6">🎉</div>
              <h1 className="text-4xl font-bold text-gradient mb-4">Welcome to AutoReview AI!</h1>
              <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                Aapka AI-powered review management system tayyar hai. Chalein, shuru karte hain aur dekhte hain ke ye kaise kaam karta hai!
              </p>
              <button
                onClick={() => setStep(2)}
                className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-lg"
              >
                Let&apos;s Get Started →
              </button>
            </motion.div>
          )}

          {/* Step 2: How It Works */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card border border-primary/20 rounded-xl p-8"
            >
              <h2 className="text-3xl font-bold text-white mb-6 text-center">How It Works</h2>
              <p className="text-white/70 text-center mb-8">
                Ye system kaise kaam karta hai - simple 4 steps:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="glass p-6 rounded-lg">
                  <div className="text-4xl mb-4">1️⃣</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Connect Platform</h3>
                  <p className="text-white/70">
                    Apne Google, Yelp, ya kisi bhi platform ko connect karein jahan customers review likhte hain
                  </p>
                </div>

                <div className="glass p-6 rounded-lg">
                  <div className="text-4xl mb-4">2️⃣</div>
                  <h3 className="text-xl font-semibold text-white mb-2">AI Analyzes</h3>
                  <p className="text-white/70">
                    AI automatically review ko analyze karta hai - sentiment, emotion, aur language detect karta hai
                  </p>
                </div>

                <div className="glass p-6 rounded-lg">
                  <div className="text-4xl mb-4">3️⃣</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Generate Reply</h3>
                  <p className="text-white/70">
                    AI personalized reply generate karta hai jo aapke tone aur brand ke according hai
                  </p>
                </div>

                <div className="glass p-6 rounded-lg">
                  <div className="text-4xl mb-4">4️⃣</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Auto-Post</h3>
                  <p className="text-white/70">
                    Reply automatically platform pe post ho jata hai. Aapko manually kuch nahi karna!
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 glass text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Next: Select Platforms →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Select Platforms */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card border border-primary/20 rounded-xl p-8"
            >
              <h2 className="text-3xl font-bold text-white mb-4 text-center">Select Your Platforms</h2>
              <p className="text-white/70 text-center mb-8">
                Kon se platforms se aap reviews manage karna chahte hain?
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {platforms.map((platform) => {
                  const isSelected = platformSelected.includes(platform.id)
                  return (
                    <motion.button
                      key={platform.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (isSelected) {
                          setPlatformSelected(platformSelected.filter(p => p !== platform.id))
                        } else {
                          setPlatformSelected([...platformSelected, platform.id])
                        }
                      }}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/20'
                          : 'border-white/20 glass hover:border-white/40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{platform.icon}</span>
                        <div className="flex-1 text-left">
                          <p className="text-white font-semibold">{platform.name}</p>
                          {platform.popular && (
                            <span className="text-xs text-primary">Most Popular</span>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 glass text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={platformSelected.length === 0}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Final Step →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Quick Guide */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card border border-primary/20 rounded-xl p-8"
            >
              <h2 className="text-3xl font-bold text-white mb-4 text-center">Quick Guide</h2>
              <p className="text-white/70 text-center mb-8">
                Aapko shuru karne ke liye kuch quick tips:
              </p>

              <div className="space-y-4 mb-8">
                <div className="glass p-6 rounded-lg">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">⚙️</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Settings Configure Karein</h3>
                      <p className="text-white/70">
                        Settings page pe jaakar AI tone, auto-reply, aur auto-approval configure karein
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass p-6 rounded-lg">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">🔌</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Platforms Connect Karein</h3>
                      <p className="text-white/70">
                        Selected platforms ko Settings → Integrations mein jaakar API keys enter karke connect karein
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass p-6 rounded-lg">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">✨</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Test Review Generate Karein</h3>
                      <p className="text-white/70">
                        Reviews page pe &quot;Generate Test Review&quot; button se test reviews banayein aur AI ko action mein dekhein
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass p-6 rounded-lg">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">📊</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Analytics Dekhein</h3>
                      <p className="text-white/70">
                        Analytics page pe detailed insights, trends, aur AI-generated suggestions dekhein
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 glass text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleComplete}
                  className="px-8 py-4 bg-linear-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-all text-lg font-semibold"
                >
                  Start Using AutoReview AI! 🚀
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
