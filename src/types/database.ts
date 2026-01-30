export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      reviews: {
        Row: {
          id: string
          user_id: string
          platform: string
          rating: number
          content: string | null
          author_name: string | null
          author_email: string | null
          status: 'pending' | 'approved' | 'rejected' | null
          sentiment_label: 'positive' | 'negative' | 'neutral' | null
          sentiment_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform?: string
          rating?: number
          content?: string | null
          author_name?: string | null
          author_email?: string | null
          status?: 'pending' | 'approved' | 'rejected' | null
          sentiment_label?: 'positive' | 'negative' | 'neutral' | null
          sentiment_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          rating?: number
          content?: string | null
          author_name?: string | null
          author_email?: string | null
          status?: 'pending' | 'approved' | 'rejected' | null
          sentiment_label?: 'positive' | 'negative' | 'neutral' | null
          sentiment_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      replies: {
        Row: {
          id: string
          review_id: string
          user_id: string
          reply_text: string
          ai_generated: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          user_id: string
          reply_text: string
          ai_generated?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          user_id?: string
          reply_text?: string
          ai_generated?: boolean | null
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          ai_tone: string | null
          auto_reply_enabled: boolean | null
          auto_approval: boolean | null
          auto_approval_min_rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ai_tone?: string | null
          auto_reply_enabled?: boolean | null
          auto_approval?: boolean | null
          auto_approval_min_rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ai_tone?: string | null
          auto_reply_enabled?: boolean | null
          auto_approval?: boolean | null
          auto_approval_min_rating?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      connected_platforms: {
        Row: {
          id: string
          user_id: string
          platform: string
          platform_id: string | null
          api_key: string | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: string
          platform_id?: string | null
          api_key?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          platform_id?: string | null
          api_key?: string | null
          is_active?: boolean | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
