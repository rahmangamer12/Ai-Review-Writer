import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ArrowRight, CheckCircle2, Star, Zap, Shield, ChevronRight, BarChart3, MessageSquare, Plus, Mail } from 'lucide-react'

// Note: Next.js Server Component
export const metadata = {
  title: 'Ai Review Writer | AI Review Management for Local Service Businesses',
  description: 'Ai Review Writer helps restaurants, clinics, salons, repair shops, and local service teams manage, analyze, and reply to customer reviews with AI.',
}

export default async function LandingPage() {
  const { userId } = await auth()
  
  // If user is already signed in, go straight to dashboard
  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#030308] text-white overflow-hidden font-sans w-full max-w-[100vw] overflow-x-hidden selection:bg-violet-500/30">
      
      {/* ─── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-violet-600/20 to-transparent blur-[100px] pointer-events-none" />
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-sm mb-8 animate-fade-in-up backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-white/80 tracking-wide">Built for local service businesses</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 animate-fade-in-up animation-delay-100 max-w-4xl mx-auto leading-[1.1]">
          Turn Local Customer{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
            Reviews Into Revenue
          </span>
          <br className="hidden sm:block" />
          With AI
        </h1>

        <p className="text-lg sm:text-xl text-white/60 mb-10 max-w-2xl mx-auto animate-fade-in-up animation-delay-200 leading-relaxed">
          Ai Review Writer helps restaurants, clinics, salons, repair shops, and local agencies track reviews, understand sentiment, and draft better replies from one simple workspace.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up animation-delay-300 w-full sm:w-auto">
          <Link 
            href="/subscription" 
            className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] active:scale-95"
          >
            Start Managing Reviews
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            href="/dashboard" 
            className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            View Product Dashboard
          </Link>
        </div>

        <div className="mt-16 flex items-center gap-6 animate-fade-in-up animation-delay-400 text-sm text-white/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Best for Google review workflows</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>AI drafts stay editable</span>
          </div>
        </div>

        {/* Dashboard Preview */}

        <div className="w-full max-w-5xl mt-24 relative animate-fade-in-up animation-delay-500 group">
          <div className="absolute inset-0 bg-gradient-to-t from-[#030308] via-transparent to-transparent z-10" />
          <div className="relative rounded-2xl sm:rounded-[32px] overflow-hidden border border-white/10 bg-[#0c0c18] shadow-2xl p-2 sm:p-4 transition-transform duration-500 group-hover:scale-[1.02]">
            {/* Browser top UI */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 mb-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="mx-auto w-full max-w-md h-6 bg-white/5 rounded-full" />
            </div>
            {/* Placeholder for dashboard screenshot */}
            <div className="w-full aspect-video bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 cyber-grid opacity-20" />
                <div className="text-center z-10">
                  <BarChart3 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40 font-medium">Local reputation command center</p>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative border-t border-white/5 mt-[-100px]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built Around The Local Review Workflow</h2>
          <p className="text-white/50 text-lg">A focused reputation workspace for small teams that cannot afford to miss reviews.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Zap className="w-6 h-6 text-amber-400" />,
              title: "Review Reply Drafts",
              desc: "Generate polite, brand-safe replies for happy, angry, and neutral customers without starting from a blank page."
            },
            {
              icon: <BarChart3 className="w-6 h-6 text-cyan-400" />,
              title: "Sentiment Tracking",
              desc: "Spot negative review patterns early so the owner or manager can fix the real service issue."
            },
            {
              icon: <MessageSquare className="w-6 h-6 text-pink-400" />,
              title: "Platform Inbox",
              desc: "Connect supported platforms or manually add real reviews while OAuth approvals are being completed."
            },
            {
              icon: <Shield className="w-6 h-6 text-emerald-400" />,
              title: "Human Approval",
              desc: "Save AI replies as drafts first, then edit, approve, reject, or delete before using them publicly."
            },
            {
              icon: <Star className="w-6 h-6 text-violet-400" />,
              title: "Manager Dashboard",
              desc: "See response rate, review status, rating trends, and pending work without digging through spreadsheets."
            },
            {
              icon: <Mail className="w-6 h-6 text-blue-400" />,
              title: "Damage Control Alerts",
              desc: "Route urgent low-star reviews to the person who can respond before the problem gets worse."
            }
          ].map((feature, i) => (
            <div key={i} className="bg-[#0c0c18] border border-white/5 p-8 rounded-[24px] hover:bg-white/[0.03] transition-colors group">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-white/50 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Social Proof / Logos ──────────────────────────────────────────────── */}
      <section className="py-20 border-y border-white/5 bg-[#05050A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/40 text-sm tracking-widest uppercase font-semibold mb-8">
            For restaurants, clinics, salons, repair shops, real estate offices, and local service teams
          </p>
          <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
              <h3 className="mb-2 font-bold text-white">Capture Every Review</h3>
              <p className="text-sm leading-relaxed text-white/50">Keep Google reviews and manually entered feedback in one owner-friendly workspace.</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
              <h3 className="mb-2 font-bold text-white">Reply Faster</h3>
              <p className="text-sm leading-relaxed text-white/50">Use AI to draft professional responses while your team focuses on serving customers.</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
              <h3 className="mb-2 font-bold text-white">Protect Reputation</h3>
              <p className="text-sm leading-relaxed text-white/50">Track unresolved negative reviews and make reputation management a daily habit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Local Teams Need This</h2>
          <p className="text-white/50 text-lg">The product is designed around real review operations, not vanity dashboards.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Owner approval",
              role: "Before public use",
              text: "AI replies are saved as drafts inside your workspace so you can review, edit, approve, or delete them before using them publicly.",
              avatar: "1"
            },
            {
              name: "Real review data",
              role: "No fake activity needed",
              text: "The dashboard is designed to show saved platform reviews and manually entered customer reviews, not made-up activity.",
              avatar: "2"
            },
            {
              name: "Daily workflow",
              role: "One workspace",
              text: "You can manage review status, edit saved replies, remove reviews, and refresh analytics from the same authenticated account.",
              avatar: "3"
            }
          ].map((test, i) => (
            <div key={i} className="bg-gradient-to-b from-[#0c0c18] to-[#08080f] border border-white/5 p-8 rounded-[24px]">
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-white/80 text-lg leading-relaxed mb-8">{test.text}</p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center font-bold text-lg">
                  {test.avatar}
                </div>
                <div>
                  <div className="font-bold">{test.name}</div>
                  <div className="text-white/40 text-sm">{test.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-violet-900/20 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 bg-[#0c0c18] border border-white/10 p-12 sm:p-20 rounded-[40px] shadow-2xl">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">Ready to stop losing trust to unanswered reviews?</h2>
          <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto">
            Start with your real customer reviews, then use AI to respond faster, protect your rating, and keep every review under control.
          </p>
          <Link 
            href="/subscription" 
            className="inline-flex px-8 py-4 bg-white text-black font-semibold rounded-2xl hover:scale-105 transition-transform items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
          >
            Start Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#030308] pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Zap className="w-4 h-4 text-white" />
              </div>
              Ai Review Writer
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              AI review management for local service businesses that need faster, safer customer replies.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Product</h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/subscription" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/extension" className="hover:text-white transition-colors">Chrome Extension</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold mb-4 text-white">Subscribe to waitlist</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="Email address" className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm w-full outline-none focus:border-violet-500" />
              <button className="bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/90">Join</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto text-center text-white/30 text-sm pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} AutoReview AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
