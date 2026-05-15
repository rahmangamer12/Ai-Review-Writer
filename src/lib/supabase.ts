import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co'))
}

// Create Supabase client - works even without credentials during build
// Runtime calls should check isSupabaseConfigured() first
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'autoreview-ai',
      },
    },
  }
)

// Log configuration status (only on server, skip during build)
if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  console.log('🗄️ Supabase Configuration:')
  console.log(`   URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
  console.log(`   Key: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`)
  console.log(`   Status: ${isSupabaseConfigured() ? '✅ Ready' : '❌ Not Configured'}`)
}

export default supabase
