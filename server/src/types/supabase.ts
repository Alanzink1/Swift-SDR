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
      workspaces: {
        Row: {
          id: string
          name: string | null
          slug: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          slug?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          slug?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string | null
          user_id: string | null
          role: string | null
        }
        Insert: {
          id?: string
          workspace_id?: string | null
          user_id?: string | null
          role?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string | null
          user_id?: string | null
          role?: string | null
        }
      }
      custom_field_definitions: {
        Row: {
          id: string
          workspace_id: string | null
          label: string | null
          field_type: string | null
          is_required: boolean | null
        }
        Insert: {
          id?: string
          workspace_id?: string | null
          label?: string | null
          field_type?: string | null
          is_required?: boolean | null
        }
        Update: {
          id?: string
          workspace_id?: string | null
          label?: string | null
          field_type?: string | null
          is_required?: boolean | null
        }
      }
      funnel_stages: {
        Row: {
          id: string
          workspace_id: string | null
          name: string | null
          position: number | null
          required_fields: Json | null
        }
        Insert: {
          id?: string
          workspace_id?: string | null
          name?: string | null
          position?: number | null
          required_fields?: Json | null
        }
        Update: {
          id?: string
          workspace_id?: string | null
          name?: string | null
          position?: number | null
          required_fields?: Json | null
        }
      }
      leads: {
        Row: {
          id: string
          workspace_id: string | null
          current_stage_id: string | null
          assigned_to: string | null
          name: string | null
          email: string | null
          phone: string | null
          company: string | null
          job_title: string | null
          custom_values: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id?: string | null
          current_stage_id?: string | null
          assigned_to?: string | null
          name?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          job_title?: string | null
          custom_values?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string | null
          current_stage_id?: string | null
          assigned_to?: string | null
          name?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          job_title?: string | null
          custom_values?: Json | null
          created_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          workspace_id: string | null
          name: string | null
          context: string | null
          system_prompt: string | null
          trigger_stage_id: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          workspace_id?: string | null
          name?: string | null
          context?: string | null
          system_prompt?: string | null
          trigger_stage_id?: string | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          workspace_id?: string | null
          name?: string | null
          context?: string | null
          system_prompt?: string | null
          trigger_stage_id?: string | null
          is_active?: boolean | null
        }
      }
      ai_messages: {
        Row: {
          id: string
          lead_id: string | null
          campaign_id: string | null
          content: string | null
          is_sent: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          campaign_id?: string | null
          content?: string | null
          is_sent?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          campaign_id?: string | null
          content?: string | null
          is_sent?: boolean | null
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