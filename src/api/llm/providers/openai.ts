import type { LlmProvider, LlmProviderInput, LlmProviderOutput } from './base';

const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';
const API_KEY = process.env.LLM_API_KEY || '';
const BASE_URL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';

type OpenAIChatChoice = {
  message?: {
    role?: string;
    content?: string | null;
    tool_calls?: Array<{ type: string; id?: string; function: { name: string; arguments: string } }>;
  };
};

export class OpenAiProvider implements LlmProvider {
  async chat(input: LlmProviderInput): Promise<LlmProviderOutput> {
    if (!API_KEY) throw new Error('OPENAI_API_KEY ausente (LLM_API_KEY)');
    const { messages, temperature = Number(process.env.LLM_TEMPERATURE ?? 0.2), maxTokens, tools } = input;

    const url = `${BASE_URL.replace(/\/$/, '')}/chat/completions`;
    const body: Record<string, unknown> = {
      model: MODEL,
      messages,
      temperature,
    };
    if (maxTokens) body.max_tokens = maxTokens;
    if (tools && tools.length) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenAI error ${res.status}: ${text || res.statusText}`);
    }
    const data = (await res.json()) as { choices?: OpenAIChatChoice[] };
    const choice = data.choices?.[0];
    const content = choice?.message?.content ?? '';
    const toolCalls = choice?.message?.tool_calls?.map((tc) => {
      let parsed: unknown;
      try {
        parsed = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
      } catch {
        parsed = { raw: tc.function.arguments };
      }
      return { name: tc.function.name, arguments: parsed as Record<string, unknown> | unknown[], id: tc.id };
    });
    return { content, toolCalls };
  }
}
