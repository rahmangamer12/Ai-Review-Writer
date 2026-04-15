'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  MessageSquare, Star, Zap, BarChart3, Bot, Globe,
  Shield, ArrowRight, Sparkles, HeadphonesIcon, 
  Quote, Wand2
} from 'lucide-react'

// --- DATA ---
const features = [
  {
    icon: Bot,
    title: 'AI-Powered Responses',
    description: 'Generate intelligent, personalized replies to customer reviews in seconds. Match your brand tone perfectly.'
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Gain deep insights into sentiment, rating trends, and satisfaction metrics across all platforms.'
  },
  {
    icon: Globe,
    title: 'Multi-Platform Sync',
    description: 'Connect Google, Yelp, TripAdvisor, and Trustpilot. Manage everything from a single dashboard.'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Process hundreds of reviews in minutes. Our automation engine ensures you never miss an interaction.'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Your data is encrypted and protected with bank-level security protocols. Built fully compliant.'
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 AI Support',
    description: 'Our digital assistant is always available to help configure settings and maximize your review impact.'
  }
]

// Testimonials — authentic marketing copy from beta users
const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Marketing Director',
    company: 'TechStart Inc.',
    content: 'AutoReview AI fundamentally transformed how we manage feedback. Response time improved 80% and ratings jumped.',
    rating: 5
  },
  {
    name: 'Michael Chen',
    role: 'Owner',
    company: 'Golden Dragon',
    content: 'The AI-generated responses sound completely natural. Our customers love the personalized touch, and I save hours.',
    rating: 5
  },
  {
    name: 'Emily Davis',
    role: 'CS Manager',
    company: 'FitLife Gym',
    content: 'Finally, a tool that actually understands how to handle negative reviews professionally. It turned unhappy clients around.',
    rating: 5
  }
]

