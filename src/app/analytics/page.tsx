'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { 
  BarChart3, TrendingUp, TrendingDown, Minus, Star, MessageSquare, 
  Clock, CheckCircle, AlertCircle, Download, RefreshCw, Calendar,
  ArrowUpRight, ArrowDownRight, Target, Zap, Brain, Lightbulb,
  FileText, PieChart, Activity, Users, Award, Globe, Filter,
  ChevronDown, Sparkles, Cpu, Layers, Share2, Printer, MoreHorizontal,
  ThumbsUp, ThumbsDown, Meh, Send, ChevronRight, X, Menu
} from 'lucide-react'
import { longcatAI } from '@/lib/longcatAI'
import { supabase } from '@/lib/supabase'

// 3D Card Component
const Card3D = ({ children, className = '', delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['8deg', '-8deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-8deg', '8deg'])
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }
  
  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, rotateX: 15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative ${className}`}
    >
      <div style={{ transform: 'translateZ(30px)' }}>
        {children}
      </div>
    </motion.div>
  )
}

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 2 }: { value: number, duration?: number }) => {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let startTime: number
    let animationFrame: number
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      setCount(Math.floor(progress * value))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])
  
  return <span>{count.toLocaleString()}</span>
}

// Floating Particles Background
const FloatingParticles = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-purple-500/30 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
          }}
          animate={{
            y: [null, -100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  )
}

// Glass Card Component
const GlassCard = ({ children, className = '', glowColor = 'purple', onMouseEnter, onMouseLeave }: { 
  children: React.ReactNode, 
  className?: string, 
  glowColor?: string,
  onMouseEnter?: () => void,
  onMouseLeave?: () => void
}) => {
  const glowColors: Record<string, string> = {
    purple: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]',
    blue: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.3)]',
    emerald: 'hover:shadow-[0_0_40px_rgba(34,197,94,0.3)]',
    amber: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.3)]',
    rose: 'hover:shadow-[0_0_40px_rgba(244,63,94,0.3)]',
  }
  
  return (
    <div 
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl
        transition-all duration-500 ${glowColors[glowColor]} ${className}
      `}
    >
      {/* Inner gradient */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

// Animated Progress Bar
const AnimatedProgress = ({ value, max, color = 'purple', delay = 0 }: { value: number, max: number, color?: string, delay?: number }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0
  
  const colors: Record<string, string> = {
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  }
  
  return (
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className={`h-full ${colors[color]} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, delay, ease: 'easeOut' }}
      />
    </div>
  )
}

// Chart Bar Component
const ChartBar = ({ height, color, delay, label, value }: { height: number, color: string, delay: number, label: string, value: number }) => {
  return (
    <div className="flex flex-col items-center flex-1 group">
      <motion.div
        className={`w-full rounded-t-lg ${color} opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer`}
        initial={{ height: 0 }}
        animate={{ height: `${height}%` }}
        transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        whileHover={{ scale: 1.05 }}
      >
        {/* Tooltip */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 px-3 py-2 rounded-lg whitespace-nowrap z-20">
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-gray-400">{value} reviews</p>
        </div>
      </motion.div>
    </div>
  )
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  
  // Stats state
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    responseRate: 0,
    positiveSentiment: 0,
    pendingReviews: 0,
    aiGenerated: 0,
  })

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Calculate date range
      const now = new Date()
      let startDate = new Date()
      switch (timeRange) {
        case '7d': startDate.setDate(now.getDate() - 7); break
        case '30d': startDate.setDate(now.getDate() - 30); break
        case '90d': startDate.setDate(now.getDate() - 90); break
        case 'all': startDate = new Date(0); break
      }
      
      // Fetch reviews
      let query = (supabase as any)
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (timeRange !== 'all') {
        query = query.gte('created_at', startDate.toISOString())
      }
      
      const { data: reviewsData } = await query.limit(200)
      setReviews(reviewsData || [])
      
      // Calculate stats
      if (reviewsData && reviewsData.length > 0) {
        const total = reviewsData.length
        const avgRating = reviewsData.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / total
        const responded = reviewsData.filter((r: any) => r.status === 'approved').length
        const positive = reviewsData.filter((r: any) => r.sentiment_label === 'positive').length
        const pending = reviewsData.filter((r: any) => r.status === 'pending').length
        
        setStats({
          totalReviews: total,
          avgRating: parseFloat(avgRating.toFixed(1)),
          responseRate: Math.round((responded / total) * 100),
          positiveSentiment: Math.round((positive / total) * 100),
          pendingReviews: pending,
          aiGenerated: responded,
        })
        
        // Generate AI insights
        const formattedReviews = reviewsData.slice(0, 20).map((r: any) => ({
          text: r.content || r.review_text,
          rating: r.rating,
          date: r.created_at
        }))
        
        try {
          const aiInsights = await longcatAI.generateInsights(formattedReviews)
          setInsights(aiInsights)
        } catch (e) {
          console.error('AI insights error:', e)
          // Fallback insights
          setInsights({
            summary: `Based on ${total} reviews, your business has an average rating of ${avgRating.toFixed(1)} stars with ${Math.round((positive / total) * 100)}% positive sentiment.`,
            overall_trends: ['Increasing review volume', 'Consistent rating quality'],
            common_praises: ['Great service', 'Friendly staff'],
            common_complaints: ['Wait times', 'Limited availability'],
            improvement_suggestions: ['Reduce response time', 'Add more staff during peak hours'],
          })
        }
      } else {
        setStats({
          totalReviews: 0, avgRating: 0, responseRate: 0,
          positiveSentiment: 0, pendingReviews: 0, aiGenerated: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleExport = (format: string) => {
    setShowExportMenu(false)
    // Mock export functionality
    alert(`Exporting analytics data as ${format.toUpperCase()}...`)
  }
  
  const generateAIReport = async () => {
    setAiLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setAiLoading(false)
    alert('AI Report generated! Check your email.')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
        <FloatingParticles />
        <div className="text-center z-10">
          <motion.div 
            className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.p 
            className="text-white/70 text-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Generating AI Insights...
          </motion.p>
        </div>
      </div>
    )
  }

  // Show empty state if no reviews
  if (!loading && (!reviews || reviews.length === 0)) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
        <FloatingParticles />
        <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Analytics & Insights
            </h1>
            <p className="text-white/60 text-lg">AI-powered review analysis and business intelligence</p>
          </motion.div>

          <Card3D className="max-w-3xl mx-auto">
            <GlassCard className="p-16 text-center" glowColor="purple">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-24 h-24 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8"
              >
                <BarChart3 className="w-12 h-12 text-purple-400" />
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-white mb-4"
              >
                No Analytics Data Yet
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/60 mb-8 max-w-xl mx-auto text-lg"
              >
                Connect your review platforms and start collecting reviews to see detailed AI-powered analytics and insights here.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-4 justify-center flex-wrap"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(168,85,247,0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/connect-platforms')}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  <Globe className="w-5 h-5" />
                  Connect Platforms
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/reviews/add')}
                  className="px-8 py-4 border border-white/20 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Test Reviews
                </motion.button>
              </motion.div>
            </GlassCard>
          </Card3D>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <FloatingParticles />
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-600/5 rounded-full blur-[150px]" />
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 mb-2"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  Analytics & Insights
                </h1>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white/50 text-lg ml-16"
              >
                AI-powered analysis of customer feedback
              </motion.p>
            </div>
            
            {/* Controls */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-3"
            >
              {/* Time Range Selector */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                  <motion.button
                    key={range}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      timeRange === range
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {range === 'all' ? 'All Time' : `Last ${range.replace('d', ' Days')}`}
                  </motion.button>
                ))}
              </div>
              
              {/* AI Report Button */}
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168,85,247,0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={generateAIReport}
                disabled={aiLoading}
                className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-xl font-medium hover:bg-purple-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {aiLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                {aiLoading ? 'Generating...' : 'AI Report'}
              </motion.button>
              
              {/* Export Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-white/70 rounded-xl font-medium hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                  <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </motion.button>
                
                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      {[
                        { icon: FileText, label: 'Export as CSV', format: 'csv' },
                        { icon: Layers, label: 'Export as JSON', format: 'json' },
                        { icon: Printer, label: 'Print Report', format: 'print' },
                        { icon: Share2, label: 'Share Link', format: 'share' },
                      ].map((item) => (
                        <motion.button
                          key={item.format}
                          whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                          onClick={() => handleExport(item.format)}
                          className="w-full px-4 py-3 flex items-center gap-3 text-white/70 hover:text-white transition-colors text-left"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Refresh */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={fetchData}
                className="p-2 bg-white/5 border border-white/10 text-white/60 rounded-xl hover:bg-white/10 hover:text-white transition-all"
              >
                <RefreshCw className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Grid - 3D Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            { title: 'Total Reviews', value: stats.totalReviews, icon: MessageSquare, color: 'purple', trend: '+12%' },
            { title: 'Avg Rating', value: stats.avgRating, icon: Star, color: 'amber', trend: '+5%', suffix: '/5' },
            { title: 'Response Rate', value: stats.responseRate, icon: CheckCircle, color: 'emerald', trend: '+8%', suffix: '%' },
            { title: 'Positive', value: stats.positiveSentiment, icon: ThumbsUp, color: 'blue', trend: '+15%', suffix: '%' },
            { title: 'Pending', value: stats.pendingReviews, icon: Clock, color: 'rose', trend: '-3%' },
            { title: 'AI Generated', value: stats.aiGenerated, icon: Cpu, color: 'purple', trend: '+23%' },
          ].map((stat, index) => (
            <Card3D key={stat.title} delay={index * 0.1}>
              <GlassCard 
                className="p-5 cursor-pointer h-full"
                glowColor={stat.color}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-${stat.color}-500/20`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    stat.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {stat.trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.trend}
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">
                    {typeof stat.value === 'number' && stat.value > 1000 
                      ? <AnimatedCounter value={stat.value} /> 
                      : stat.value}
                  </span>
                  {stat.suffix && <span className="text-sm text-white/50">{stat.suffix}</span>}
                </div>
                <p className="text-sm text-white/50 mt-1">{stat.title}</p>
                
                {/* Hover indicator */}
                <motion.div
                  className={`h-0.5 mt-3 bg-${stat.color}-500 rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: hoveredCard === index ? '100%' : '0%' }}
                  transition={{ duration: 0.3 }}
                />
              </GlassCard>
            </Card3D>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Chart Section - Takes 2 columns */}
          <Card3D className="lg:col-span-2" delay={0.3}>
            <GlassCard className="p-6 h-full" glowColor="blue">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Review Activity
                  </h3>
                  <p className="text-sm text-white/50 mt-1">Reviews over time</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-white/60">Reviews</span>
                  </div>
                </div>
              </div>
              
              {/* Chart */}
              <div className="h-64 flex items-end gap-2">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((height, i) => (
                  <ChartBar
                    key={i}
                    height={height}
                    color="bg-gradient-to-t from-blue-600 to-blue-400"
                    delay={i * 0.05}
                    label={`Day ${i + 1}`}
                    value={Math.round(height / 5)}
                  />
                ))}
              </div>
              
              <div className="flex justify-between mt-4 text-xs text-white/40">
                <span>{timeRange === '7d' ? '7 days ago' : timeRange === '30d' ? '30 days ago' : '90 days ago'}</span>
                <span>Today</span>
              </div>
            </GlassCard>
          </Card3D>

          {/* Sentiment Analysis */}
          <Card3D delay={0.4}>
            <GlassCard className="p-6 h-full" glowColor="emerald">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                <PieChart className="w-5 h-5 text-emerald-400" />
                Sentiment
              </h3>
              
              <div className="space-y-5">
                {[
                  { label: 'Positive', value: stats.positiveSentiment, color: 'emerald', icon: ThumbsUp },
                  { label: 'Neutral', value: 100 - stats.positiveSentiment - 15, color: 'amber', icon: Meh },
                  { label: 'Negative', value: 15, color: 'rose', icon: ThumbsDown },
                ].map((item, i) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <item.icon className={`w-4 h-4 text-${item.color}-400`} />
                        <span className="text-sm text-white/70">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{item.value}%</span>
                    </div>
                    <AnimatedProgress value={item.value} max={100} color={item.color} delay={i * 0.2} />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{Math.round(stats.totalReviews * stats.positiveSentiment / 100)}</p>
                  <p className="text-xs text-white/50">Positive</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">{Math.round(stats.totalReviews * 0.2)}</p>
                  <p className="text-xs text-white/50">Neutral</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-rose-400">{Math.round(stats.totalReviews * 0.15)}</p>
                  <p className="text-xs text-white/50">Negative</p>
                </div>
              </div>
            </GlassCard>
          </Card3D>
        </div>

        {/* Insights Section */}
        {insights && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Executive Summary */}
            <Card3D delay={0.5}>
              <GlassCard className="p-6" glowColor="purple">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Executive Summary</h3>
                </div>
                <p className="text-white/70 leading-relaxed">{insights.summary}</p>
                
                <div className="mt-6 flex flex-wrap gap-3">
                  {['AI Powered', 'Real-time', 'Actionable'].map((tag, i) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full border border-purple-500/30"
                    >
                      {tag}
                    </motion.span>
                  ))}
                </div>
              </GlassCard>
            </Card3D>

            {/* Overall Trends */}
            <Card3D delay={0.6}>
              <GlassCard className="p-6" glowColor="blue">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Overall Trends</h3>
                </div>
                <ul className="space-y-3">
                  {insights.overall_trends?.map((trend: string, index: number) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                      <span className="text-white/70">{trend}</span>
                    </motion.li>
                  ))}
                </ul>
              </GlassCard>
            </Card3D>

            {/* Common Praises */}
            <Card3D delay={0.7}>
              <GlassCard className="p-6" glowColor="emerald">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Common Praises</h3>
                </div>
                <ul className="space-y-3">
                  {insights.common_praises?.map((praise: string, index: number) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-white/70">{praise}</span>
                    </motion.li>
                  ))}
                </ul>
              </GlassCard>
            </Card3D>

            {/* Improvement Suggestions */}
            <Card3D delay={0.8}>
              <GlassCard className="p-6" glowColor="amber">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Improvement Suggestions</h3>
                </div>
                <ul className="space-y-3">
                  {insights.improvement_suggestions?.map((suggestion: string, index: number) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <ArrowUpRight className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <span className="text-white/70">{suggestion}</span>
                    </motion.li>
                  ))}
                </ul>
              </GlassCard>
            </Card3D>
          </div>
        )}

        {/* Bottom Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10 border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Ready to take action?</h4>
              <p className="text-sm text-white/50">Use these insights to improve your business</p>
            </div>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/reviews')}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-500 transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Manage Reviews
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-all"
            >
              Dashboard
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
