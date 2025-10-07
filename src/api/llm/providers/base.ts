export type LlmMessage = { role: 'system' | 'user' | 'assistant' | 'tool'; content: string };

export interface LlmProviderInput {
  messages: LlmMessage[];
  tools?: Array<Record<string, unknown>>;
  temperature?: number;
  maxTokens?: number;
  idempotencyKey?: string;
}

export interface LlmProviderOutput {
  content: string;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> | unknown[]; id?: string }>;
}

export interface LlmProvider {
  chat(input: LlmProviderInput): Promise<LlmProviderOutput>;
}