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
      admin_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
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
      conversation_analytics: {
        Row: {
          clarification_needed: boolean | null
          confidence_level: number
          created_at: string | null
          evento_id: number | null
          id: string
          intent: string
          message_id: string | null
          metadata: Json | null
          response_time_ms: number | null
          response_type: string | null
          tokens_used: number | null
          user_confused: boolean | null
          user_corrected: boolean | null
          user_id: string
        }
        Insert: {
          clarification_needed?: boolean | null
          confidence_level: number
          created_at?: string | null
          evento_id?: number | null
          id?: string
          intent: string
          message_id?: string | null
          metadata?: Json | null
          response_time_ms?: number | null
          response_type?: string | null
          tokens_used?: number | null
          user_confused?: boolean | null
          user_corrected?: boolean | null
          user_id: string
        }
        Update: {
          clarification_needed?: boolean | null
          confidence_level?: number
          created_at?: string | null
          evento_id?: number | null
          id?: string
          intent?: string
          message_id?: string | null
          metadata?: Json | null
          response_time_ms?: number | null
          response_type?: string | null
          tokens_used?: number | null
          user_confused?: boolean | null
          user_corrected?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_analytics_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "table_reune"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_analytics_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_contexts: {
        Row: {
          collected_data: Json | null
          confidence_level: number | null
          created_at: string | null
          evento_id: number | null
          id: string
          last_intent: string | null
          missing_slots: string[] | null
          state: string
          summary: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          collected_data?: Json | null
          confidence_level?: number | null
          created_at?: string | null
          evento_id?: number | null
          id?: string
          last_intent?: string | null
          missing_slots?: string[] | null
          state?: string
          summary?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          collected_data?: Json | null
          confidence_level?: number | null
          created_at?: string | null
          evento_id?: number | null
          id?: string
          last_intent?: string | null
          missing_slots?: string[] | null
          state?: string
          summary?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_contexts_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "table_reune"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          content: string
          evento_id: number | null
          id: string
          metadata: Json | null
          role: string
          timestamp: string
          user_id: string
        }
        Insert: {
          content: string
          evento_id?: number | null
          id?: string
          metadata?: Json | null
          role: string
          timestamp?: string
          user_id: string
        }
        Update: {
          content?: string
          evento_id?: number | null
          id?: string
          metadata?: Json | null
          role?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "table_reune"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          lead_email: string
          lead_id: string | null
          metadata: Json | null
          sent_at: string | null
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          lead_email: string
          lead_id?: string | null
          metadata?: Json | null
          sent_at?: string | null
          status: string
          template_name: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          lead_email?: string
          lead_id?: string | null
          metadata?: Json | null
          sent_at?: string | null
          status?: string
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "waitlist_reune"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string | null
          description: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
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
      event_dynamics: {
        Row: {
          created_at: string
          event_id: number
          id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: number
          id?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: number
          id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_dynamics_event_id_fkey"
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
      event_secret_santa: {
        Row: {
          created_at: string
          draw_date: string | null
          event_id: number
          has_drawn: boolean | null
          id: string
          max_value: number | null
          min_value: number | null
          rules_json: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          draw_date?: string | null
          event_id: number
          has_drawn?: boolean | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          rules_json?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          draw_date?: string | null
          event_id?: number
          has_drawn?: boolean | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          rules_json?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_secret_santa_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "table_reune"
            referencedColumns: ["id"]
          },
        ]
      }
      event_secret_santa_pairs: {
        Row: {
          created_at: string
          giver_id: string
          id: string
          receiver_id: string
          secret_santa_id: string
        }
        Insert: {
          created_at?: string
          giver_id: string
          id?: string
          receiver_id: string
          secret_santa_id: string
        }
        Update: {
          created_at?: string
          giver_id?: string
          id?: string
          receiver_id?: string
          secret_santa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_secret_santa_pairs_secret_santa_id_fkey"
            columns: ["secret_santa_id"]
            isOneToOne: false
            referencedRelation: "event_secret_santa"
            referencedColumns: ["id"]
          },
        ]
      }
      event_secret_santa_participants: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          secret_santa_id: string
          status: string
          updated_at: string
          user_id: string
          wishlist_link: string | null
          wishlist_text: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          secret_santa_id: string
          status?: string
          updated_at?: string
          user_id: string
          wishlist_link?: string | null
          wishlist_text?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          secret_santa_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          wishlist_link?: string | null
          wishlist_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_secret_santa_participants_secret_santa_id_fkey"
            columns: ["secret_santa_id"]
            isOneToOne: false
            referencedRelation: "event_secret_santa"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          invitation_token: string | null
          receiver_email: string
          receiver_id: string | null
          responded_at: string | null
          sender_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitation_token?: string | null
          receiver_email: string
          receiver_id?: string | null
          responded_at?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitation_token?: string | null
          receiver_email?: string
          receiver_id?: string | null
          responded_at?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          user_id_1: string
          user_id_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id_1: string
          user_id_2: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id_1?: string
          user_id_2?: string
        }
        Relationships: []
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
          accept_notifications: boolean | null
          allow_search_by_username: boolean | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          favorite_event_type: string | null
          founder_member: boolean | null
          founder_since: string | null
          hide_profile_prompt: boolean | null
          id: string
          is_founder: boolean | null
          language: string | null
          phone: string | null
          premium_until: string | null
          state: string | null
          storage_multiplier: number | null
          terms_accepted_at: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          accept_notifications?: boolean | null
          allow_search_by_username?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_event_type?: string | null
          founder_member?: boolean | null
          founder_since?: string | null
          hide_profile_prompt?: boolean | null
          id: string
          is_founder?: boolean | null
          language?: string | null
          phone?: string | null
          premium_until?: string | null
          state?: string | null
          storage_multiplier?: number | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          accept_notifications?: boolean | null
          allow_search_by_username?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_event_type?: string | null
          founder_member?: boolean | null
          founder_since?: string | null
          hide_profile_prompt?: boolean | null
          id?: string
          is_founder?: boolean | null
          language?: string | null
          phone?: string | null
          premium_until?: string | null
          state?: string | null
          storage_multiplier?: number | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          username?: string | null
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
          public_location: string | null
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
          public_location?: string | null
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
          public_location?: string | null
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
      user_addresses: {
        Row: {
          city: string
          complement: string | null
          country: string
          created_at: string
          id: string
          is_primary: boolean
          neighborhood: string
          nickname: string
          number: string
          state: string
          street: string
          updated_at: string
          user_id: string
          zip_code: string
        }
        Insert: {
          city: string
          complement?: string | null
          country?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          neighborhood: string
          nickname: string
          number: string
          state: string
          street: string
          updated_at?: string
          user_id: string
          zip_code: string
        }
        Update: {
          city?: string
          complement?: string | null
          country?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          neighborhood?: string
          nickname?: string
          number?: string
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          evento_id: number | null
          feedback_type: string
          id: string
          message_id: string | null
          rating: number | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          evento_id?: number | null
          feedback_type: string
          id?: string
          message_id?: string | null
          rating?: number | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          evento_id?: number | null
          feedback_type?: string
          id?: string
          message_id?: string | null
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "table_reune"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_reune: {
        Row: {
          created_at: string
          email: string
          id: string
          is_founder: boolean | null
          name: string | null
          origin: string | null
          welcome_email_sent: boolean | null
          welcome_email_sent_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_founder?: boolean | null
          name?: string | null
          origin?: string | null
          welcome_email_sent?: boolean | null
          welcome_email_sent_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_founder?: boolean | null
          name?: string | null
          origin?: string | null
          welcome_email_sent?: boolean | null
          welcome_email_sent_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      conversation_metrics: {
        Row: {
          avg_confidence: number | null
          avg_response_time_ms: number | null
          clarification_count: number | null
          correction_count: number | null
          date: string | null
          events_touched: number | null
          total_interactions: number | null
          unique_intents: number | null
          user_id: string | null
        }
        Relationships: []
      }
      founder_members: {
        Row: {
          email: string | null
          founder_since: string | null
          id: string | null
          is_founder: boolean | null
          premium_status: string | null
          premium_until: string | null
          signup_date: string | null
          storage_multiplier: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_event_invitation: {
        Args: { _invitation_token: string; _user_id?: string }
        Returns: Json
      }
      assign_items_bulk: {
        Args: { _assignments: Json; _event_id: number }
        Returns: Json
      }
      check_username_available: {
        Args: { desired_username: string }
        Returns: boolean
      }
      create_missing_profiles: { Args: never; Returns: undefined }
      distribution_bulk_upsert: {
        Args: { evento_id: string; rows: Json }
        Returns: Json[]
      }
      get_distribution_summary: { Args: { evento_id: string }; Returns: Json }
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
          user_id: string
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
      get_event_plan: { Args: { evento_id: string }; Returns: Json }
      get_friends: {
        Args: { _search?: string }
        Returns: {
          avatar_url: string
          display_name: string
          friend_id: string
          username: string | null
        }[]
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
      get_my_email: { Args: never; Returns: string }
      get_pending_friend_requests: {
        Args: never
        Returns: {
          created_at: string
          request_id: string
          sender_avatar: string
          sender_id: string
          sender_name: string
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
      get_profile_completion: { Args: never; Returns: number }
      get_public_events: {
        Args: never
        Returns: {
          categoria_evento: string
          created_at: string
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
      get_storage_multiplier: { Args: { user_id: string }; Returns: number }
      has_active_premium: { Args: { user_id: string }; Returns: boolean }
      is_event_organizer: {
        Args: { _event_id: number; _user_id: string }
        Returns: boolean
      }
      items_replace_for_event: {
        Args: { evento_id: string; itens: Json }
        Returns: Json[]
      }
      mask_location: { Args: { full_location: string }; Returns: string }
      notify_secret_santa_draw: {
        Args: {
          _event_id: number
          _participant_user_ids: string[]
          _secret_santa_id: string
        }
        Returns: undefined
      }
      participants_bulk_upsert: {
        Args: { evento_id: string; participantes: Json }
        Returns: Json[]
      }
      process_invitation: {
        Args: {
          _event_id: number
          _invitee_email: string | null
          _invitee_name: string
          _is_organizer?: boolean
          _invitee_user_id?: string | null
        }
        Returns: Json
      }
      respond_to_friend_request: {
        Args: { _accept: boolean; _request_id: string }
        Returns: Json
      }
      respond_to_suggestion: {
        Args: { _response?: string; _status: string; _suggestion_id: string }
        Returns: Json
      }
      search_user_by_identifier: {
        Args: { _identifier: string }
        Returns: {
          avatar_url: string
          display_name: string
          email: string | null
          id: string
          username: string
        }[]
      }
      send_friend_request: {
        Args: { _receiver_identifier: string }
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
