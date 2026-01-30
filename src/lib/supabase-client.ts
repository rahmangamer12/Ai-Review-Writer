// Safe Supabase client with error handling
import { supabase } from './supabase'

export interface SafeReview {
  id: string
  user_id: string
  platform: string
  rating: number
  content: string
  author_name: string
  author_email: string
  status: 'pending' | 'approved' | 'rejected'
  sentiment_label: 'positive' | 'negative' | 'neutral' | null
  sentiment_score: number | null
  created_at: string
  updated_at: string
}

/**
 * Safely fetch reviews with fallback for missing columns
 */
export async function fetchReviewsSafe(
  userId: string,
  status?: 'pending' | 'approved' | 'rejected'
): Promise<{ data: SafeReview[] | null; error: string | null }> {
  try {
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      // Check if error is about missing column
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.error('Database schema error:', error.message)
        return { 
          data: null, 
          error: 'Database schema needs update. Please run the SQL fix.' 
        }
      }
      return { data: null, error: error.message }
    }

    // Normalize the data to handle both old and new column names
    const normalizedData = (data || []).map((item: any): SafeReview => ({
      id: item.id,
      user_id: item.user_id,
      platform: item.platform || 'unknown',
      rating: item.rating || 0,
      // Handle both old (review_text) and new (content) column names
      content: item.review_text || item.content || '',
      author_name: item.reviewer_name || item.author_name || 'Anonymous',
      author_email: item.reviewer_email || item.author_email || '',
      status: item.status || 'pending',
      sentiment_label: item.sentiment_label || null,
      sentiment_score: item.sentiment_score || null,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }))

    return { data: normalizedData, error: null }
  } catch (err: any) {
    console.error('Fetch reviews error:', err)
    return { data: null, error: err?.message || 'Unknown error' }
  }
}

/**
 * Safely insert a review with fallback for missing columns
 */
export async function insertReviewSafe(
  review: Partial<SafeReview>
): Promise<{ data: any; error: string | null }> {
  try {
    // Use YOUR database column names (review_text, reviewer_name, reviewer_email)
    const insertData = {
      user_id: review.user_id,
      platform: review.platform || 'manual',
      rating: review.rating,
      review_text: review.content,
      reviewer_name: review.author_name,
      reviewer_email: review.author_email,
      status: review.status || 'pending',
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err: any) {
    console.error('Insert review error:', err)
    return { data: null, error: err?.message || 'Unknown error' }
  }
}

/**
 * Safely update review status
 */
export async function updateReviewStatusSafe(
  reviewId: string,
  status: 'pending' | 'approved' | 'rejected'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('reviews')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reviewId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err: any) {
    console.error('Update review error:', err)
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

/**
 * Safely get tab count
 */
export async function getTabCountSafe(
  userId: string,
  status: string
): Promise<{ count: number; error: string | null }> {
  try {
    const { count, error } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', status)

    if (error) {
      // Return 0 on error to prevent UI breakage
      return { count: 0, error: null }
    }

    return { count: count || 0, error: null }
  } catch (err) {
    return { count: 0, error: null }
  }
}
