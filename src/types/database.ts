/**
 * Database Types - Generados desde el schema de Supabase
 *
 * Estos tipos representan la estructura de tu base de datos
 * y proporcionan type-safety completo en TypeScript
 */

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
      clients: {
        Row: {
          id: string
          name: string
          instagram_username: string
          instagram_user_id: string
          access_token: string
          token_expires_at: string | null
          status: 'active' | 'paused' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          instagram_username: string
          instagram_user_id: string
          access_token: string
          token_expires_at?: string | null
          status?: 'active' | 'paused' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          instagram_username?: string
          instagram_user_id?: string
          access_token?: string
          token_expires_at?: string | null
          status?: 'active' | 'paused' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          client_id: string
          instagram_post_id: string
          media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS'
          media_url: string | null
          thumbnail_url: string | null
          permalink: string
          caption: string | null
          timestamp: string
          likes: number
          comments: number
          shares: number
          saves: number
          reach: number
          impressions: number
          engagement_rate: number | null
          is_deleted: boolean
          last_fetched_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          instagram_post_id: string
          media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS'
          media_url?: string | null
          thumbnail_url?: string | null
          permalink: string
          caption?: string | null
          timestamp: string
          likes?: number
          comments?: number
          shares?: number
          saves?: number
          reach?: number
          impressions?: number
          engagement_rate?: number | null
          is_deleted?: boolean
          last_fetched_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          instagram_post_id?: string
          media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS'
          media_url?: string | null
          thumbnail_url?: string | null
          permalink?: string
          caption?: string | null
          timestamp?: string
          likes?: number
          comments?: number
          shares?: number
          saves?: number
          reach?: number
          impressions?: number
          engagement_rate?: number | null
          is_deleted?: boolean
          last_fetched_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'posts_client_id_fkey'
            columns: ['client_id']
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      account_stats: {
        Row: {
          id: string
          client_id: string
          followers_count: number
          following_count: number
          media_count: number
          avg_engagement_rate_7d: number | null
          avg_reach_7d: number | null
          total_likes_7d: number | null
          total_comments_7d: number | null
          total_shares_7d: number | null
          total_saves_7d: number | null
          avg_engagement_rate_30d: number | null
          avg_reach_30d: number | null
          total_likes_30d: number | null
          total_comments_30d: number | null
          calculated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          followers_count?: number
          following_count?: number
          media_count?: number
          avg_engagement_rate_7d?: number | null
          avg_reach_7d?: number | null
          total_likes_7d?: number | null
          total_comments_7d?: number | null
          total_shares_7d?: number | null
          total_saves_7d?: number | null
          avg_engagement_rate_30d?: number | null
          avg_reach_30d?: number | null
          total_likes_30d?: number | null
          total_comments_30d?: number | null
          calculated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          followers_count?: number
          following_count?: number
          media_count?: number
          avg_engagement_rate_7d?: number | null
          avg_reach_7d?: number | null
          total_likes_7d?: number | null
          total_comments_7d?: number | null
          total_shares_7d?: number | null
          total_saves_7d?: number | null
          avg_engagement_rate_30d?: number | null
          avg_reach_30d?: number | null
          total_likes_30d?: number | null
          total_comments_30d?: number | null
          calculated_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'account_stats_client_id_fkey'
            columns: ['client_id']
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      alerts: {
        Row: {
          id: string
          client_id: string
          alert_type: string
          severity: 'info' | 'warning' | 'critical'
          title: string
          message: string
          metadata: Json | null
          status: 'unread' | 'read' | 'dismissed'
          read_at: string | null
          dismissed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          alert_type: string
          severity?: 'info' | 'warning' | 'critical'
          title: string
          message: string
          metadata?: Json | null
          status?: 'unread' | 'read' | 'dismissed'
          read_at?: string | null
          dismissed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          alert_type?: string
          severity?: 'info' | 'warning' | 'critical'
          title?: string
          message?: string
          metadata?: Json | null
          status?: 'unread' | 'read' | 'dismissed'
          read_at?: string | null
          dismissed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'alerts_client_id_fkey'
            columns: ['client_id']
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
      automation_logs: {
        Row: {
          id: string
          client_id: string | null
          workflow_name: string
          execution_id: string | null
          status: 'success' | 'error' | 'warning'
          posts_ingested: number | null
          duration_ms: number | null
          error_message: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          workflow_name: string
          execution_id?: string | null
          status: 'success' | 'error' | 'warning'
          posts_ingested?: number | null
          duration_ms?: number | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          workflow_name?: string
          execution_id?: string | null
          status?: 'success' | 'error' | 'warning'
          posts_ingested?: number | null
          duration_ms?: number | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'automation_logs_client_id_fkey'
            columns: ['client_id']
            referencedRelation: 'clients'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dashboard_overview: {
        Args: {
          p_client_id: string
        }
        Returns: Json
      }
      get_top_posts: {
        Args: {
          p_client_id: string
          p_limit?: number
          p_days?: number
        }
        Returns: Database['public']['Tables']['posts']['Row'][]
      }
      search_posts: {
        Args: {
          p_client_id: string
          p_query?: string
          p_media_types?: string[]
          p_limit?: number
          p_offset?: number
        }
        Returns: Database['public']['Tables']['posts']['Row'][]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
