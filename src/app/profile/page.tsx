'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import PageTransition from '@/components/transitions/PageTransition'
import PermissionManager from '@/components/PermissionManager'
import { 
  Camera, CreditCard, TrendingUp, Award, Target, Zap, BarChart3, 
  Users, MessageSquare, Star, Calendar, Clock, Globe, MapPin, 
  Mail, Phone, Briefcase, Edit2, Save, X, CheckCircle, 
  ArrowUpRight, Activity, Heart, ThumbsUp, Settings, Bell, 
  MapPinned, Shield, ChevronRight, Layout
} from 'lucide-react'

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
  stats: {
    total_reviews: number
    avg_rating: number
    response_rate: number
    avg_response_time: number
    satisfaction_score: number
    platforms_connected: number
  }
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'activity' | 'achievements' | 'professional'>('overview')
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({})
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      // Real data fetch logic would go here
      const mockProfile: UserProfile = {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        full_name: user.fullName || 'User',
        avatar_url: user.imageUrl,
        bio: 'Visionary entrepreneur managing review ecosystems with AI.',
        location: 'New York, USA',
        phone: '+1 (555) 000-0000',
        website: 'https://autoreview.ai',
        company: 'The Stove Club',
        role: 'Founder & CEO',
        industry: 'Hospitality',
        plan: 'professional',
        credits: 750,
        joined_date: new Date().toISOString(),
        stats: {
          total_reviews: 1240,
          avg_rating: 4.8,
          response_rate: 98,
          avg_response_time: 12,
          satisfaction_score: 95,
          platforms_connected: 5
        }
      }
      setProfile(mockProfile)
      setEditedProfile(mockProfile)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isLoaded && user) fetchProfile()
  }, [isLoaded, user, fetchProfile])

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setProfile(prev => ({ ...prev!, ...editedProfile }))
    setEditing(false)
    setSaving(false)
  }

  if (loading || !profile) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  )

  return (
    <PageTransition>
      <div className="min-h-[100dvh] bg-[#030308] text-white overflow-x-hidden w-full pb-[calc(100px+env(safe-area-inset-bottom))]">
        <div className="max-w-5xl mx-auto px-0 md:px-6">
          
          {/* Native Header Card */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-white/5 border-b border-white/5 md:border md:rounded-[3rem] md:mt-8 p-6 sm:p-10 backdrop-blur-2xl"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="relative group">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2.5rem] overflow-hidden border-2 border-primary/30 bg-white/5 shadow-2xl">
                  <Image src={profile.avatar_url || ''} alt="User" width={144} height={144} className="w-full h-full object-cover" />
                </div>
                {editing && (
                  <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>

              <div className="flex-1 text-center md:text-left min-w-0">
                {editing ? (
                  <div className="space-y-3">
                    <input 
                      value={editedProfile.full_name || ''} 
                      onChange={e => setEditedProfile({...editedProfile, full_name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-2xl font-black focus:outline-none focus:border-primary"
                    />
                    <textarea 
                      value={editedProfile.bio || ''} 
                      onChange={e => setEditedProfile({...editedProfile, bio: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                      rows={2}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                      <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{profile.full_name}</h1>
                      <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Verified</span>
                      </div>
                    </div>
                    <p className="text-white/40 font-medium mb-4">{profile.email}</p>
                    <p className="text-white/70 text-sm max-w-lg mb-6 leading-relaxed">{profile.bio}</p>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-tight capitalize">{profile.plan} Node</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                        <CreditCard className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold uppercase tracking-tight">{profile.credits} Available</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="shrink-0 flex gap-2 w-full md:w-auto">
                {editing ? (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button onClick={handleSave} disabled={saving} className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm active:scale-95 transition-all">
                      {saving ? 'Saving...' : 'Commit'}
                    </button>
                    <button onClick={() => setEditing(false)} className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black text-sm active:scale-95 transition-all">
                      Abort
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditing(true)} className="w-full md:w-auto px-10 py-4 bg-primary text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">
                    Initialize Edit
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Navigation Matrix */}
          <div className="flex overflow-x-auto px-4 md:px-0 py-8 gap-2 no-scrollbar snap-x">
            {[
              { id: 'overview', label: 'Dossier', icon: <Users className="w-4 h-4" /> },
              { id: 'stats', label: 'Metrics', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'activity', label: 'Timeline', icon: <Activity className="w-4 h-4" /> },
              { id: 'achievements', label: 'Awards', icon: <Award className="w-4 h-4" /> },
              { id: 'professional', label: 'Corporate', icon: <Briefcase className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl whitespace-nowrap text-xs font-black uppercase tracking-[0.1em] snap-start transition-all active:scale-90 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-2xl shadow-primary/30 border border-primary/50'
                    : 'bg-white/5 text-white/40 border border-white/5'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content Space */}
          <div className="px-4 md:px-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* RESTORED FULL STATS GRID */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Intelligence Index', val: profile.stats.avg_rating, icon: <Star className="text-yellow-400" />, sub: 'Out of 5.0' },
                        { label: 'Node Response', val: `${profile.stats.response_rate}%`, icon: <Zap className="text-emerald-400" />, sub: 'Active sync' },
                        { label: 'Transmission', val: `${profile.stats.avg_response_time}m`, icon: <Clock className="text-purple-400" />, sub: 'Avg latency' },
                        { label: 'Trust Score', val: profile.stats.satisfaction_score, icon: <Shield className="text-cyan-400" />, sub: 'Global rank' }
                      ].map((s, i) => (
                        <div key={i} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-md relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">{s.icon}</div>
                          <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">{s.label}</p>
                          <p className="text-3xl font-black text-white mb-1">{s.val}</p>
                          <p className="text-[10px] text-white/20 font-bold uppercase">{s.sub}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <section className="bg-white/5 rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><MapPin className="w-5 h-5" /></div>
                          <h3 className="text-xl font-black uppercase tracking-tight text-white">Geographic Node</h3>
                        </div>
                        <div className="space-y-6">
                          <div className="flex justify-between items-center py-4 border-b border-white/5">
                            <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Global Location</span>
                            <span className="text-white font-black">{profile.location}</span>
                          </div>
                          <div className="flex justify-between items-center py-4 border-b border-white/5">
                            <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Transmission Hub</span>
                            <span className="text-white font-black">{profile.website.replace('https://', '')}</span>
                          </div>
                        </div>
                      </section>

                      <section className="bg-white/5 rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400"><Phone className="w-5 h-5" /></div>
                          <h3 className="text-xl font-black uppercase tracking-tight text-white">Encrypted Comms</h3>
                        </div>
                        <div className="space-y-6">
                          <div className="flex justify-between items-center py-4 border-b border-white/5">
                            <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Mobile Link</span>
                            <span className="text-white font-black">{profile.phone}</span>
                          </div>
                          <div className="flex justify-between items-center py-4 border-b border-white/5">
                            <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Identity ID</span>
                            <span className="text-white font-black truncate ml-8">UID-{profile.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                )}

                {activeTab === 'stats' && (
                  <div className="space-y-6">
                    <div className="bg-white/5 p-10 rounded-[3.5rem] border border-white/5 text-center relative overflow-hidden backdrop-blur-xl">
                      <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150 animate-pulse" />
                      <div className="relative z-10">
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-4">Network Efficiency</p>
                        <p className="text-8xl font-black text-white mb-4 tracking-tighter">{profile.stats.satisfaction_score}%</p>
                        <div className="w-48 h-2 bg-white/5 mx-auto rounded-full mb-6 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${profile.stats.satisfaction_score}%` }} transition={{ duration: 1.5 }} className="h-full bg-primary rounded-full shadow-[0_0_30px_rgba(99,102,241,0.8)]" />
                        </div>
                        <p className="text-xs text-primary font-black uppercase tracking-[0.3em]">Elite Protocol Active</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Total Payload</p>
                          <p className="text-3xl font-black text-white">{profile.stats.total_reviews} Reviews</p>
                        </div>
                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400"><Layout className="w-6 h-6" /></div>
                      </div>
                      <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Platforms</p>
                          <p className="text-3xl font-black text-white">{profile.stats.platforms_connected} Nodes</p>
                        </div>
                        <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400"><Globe className="w-6 h-6" /></div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    {[
                      { icon: '🚀', title: 'System Initialization', desc: 'Protocol version 4.0 deployed', time: '2h ago', color: 'bg-primary/10 text-primary' },
                      { icon: '🤖', title: 'AI Response Matrix', desc: 'Auto-reply sent to Google Maps', time: '5h ago', color: 'bg-emerald-500/10 text-emerald-400' },
                      { icon: '💎', title: 'Credit Infusion', desc: '+500 AI nodes allocated', time: '1d ago', color: 'bg-cyan-500/10 text-cyan-400' },
                      { icon: '🔓', title: 'Security Purge', desc: 'Data retention lifecycle updated', time: '3d ago', color: 'bg-rose-500/10 text-rose-500' }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white/5 p-6 rounded-[2rem] border border-white/5 flex items-center gap-6 backdrop-blur-md hover:bg-white/[0.08] transition-colors group cursor-default">
                        <div className={`w-16 h-16 ${item.color} rounded-3xl flex items-center justify-center text-3xl shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-lg font-black text-white tracking-tight">{item.title}</h4>
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest whitespace-nowrap ml-4">{item.time}</span>
                          </div>
                          <p className="text-sm text-white/40 font-medium">{item.desc}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/30 transition-colors" />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'achievements' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                      { icon: '🏆', label: 'Core Founder', sub: 'Alpha user status' },
                      { icon: '⚡', label: 'Quick Node', sub: 'Fastest reply rate' },
                      { icon: '🌍', label: 'Global Reach', sub: '5+ Platforms sync' },
                      { icon: '🛡️', label: 'Trust Guard', sub: 'Security specialist' },
                      { icon: '📈', label: 'Growth Hack', sub: '1k+ Reviews managed' },
                      { icon: '🔥', label: 'Hot Streak', sub: '30 day active' }
                    ].map((a, i) => (
                      <div key={i} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 text-center group hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer">
                        <div className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-500">{a.icon}</div>
                        <p className="text-xs font-black text-white uppercase tracking-widest mb-1">{a.label}</p>
                        <p className="text-[10px] text-white/20 font-bold uppercase">{a.sub}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'professional' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <section className="bg-white/5 rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400"><Briefcase className="w-5 h-5" /></div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-white">Employment Dossier</h3>
                      </div>
                      <div className="space-y-6">
                        <div className="flex flex-col gap-1 py-4 border-b border-white/5">
                          <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Active Organization</span>
                          <span className="text-white text-xl font-black">{profile.company}</span>
                        </div>
                        <div className="flex flex-col gap-1 py-4 border-b border-white/5">
                          <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Operational Role</span>
                          <span className="text-white text-xl font-black">{profile.role}</span>
                        </div>
                        <div className="flex flex-col gap-1 py-4 border-b border-white/5">
                          <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Industry Sector</span>
                          <span className="text-white text-xl font-black">{profile.industry}</span>
                        </div>
                      </div>
                    </section>

                    <section className="bg-white/5 rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400"><Shield className="w-5 h-5" /></div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-white">Access Credentials</h3>
                      </div>
                      <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-black text-xs">P</div>
                          <span className="text-emerald-400 font-black uppercase text-xs tracking-widest">Professional Protocol</span>
                        </div>
                        <p className="text-[11px] text-emerald-100/60 leading-relaxed font-medium uppercase tracking-tight">
                          Full administrative access granted. All AI nodes operational. Enhanced encryption active.
                        </p>
                      </div>
                      <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 active:scale-[0.98]">
                        Download Access Keys
                      </button>
                    </section>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
