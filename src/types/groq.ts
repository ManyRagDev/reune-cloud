/**
 * Tipos específicos para o serviço Groq
 */

import { UUID } from './domain';

export interface EventContext {
  evento?: {
    id?: string;
    tipo_evento?: string;
    qtd_pessoas?: number;
    data_evento?: string;
    menu?: string;
    finalidade_evento?: string;
    status?: string;
  };
  hasItems?: boolean;
  hasParticipants?: boolean;
  collectedData?: CollectedData;
}

export interface CollectedData {
  tipo_evento?: string;
  qtd_pessoas?: number;
  data_evento?: string;
  menu?: string;
  finalidade_evento?: string;
  descricao?: string;
  evento_id?: string;
  event_status?: string;
  has_items?: boolean;
}

export interface ActionContext {
  userId: UUID;
  collectedData?: CollectedData;
  evento?: {
    id: string;
    status: string;
    tipo_evento?: string;
    qtd_pessoas?: number;
    data_evento?: string;
    menu?: string;
    finalidade_evento?: string;
  };
  hasItems?: boolean;
}

export interface GroqCallResult {
  content: string;
  error?: string;
}
