export type SecretSantaInviteMode = 'open' | 'individual';

export interface SecretSantaConfig {
  id: string;
  event_id: number;
  min_value?: number | null;
  max_value?: number | null;
  draw_date?: string | null;
  invite_mode: SecretSantaInviteMode;
  has_drawn: boolean;
  rules_json?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface SecretSantaParticipant {
  id: string;
  secret_santa_id: string;
  user_id?: string | null;
  display_name?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  pin_code?: string | null;
  invitation_token?: string | null;
  status: 'pending' | 'confirmed';
  wishlist_text?: string | null;
  wishlist_link?: string | null;
  has_pin?: boolean;
}

export interface SecretSantaInviteInfo {
  event_id: number;
  title: string;
  description?: string | null;
  event_date: string;
  event_time?: string | null;
  location?: string | null;
  address?: string | null;
  secret_santa_id: string;
  min_value?: number | null;
  max_value?: number | null;
  draw_date?: string | null;
  has_drawn: boolean;
  invite_mode: SecretSantaInviteMode;
  participant?: {
    id: string;
    display_name?: string | null;
    status: string;
    wishlist_text?: string | null;
    has_pin: boolean;
  } | null;
  error?: string;
}
