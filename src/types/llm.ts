// Tipos centrais para integração com LLM

export type LlmMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
};

// Evitar any explícito
export type LlmToolCall = { name: string; arguments: Record<string, unknown> | unknown[] };
// Evitar any explícito
export type SafeLlmToolCall = { name: string; arguments: Record<string, unknown> | unknown[] };

export type LlmChatResponse = {
  provider: string;
  model: string;
  content: string;
  toolCalls?: Array<SafeLlmToolCall>;
};