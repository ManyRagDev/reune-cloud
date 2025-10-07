// Tipos base do domínio UNE.Ai / ReUNE

export type UUID = string;

export type EventStatus =
  | 'collecting_core'
  | 'itens_pendentes_confirmacao'
  | 'distrib_pendente_confirmacao'
  | 'finalizado';

export interface Event {
  id: UUID;
  usuario_id: UUID;
  nome_evento: string;
  tipo_evento: string;
  data_evento: string; // ISO date-time
  qtd_pessoas: number;
  orcamento_total?: number | null;
  status: EventStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Item {
  id: UUID;
  evento_id: UUID;
  nome_item: string;
  quantidade: number;
  unidade: string;
  valor_estimado: number;
  categoria: string;
  prioridade: 'A' | 'B' | 'C';
  created_at?: string;
  updated_at?: string;
}

export interface Participant {
  id: UUID;
  evento_id: UUID;
  nome_participante: string;
  contato?: string | null;
  status_convite: 'pendente' | 'confirmado' | 'recusado';
  preferencias?: Record<string, unknown> | null;
  valor_responsavel?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface DistributionRow {
  id: UUID;
  item_id: UUID;
  participante_id: UUID;
  quantidade_atribuida: number;
  valor_rateado: number;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  id?: string;
}

export interface ConversationState {
  conversationId: string;
  context?: Record<string, unknown>;
  history: Message[];
  lastUpdated: number;
}

export interface AiProfile {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  defaults?: AiProfileDefaults;
}

export type ApiResult<T> = {
  data?: T;
  error?: string;
};

// Itens sugeridos pelos perfis de IA (baseline, não persistidos diretamente)
export interface SuggestedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  priority?: 'A' | 'B' | 'C';
  estimated_cost?: number;
}

export interface AiProfileDefaults {
  suggestedItems?: SuggestedItem[];
}

export interface EventSnapshot {
  evento: Event;
  itens: Item[];
  participantes: Participant[];
  distribuicao: DistributionRow[];
}