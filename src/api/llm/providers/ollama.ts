import type { LlmProvider, LlmProviderInput, LlmProviderOutput } from './base';

// Leitura de env server-side (não usar VITE_ aqui)
const PROVIDER = process.env.LLM_PROVIDER || 'ollama';
const MODEL = process.env.LLM_MODEL || 'llama3.2:3b-instruct-q4';
const BASE_URL = process.env.LLM_BASE_URL || 'http://localhost:11434';

type OllamaResponse = {
  response?: string;
};

export class OllamaProvider implements LlmProvider {
  async chat(input: LlmProviderInput): Promise<LlmProviderOutput> {
    const { messages, temperature = Number(process.env.LLM_TEMPERATURE ?? 0.2), maxTokens } = input;
    // Ollama /api/generate espera um prompt único; para chat simples concatenamos
    const prompt = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const body: Record<string, unknown> = {
      model: MODEL,
      prompt,
      stream: false,
      options: {
        temperature,
      } as Record<string, unknown>,
    };
    if (maxTokens && typeof body.options === 'object' && body.options !== null) {
      (body.options as Record<string, unknown>).num_predict = maxTokens;
    }

    const url = `${BASE_URL}/api/generate`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama error: ${res.status} ${text}`);
    }

    const data = (await res.json()) as OllamaResponse;
    return { content: data.response ?? '' };
  }
}