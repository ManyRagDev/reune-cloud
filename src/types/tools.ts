// Tipos para function-calling de ferramentas do UNE.Ai

export type ToolCall = { name: string; arguments: Record<string, unknown> | unknown[] };

export type ToolName =
  | 'generateItemList'
  | 'confirmItems'
  | 'computeCostSplit'
  | 'addParticipants'
  | 'getPlan';

export type GenerateItemListArgs = {
  evento_id: string;
  tipo_evento: string;
  qtd_pessoas: number;
  preferencias?: Record<string, unknown> | undefined;
};

export type ConfirmItemsArgs = {
  evento_id: string;
  itens_editados?: unknown[]; // manter flexível; validação via schemas zod
};

export type ComputeCostSplitArgs = {
  evento_id: string;
};

export type AddParticipantsArgs = {
  evento_id: string;
  participantes: unknown[]; // manter flexível; validação via schemas zod
};

export type GetPlanArgs = {
  evento_id: string;
};