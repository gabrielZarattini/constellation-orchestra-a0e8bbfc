export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      affiliate_config: {
        Row: {
          access_token: string | null
          app_id: string | null
          client_secret: string | null
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          platform: string
          redirect_uri: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          app_id?: string | null
          client_secret?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          platform?: string
          redirect_uri?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          app_id?: string | null
          client_secret?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          platform?: string
          redirect_uri?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_links: {
        Row: {
          campaign_id: string | null
          clicks: number
          content_id: string | null
          conversions: number
          created_at: string
          id: string
          metadata: Json | null
          original_url: string
          platform: string
          product_id: string | null
          revenue_cents: number
          short_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          clicks?: number
          content_id?: string | null
          conversions?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          original_url: string
          platform?: string
          product_id?: string | null
          revenue_cents?: number
          short_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          clicks?: number
          content_id?: string | null
          conversions?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          original_url?: string
          platform?: string
          product_id?: string | null
          revenue_cents?: number
          short_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_metrics: {
        Row: {
          campaign_id: string
          clicks: number | null
          conversions: number | null
          created_at: string
          ctr: number | null
          engagements: number | null
          id: string
          impressions: number | null
          measured_at: string
          platform: Database["public"]["Enums"]["social_platform"] | null
          spend_cents: number | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          ctr?: number | null
          engagements?: number | null
          id?: string
          impressions?: number | null
          measured_at?: string
          platform?: Database["public"]["Enums"]["social_platform"] | null
          spend_cents?: number | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          ctr?: number | null
          engagements?: number | null
          id?: string
          impressions?: number | null
          measured_at?: string
          platform?: Database["public"]["Enums"]["social_platform"] | null
          spend_cents?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget_cents: number | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          metadata: Json | null
          name: string
          objective: string | null
          platforms: Database["public"]["Enums"]["social_platform"][] | null
          starts_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          target_audience: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_cents?: number | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          objective?: string | null
          platforms?: Database["public"]["Enums"]["social_platform"][] | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_audience?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_cents?: number | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          objective?: string | null
          platforms?: Database["public"]["Enums"]["social_platform"][] | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_audience?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_library: {
        Row: {
          ai_model: string | null
          ai_prompt: string | null
          body: string | null
          campaign_id: string | null
          created_at: string
          id: string
          is_favorite: boolean | null
          media_url: string | null
          metadata: Json | null
          status: Database["public"]["Enums"]["content_status"]
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          ai_model?: string | null
          ai_prompt?: string | null
          body?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          media_url?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          ai_model?: string | null
          ai_prompt?: string | null
          body?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          media_url?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_library_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          balance: number
          id: string
          lifetime_earned: number
          lifetime_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crew_agents: {
        Row: {
          agent_key: string
          avatar: string
          created_at: string
          id: string
          model: string
          name: string
          position: Json
          priority: string
          provider: string
          role: string
          status: string
          system_prompt: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_key: string
          avatar?: string
          created_at?: string
          id?: string
          model?: string
          name: string
          position?: Json
          priority?: string
          provider?: string
          role?: string
          status?: string
          system_prompt?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_key?: string
          avatar?: string
          created_at?: string
          id?: string
          model?: string
          name?: string
          position?: Json
          priority?: string
          provider?: string
          role?: string
          status?: string
          system_prompt?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crew_edges: {
        Row: {
          created_at: string
          from_agent_key: string
          id: string
          label: string | null
          status: string
          to_agent_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_agent_key: string
          id?: string
          label?: string | null
          status?: string
          to_agent_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_agent_key?: string
          id?: string
          label?: string | null
          status?: string
          to_agent_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      healing_actions: {
        Row: {
          action_taken: string
          created_at: string
          id: string
          issue_details: string | null
          issue_type: string
          metadata: Json | null
          related_resource_id: string | null
          related_resource_type: string | null
          success: boolean | null
          user_id: string
        }
        Insert: {
          action_taken: string
          created_at?: string
          id?: string
          issue_details?: string | null
          issue_type: string
          metadata?: Json | null
          related_resource_id?: string | null
          related_resource_type?: string | null
          success?: boolean | null
          user_id: string
        }
        Update: {
          action_taken?: string
          created_at?: string
          id?: string
          issue_details?: string | null
          issue_type?: string
          metadata?: Json | null
          related_resource_id?: string | null
          related_resource_type?: string | null
          success?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          read: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      optimization_policy: {
        Row: {
          action_details: Json
          action_type: string
          applied: boolean | null
          campaign_id: string | null
          context: Json | null
          created_at: string
          id: string
          reward: number | null
          user_id: string
        }
        Insert: {
          action_details?: Json
          action_type: string
          applied?: boolean | null
          campaign_id?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          reward?: number | null
          user_id: string
        }
        Update: {
          action_details?: Json
          action_type?: string
          applied?: boolean | null
          campaign_id?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          reward?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimization_policy_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          language: string | null
          onboarding_completed: boolean | null
          timezone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          language?: string | null
          onboarding_completed?: boolean | null
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string | null
          onboarding_completed?: boolean | null
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          campaign_id: string | null
          content_id: string | null
          created_at: string
          error_message: string | null
          id: string
          max_retries: number | null
          metadata: Json | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_post_id: string | null
          published_at: string | null
          retry_count: number | null
          scheduled_at: string
          social_account_id: string | null
          status: Database["public"]["Enums"]["post_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          content_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_post_id?: string | null
          published_at?: string | null
          retry_count?: number | null
          scheduled_at: string
          social_account_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          content_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          platform?: Database["public"]["Enums"]["social_platform"]
          platform_post_id?: string | null
          published_at?: string | null
          retry_count?: number | null
          scheduled_at?: string
          social_account_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_user_id: string | null
          platform_username: string | null
          refresh_token: string | null
          scopes: string[] | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_user_id?: string | null
          platform_username?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          platform?: Database["public"]["Enums"]["social_platform"]
          platform_user_id?: string | null
          platform_username?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          created_at: string
          credits_consumed: number
          id: string
          metadata: Json | null
          quantity: number
          resource_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_consumed?: number
          id?: string
          metadata?: Json | null
          quantity?: number
          resource_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_consumed?: number
          id?: string
          metadata?: Json | null
          quantity?: number
          resource_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      seed_crew_template: { Args: { _user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
      campaign_status: "draft" | "active" | "paused" | "completed" | "archived"
      content_status: "draft" | "approved" | "published" | "archived"
      content_type: "text" | "image" | "audio" | "music" | "video" | "carousel"
      notification_type: "info" | "warning" | "error" | "success"
      post_status:
        | "queued"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled"
      social_platform:
        | "linkedin"
        | "instagram"
        | "facebook"
        | "twitter"
        | "tiktok"
        | "youtube"
        | "pinterest"
        | "wordpress"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "viewer"],
      campaign_status: ["draft", "active", "paused", "completed", "archived"],
      content_status: ["draft", "approved", "published", "archived"],
      content_type: ["text", "image", "audio", "music", "video", "carousel"],
      notification_type: ["info", "warning", "error", "success"],
      post_status: ["queued", "publishing", "published", "failed", "cancelled"],
      social_platform: [
        "linkedin",
        "instagram",
        "facebook",
        "twitter",
        "tiktok",
        "youtube",
        "pinterest",
        "wordpress",
      ],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
      ],
    },
  },
} as const
