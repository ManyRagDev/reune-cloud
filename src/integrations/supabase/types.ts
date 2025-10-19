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
      confirmation_history: {
        Row: {
          confirmation_type: string
          created_at: string | null
          event_id: number
          id: string
          organizer_response: string | null
          original_value: string | null
          responded_at: string | null
          responded_by: string | null
          status: string | null
          suggested_value: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confirmation_type: string
          created_at?: string | null
          event_id: number
          id?: string
          organizer_response?: string | null
          original_value?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
          suggested_value?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confirmation_type?: string
          created_at?: string | null
          event_id?: number
          id?: string
          organizer_response?: string | null
          original_value?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
          suggested_value?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "table_reune"
            referencedColumns: ["id"]
          },
        ]
      }
      event_confirmations: {
        Row: {
          alternative_date: string | null
          alternative_location: string | null
          alternative_time: string | null
          created_at: string
          date_confirmed: boolean | null
          event_id: number
          id: string
          location_confirmed: boolean | null
          presence_confirmed: boolean | null
          time_confirmed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alternative_date?: string | null
          alternative_location?: string | null
          alternative_time?: string | null
          created_at?: string
          date_confirmed?: boolean | null
          event_id: number
          id?: string
          location_confirmed?: boolean | null
          presence_confirmed?: boolean | null
          time_confirmed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alternative_date?: string | null
          alternative_location?: string | null
          alternative_time?: string | null
          created_at?: string
          date_confirmed?: boolean | null
          event_id?: number
          id?: string
          location_confirmed?: boolean | null
          presence_confirmed?: boolean | null
          time_confirmed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_confirmations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "table_reune"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invitations: {
        Row: {
          created_at: string | null
          event_id: number
          id: string
          invitation_token: string
          participant_email: string
          participant_name: string | null
          responded_at: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: number
          id?: string
          invitation_token?: string
          participant_email: string
          participant_name?: string | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: number
          id?: string
          invitation_token?: string
          participant_email?: string
          participant_name?: string | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "table_reune"
            referencedColumns: ["id"]
          },
        ]
      }
      event_items: {
        Row: {
          categoria: string
          created_at: string
          event_id: number
          id: number
          nome_item: string
          prioridade: string
          quantidade: number
          unidade: string
          updated_at: string
          valor_estimado: number
        }
        Insert: {
          categoria?: string
          created_at?: string
          event_id: number
          id?: number
          nome_item: string
          prioridade?: string
          quantidade?: number
          unidade?: string
          updated_at?: string
          valor_estimado?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          event_id?: number
          id?: number
          nome_item?: string
          prioridade?: string
          quantidade?: number
          unidade?: string
          updated_at?: string
          valor_estimado?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "table_reune"
            referencedColumns: ["id"]
          },
        ]
      }
      event_organizers: {
        Row: {
          added_at: string | null
          added_by: string
          event_id: number | null
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by: string
          event_id?: number | null
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string
          event_id?: number | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_organizers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "table_reune"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          contato: string | null
          created_at: string
          event_id: number
          id: number
          nome_participante: string
          status_convite: string
          updated_at: string
        }
        Insert: {
          contato?: string | null
          created_at?: string
          event_id: number
          id?: number
          nome_participante: string
          status_convite?: string
          updated_at?: string
        }
        Update: {
          contato?: string | null
          created_at?: string
          event_id?: number
          id?: number
          nome_participante?: string
          status_convite?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "table_reune"
            referencedColumns: ["id"]
          },
        ]
      }
      item_assignments: {
        Row: {
          confirmado: boolean | null
          created_at: string | null
          event_id: number
          id: string
          item_id: number
          participant_id: number
          quantidade_atribuida: number | null
          updated_at: string | null
        }
        Insert: {
          confirmado?: boolean | null
          created_at?: string | null
          event_id: number
          id?: string
          item_id: number
          participant_id: number
          quantidade_atribuida?: number | null
          updated_at?: string | null
        }
        Update: {
          confirmado?: boolean | null
          created_at?: string | null
          event_id?: number
          id?: string
          item_id?: number
          participant_id?: number
          quantidade_atribuida?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "table_reune"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_assignments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "event_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_assignments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "event_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          event_id: number | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id?: number | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: number | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "table_reune"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      table_reune: {
        Row: {
          categoria_evento: string | null
          created_at: string
          created_by_ai: boolean | null
          description: string | null
          event_date: string
          event_time: string
          finalidade_evento: string | null
          id: number
          inclui_bebidas: boolean | null
          inclui_entradas: boolean | null
          is_public: boolean | null
          location: string | null
          max_attendees: number | null
          menu: string | null
          qtd_pessoas: number | null
          status: string | null
          subtipo_evento: string | null
          tipo_evento: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          categoria_evento?: string | null
          created_at?: string
          created_by_ai?: boolean | null
          description?: string | null
          event_date?: string
          event_time?: string
          finalidade_evento?: string | null
          id?: number
          inclui_bebidas?: boolean | null
          inclui_entradas?: boolean | null
          is_public?: boolean | null
          location?: string | null
          max_attendees?: number | null
          menu?: string | null
          qtd_pessoas?: number | null
          status?: string | null
          subtipo_evento?: string | null
          tipo_evento?: string | null
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          categoria_evento?: string | null
          created_at?: string
          created_by_ai?: boolean | null
          description?: string | null
          event_date?: string
          event_time?: string
          finalidade_evento?: string | null
          id?: number
          inclui_bebidas?: boolean | null
          inclui_entradas?: boolean | null
          is_public?: boolean | null
          location?: string | null
          max_attendees?: number | null
          menu?: string | null
          qtd_pessoas?: number | null
          status?: string | null
          subtipo_evento?: string | null
          tipo_evento?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_items_bulk: {
        Args: { _assignments: Json; _event_id: number }
        Returns: Json
      }
      distribution_bulk_upsert: {
        Args: { evento_id: string; rows: Json }
        Returns: Json[]
      }
      get_distribution_summary: {
        Args: { evento_id: string }
        Returns: Json
      }
      get_event_details_safe: {
        Args: { _event_id: number }
        Returns: {
          categoria_evento: string
          created_at: string
          creator_avatar_url: string
          creator_display_name: string
          description: string
          event_date: string
          event_time: string
          finalidade_evento: string
          id: number
          inclui_bebidas: boolean
          inclui_entradas: boolean
          is_public: boolean
          location: string
          max_attendees: number
          menu: string
          qtd_pessoas: number
          status: string
          subtipo_evento: string
          tipo_evento: string
          title: string
          updated_at: string
        }[]
      }
      get_event_organizers_safe: {
        Args: { _event_id: number }
        Returns: {
          added_at: string
          avatar_url: string
          display_name: string
          event_id: number
          id: string
        }[]
      }
      get_event_participants_safe: {
        Args: { _event_id: number }
        Returns: {
          contato: string
          created_at: string
          event_id: number
          id: number
          nome_participante: string
          status_convite: string
          updated_at: string
        }[]
      }
      get_event_plan: {
        Args: { evento_id: string }
        Returns: Json
      }
      get_item_assignments: {
        Args: { _event_id: number }
        Returns: {
          confirmado: boolean
          event_id: number
          id: string
          item_id: number
          item_nome: string
          participant_id: number
          participant_nome: string
          quantidade_atribuida: number
        }[]
      }
      get_pending_suggestions: {
        Args: { _event_id: number }
        Returns: {
          confirmation_type: string
          created_at: string
          id: string
          original_value: string
          suggested_value: string
          user_id: string
          user_name: string
        }[]
      }
      is_event_organizer: {
        Args: { _event_id: number; _user_id: string }
        Returns: boolean
      }
      items_replace_for_event: {
        Args: { evento_id: string; itens: Json }
        Returns: Json[]
      }
      participants_bulk_upsert: {
        Args: { evento_id: string; participantes: Json }
        Returns: Json[]
      }
      respond_to_suggestion: {
        Args: { _response?: string; _status: string; _suggestion_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
