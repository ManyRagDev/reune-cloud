/**
 * Interfaces TypeScript para o banco de dados Supabase
 * Criado manualmente baseado na estrutura do código
 */

export interface Item {
  id: string;
  evento_id: string;
  nome_item: string;
  quantidade: number;
  unidade: string;
  valor_estimado: number;
  categoria: 'comida' | 'bebida' | 'descartaveis' | 'decoracao' | 'combustivel' | 'outros';
  prioridade: 'A' | 'B' | 'C';
  created_at?: string;
}

export interface Event {
  id: string;
  usuario_id: string;
  nome_evento: string;
  tipo_evento: string;
  qtd_pessoas: number;
  data_evento?: string;
  status: 'draft' | 'collecting_core' | 'created' | 'finalized' | 'cancelled';
  menu?: string;
  finalidade_evento?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConversationMessage {
  id: string;
  usuario_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  evento_id?: number;
  created_at?: string;
}

export interface ConversationContext {
  id: string;
  usuario_id: string;
  state: 'idle' | 'collecting_core' | 'created' | 'finalized' | 'cancelled';
  collected_data: Record<string, unknown>;
  evento_id?: number;
  missing_slots: string[];
  confidence_level: number;
  last_intent?: string;
  summary?: string;
  history_length?: number;
  created_at?: string;
  updated_at?: string;
}
