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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          id: string
          location: string | null
          patient_id: string
          provider_name: string | null
          reminder_24h_sent_at: string | null
          reminder_2h_sent_at: string | null
          scheduled_end: string | null
          scheduled_start: string
          source_system_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          patient_id: string
          provider_name?: string | null
          reminder_24h_sent_at?: string | null
          reminder_2h_sent_at?: string | null
          scheduled_end?: string | null
          scheduled_start: string
          source_system_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          patient_id?: string
          provider_name?: string | null
          reminder_24h_sent_at?: string | null
          reminder_2h_sent_at?: string | null
          scheduled_end?: string | null
          scheduled_start?: string
          source_system_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          appointment_id: string | null
          created_at: string
          created_by: string
          event_type: string
          id: string
          metadata: Json | null
          patient_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string
          event_type: string
          id?: string
          metadata?: Json | null
          patient_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_tasks: {
        Row: {
          appointment_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          patient_id: string
          priority: Database["public"]["Enums"]["follow_up_priority"]
          risk_score: number
          status: Database["public"]["Enums"]["follow_up_status"]
          type: Database["public"]["Enums"]["follow_up_type"]
        }
        Insert: {
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          patient_id: string
          priority?: Database["public"]["Enums"]["follow_up_priority"]
          risk_score?: number
          status?: Database["public"]["Enums"]["follow_up_status"]
          type: Database["public"]["Enums"]["follow_up_type"]
        }
        Update: {
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          patient_id?: string
          priority?: Database["public"]["Enums"]["follow_up_priority"]
          risk_score?: number
          status?: Database["public"]["Enums"]["follow_up_status"]
          type?: Database["public"]["Enums"]["follow_up_type"]
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_tasks_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body_template: string
          channel: Database["public"]["Enums"]["message_channel"]
          created_at: string
          description: string | null
          id: string
          key: string
        }
        Insert: {
          body_template: string
          channel: Database["public"]["Enums"]["message_channel"]
          created_at?: string
          description?: string | null
          id?: string
          key: string
        }
        Update: {
          body_template?: string
          channel?: Database["public"]["Enums"]["message_channel"]
          created_at?: string
          description?: string | null
          id?: string
          key?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          appointment_id: string | null
          body: string
          channel: Database["public"]["Enums"]["message_channel"]
          created_at: string
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          patient_id: string | null
          phone: string | null
          provider_message_id: string | null
          provider_status: string | null
          received_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"]
          template_key: string | null
        }
        Insert: {
          appointment_id?: string | null
          body: string
          channel: Database["public"]["Enums"]["message_channel"]
          created_at?: string
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          patient_id?: string | null
          phone?: string | null
          provider_message_id?: string | null
          provider_status?: string | null
          received_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          template_key?: string | null
        }
        Update: {
          appointment_id?: string | null
          body?: string
          channel?: Database["public"]["Enums"]["message_channel"]
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          patient_id?: string | null
          phone?: string | null
          provider_message_id?: string | null
          provider_status?: string | null
          received_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          template_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          created_at: string
          date_of_birth: string | null
          external_id: string | null
          first_name: string
          id: string
          last_name: string
          phone: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          external_id?: string | null
          first_name: string
          id?: string
          last_name: string
          phone: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          external_id?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_follow_up_tasks: {
        Args: never
        Returns: {
          appointment_id: string
          appointment_status: string
          completed_at: string
          first_name: string
          last_name: string
          location: string
          patient_id: string
          patient_phone: string
          priority: string
          provider_name: string
          risk_score: number
          scheduled_end: string
          scheduled_start: string
          task_created_at: string
          task_id: string
          task_status: string
          task_type: string
        }[]
      }
    }
    Enums: {
      appointment_status:
        | "SCHEDULED"
        | "CONFIRMED"
        | "RESCHEDULED"
        | "CANCELLED"
        | "MISSED"
      follow_up_priority: "LOW" | "MEDIUM" | "HIGH"
      follow_up_status: "OPEN" | "IN_PROGRESS" | "DONE"
      follow_up_type:
        | "MISSED_APPOINTMENT"
        | "NO_RESPONSE"
        | "SYMPTOM_ALERT"
        | "RESCHEDULE_REQUEST"
        | "CANCEL_REQUEST"
      message_channel: "SMS" | "WHATSAPP"
      message_direction: "OUTBOUND" | "INBOUND"
      message_status: "SENT" | "DELIVERED" | "FAILED" | "RECEIVED"
      user_role: "COORDINATOR" | "ADMIN"
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
      appointment_status: [
        "SCHEDULED",
        "CONFIRMED",
        "RESCHEDULED",
        "CANCELLED",
        "MISSED",
      ],
      follow_up_priority: ["LOW", "MEDIUM", "HIGH"],
      follow_up_status: ["OPEN", "IN_PROGRESS", "DONE"],
      follow_up_type: [
        "MISSED_APPOINTMENT",
        "NO_RESPONSE",
        "SYMPTOM_ALERT",
        "RESCHEDULE_REQUEST",
        "CANCEL_REQUEST",
      ],
      message_channel: ["SMS", "WHATSAPP"],
      message_direction: ["OUTBOUND", "INBOUND"],
      message_status: ["SENT", "DELIVERED", "FAILED", "RECEIVED"],
      user_role: ["COORDINATOR", "ADMIN"],
    },
  },
} as const
