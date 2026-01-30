'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { longcatAI } from '@/lib/longcatAI'
import { supabase } from '@/lib/supabase'
import PageTransition from '@/components/transitions/PageTransition'

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch reviews
      const { data: reviewsData } = await (supabase as any)
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      setReviews(reviewsData || [])

      // Generate insights using AI
      if (reviewsData && reviewsData.length > 0) {
        const formattedReviews = reviewsData.slice(0, 20).map((r: any) => ({
          text: r.content,
          rating: r.rating,
          date: r.created_at
        }))

        const aiInsights = await longcatAI.generateInsights(formattedReviews)
        setInsights(aiInsights)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show empty state if no reviews
  if (!loading && (!reviews || reviews.length === 0)) {
    return (
      <PageTransition>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gradient mb-2">Analytics & Insights</h1>
            <p className="text-white/70">AI-powered review analysis and insights</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card border border-primary/20 rounded-xl p-12 text-center"
          >
            <div className="text-6xl mb-6">📊</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Analytics Data Yet</h2>
            <p className="text-white/70 mb-6 max-w-2xl mx-auto">
              Connect your review platforms and start collecting reviews to see detailed AI-powered analytics and insights here.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/connect-platforms"
                className="px-6 py-3 bg-linear-to-r from-primary to-accent text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Connect Platforms
              </a>
              <a
                href="/reviews"
                className="px-6 py-3 glass text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
              >
                Generate Test Review
              </a>
            </div>
          </motion.div>
        </div>
      </div>
      </PageTransition>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Generating AI Insights...</p>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gradient mb-2">Analytics & Insights</h1>
          <p className="text-white/70">AI-powered analysis of customer feedback</p>
        </motion.div>

        {/* Time Range Selector */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-8"
        >
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-all ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'glass text-white/70 hover:text-white'
              }`}
            >
              {range === 'all' ? 'All Time' : `Last ${range.replace('d', ' Days')}`}
            </button>
          ))}
        </motion.div>

        {/* Summary Section */}
        {insights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card border border-primary/20 rounded-xl p-6 mb-6"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">📊 Executive Summary</h2>
            <p className="text-white/80 leading-relaxed">{insights.summary}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Overall Trends */}
          {insights?.overall_trends && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card border border-primary/20 rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span>📈</span> Overall Trends
              </h2>
              <ul className="space-y-3">
                {insights.overall_trends.map((trend: string, index: number) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 text-white/80"
                  >
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>{trend}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Common Praises */}
          {insights?.common_praises && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card border border-emerald-500/20 rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span>🎉</span> Common Praises
              </h2>
              <ul className="space-y-3">
                {insights.common_praises.map((praise: string, index: number) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 text-white/80"
                  >
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span>{praise}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Common Complaints */}
          {insights?.common_complaints && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card border border-red-500/20 rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span>⚠️</span> Common Complaints
              </h2>
              <ul className="space-y-3">
                {insights.common_complaints.map((complaint: string, index: number) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-3 text-white/80"
                  >
                    <span className="text-red-400 mt-1">!</span>
                    <span>{complaint}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Improvement Suggestions */}
          {insights?.improvement_suggestions && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card border border-purple-500/20 rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span>💡</span> Improvement Suggestions
              </h2>
              <ul className="space-y-3">
                {insights.improvement_suggestions.map((suggestion: string, index: number) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-3 text-white/80"
                  >
                    <span className="text-purple-400 mt-1">→</span>
                    <span>{suggestion}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* Refresh Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <button
            onClick={fetchData}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            🔄 Refresh Insights
          </button>
        </motion.div>
      </div>
    </div>
    </PageTransition>
  )
}
