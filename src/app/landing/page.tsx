'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  MessageSquare, Star, Zap, BarChart3, Bot, Globe, 
  Shield, CheckCircle, ArrowRight, Play, ChevronRight,
  Sparkles, Users, TrendingUp, HeadphonesIcon, Quote
} from 'lucide-react'

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Responses',
    description: 'Generate intelligent, personalized replies to customer reviews in seconds using advanced AI.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Get deep insights into customer sentiment, trends, and satisfaction metrics.',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Globe,
    title: 'Multi-Platform Support',
    description: 'Connect Google, Facebook, Yelp, TripAdvisor, and Trustpilot all in one place.',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Process hundreds of reviews in minutes with our powerful automation engine.',
    gradient: 'from-amber-500 to-orange-500'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Your data is encrypted and protected with bank-level security protocols.',
    gradient: 'from-rose-500 to-pink-500'
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Support',
    description: 'Our AI assistant "Sarah" is always available to help you with any questions.',
    gradient: 'from-indigo-500 to-purple-500'
  }
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Marketing Director',
    company: 'TechStart Inc.',
    avatar: 'S',
    content: 'AutoReview AI has transformed how we manage customer feedback. Our response time improved by 80%!',
    rating: 5
  },
  {
    name: 'Michael Chen',
    role: 'Owner',
    company: 'Golden Dragon Restaurant',
    avatar: 'M',
    content: 'The AI-generated responses sound so natural. Our customers love the personalized touch.',
    rating: 5
  },
  {
    name: 'Emily Davis',
    role: 'Customer Success Manager',
    company: 'FitLife Gym',
    avatar: 'E',
    content: 'Finally, a tool that actually understands how to handle negative reviews professionally.',
    rating: 5
  }
]

const stats = [
  { value: '10K+', label: 'Businesses' },
  { value: '500K+', label: 'Reviews Processed' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9/5', label: 'Rating' }
]

export default function LandingPage() {
  const router = useRouter()
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#0a0a0f] overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12 lg:py-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">AutoReview AI</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <button 
            onClick={() => router.push('/sign-in')}
            className="px-4 py-2 text-white/70 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => router.push('/sign-up')}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300"
          >
            Get Started Free
          </button>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-12 pb-20 lg:px-12 lg:pt-20 lg:pb-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>Trusted by 10,000+ businesses worldwide</span>
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Manage Reviews with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
                AI Power
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed">
              Automate your review responses, analyze customer sentiment, and grow your business with intelligent AI that sounds human.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/sign-up')}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 border border-white/20 bg-white/5 text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                How it Works
              </motion.button>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-white/50">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Image/Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-16 lg:mt-24 relative"
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-10" />
              <div className="p-2 sm:p-4">
                <div className="aspect-video lg:aspect-[21/9] rounded-xl bg-gradient-to-br from-purple-900/50 via-[#0a0a0f] to-blue-900/50 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <BarChart3 className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Interactive Dashboard</h3>
                    <p className="text-white/60">Sign up to see your analytics in action</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -right-4 top-1/4 hidden lg:block"
            >
              <div className="glass-card border border-purple-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-white/80 text-sm">AI Processing...</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-20 lg:px-12 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              Everything You Need to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Succeed
              </span>
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Powerful features designed to help you manage reviews like a pro.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
                whileHover={{ y: -8 }}
                className="group relative glass-card rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.description}</p>
                
                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 px-6 py-20 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              Loved by{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Thousands
              </span>
            </h2>
            <p className="text-white/60 text-lg">See what our customers have to say</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-purple-500/30 mb-4" />
                <p className="text-white/70 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-white/50">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="relative z-10 px-6 py-20 lg:px-12 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              Start{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Free
              </span>, Scale When Ready
            </h2>
            <p className="text-white/60 text-lg mb-10">
              No credit card required. 20 free credits every month.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass-card rounded-2xl p-6 border border-white/10 text-left"
              >
                <div className="text-3xl font-bold text-white mb-1">Free</div>
                <div className="text-white/50 mb-4">Forever free</div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-white/70">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    20 AI credits/month
                  </li>
                  <li className="flex items-center gap-2 text-white/70">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    1 platform
                  </li>
                  <li className="flex items-center gap-2 text-white/70">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Basic analytics
                  </li>
                </ul>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass-card rounded-2xl p-6 border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-medium rounded-bl-xl">
                  Popular
                </div>
                <div className="text-3xl font-bold text-white mb-1">Pro</div>
                <div className="text-white/50 mb-4">From $9/month</div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-white/70">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    100 AI credits/month
                  </li>
                  <li className="flex items-center gap-2 text-white/70">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Unlimited platforms
                  </li>
                  <li className="flex items-center gap-2 text-white/70">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Advanced analytics
                  </li>
                </ul>
              </motion.div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/sign-up')}
              className="mt-8 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all inline-flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 lg:px-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold">AutoReview AI</span>
            </div>
            <div className="flex items-center gap-6 text-white/50 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-white/50 text-sm">
              © 2026 AutoReview AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
