// Tipos para o Admin Email Center

export interface Lead {
  id: string;
  email: string;
  name?: string | null;
  origin: string;
  welcome_email_sent: boolean;
  welcome_email_sent_at?: string | null;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  description?: string | null;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  lead_id?: string | null;
  lead_email: string;
  template_name: string;
  sent_at: string;
  status: 'success' | 'failed' | 'pending';
  error_message?: string | null;
  metadata: {
    resend_message_id?: string;
    variables?: Record<string, string>;
    [key: string]: any;
  };
  created_at: string;
}

export interface AdminSettings {
  id: string;
  key: string;
  value: any;
  description?: string | null;
  updated_at: string;
  created_at: string;
}

export interface EmailStats {
  total: number;
  success: number;
  failed: number;
  pending: number;
}

export interface AdminData {
  waitlist: Lead[];
  events: any[];
  templates: EmailTemplate[];
  settings: AdminSettings[];
  emailStats: EmailStats;
  leadsWithoutWelcome: number;
}

export interface SendEmailRequest {
  lead_ids: string[];
  template_name: string;
  variables?: Record<string, string>;
  password: string;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  results: Array<{
    lead_id: string;
    lead_email?: string;
    status: 'success' | 'failed';
    message_id?: string;
    error?: string;
  }>;
}