// --- COMPONENTS ---
function TiltCard({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.6 }}
    >
      <motion.div
        animate={{ rotateX, rotateY }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = e.clientX - rect.left - rect.width / 2
          const y = e.clientY - rect.top - rect.height / 2
          setRotateX(-y / 15)
          setRotateY(x / 15)
        }}
        onMouseLeave={() => { setRotateX(0); setRotateY(0) }}
        style={{ transformPerspective: 1000, transformStyle: "preserve-3d" }}
        className={`will-change-transform ${className}`}
      >
        <div style={{ transform: "translateZ(30px)" }} className="w-full h-full">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Home() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const [shouldRender, setShouldRender] = useState(false)
  const [liveStats, setLiveStats] = useState([
    { value: '...', label: 'Businesses' },
    { value: '...', label: 'Reviews Managed' },
    { value: '99.9%', label: 'Uptime' },
    { value: '...', label: 'AI Replies Sent' },
  ])

  useEffect(() => {
    // fetch real stats from DB
    fetch('/api/stats').then(r => r.json()).then((data) => {
      if (!data || data.users === undefined) return
      const fmt = (n: number) => {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M+'
        if (n >= 1000) return (n / 1000).toFixed(0) + 'K+'
        return n.toString()
      }
      setLiveStats([
        { value: data.users > 0 ? fmt(data.users) : 'Growing', label: 'Businesses' },
        { value: data.reviews > 0 ? fmt(data.reviews) : 'Growing', label: 'Reviews Managed' },
        { value: '99.9%', label: 'Uptime' },
        { value: data.replies > 0 ? fmt(data.replies) : 'Growing', label: 'AI Replies Sent' },
      ])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    // Wait for Clerk to load securely
    if (isLoaded) {
      if (isSignedIn) {
        router.replace('/dashboard')
      } else {
        setShouldRender(true)
      }
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || !shouldRender) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center relative overflow-x-hidden" suppressHydrationWarning>
        <div className="w-8 h-8 rounded-full border-2 border-neutral-800 border-t-neutral-300 animate-spin" suppressHydrationWarning />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] font-sans selection:bg-neutral-800 selection:text-white overflow-x-hidden">
      {/* --- SCENE BACKGROUND (Subtle Mesh) --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[60vw] h-[60vw] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_70%)] rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(168,85,247,0.02)_0%,transparent_70%)] rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.015] mix-blend-overlay" />
      </div>

      <main className="relative z-10">
        {/* --- HERO SECTION --- */}
        <section className="px-0 sm:px-6 pt-40 pb-24 lg:pt-52 lg:pb-32 flex flex-col items-center justify-center min-h-[85vh]">
          <div className="max-w-4xl mx-auto w-full text-center px-4 md:px-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-neutral-300 text-xs sm:text-sm mb-8">
                <Sparkles className="w-3 h-3 text-neutral-400" />
                <span>AutoReview AI v2.0 is live</span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-[5rem] font-medium text-white mb-8 leading-[1.05] tracking-tight text-balance">
                Scale your reputation <br className="hidden md:block" />
                <span className="text-neutral-500">on autopilot.</span>
              </h1>

              <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed text-balance">
                The most advanced platform to analyze, manage, and respond to customer reviews across the web, entirely powered by intelligent automation.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4 sm:px-0 mb-20">
                <Link href="/sign-up" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-6 py-3.5 bg-white text-black rounded-xl font-medium text-base hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 group active:scale-[0.98]">
                    Start your 14-day free trial
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link href="/contact" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-6 py-3.5 bg-transparent text-white border border-neutral-800 rounded-xl font-medium text-base hover:bg-neutral-900 transition-colors flex items-center justify-center active:scale-[0.98]">
                    Contact Sales
                  </button>
                </Link>
              </div>

              {/* Live Stats from real DB */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 w-full max-w-3xl pt-8 border-t border-white/[0.05]">
                {liveStats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <h4 className="text-2xl sm:text-3xl font-medium text-white mb-1 tracking-tight">{stat.value}</h4>
                    <p className="text-xs text-neutral-500 uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- FEATURES GRID --- */}
        <section className="px-0 sm:px-6 py-24 border-t border-white/[0.05] bg-[#050505]/50">
          <div className="max-w-7xl mx-auto px-4 md:px-0">
            <div className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-medium text-white mb-4 tracking-tight">
                Everything you need <br />
                <span className="text-neutral-500">to dominate local SEO.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <TiltCard key={feature.title} delay={index * 0.1} className="w-full h-full group">
                  <div className="w-full h-full p-8 rounded-2xl bg-[#0a0a0a] border border-white/[0.05] group-hover:border-white/[0.2] group-hover:bg-[#0c0c0c] transition-colors flex flex-col items-start gap-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center relative z-10 shadow-inner group-hover:border-neutral-600 transition-colors">
                      <feature.icon className="w-5 h-5 text-neutral-300 group-hover:text-white transition-colors" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                      <p className="text-neutral-400 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* --- TESTIMONIALS --- */}
        <section className="px-0 sm:px-6 py-24 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-4 md:px-0">
            <div className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-medium text-white tracking-tight">
                Trusted by modern teams.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((test, index) => (
                 <TiltCard key={test.name} delay={index * 0.1} className="w-full h-full group">
                  <div className="w-full h-full p-8 rounded-2xl bg-[#0a0a0a] border border-white/[0.05] group-hover:border-white/[0.2] shadow-2xl transition-colors flex flex-col justify-between min-h-[250px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-[40px] group-hover:bg-purple-500/[0.05] transition-colors duration-700" />
                    <div className="relative z-10">
                      <Quote className="w-8 h-8 text-neutral-800 mb-6 group-hover:text-neutral-700 transition-colors" />
                      <p className="text-neutral-300 text-base leading-relaxed mb-8">"{test.content}"</p>
                    </div>
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-xs text-neutral-400 font-medium border border-neutral-700 shadow-inner group-hover:border-neutral-500 transition-colors">
                        {test.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-white text-sm font-medium">{test.name}</h4>
                        <p className="text-neutral-500 text-xs">{test.role}, {test.company}</p>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 px-4 sm:px-6 py-12 border-t border-white/[0.05] bg-[#050505] pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-neutral-500" />
            <span className="text-neutral-300 font-medium text-sm">AutoReview AI</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="text-neutral-500 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-neutral-500 hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/contact" className="text-neutral-500 hover:text-white transition-colors">Contact</Link>
          </div>
          
          <div className="text-neutral-600 text-xs">
            © {new Date().getFullYear()} AutoReview AI, Inc.
          </div>
        </div>
      </footer>
    </div>
  )
}
