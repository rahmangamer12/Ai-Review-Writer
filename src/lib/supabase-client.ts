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

interface DbReview {
  id: string
  user_id: string
  platform: string | null
  rating: number | null
  review_text: string | null
  content: string | null
  reviewer_name: string | null
  author_name: string | null
  reviewer_email: string | null
  author_email: string | null
  status: string | null
  sentiment_label: string | null
  sentiment_score: number | null
  created_at: string
  updated_at: string
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Unknown error'
}

function normalizeReview(item: DbReview): SafeReview {
  return {
    id: item.id,
    user_id: item.user_id,
    platform: item.platform || 'unknown',
    rating: item.rating || 0,
    content: item.review_text || item.content || '',
    author_name: item.reviewer_name || item.author_name || 'Anonymous',
    author_email: item.reviewer_email || item.author_email || '',
    status: (item.status as 'pending' | 'approved' | 'rejected') || 'pending',
    sentiment_label: (item.sentiment_label as 'positive' | 'negative' | 'neutral' | null) || null,
    sentiment_score: item.sentiment_score || null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }
}

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
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.error('Database schema error:', error.message)
        return { 
          data: null, 
          error: 'Database schema needs update. Please run the SQL fix.' 
        }
      }
      return { data: null, error: error.message }
    }

    const normalizedData = (data || []).map(normalizeReview)
    return { data: normalizedData, error: null }
  } catch (err: unknown) {
    console.error('Fetch reviews error:', err)
    return { data: null, error: getErrorMessage(err) || 'Unknown error' }
  }
}

export async function insertReviewSafe(
  review: Partial<SafeReview>
): Promise<{ data: unknown; error: string | null }> {
  try {
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
  } catch (err: unknown) {
    console.error('Insert review error:', err)
    return { data: null, error: getErrorMessage(err) || 'Unknown error' }
  }
}

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
  } catch (err: unknown) {
    console.error('Update review error:', err)
    return { success: false, error: getErrorMessage(err) || 'Unknown error' }
  }
}

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
      return { count: 0, error: null }
    }

    return { count: count || 0, error: null }
  } catch {
    return { count: 0, error: null }
  }
}
