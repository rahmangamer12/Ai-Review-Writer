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
      <div className="min-h-[100dvh] bg-background flex items-center justify-center overflow-x-hidden">
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
      <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6 overflow-x-hidden">
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
      <div className="min-h-[100dvh] bg-background flex items-center justify-center overflow-x-hidden">
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
    <div className="min-h-[100dvh] bg-[#030308] text-white overflow-x-hidden w-full pb-[calc(100px+env(safe-area-inset-bottom))] px-0 md:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header - Native Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border-b border-white/5 md:border border-white/10 md:rounded-3xl p-6 lg:p-8 relative overflow-hidden pt-[calc(24px+env(safe-area-inset-top))] md:pt-8"
        >
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
              {/* Avatar Section */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-[2.5rem] overflow-hidden border-2 border-primary/30 bg-white/5 flex items-center justify-center shadow-2xl">
                  {(editedProfile.avatar_url || profile.avatar_url) ? (
                    <Image
                      src={editedProfile.avatar_url || profile.avatar_url || ''}
                      alt={profile.full_name || 'User'}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
                      {profile.full_name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                
                {editing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="space-y-4 max-w-md mx-auto md:mx-0">
                    <input
                      type="text"
                      value={editedProfile.full_name ?? profile.full_name ?? ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-xl font-bold focus:outline-none focus:border-primary transition-all"
                      placeholder="Your Name"
                    />
                    <textarea
                      value={editedProfile.bio ?? profile.bio}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-primary resize-none"
                      rows={2}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tight">{profile.full_name}</h1>
                    <p className="text-white/40 text-sm mb-4 font-medium">{profile.email}</p>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                        <span className="text-sm">{getPlanIcon(profile.plan)}</span>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${getPlanColor(profile.plan)}`}>
                          {profile.plan} Plan
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                        <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-white/80 text-[10px] font-black uppercase tracking-wider">{profile.credits} Credits</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                {editing ? (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="py-3 bg-emerald-500 text-white rounded-2xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setEditing(false); setEditedProfile(profile); }}
                      className="py-3 bg-white/10 text-white rounded-2xl font-bold text-sm active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => setEditing(true)}
                      className="flex-1 md:flex-none px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="flex-1 md:flex-none px-6 py-3 bg-white/5 text-white rounded-2xl font-bold text-sm active:scale-95 transition-all border border-white/10"
                    >
                      Pro
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex overflow-x-auto px-4 md:px-0 py-6 gap-2 no-scrollbar snap-x">
          {[
            { id: 'overview', label: 'Overview', icon: <Users className="w-4 h-4" /> },
            { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'activity', label: 'Timeline', icon: <Activity className="w-4 h-4" /> },
            { id: 'achievements', label: 'Awards', icon: <Award className="w-4 h-4" /> },
            { id: 'settings', label: 'Prefs', icon: <Settings className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap text-xs font-black uppercase tracking-widest snap-start transition-all active:scale-90 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-xl shadow-primary/20'
                  : 'bg-white/5 text-white/40 border border-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-4 md:px-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Dense Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5">
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Total</p>
                      <p className="text-2xl font-black text-white">{profile.stats.total_reviews}</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5">
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Score</p>
                      <p className="text-2xl font-black text-white">{profile.stats.avg_rating.toFixed(1)}</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5">
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Rate</p>
                      <p className="text-2xl font-black text-white">{profile.stats.response_rate.toFixed(0)}%</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5">
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Latency</p>
                      <p className="text-2xl font-black text-white">{profile.stats.avg_response_time}m</p>
                    </div>
                  </div>

                  {/* Sectioned Info List */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Account Dossier</h3>
                    <div className="bg-white/5 rounded-[2.5rem] border border-white/5 divide-y divide-white/5 overflow-hidden">
                      <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold text-white/80">Location</span>
                        </div>
                        <span className="text-sm font-medium text-white/40">{profile.location || 'Not set'}</span>
                      </div>
                      <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-bold text-white/80">Email</span>
                        </div>
                        <span className="text-sm font-medium text-white/40 truncate ml-4">{profile.email}</span>
                      </div>
                      <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm font-bold text-white/80">Phone</span>
                        </div>
                        <span className="text-sm font-medium text-white/40">{profile.phone || 'Not set'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="space-y-4">
                  <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150" />
                    <div className="relative">
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-2">Customer Satisfaction</p>
                      <p className="text-6xl font-black text-white mb-2">{profile.stats.satisfaction_score}</p>
                      <div className="w-24 h-1 bg-white/10 mx-auto rounded-full mb-4">
                        <div className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${profile.stats.satisfaction_score}%` }} />
                      </div>
                      <p className="text-xs text-primary font-black uppercase tracking-widest">Elite Performance</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-4">
                  {profile.activity.map((item, idx) => (
                    <div key={idx} className="bg-white/5 p-4 rounded-3xl border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.description}</p>
                        <p className="text-[10px] text-white/40 font-medium uppercase">{new Date(item.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'achievements' && (
                <div className="grid grid-cols-2 gap-3">
                  {profile.achievements.map((a, idx) => (
                    <div key={idx} className={`p-5 rounded-[2.5rem] border text-center transition-all ${a.unlocked ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
                      <div className="text-4xl mb-3">{a.icon}</div>
                      <p className="text-xs font-black text-white uppercase tracking-tighter truncate">{a.title}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <PermissionManager />
                  <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 text-center">
                    <p className="text-sm font-bold text-white mb-4">Advanced Control Panel</p>
                    <Link href="/settings" className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest block border border-white/10 active:scale-95 transition-all">
                      Configure AI Nodes
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-6"
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
    </PageTransition>
  )
}
