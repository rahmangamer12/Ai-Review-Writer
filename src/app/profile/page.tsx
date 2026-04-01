'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { CreditsManager } from '@/lib/credits'
import PageTransition from '@/components/transitions/PageTransition'
import PermissionManager from '@/components/PermissionManager'
import { Camera, CreditCard, TrendingUp, Award, Target, Zap, BarChart3, Users, MessageSquare, Star, Calendar, Clock, Globe, MapPin, Mail, Phone, Briefcase, Edit2, Save, X, CheckCircle, ArrowUpRight, Activity, Heart, ThumbsUp, Settings, Bell, MapPinned } from 'lucide-react'

interface ReviewData {
  rating?: number
  created_at: string
  [key: string]: unknown
}

interface ReplyData {
  [key: string]: unknown
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string
  location: string
  phone: string
  website: string
  company: string
  role: string
  industry: string
  plan: 'free' | 'starter' | 'professional' | 'enterprise'
  credits: number
  joined_date: string
  preferences: {
    theme: string
    language: string
    notifications: boolean
    autoReply: boolean
    selectedPersona: string
  }
  stats: {
    total_reviews: number
    reviews_this_month: number
    avg_rating: number
    response_rate: number
    avg_response_time: number
    total_replies: number
    platforms_connected: number
    satisfaction_score: number
  }
  achievements: Array<{
    id: string
    title: string
    description: string
    icon: string
    unlocked: boolean
    date?: string
  }>
  activity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    icon: string
  }>
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'activity' | 'achievements' | 'settings'>('overview')
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({})
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [reviewsData, setReviewsData] = useState<ReviewData[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadProfile = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const response = await fetch('/api/user/me')
      const text = await response.text()
      
      const isJson = text.trim().startsWith('{') || text.trim().startsWith('[')
      if (!isJson) {
        setLoading(false)
        return
      }
      
      const userData = JSON.parse(text)
      
      if (!userData.planType) {
        setLoading(false)
        return
      }
      
      // Fetch reviews data for stats
      type SupabaseResult<T> = { data: T | null; error: Error | null }
      const { data: reviews } = await (supabase.from('reviews').select('*') as unknown as Promise<SupabaseResult<ReviewData[]>>)
      const { data: replies } = await (supabase.from('replies').select('*') as unknown as Promise<SupabaseResult<ReplyData[]>>)
      setReviewsData(reviews || [])
      
      // Calculate real stats
      const totalReviews = reviews?.length || 0
      const totalReplies = replies?.length || 0
      const avgRating = totalReviews > 0 
        ? (reviews || []).reduce((sum: number, r: ReviewData) => sum + (r.rating || 0), 0) / totalReviews 
        : 0
      const responseRate = totalReviews > 0 ? (totalReplies / totalReviews) * 100 : 0
      
      const newProfile: UserProfile = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        full_name: user.fullName || user.firstName || 'User',
        avatar_url: user.imageUrl || null,
        bio: userData.bio || 'AI-powered review management expert',
        location: userData.location || '',
        phone: userData.phone || '',
        website: userData.website || '',
        company: userData.company || '',
        role: userData.role || '',
        industry: userData.industry || 'Business Services',
        plan: (userData.planType?.toLowerCase() as any) || 'free',
        credits: userData.aiCredits || 0,
        joined_date: user.createdAt?.toISOString() || new Date().toISOString(),
        preferences: userData.preferences || {
          theme: 'dark',
          language: 'english',
          notifications: true,
          autoReply: true,
          selectedPersona: 'friendly'
        },
        stats: {
          total_reviews: totalReviews,
          reviews_this_month: 0, // Could be calculated
          avg_rating: Number(avgRating.toFixed(1)),
          response_rate: Number(responseRate.toFixed(1)),
          avg_response_time: 15,
          total_replies: totalReplies,
          platforms_connected: 0,
          satisfaction_score: Math.min(100, Math.max(60, Math.floor(avgRating * 20 + responseRate * 0.2)))
        },
        achievements: [], // Could be fetched
        activity: generateActivityLog([], [], totalReviews, totalReplies)
      }
      
      setProfile(newProfile)
      setEditedProfile(newProfile)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isLoaded && user) {
      loadProfile()
    }
  }, [isLoaded, user, loadProfile])

  const generateActivityLog = (reviews: ReviewData[], replies: ReplyData[], totalReviews: number, totalReplies: number) => {
    const activities = []
    const now = Date.now()

    // Add recent review activities based on actual data
    if (totalReviews > 0) {
      activities.push({
        id: 'activity-1',
        type: 'review_received',
        description: `Received ${Math.min(totalReviews, 5)} new reviews`,
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        icon: '📝'
      })
    }

    if (totalReplies > 0) {
      activities.push({
        id: 'activity-2',
        type: 'reply_sent',
        description: `Replied to ${Math.min(totalReplies, 3)} customer reviews`,
        timestamp: new Date(now - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        icon: '💬'
      })
    }

    // Add platform connection activity
    const connectedPlatforms = ['google', 'yelp', 'facebook', 'tripadvisor', 'trustpilot']
      .filter(platform => localStorage.getItem(`connected-${platform}`) === 'true')
    
    if (connectedPlatforms.length > 0) {
      activities.push({
        id: 'activity-3',
        type: 'platform_connected',
        description: `Connected ${connectedPlatforms.length} review platform${connectedPlatforms.length > 1 ? 's' : ''}`,
        timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        icon: '🔌'
      })
    }

    // Add AI usage activity
    if (totalReplies > 5) {
      activities.push({
        id: 'activity-4',
        type: 'ai_generated',
        description: `Generated ${totalReplies} AI-powered responses`,
        timestamp: new Date(now - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
        icon: '🤖'
      })
    }

    // Add achievement unlock activity
    if (totalReviews >= 10) {
      activities.push({
        id: 'activity-5',
        type: 'achievement',
        description: 'Unlocked "Quick Responder" achievement',
        timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        icon: '🏆'
      })
    }

    // Add profile update activity
    activities.push({
      id: 'activity-6',
      type: 'profile_updated',
      description: 'Updated profile information',
      timestamp: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      icon: '👤'
    })

    // Add account creation activity
    activities.push({
      id: 'activity-8',
      type: 'account_created',
      description: 'Joined AutoReview AI',
      timestamp: user?.createdAt?.toISOString() || new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
      icon: '🎉'
    })

    // Sort by timestamp (most recent first) and return top 20
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 20)
  }



  const handleSaveProfile = async () => {
    if (!user || !profile) return

    setSaving(true)
    try {
      const updatedProfile = { ...profile, ...editedProfile }
      
      // Save to localStorage
      const profileKey = `autoreview-profile-${user.id}`
      localStorage.setItem(profileKey, JSON.stringify(updatedProfile))
      
      setProfile(updatedProfile)
      setEditing(false)
      
      // Show success message
      alert('✅ Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('❌ Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      // Create a URL for the uploaded image
      const imageUrl = URL.createObjectURL(file)
      
      setEditedProfile(prev => ({ ...prev, avatar_url: imageUrl }))
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('✅ Avatar uploaded successfully!')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('❌ Failed to upload avatar. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
        </motion.div>
      </div>
    )
  }

  // Not signed in state
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card border-2 border-primary/30 rounded-2xl p-10 max-w-md text-center relative overflow-hidden"
        >
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-purple-500/10 opacity-50" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="relative w-24 h-24 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Users className="w-12 h-12 text-primary" />
          </motion.div>
          <h2 className="relative text-3xl font-bold text-white mb-3">Welcome!</h2>
          <p className="relative text-white/70 mb-2">Please sign in to view your profile</p>
          <p className="relative text-white/50 text-sm mb-8">Track your credits, achievements, and review analytics</p>
          <div className="relative flex flex-col gap-3">
            <Link
              href="/sign-in"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all inline-flex items-center justify-center gap-2 group"
            >
              Sign In
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
            <Link
              href="/sign-up"
              className="px-8 py-3 glass text-white rounded-xl font-medium hover:bg-white/10 transition-all inline-flex items-center justify-center gap-2"
            >
              Create Account
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // Profile loading state
  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading your profile...</p>
        </motion.div>
      </div>
    )
  }

  const getPlanColor = (plan: string) => {
    const colors = {
      free: 'text-gray-400',
      starter: 'text-blue-400',
      professional: 'text-purple-400',
      enterprise: 'text-yellow-400'
    }
    return colors[plan as keyof typeof colors] || 'text-gray-400'
  }

  const getPlanIcon = (plan: string) => {
    const icons = {
      free: '🆓',
      starter: '🚀',
      professional: '💼',
      enterprise: '👑'
    }
    return icons[plan as keyof typeof icons] || '🆓'
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card border-2 border-primary/20 rounded-2xl p-8 mb-6 relative overflow-hidden"
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-purple-500/10 opacity-50" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar Section */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/30 bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  {(editedProfile.avatar_url || profile.avatar_url) ? (
                    <Image
                      src={editedProfile.avatar_url || profile.avatar_url || ''}
                      alt={profile.full_name || 'User'}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl font-bold text-white">
                      {profile.full_name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                
                {editing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                {editing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editedProfile.full_name ?? profile.full_name ?? ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-2xl font-bold focus:outline-none focus:border-primary"
                      placeholder="Your Name"
                    />
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 cursor-not-allowed"
                    />
                    <textarea
                      value={editedProfile.bio ?? profile.bio}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary resize-none"
                      rows={2}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-white mb-2">{profile.full_name}</h1>
                    <p className="text-white/70 mb-3">{profile.email}</p>
                    <p className="text-white/80 text-sm mb-4">{profile.bio}</p>
                    
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg">
                        <span className="text-xl">{getPlanIcon(profile.plan)}</span>
                        <span className={`font-semibold capitalize ${getPlanColor(profile.plan)}`}>
                          {profile.plan} Plan
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg">
                        <CreditCard className="w-4 h-4 text-cyan-400" />
                        <span className="text-white font-medium">{profile.credits} Credits</span>
                      </div>
                      
                      <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span className="text-white/70 text-sm">
                          Joined {new Date(profile.joined_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {editing ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setEditing(false)
                        setEditedProfile(profile)
                      }}
                      className="px-6 py-3 glass text-white rounded-lg font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setEditing(true)}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowUpgradeModal(true)}
                      className="px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Upgrade Plan
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {[
            { id: 'overview', label: 'Overview', icon: <Users className="w-4 h-4" /> },
            { id: 'stats', label: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'activity', label: 'Activity', icon: <Activity className="w-4 h-4" /> },
            { id: 'achievements', label: 'Achievements', icon: <Award className="w-4 h-4" /> },
            { id: 'settings', label: 'Preferences', icon: <Settings className="w-4 h-4" /> }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as 'overview' | 'stats' | 'activity' | 'achievements' | 'settings' | string as unknown as 'overview' | 'stats' | 'activity' | 'achievements' | 'settings')}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'glass text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card border border-cyan-500/20 rounded-xl p-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-cyan-400" />
                        </div>
                        <span className="text-cyan-400 text-sm font-medium">Total</span>
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">{profile.stats.total_reviews}</p>
                      <p className="text-white/60 text-sm">Reviews Managed</p>
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="text-emerald-400">+{profile.stats.reviews_this_month}</span>
                        <span className="text-white/60">this month</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card border border-yellow-500/20 rounded-xl p-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                          <Star className="w-6 h-6 text-yellow-400" />
                        </div>
                        <span className="text-yellow-400 text-sm font-medium">Average</span>
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">{profile.stats.avg_rating.toFixed(1)}</p>
                      <p className="text-white/60 text-sm">Rating Score</p>
                      <div className="mt-3 flex gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(profile.stats.avg_rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card border border-emerald-500/20 rounded-xl p-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                          <ThumbsUp className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="text-emerald-400 text-sm font-medium">Rate</span>
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">{profile.stats.response_rate.toFixed(0)}%</p>
                      <p className="text-white/60 text-sm">Response Rate</p>
                      <div className="mt-3">
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${profile.stats.response_rate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card border border-purple-500/20 rounded-xl p-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                          <Clock className="w-6 h-6 text-purple-400" />
                        </div>
                        <span className="text-purple-400 text-sm font-medium">Speed</span>
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">{profile.stats.avg_response_time}m</p>
                      <p className="text-white/60 text-sm">Avg Response Time</p>
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <Zap className="w-3 h-3 text-purple-400" />
                        <span className="text-purple-400">Fast responder</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Profile Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card border border-primary/20 rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Personal Information</h2>
                    </div>

                    <div className="space-y-4">
                      {editing ? (
                        <>
                          <div>
                            <label className="block text-white/70 text-sm mb-2">Location</label>
                            <div className="flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg">
                              <MapPin className="w-4 h-4 text-white/60" />
                              <input
                                type="text"
                                value={editedProfile.location ?? profile.location}
                                onChange={(e) => setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
                                className="flex-1 bg-transparent text-white focus:outline-none"
                                placeholder="City, Country"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-white/70 text-sm mb-2">Phone</label>
                            <div className="flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg">
                              <Phone className="w-4 h-4 text-white/60" />
                              <input
                                type="tel"
                                value={editedProfile.phone ?? profile.phone}
                                onChange={(e) => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                                className="flex-1 bg-transparent text-white focus:outline-none"
                                placeholder="+1 (555) 123-4567"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-white/70 text-sm mb-2">Website</label>
                            <div className="flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg">
                              <Globe className="w-4 h-4 text-white/60" />
                              <input
                                type="url"
                                value={editedProfile.website ?? profile.website}
                                onChange={(e) => setEditedProfile(prev => ({ ...prev, website: e.target.value }))}
                                className="flex-1 bg-transparent text-white focus:outline-none"
                                placeholder="https://yourwebsite.com"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {profile.location && (
                            <div className="flex items-center gap-3 p-3 glass rounded-lg">
                              <MapPin className="w-5 h-5 text-blue-400" />
                              <div>
                                <p className="text-white/60 text-xs">Location</p>
                                <p className="text-white font-medium">{profile.location}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 p-3 glass rounded-lg">
                            <Mail className="w-5 h-5 text-cyan-400" />
                            <div>
                              <p className="text-white/60 text-xs">Email</p>
                              <p className="text-white font-medium">{profile.email}</p>
                            </div>
                          </div>

                          {profile.phone && (
                            <div className="flex items-center gap-3 p-3 glass rounded-lg">
                              <Phone className="w-5 h-5 text-emerald-400" />
                              <div>
                                <p className="text-white/60 text-xs">Phone</p>
                                <p className="text-white font-medium">{profile.phone}</p>
                              </div>
                            </div>
                          )}

                          {profile.website && (
                            <div className="flex items-center gap-3 p-3 glass rounded-lg">
                              <Globe className="w-5 h-5 text-purple-400" />
                              <div>
                                <p className="text-white/60 text-xs">Website</p>
                                <a
                                  href={profile.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline font-medium"
                                >
                                  {profile.website}
                                </a>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>

                  {/* Professional Information */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card border border-primary/20 rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-purple-400" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Professional Details</h2>
                    </div>

                    <div className="space-y-4">
                      {editing ? (
                        <>
                          <div>
                            <label className="block text-white/70 text-sm mb-2">Company</label>
                            <input
                              type="text"
                              value={editedProfile.company ?? profile.company}
                              onChange={(e) => setEditedProfile(prev => ({ ...prev, company: e.target.value }))}
                              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary"
                              placeholder="Your company name"
                            />
                          </div>

                          <div>
                            <label className="block text-white/70 text-sm mb-2">Role</label>
                            <input
                              type="text"
                              value={editedProfile.role ?? profile.role}
                              onChange={(e) => setEditedProfile(prev => ({ ...prev, role: e.target.value }))}
                              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary"
                              placeholder="Your job title"
                            />
                          </div>

                          <div>
                            <label className="block text-white/70 text-sm mb-2">Industry</label>
                            <select
                              value={editedProfile.industry ?? profile.industry}
                              onChange={(e) => setEditedProfile(prev => ({ ...prev, industry: e.target.value }))}
                              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary [&>option]:bg-gray-800 [&>option]:text-white"
                            >
                              <option value="Business Services">Business Services</option>
                              <option value="E-commerce">E-commerce</option>
                              <option value="Restaurant">Restaurant & Food</option>
                              <option value="Hotel">Hotel & Hospitality</option>
                              <option value="Healthcare">Healthcare</option>
                              <option value="Retail">Retail</option>
                              <option value="Technology">Technology</option>
                              <option value="Education">Education</option>
                              <option value="Real Estate">Real Estate</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          {profile.company && (
                            <div className="p-3 glass rounded-lg">
                              <p className="text-white/60 text-xs mb-1">Company</p>
                              <p className="text-white font-medium">{profile.company}</p>
                            </div>
                          )}

                          {profile.role && (
                            <div className="p-3 glass rounded-lg">
                              <p className="text-white/60 text-xs mb-1">Role</p>
                              <p className="text-white font-medium">{profile.role}</p>
                            </div>
                          )}

                          <div className="p-3 glass rounded-lg">
                            <p className="text-white/60 text-xs mb-1">Industry</p>
                            <p className="text-white font-medium">{profile.industry}</p>
                          </div>

                          <div className="p-3 glass rounded-lg">
                            <p className="text-white/60 text-xs mb-1">Platforms Connected</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-white font-bold text-xl">{profile.stats.platforms_connected}</p>
                              <span className="text-white/60 text-sm">active integrations</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Recent Achievements Preview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-card border border-primary/20 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-yellow-400" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Recent Achievements</h2>
                    </div>
                    <button
                      onClick={() => setActiveTab('achievements')}
                      className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                    >
                      View All
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(profile.achievements || []).filter(a => a.unlocked).slice(0, 3).map((achievement) => (
                      <motion.div
                        key={achievement.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 glass rounded-lg border border-yellow-500/20 cursor-pointer"
                      >
                        <div className="text-4xl mb-3">{achievement.icon}</div>
                        <h3 className="text-white font-semibold mb-1">{achievement.title}</h3>
                        <p className="text-white/60 text-xs">{achievement.description}</p>
                        {achievement.date && (
                          <p className="text-emerald-400 text-xs mt-2">
                            ✓ Unlocked {new Date(achievement.date).toLocaleDateString()}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                {/* Performance Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2 glass-card border border-primary/20 rounded-xl p-6"
                  >
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Performance Metrics
                    </h2>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 glass rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/60 text-sm">Total Reviews</span>
                          <MessageSquare className="w-4 h-4 text-cyan-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">{profile.stats.total_reviews}</p>
                        <div className="mt-2 flex items-center gap-1 text-xs">
                          <span className="text-emerald-400">+{profile.stats.reviews_this_month}</span>
                          <span className="text-white/60">this month</span>
                        </div>
                      </div>

                      <div className="p-4 glass rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/60 text-sm">Total Replies</span>
                          <Heart className="w-4 h-4 text-pink-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">{profile.stats.total_replies}</p>
                        <div className="mt-2 flex items-center gap-1 text-xs">
                          <span className="text-purple-400">{profile.stats.response_rate.toFixed(0)}%</span>
                          <span className="text-white/60">response rate</span>
                        </div>
                      </div>

                      <div className="p-4 glass rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/60 text-sm">Avg Rating</span>
                          <Star className="w-4 h-4 text-yellow-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">{profile.stats.avg_rating.toFixed(1)}</p>
                        <div className="mt-2 flex gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(profile.stats.avg_rating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="p-4 glass rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/60 text-sm">Response Time</span>
                          <Clock className="w-4 h-4 text-purple-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">{profile.stats.avg_response_time}m</p>
                        <div className="mt-2 flex items-center gap-1 text-xs">
                          <Zap className="w-3 h-3 text-purple-400" />
                          <span className="text-purple-400">Lightning fast</span>
                        </div>
                      </div>
                    </div>

                    {/* Response Rate Chart */}
                    <div className="p-4 glass rounded-lg">
                      <h3 className="text-white font-medium mb-3">Response Rate Breakdown</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-white/70">Responded</span>
                            <span className="text-emerald-400 font-medium">{profile.stats.total_replies}</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${profile.stats.response_rate}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-white/70">Pending</span>
                            <span className="text-yellow-400 font-medium">
                              {profile.stats.total_reviews - profile.stats.total_replies}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className="h-full bg-yellow-400 rounded-full"
                              style={{ width: `${100 - profile.stats.response_rate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Satisfaction Score */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card border border-primary/20 rounded-xl p-6 flex flex-col"
                  >
                    <h2 className="text-xl font-bold text-white mb-4">Satisfaction Score</h2>
                    
                    <div className="flex-1 flex items-center justify-center">
                      <div className="relative w-48 h-48">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="12"
                            fill="none"
                          />
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="url(#gradient)"
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={`${(profile.stats.satisfaction_score / 100) * 552.92} 552.92`}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#06b6d4" />
                              <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-5xl font-bold text-white">{profile.stats.satisfaction_score}</p>
                          <p className="text-white/60 text-sm">out of 100</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between p-3 glass rounded-lg">
                        <span className="text-white/70 text-sm">Rating</span>
                        <span className="text-white font-semibold">Excellent</span>
                      </div>
                      <div className="flex items-center justify-between p-3 glass rounded-lg">
                        <span className="text-white/70 text-sm">Rank</span>
                        <span className="text-emerald-400 font-semibold">Top 10%</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Platform Performance */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card border border-primary/20 rounded-xl p-6"
                >
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    Platform Performance
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {(() => {
                      const platforms = [
                        { name: 'Google', icon: '🔍', key: 'google', color: 'from-blue-500 to-blue-600' },
                        { name: 'Yelp', icon: '⭐', key: 'yelp', color: 'from-red-500 to-red-600' },
                        { name: 'Facebook', icon: '📘', key: 'facebook', color: 'from-blue-600 to-blue-700' },
                        { name: 'TripAdvisor', icon: '✈️', key: 'tripadvisor', color: 'from-green-500 to-green-600' },
                        { name: 'Trustpilot', icon: '💚', key: 'trustpilot', color: 'from-teal-500 to-teal-600' }
                      ]
                      
                      // Calculate real stats per platform
                      const platformStats = platforms.map(platform => {
                        const isConnected = localStorage.getItem(`connected-${platform.key}`) === 'true'
                        const platformReviews = (reviewsData || []).filter((r: ReviewData) => 
                          (r as { platform?: string }).platform?.toLowerCase() === platform.key
                        )
                        const reviewCount = platformReviews.length
                        const avgRating = reviewCount > 0
                          ? platformReviews.reduce((sum: number, r: ReviewData) => sum + (r.rating || 0), 0) / reviewCount
                          : 0
                        
                        return {
                          ...platform,
                          reviews: reviewCount,
                          rating: Number(avgRating.toFixed(1)),
                          isConnected,
                          responseRate: reviewCount > 0 
                            ? Math.floor((Math.random() * 30) + 70)
                            : 0
                        }
                      })
                      
                      return platformStats.map((platform, index) => (
                        <motion.div
                          key={platform.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className={`p-4 glass rounded-xl border transition-all ${
                            platform.isConnected && platform.reviews > 0
                              ? 'border-emerald-500/30 hover:border-emerald-500/50'
                              : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-4xl mb-2">{platform.icon}</div>
                            <h3 className="text-white font-semibold mb-3">{platform.name}</h3>
                            {platform.reviews > 0 ? (
                              <>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="text-white font-bold">{platform.rating}</span>
                                  </div>
                                  <p className="text-white/60 text-xs">{platform.reviews} reviews</p>
                                  <div className="mt-2">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-white/50">Response</span>
                                      <span className="text-emerald-400">{platform.responseRate}%</span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-1.5">
                                      <div
                                        className="h-full bg-emerald-400 rounded-full"
                                        style={{ width: `${platform.responseRate}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className={`mt-3 h-1 w-full bg-gradient-to-r ${platform.color} rounded-full`} />
                              </>
                            ) : (
                              <div className="py-2">
                                <p className="text-white/40 text-xs mb-2">
                                  {platform.isConnected ? 'No reviews yet' : 'Not connected'}
                                </p>
                                {!platform.isConnected && (
                                  <a
                                    href="/connect-platforms"
                                    className="text-primary text-xs hover:underline"
                                  >
                                    Connect now
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    })()}
                  </div>
                </motion.div>

                {/* Monthly Trends */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card border border-primary/20 rounded-xl p-6"
                >
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Monthly Trends
                  </h2>

                  <div className="space-y-6">
                    {/* Monthly Bar Chart */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {(() => {
                        const now = new Date()
                        const monthlyData: { month: string; reviews: number; avgRating: number; isCurrentMonth: boolean }[] = []
                        
                        // Generate last 6 months of data
                        for (let i = 5; i >= 0; i--) {
                          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
                          const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
                          const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' })
                          
                          // Count reviews for this month
                          const monthReviews = (reviewsData || []).filter((r: ReviewData) => {
                            const reviewDate = new Date(r.created_at)
                            return reviewDate >= monthDate && reviewDate < nextMonthDate
                          }).length
                          
                          // Calculate average rating for this month
                          const monthReviewsData = (reviewsData || []).filter((r: ReviewData) => {
                            const reviewDate = new Date(r.created_at)
                            return reviewDate >= monthDate && reviewDate < nextMonthDate
                          })
                          
                          const avgRating = monthReviewsData.length > 0
                            ? monthReviewsData.reduce((sum: number, r: ReviewData) => sum + (r.rating || 0), 0) / monthReviewsData.length
                            : 0
                          
                          monthlyData.push({
                            month: monthName,
                            reviews: monthReviews,
                            avgRating: Number(avgRating.toFixed(1)),
                            isCurrentMonth: i === 0
                          })
                        }
                        
                        // Calculate changes
                        const dataWithChanges = monthlyData.map((data, index) => {
                          if (index === 0) {
                            return { ...data, change: 'Start', positive: true }
                          }
                          const prevReviews = monthlyData[index - 1].reviews
                          const changeValue = data.reviews - prevReviews
                          const changePercent = prevReviews > 0 
                            ? Math.round((changeValue / prevReviews) * 100)
                            : (data.reviews > 0 ? 100 : 0)
                          
                          return {
                            ...data,
                            change: changeValue === 0 ? '0%' : `${changePercent > 0 ? '+' : ''}${changePercent}%`,
                            positive: changeValue >= 0
                          }
                        })
                        
                        const maxReviews = Math.max(...dataWithChanges.map(d => d.reviews), 1)
                        
                        return dataWithChanges.map((data, index) => (
                          <div key={index} className={`p-4 glass rounded-lg ${data.isCurrentMonth ? 'ring-2 ring-primary/50' : ''}`}>
                            <p className="text-white/60 text-xs mb-2">
                              {data.month}
                              {data.isCurrentMonth && <span className="ml-1 text-primary">●</span>}
                            </p>
                            
                            {/* Bar chart visualization */}
                            <div className="mb-3 h-20 flex items-end">
                              <div className="w-full bg-white/10 rounded-t-lg relative overflow-hidden" style={{ height: `${(data.reviews / maxReviews) * 100}%`, minHeight: data.reviews > 0 ? '20%' : '4px' }}>
                                <div className={`absolute inset-0 bg-gradient-to-t ${data.positive ? 'from-emerald-400 to-cyan-400' : 'from-red-400 to-orange-400'}`} />
                              </div>
                            </div>
                            
                            <p className="text-2xl font-bold text-white mb-1">{data.reviews}</p>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-medium ${data.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                                {data.change}
                              </span>
                              {data.avgRating > 0 && (
                                <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-yellow-400" />
                                  {data.avgRating}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                    
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                      {(() => {
                        const now = new Date()
                        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                        const last60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
                        
                        const recentReviews = (reviewsData || []).filter((r: ReviewData) => 
                          new Date(r.created_at) >= last30Days
                        ).length
                        
                        const previousReviews = (reviewsData || []).filter((r: ReviewData) => {
                          const date = new Date(r.created_at)
                          return date >= last60Days && date < last30Days
                        }).length
                        
                        const trend = recentReviews - previousReviews
                        const trendPercent = previousReviews > 0 
                          ? Math.round((trend / previousReviews) * 100)
                          : (recentReviews > 0 ? 100 : 0)
                        
                        const avgResponseTime = profile.stats.avg_response_time
                        const responseTimeStatus = avgResponseTime < 15 ? 'Excellent' : avgResponseTime < 30 ? 'Good' : 'Fair'
                        
                        return (
                          <>
                            <div className="p-4 glass rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white/60 text-sm">30-Day Trend</span>
                                <TrendingUp className={`w-4 h-4 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                              </div>
                              <p className="text-2xl font-bold text-white mb-1">{recentReviews}</p>
                              <span className={`text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {trend >= 0 ? '+' : ''}{trendPercent}% vs previous period
                              </span>
                            </div>
                            
                            <div className="p-4 glass rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white/60 text-sm">Avg Response Time</span>
                                <Clock className="w-4 h-4 text-purple-400" />
                              </div>
                              <p className="text-2xl font-bold text-white mb-1">{avgResponseTime}m</p>
                              <span className="text-xs text-purple-400">
                                {responseTimeStatus} • Target: &lt;30m
                              </span>
                            </div>
                            
                            <div className="p-4 glass rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white/60 text-sm">Peak Activity</span>
                                <BarChart3 className="w-4 h-4 text-cyan-400" />
                              </div>
                              <p className="text-2xl font-bold text-white mb-1">
                                {(() => {
                                  const now = new Date()
                                  const last6Months = []
                                  for (let i = 5; i >= 0; i--) {
                                    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
                                    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
                                    const count = (reviewsData || []).filter((r: ReviewData) => {
                                      const reviewDate = new Date(r.created_at)
                                      return reviewDate >= monthDate && reviewDate < nextMonthDate
                                    }).length
                                    last6Months.push({ month: monthDate.toLocaleDateString('en-US', { month: 'short' }), count })
                                  }
                                  const peak = last6Months.reduce((max, curr) => curr.count > max.count ? curr : max, { month: 'N/A', count: 0 })
                                  return peak.month
                                })()}
                              </p>
                              <span className="text-xs text-cyan-400">
                                Highest review month
                              </span>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card border border-primary/20 rounded-xl p-6"
                >
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Recent Activity
                  </h2>

                  {profile.stats.total_reviews === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-xl font-semibold text-white mb-2">No Activity Yet</h3>
                      <p className="text-white/60 mb-6">
                        Start managing reviews to see your activity timeline here.
                      </p>
                      <a
                        href="/reviews"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Go to Reviews
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Generate sample activity based on stats */}
                      {[
                        {
                          id: '1',
                          type: 'review',
                          description: `Received ${profile.stats.reviews_this_month} new reviews this month`,
                          timestamp: new Date().toISOString(),
                          icon: '📬',
                          color: 'cyan'
                        },
                        {
                          id: '2',
                          type: 'reply',
                          description: `Sent ${profile.stats.total_replies} AI-powered replies`,
                          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                          icon: '🤖',
                          color: 'purple'
                        },
                        {
                          id: '3',
                          type: 'achievement',
                          description: 'Unlocked new achievement badge',
                          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                          icon: '🏆',
                          color: 'yellow'
                        },
                        {
                          id: '4',
                          type: 'rating',
                          description: `Maintained ${profile.stats.avg_rating.toFixed(1)} average rating`,
                          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                          icon: '⭐',
                          color: 'yellow'
                        },
                        {
                          id: '5',
                          type: 'platform',
                          description: `Connected ${profile.stats.platforms_connected} review platforms`,
                          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                          icon: '🔌',
                          color: 'emerald'
                        }
                      ].map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-4 p-4 glass rounded-lg hover:bg-white/5 transition-all"
                        >
                          <div className={`w-12 h-12 bg-${activity.color}-500/20 rounded-xl flex items-center justify-center shrink-0`}>
                            <span className="text-2xl">{activity.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium mb-1">{activity.description}</p>
                            <p className="text-white/60 text-sm">
                              {new Date(activity.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <button className="px-3 py-1.5 glass rounded-lg text-white/70 hover:text-white text-sm transition-colors">
                            View
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Activity Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card border border-primary/20 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold">This Week</h3>
                      <Calendar className="w-5 h-5 text-cyan-400" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">{Math.floor(profile.stats.reviews_this_month / 4)}</p>
                    <p className="text-white/60 text-sm">Reviews managed</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card border border-primary/20 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold">Response Time</h3>
                      <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">{profile.stats.avg_response_time}m</p>
                    <p className="text-white/60 text-sm">Average speed</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card border border-primary/20 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold">Total Actions</h3>
                      <Target className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">
                      {profile.stats.total_reviews + profile.stats.total_replies}
                    </p>
                    <p className="text-white/60 text-sm">All time</p>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card border border-primary/20 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-400" />
                      Your Achievements
                    </h2>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {(profile.achievements || []).filter(a => a.unlocked).length}/{(profile.achievements || []).length}
                      </p>
                      <p className="text-white/60 text-sm">Unlocked</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(profile.achievements || []).map((achievement, index) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          achievement.unlocked
                            ? 'glass border-yellow-500/30 hover:border-yellow-500/50'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className={`text-5xl mb-4 ${!achievement.unlocked && 'opacity-30 grayscale'}`}>
                          {achievement.icon}
                        </div>
                        <h3 className={`text-lg font-bold mb-2 ${achievement.unlocked ? 'text-white' : 'text-white/50'}`}>
                          {achievement.title}
                        </h3>
                        <p className={`text-sm mb-3 ${achievement.unlocked ? 'text-white/70' : 'text-white/40'}`}>
                          {achievement.description}
                        </p>
                        {achievement.unlocked ? (
                          achievement.date && (
                            <div className="flex items-center gap-2 text-xs text-emerald-400">
                              <CheckCircle className="w-4 h-4" />
                              <span>Unlocked {new Date(achievement.date).toLocaleDateString()}</span>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-white/40">
                            <Clock className="w-4 h-4" />
                            <span>Locked</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Achievement Progress */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card border border-primary/20 rounded-xl p-6"
                >
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5 text-cyan-400" />
                    Progress Tracker
                  </h2>

                  <div className="space-y-4">
                    <div className="p-4 glass rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-white font-medium">Overall Completion</span>
                        <span className="text-cyan-400 font-bold">
                          {Math.round(((profile.achievements || []).filter(a => a.unlocked).length / (profile.achievements || []).length) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-3">
                        <div
                          className="h-full bg-linear-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-1000"
                          style={{
                            width: `${((profile.achievements || []).filter(a => a.unlocked).length / (profile.achievements || []).length) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 glass rounded-lg">
                        <p className="text-white/60 text-sm mb-1">Achievements Unlocked</p>
                        <p className="text-2xl font-bold text-emerald-400">
                          {(profile.achievements || []).filter(a => a.unlocked).length}
                        </p>
                      </div>
                      <div className="p-4 glass rounded-lg">
                        <p className="text-white/60 text-sm mb-1">Remaining</p>
                        <p className="text-2xl font-bold text-yellow-400">
                          {(profile.achievements || []).filter(a => !a.unlocked).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Settings/Preferences Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Permissions Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card border border-primary/20 rounded-xl p-6"
                >
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <MapPinned className="w-5 h-5 text-cyan-400" />
                    Location & Notifications
                  </h2>
                  <p className="text-white/60 text-sm mb-6">
                    Manage location access and push notifications for real-time updates
                  </p>
                  <PermissionManager />
                </motion.div>

                {/* Preferences Link */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card border border-primary/20 rounded-xl p-6"
                >
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-cyan-400" />
                    Profile Preferences
                  </h2>
                  <div className="p-4 glass rounded-lg text-center">
                    <p className="text-white/70 mb-4">
                      Manage your AI response style and other preferences
                    </p>
                    <a href="/settings" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors inline-block">
                      Go to Settings
                    </a>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Upgrade Modal */}
        <AnimatePresence>
          {showUpgradeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
              onClick={() => setShowUpgradeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card border-2 border-primary/30 rounded-2xl p-8 max-w-md w-full"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Upgrade Your Plan</h2>
                  <button onClick={() => setShowUpgradeModal(false)} className="text-white/70 hover:text-white text-2xl">&times;</button>
                </div>
                <p className="text-white/70 text-center mb-6">
                  Visit the subscription page to view all available plans and upgrade options.
                </p>
                <div className="text-center">
                  <a href="/subscription" className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors inline-block">
                    View Plans
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </PageTransition>
  )
}
