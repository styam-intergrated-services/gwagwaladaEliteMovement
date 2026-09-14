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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          participant_1: string
          participant_2: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_1: string
          participant_2: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_1?: string
          participant_2?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          image_url: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          image_url?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          image_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      leadership: {
        Row: {
          bio: string | null
          display_order: number
          id: string
          name: string
          photo_url: string | null
          role_title: string
        }
        Insert: {
          bio?: string | null
          display_order?: number
          id?: string
          name: string
          photo_url?: string | null
          role_title: string
        }
        Update: {
          bio?: string | null
          display_order?: number
          id?: string
          name?: string
          photo_url?: string | null
          role_title?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          category: Database["public"]["Enums"]["marketplace_category"]
          created_at: string
          description: string
          id: string
          images: string[]
          is_active: boolean
          is_negotiable: boolean
          price: number
          seller_id: string
          title: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["marketplace_category"]
          created_at?: string
          description: string
          id?: string
          images?: string[]
          is_active?: boolean
          is_negotiable?: boolean
          price: number
          seller_id: string
          title: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["marketplace_category"]
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          is_active?: boolean
          is_negotiable?: boolean
          price?: number
          seller_id?: string
          title?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          created_at: string
          group_id: string | null
          id: string
          post_id: string | null
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          post_id?: string | null
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          post_id?: string | null
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          location: string | null
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          location?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          project_id: string
          target_date: string | null
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          target_date?: string | null
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          target_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_photos: {
        Row: {
          caption: string | null
          id: string
          photo_url: string
          project_id: string
          submitted_at: string
          uploaded_by: string
          verified: boolean
        }
        Insert: {
          caption?: string | null
          id?: string
          photo_url: string
          project_id: string
          submitted_at?: string
          uploaded_by: string
          verified?: boolean
        }
        Update: {
          caption?: string | null
          id?: string
          photo_url?: string
          project_id?: string
          submitted_at?: string
          uploaded_by?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_approved: number
          budget_spent: number
          contractor_contact: string | null
          contractor_name: string | null
          created_at: string
          description: string | null
          entity_badge: Database["public"]["Enums"]["project_entity_badge"]
          id: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          target_completion_date: string | null
          title: string
          updated_at: string
          ward: Database["public"]["Enums"]["project_ward"]
        }
        Insert: {
          budget_approved?: number
          budget_spent?: number
          contractor_contact?: string | null
          contractor_name?: string | null
          created_at?: string
          description?: string | null
          entity_badge: Database["public"]["Enums"]["project_entity_badge"]
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_completion_date?: string | null
          title: string
          updated_at?: string
          ward: Database["public"]["Enums"]["project_ward"]
        }
        Update: {
          budget_approved?: number
          budget_spent?: number
          contractor_contact?: string | null
          contractor_name?: string | null
          created_at?: string
          description?: string | null
          entity_badge?: Database["public"]["Enums"]["project_entity_badge"]
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_completion_date?: string | null
          title?: string
          updated_at?: string
          ward?: Database["public"]["Enums"]["project_ward"]
        }
        Relationships: []
      }
      revenue_logs: {
        Row: {
          amount: number
          id: string
          linked_project_id: string | null
          notes: string | null
          recorded_at: string
          source: string
          ward: Database["public"]["Enums"]["project_ward"] | null
        }
        Insert: {
          amount: number
          id?: string
          linked_project_id?: string | null
          notes?: string | null
          recorded_at?: string
          source: string
          ward?: Database["public"]["Enums"]["project_ward"] | null
        }
        Update: {
          amount?: number
          id?: string
          linked_project_id?: string | null
          notes?: string | null
          recorded_at?: string
          source?: string
          ward?: Database["public"]["Enums"]["project_ward"] | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_logs_linked_project_id_fkey"
            columns: ["linked_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          contact_info: string | null
          description: string
          id: string
          is_anonymous: boolean
          request_type: Database["public"]["Enums"]["service_request_type"]
          requester_id: string | null
          status: Database["public"]["Enums"]["service_request_status"]
          submitted_at: string
          updated_at: string
          ward: Database["public"]["Enums"]["project_ward"] | null
        }
        Insert: {
          contact_info?: string | null
          description: string
          id?: string
          is_anonymous?: boolean
          request_type: Database["public"]["Enums"]["service_request_type"]
          requester_id?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          submitted_at?: string
          updated_at?: string
          ward?: Database["public"]["Enums"]["project_ward"] | null
        }
        Update: {
          contact_info?: string | null
          description?: string
          id?: string
          is_anonymous?: boolean
          request_type?: Database["public"]["Enums"]["service_request_type"]
          requester_id?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          submitted_at?: string
          updated_at?: string
          ward?: Database["public"]["Enums"]["project_ward"] | null
        }
        Relationships: []
      }
      transparency_documents: {
        Row: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_url: string
          id: string
          published_at: string
          title: string
        }
        Insert: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_url: string
          id?: string
          published_at?: string
          title: string
        }
        Update: {
          document_type?: Database["public"]["Enums"]["document_type"]
          file_url?: string
          id?: string
          published_at?: string
          title?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Enums: {
      app_role:
        | "resident"
        | "verified_trader"
        | "volunteer"
        | "moderator"
        | "admin"
      document_type:
        | "Financial Summary"
        | "Balance Sheet"
        | "Audit Report"
        | "Press Release"
        | "Governance Guideline"
      marketplace_category:
        | "Goods"
        | "Services"
        | "Food"
        | "Fashion"
        | "Electronics"
        | "Home & Garden"
        | "Beauty & Health"
        | "Other"
      project_entity_badge:
        | "GEM Grassroots"
        | "Area Council Municipal"
        | "Joint Initiative"
      project_status: "Planning" | "In Progress" | "Completed"
      project_ward: "Gwagwalada Center" | "Paiko" | "Ibwa" | "Zuba" | "Kutunku"
      service_request_status: "Submitted" | "In Review" | "Resolved"
      service_request_type:
        | "Resident Assistance"
        | "Volunteer Onboarding"
        | "Grievance Report"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "resident",
        "verified_trader",
        "volunteer",
        "moderator",
        "admin",
      ],
      document_type: [
        "Financial Summary",
        "Balance Sheet",
        "Audit Report",
        "Press Release",
        "Governance Guideline",
      ],
      marketplace_category: [
        "Goods",
        "Services",
        "Food",
        "Fashion",
        "Electronics",
        "Home & Garden",
        "Beauty & Health",
        "Other",
      ],
      project_entity_badge: [
        "GEM Grassroots",
        "Area Council Municipal",
        "Joint Initiative",
      ],
      project_status: ["Planning", "In Progress", "Completed"],
      project_ward: ["Gwagwalada Center", "Paiko", "Ibwa", "Zuba", "Kutunku"],
      service_request_status: ["Submitted", "In Review", "Resolved"],
      service_request_type: [
        "Resident Assistance",
        "Volunteer Onboarding",
        "Grievance Report",
      ],
    },
  },
} as const
