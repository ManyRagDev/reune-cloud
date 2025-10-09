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
      table_reune: {
        Row: {
          categoria_evento: string | null
          created_at: string
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
      distribution_bulk_upsert: {
        Args: { evento_id: string; rows: Json }
        Returns: Json[]
      }
      get_distribution_summary: {
        Args: { evento_id: string }
        Returns: Json
      }
      get_event_plan: {
        Args: { evento_id: string }
        Returns: Json
      }
      items_replace_for_event: {
        Args: { evento_id: string; itens: Json }
        Returns: Json[]
      }
      participants_bulk_upsert: {
        Args: { evento_id: string; participantes: Json }
        Returns: Json[]
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
