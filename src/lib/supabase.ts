import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// STRICT MODE: NO MOCK DATA - REAL CREDENTIALS REQUIRED
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ MISSING SUPABASE CREDENTIALS!')
  console.error('Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.')
  console.error('Get your credentials from: https://supabase.com > Your Project > Settings > API')
}

// Create REAL Supabase client - NO MOCK DATA ALLOWED
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
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

// Export auth for authentication
export const { auth } = supabase

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co'))
}

// Log configuration status
if (typeof window === 'undefined') {
  console.log('🗄️ Supabase Configuration:')
  console.log(`   URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
  console.log(`   Key: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`)
  console.log(`   Status: ${isSupabaseConfigured() ? '✅ Ready' : '❌ Not Configured'}`)
}

export default supabase
