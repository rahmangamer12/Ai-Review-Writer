import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
}

// Create Supabase client with error handling
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: false, // Don't persist session for now
    },
    db: {
      schema: 'public'
    }
  }
)

// Test connection on load
if (typeof window !== 'undefined') {
  supabase.from('reviews').select('count', { count: 'exact', head: true }).then(({ error }) => {
    if (error) {
      console.warn('Supabase connection test failed:', error.message)
    } else {
      console.log('✅ Supabase connection successful')
    }
  })
}
