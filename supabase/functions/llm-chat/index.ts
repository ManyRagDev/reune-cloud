// Supabase Edge Function: POST /llm/chat
// Server-side: lê envs LLM_* via Deno.env. Não expõe chaves ao cliente.
// Recursos: autenticação por Bearer, rate-limit simples, idempotência 60s, maskPII para SaaS.

// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Message = { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; name?: string; tool_call_id?: string };
type ToolCall = { name: string; arguments: Record<string, unknown>; id?: string };

const PROVIDER = (Deno.env.get('LLM_PROVIDER') || 'ollama').toLowerCase();
const MODEL = Deno.env.get('LLM_MODEL') || 'llama3.2:3b-instruct-q4';
const BASE_URL = Deno.env.get('LLM_BASE_URL') || 'http://localhost:11434';
const API_KEY = Deno.env.get('LLM_API_KEY') || '';
const DEFAULT_TEMP = Number(Deno.env.get('LLM_TEMPERATURE') ?? 0.2);
const DEFAULT_MAX_TOKENS = Deno.env.get('LLM_MAX_TOKENS') ? Number(Deno.env.get('LLM_MAX_TOKENS')) : undefined;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const MAX_TOOL_ITERS = Number(Deno.env.get('LLM_TOOL_MAX_ITERS') ?? 3);

type GeminiMessage = { role: 'user' | 'model'; parts: { text: string }[] };
type GeminiFunctionDeclaration = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

// Gemini-specific helpers
function mapToGeminiRoles(messages: Message[]): GeminiMessage[] {
  return messages.map((msg) => {
    let role: 'user' | 'model' = 'user';
    if (msg.role === 'assistant') role = 'model';
    return {
      role: role,
      parts: [{ text: msg.content }],
    };
  });
}

async function streamGemini(
  messages: Message[],
  temperature: number,
  maxTokens?: number,
  tools?: GeminiFunctionDeclaration[],
): Promise<ReadableStream<Uint8Array>> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse`;
  const headers = {
    'Content-Type': 'application/json',
    'x-goog-api-key': API_KEY,
  };

  // O histórico para Gemini é uma lista de conteúdos com papéis alternados.
  const contents = mapToGeminiRoles(messages);

  const body = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
    tools: tools ? [{ function_declarations: tools }] : undefined,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${res.status} ${errorText}`);
  }

  // Transforma o stream SSE do Gemini no formato esperado pelo cliente (JSON com `content`).
  const reader = res.body!.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      // Respostas SSE vêm com "data: " no início.
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const jsonStr = line.substring(5).trim();
        if (jsonStr === '[DONE]') {
          controller.close();
          return;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          // A resposta do Gemini tem o texto em `candidates[0].content.parts[0].text`
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            controller.enqueue(encoder.encode(JSON.stringify({ content: text })));
          }
        } catch (e) {
          // Ignora linhas que não são JSON válido (p.ex., linhas vazias entre eventos)
        }
      }
    },
  });
}


// In-memory estruturas (adequadas para MVP; para produção usar KV/cache externo)
const cache = new Map<string, { content: string; toolCalls?: ToolCall[]; ts: number }>();
const rateWindowMs = 60_000;
const rateLimitPerUser = 10;
const userHits = new Map<string, number[]>();

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}

function errorResponse(code: 'forbidden' | 'rate_limit' | 'bad_request' | 'server_error' | 'unauthorized', message: string, status: number, details?: unknown) {
  return jsonResponse({ error: { code, message, details } }, status);
}

function decodeJwtSub(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || payload.user_id || null;
  } catch {
    return null;
  }
}

function maskPII(text: string): string {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b\+?\d{2,3}[\s-]?\d{3,5}[\s-]?\d{4,6}\b/g, '[phone]');
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const arr = userHits.get(userId) || [];
  const recent = arr.filter((t) => now - t < rateWindowMs);
  recent.push(now);
  userHits.set(userId, recent);
  return recent.length <= rateLimitPerUser;
}

// Helpers RPC: chamar funções Postgres via REST usando o token do usuário (para RLS/ACL via auth.uid())
async function postRpc<TResponse>(rpcName: string, payload: unknown, userToken: string, idempotencyKey?: string): Promise<TResponse> {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL não configurado');
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/${rpcName}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userToken}`,
  };
  if (SUPABASE_ANON_KEY) headers['apikey'] = SUPABASE_ANON_KEY;
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`rpc:${rpcName} ${res.status} ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as TResponse;
  return (await res.text()) as unknown as TResponse;
}

// Tools padrão para SaaS (OpenAI-compatible), seguindo schemas mínimos
const defaultTools = [
  {
    type: 'function',
    function: {
      name: 'generateItemList',
      description: 'Gerar lista inicial de itens para um evento',
      parameters: {
        type: 'object',
        properties: {
          evento_id: { type: 'string', description: 'ID do evento (UUID)' },
          tipo_evento: { type: 'string', enum: ['churrasco', 'piquenique', 'jantar'] },
          qtd_pessoas: { type: 'number' },
        },
        required: ['evento_id', 'tipo_evento', 'qtd_pessoas'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'confirmItems',
      description: 'Confirmar/atualizar itens do evento',
      parameters: {
        type: 'object',
        properties: {
          evento_id: { type: 'string' },
          itens_editados: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                nome_item: { type: 'string' },
                quantidade: { type: 'number' },
                unidade: { type: 'string' },
                valor_estimado: { type: 'number' },
                categoria: { type: 'string' },
                prioridade: { type: 'string', enum: ['A', 'B', 'C'] },
              },
              required: ['nome_item', 'quantidade', 'unidade', 'valor_estimado', 'categoria', 'prioridade'],
            },
          },
        },
        required: ['evento_id', 'itens_editados'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'computeCostSplit',
      description: 'Calcular rateio de custos baseado em itens e participantes',
      parameters: {
        type: 'object',
        properties: { evento_id: { type: 'string' } },
        required: ['evento_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'addParticipants',
      description: 'Adicionar ou atualizar participantes do evento',
      parameters: {
        type: 'object',
        properties: {
          evento_id: { type: 'string' },
          participantes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                nome_participante: { type: 'string' },
                contato: { type: 'string' },
                status_convite: { type: 'string', enum: ['pendente', 'confirmado', 'recusado'] },
                preferencias: { type: 'object' },
                valor_responsavel: { type: 'number' },
              },
            },
          },
        },
        required: ['evento_id', 'participantes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getPlan',
      description: 'Obter plano completo do evento',
      parameters: {
        type: 'object',
        properties: { evento_id: { type: 'string' } },
        required: ['evento_id'],
      },
    },
  },
];

async function getPlan(evento_id: string, userToken: string) {
  return await postRpc<{ evento: Record<string, unknown>; itens: Array<Record<string, unknown>>; participantes: Array<Record<string, unknown>>; distribuicao: Array<Record<string, unknown>> }>('get_event_plan', { evento_id }, userToken);
}

async function getDistributionSummary(evento_id: string, userToken: string) {
  return await postRpc<{ porParticipante: Array<{ participante_id: string; total: number }>; custoTotal: number }>('get_distribution_summary', { evento_id }, userToken);
}

function estimateQuantityPerPersonSimple(itemName: string): number {
  const lower = itemName.toLowerCase();
  if (lower.includes('carne')) return 0.4;
  if (lower.includes('bebida')) return 1;
  return 1;
}

type SimpleItem = { id: string; valor_estimado?: number | string; quantidade?: number | string };
type SimpleParticipant = { id: string; status_convite?: string };
type Distribution = { id: string; item_id: string; participante_id: string; quantidade_atribuida: number; valor_rateado: number; observacoes: string | null };

function computeCostSplitSimple(items: Array<Record<string, unknown>>, participants: Array<Record<string, unknown>>): Distribution[] {
  const active = participants.filter((p) => (p as SimpleParticipant).status_convite !== 'recusado');
  const base = active.length > 0 ? active : participants;
  const out: Distribution[] = [];
  for (const item of items) {
    const it = item as SimpleItem;
    const cost = Number(it.valor_estimado || 0);
    const qty = Number(it.quantidade || 0);
    const perCost = cost / Math.max(1, base.length);
    const perQty = qty / Math.max(1, base.length);
    for (const p of base) {
      const part = p as SimpleParticipant;
      const it = item as SimpleItem;
      out.push({
        id: crypto.randomUUID(),
        item_id: it.id,
        participante_id: part.id,
        quantidade_atribuida: Number.isFinite(perQty) ? perQty : 0,
        valor_rateado: Number.isFinite(perCost) ? perCost : 0,
        observacoes: null,
      });
    }
  }
  return out;
}

async function runToolCall(userId: string, call: ToolCall, userToken: string, idempotencyKey?: string): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const started = performance.now();
  const name = call?.name;
  const args = call?.arguments || {};
  try {
    const evento_id = String(args.evento_id || '').trim();
    if (!evento_id) return { ok: false, error: 'invalid_params: evento_id obrigatório' };

    // ACL: conferir dono via events_plan (usa auth.uid() do token do usuário)
    const plan = await getPlan(evento_id, userToken).catch((e) => {
      const msg = e instanceof Error ? e.message : String(e);
      if (/42501|not authorized/i.test(msg)) throw new Error('forbidden');
      throw e;
    });
    if (String(plan.evento?.usuario_id) !== String(userId)) {
      const duration_ms = Math.round(performance.now() - started);
      console.debug(JSON.stringify({ tool: name, evento_id, duration_ms, error: 'forbidden' }));
      return { ok: false, error: 'forbidden' };
    }

    switch (name) {
      case 'generateItemList': {
        const tipo_evento = String(args.tipo_evento || plan.evento?.tipo_evento || 'churrasco');
        const qtd_pessoas = Number(args.qtd_pessoas || plan.evento?.qtd_pessoas || 0);
        const baseSuggestions = [
          { name: 'Carne', unit: 'kg', category: 'proteina', priority: 'A' as const },
          { name: 'Bebida', unit: 'L', category: 'bebida', priority: 'A' as const },
        ];
        const itens = baseSuggestions.map((s) => {
          const per = estimateQuantityPerPersonSimple(s.name);
          const qty = Math.round(per * Math.max(1, qtd_pessoas) * 100) / 100;
          return {
            nome_item: s.name,
            quantidade: qty,
            unidade: s.unit,
            valor_estimado: 0,
            categoria: s.category,
            prioridade: s.priority,
          };
        });
        const persisted = await postRpc<unknown[]>('items_replace_for_event', { evento_id, itens }, userToken, idempotencyKey);
        const finalPlan = await getPlan(evento_id, userToken);
        const duration_ms = Math.round(performance.now() - started);
        console.debug(JSON.stringify({ tool: name, evento_id, duration_ms, ok: true, count: Array.isArray(persisted) ? persisted.length : 0 }));
        return { ok: true, data: { plan: finalPlan } };
      }
      case 'confirmItems': {
        const itens_editados = Array.isArray(args.itens_editados) ? args.itens_editados : [];
        const persisted = await postRpc<unknown[]>('items_replace_for_event', { evento_id, itens: itens_editados }, userToken, idempotencyKey);
        const finalPlan = await getPlan(evento_id, userToken);
        const duration_ms = Math.round(performance.now() - started);
        console.debug(JSON.stringify({ tool: name, evento_id, duration_ms, ok: true, count: Array.isArray(persisted) ? persisted.length : 0 }));
        return { ok: true, data: { plan: finalPlan } };
      }
      case 'computeCostSplit': {
        const rows = computeCostSplitSimple(plan.itens, plan.participantes);
        const persisted = await postRpc<unknown[]>('distribution_bulk_upsert', { evento_id, rows }, userToken, idempotencyKey);
        const summary = await getDistributionSummary(evento_id, userToken);
        const duration_ms = Math.round(performance.now() - started);
        console.debug(JSON.stringify({ tool: name, evento_id, duration_ms, ok: true, rows: Array.isArray(persisted) ? persisted.length : 0 }));
        return { ok: true, data: { summary } };
      }
      case 'addParticipants': {
        const participantes = Array.isArray(args.participantes) ? args.participantes : [];
        const persisted = await postRpc<unknown[]>('participants_bulk_upsert', { evento_id, participantes }, userToken, idempotencyKey);
        const duration_ms = Math.round(performance.now() - started);
        console.debug(JSON.stringify({ tool: name, evento_id, duration_ms, ok: true, count: Array.isArray(persisted) ? persisted.length : 0 }));
        return { ok: true, data: { participantes: persisted } };
      }
      case 'getPlan': {
        const plan2 = await getPlan(evento_id, userToken);
        const duration_ms = Math.round(performance.now() - started);
        console.debug(JSON.stringify({ tool: name, evento_id, duration_ms, ok: true }));
        return { ok: true, data: { plan: plan2 } };
      }
      default: {
        const duration_ms = Math.round(performance.now() - started);
        console.debug(JSON.stringify({ tool: name, duration_ms, error: 'unknown_tool' }));
        return { ok: false, error: 'unknown_tool' };
      }
    }
  } catch (e) {
    const duration_ms = Math.round(performance.now() - started);
    const msg = e instanceof Error ? e.message : String(e);
    console.debug(JSON.stringify({ tool: name, duration_ms, error: msg }));
    if (/forbidden/i.test(msg)) return { ok: false, error: 'forbidden' };
    return { ok: false, error: msg };
  }
}

async function ollamaChat(messages: Message[], temperature: number, maxTokens?: number): Promise<{ content: string }> {
  const prompt = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  const body: Record<string, unknown> = {
    model: MODEL,
    prompt,
    stream: false,
    options: { temperature } as Record<string, unknown>,
  };
  if (maxTokens && typeof body.options === 'object' && body.options !== null) {
    (body.options as Record<string, unknown>).num_predict = maxTokens;
  }

  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { response?: string };
  return { content: data.response ?? '' };
}

async function saasStubChat(messages: Message[], tools?: Array<Record<string, unknown>>): Promise<{ content: string; toolCalls?: ToolCall[] }> {
  // Real SaaS chat via OpenAI-compatible endpoint (OpenAI, Groq, Together)
  const base = BASE_URL.replace(/\/$/, '');
  const url = `${base}/chat/completions`;
  const body: Record<string, unknown> = { model: MODEL, messages, temperature: DEFAULT_TEMP };
  if (DEFAULT_MAX_TOKENS) body.max_tokens = DEFAULT_MAX_TOKENS;
  if (tools && tools.length) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }
  if (!API_KEY) throw new Error('LLM_API_KEY ausente para provider SaaS');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`saas_chat ${res.status} ${text}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string | null; tool_calls?: Array<{ id?: string; function: { name: string; arguments: string } }> } }> };
  const choice = data.choices?.[0];
  const content = choice?.message?.content ?? '';
  const toolCalls = choice?.message?.tool_calls?.map((tc) => {
    let parsed: unknown;
    try {
      parsed = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
    } catch {
      parsed = { raw: tc.function.arguments };
    }
    return { name: tc.function.name, arguments: parsed as Record<string, unknown>, id: tc.id };
  });
  return { content, toolCalls };
}

// Zod Schemas para validação de tool params no Edge
// Aceitar UUID como string não vazia; validação de formato pode ser feita no DB
const uuidStr = z.string().min(1);
const generateItemListSchema = z.object({
  evento_id: uuidStr,
  tipo_evento: z.enum(['churrasco', 'piquenique', 'jantar']),
  qtd_pessoas: z.number().int().min(1),
  preferencias: z.record(z.any()).optional(),
});
const itemSchema = z.object({
  id: z.string().optional(),
  evento_id: z.string().optional(),
  nome_item: z.string().min(1),
  quantidade: z.number().min(0),
  unidade: z.string().min(1),
  valor_estimado: z.number().min(0),
  categoria: z.string().min(1),
  prioridade: z.enum(['A', 'B', 'C']),
});
const confirmItemsSchema = z.object({
  evento_id: uuidStr,
  itens_editados: z.array(itemSchema),
});
const computeCostSplitSchema = z.object({ evento_id: uuidStr });
const participantSchema = z.object({
  id: z.string().optional(),
  nome_participante: z.string().min(1),
  contato: z.string().optional().nullable(),
  status_convite: z.enum(['pendente', 'confirmado', 'recusado']).default('pendente'),
  preferencias: z.record(z.any()).optional().nullable(),
  valor_responsavel: z.number().optional().nullable(),
});
const addParticipantsSchema = z.object({
  evento_id: uuidStr,
  participantes: z.array(participantSchema),
});
const getPlanSchema = z.object({ evento_id: uuidStr });
const edgeToolSchemas: Record<string, z.ZodSchema<unknown>> = {
  generateItemList: generateItemListSchema,
  confirmItems: confirmItemsSchema,
  computeCostSplit: computeCostSplitSchema,
  addParticipants: addParticipantsSchema,
  getPlan: getPlanSchema,
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') return errorResponse('bad_request', 'Método não permitido', 405);

    const auth = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) return errorResponse('unauthorized', 'Token ausente', 401);
    const token = auth.substring('Bearer '.length);
    const userId = decodeJwtSub(token);
    if (!userId) return errorResponse('unauthorized', 'Token inválido', 401);

    // Rate-limit por usuário
    if (!checkRateLimit(userId)) return errorResponse('rate_limit', 'Rate limit excedido', 429);

    const idemKey = req.headers.get('Idempotency-Key') || undefined;
    if (idemKey) {
      const ent = cache.get(idemKey);
      if (ent && Date.now() - ent.ts <= 60_000) {
        return jsonResponse({ provider: PROVIDER, model: MODEL, content: ent.content, toolCalls: ent.toolCalls ?? undefined }, 200);
      }
    }

    const body = await req.json();
    const messages: Message[] = Array.isArray(body?.messages) ? body.messages : [];
    const systemPrompt: string | undefined = body?.systemPrompt || undefined;
  const tools: Array<Record<string, unknown>> | undefined = Array.isArray(body?.tools) ? body.tools : undefined;
    const temperature = typeof body?.temperature === 'number' ? body.temperature : DEFAULT_TEMP;
    const maxTokens = DEFAULT_MAX_TOKENS;

    if (!messages.length) return errorResponse('bad_request', 'Body inválido: messages requerido', 400);

    // Validar API key quando provider não for Ollama
    const isSaaS = PROVIDER !== 'ollama';
    if (isSaaS && !API_KEY) {
      return errorResponse('bad_request', `LLM_API_KEY ausente para provider ${PROVIDER}`, 400);
    }

    // Montar system default
    const systemDefault = 'Você é a UNE.AI. Nunca invente números. Para quantidades, preços e rateio, SEMPRE use ferramentas. Se faltar dado, pergunte curto e claro.';
    const msgs: Message[] = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : [{ role: 'system', content: systemDefault }, ...messages];

    // Mask PII para SaaS (não-Ollama)
    const finalMessages = PROVIDER === 'ollama'
      ? msgs
      : msgs.map((m) => (m.role === 'user' || m.role === 'assistant' ? { ...m, content: maskPII(m.content) } : m));

    if (PROVIDER === 'gemini') {
      const geminiTools = tools?.map(t => {
        const tool = t as Record<string, unknown>;
        const func = tool?.function as Record<string, unknown> | undefined;
        return {
          name: String(func?.name ?? ''),
          description: String(func?.description ?? ''),
          parameters: (func?.parameters as Record<string, unknown>) ?? {},
        };
      }) as GeminiFunctionDeclaration[] | undefined;
      const stream = await streamGemini(finalMessages, temperature, maxTokens, geminiTools);
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          ...corsHeaders,
        },
      });
    }

    const started = performance.now();
    let result: { content: string; toolCalls?: ToolCall[] };
    if (PROVIDER === 'ollama') {
      if (tools?.length) {
        console.debug(JSON.stringify({ route: '/llm/chat', provider: PROVIDER, model: MODEL, user_id: userId, info: 'tools present but ignored for ollama' }));
      }
      result = await ollamaChat(finalMessages, temperature, maxTokens);
    } else {
      // Para SaaS: injetar tools padrão se ausentes e executar loop multi-turn com validação Zod (máx N)
      const toolsToSend = Array.isArray(tools) && tools.length ? tools : defaultTools;
      const idemKey = req.headers.get('Idempotency-Key') || undefined;
      const messagesState: Message[] = [...finalMessages];
      const executed: ToolCall[] = [];

      let finalContent = '';
      for (let iter = 0; iter < MAX_TOOL_ITERS; iter++) {
        const stepStart = performance.now();
        const stepRes = await saasStubChat(messagesState, toolsToSend);
        const stepDuration = Math.round(performance.now() - stepStart);
        console.debug(JSON.stringify({ route: '/llm/chat', provider: PROVIDER, model: MODEL, user_id: userId, iteration: iter + 1, duration_ms: stepDuration, toolCallsCount: stepRes.toolCalls?.length ?? 0 }));

        if (!stepRes.toolCalls || stepRes.toolCalls.length === 0) {
          finalContent = stepRes.content || (executed.length ? 'Ferramentas executadas com sucesso.' : stepRes.content || '');
          break;
        }

        // Tomar a primeira call por iteração para encadear tool→tool
        const call = stepRes.toolCalls[0];

        // Validação Zod antes do router
        const schema = edgeToolSchemas[call.name];
        if (!schema) {
          return errorResponse('bad_request', `Tool desconhecida: ${call.name}`, 400, { tool: call.name });
        }
        const parsed = schema.safeParse(call.arguments);
        if (!parsed.success) {
          const details = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
          console.debug(JSON.stringify({ route: '/llm/chat', tool: call.name, evento_id: call.arguments?.evento_id, validated: false, iteration: iter + 1, details }));
          return errorResponse('bad_request', `Parâmetros inválidos para ${call.name}`, 400, { tool: call.name, details });
        }
        const validatedArgs = parsed.data;

        const perCallKey = idemKey ? `${idemKey}:${call.id ?? iter + 1}` : undefined;
        const toolStart = performance.now();
        const argsAsRecord = validatedArgs as Record<string, unknown>;
        const r = await runToolCall(userId, { name: call.name, arguments: argsAsRecord, id: call.id }, token, perCallKey);
        const toolDuration = Math.round(performance.now() - toolStart);
        console.debug(JSON.stringify({ route: '/llm/chat', tool: call.name, tool_call_id: call.id, evento_id: argsAsRecord?.evento_id, validated: true, iteration: iter + 1, duration_ms: toolDuration, ok: r.ok, error: r.error }));

        executed.push({ name: call.name, arguments: argsAsRecord, id: call.id });

        if (!r.ok) {
          if (r.error === 'forbidden') {
            return errorResponse('forbidden', 'Acesso negado ao evento', 403, { tool: call.name, evento_id: argsAsRecord?.evento_id });
          }
          return errorResponse('server_error', r.error || 'Falha ao executar ferramenta', 500, { tool: call.name, evento_id: argsAsRecord?.evento_id });
        }

        // Anexar mensagem de tool com resultado para reenvio ao provedor (multi-turn)
        messagesState.push({ role: 'tool', name: call.name, content: JSON.stringify(r.data ?? { ok: true }), tool_call_id: call.id });
      }

      // Opcional: após mutações, obter plano atualizado se último passo afetou evento
      const lastArgs = executed.length ? executed[executed.length - 1].arguments : undefined;
      const lastEvento = lastArgs && typeof lastArgs === 'object' && 'evento_id' in lastArgs && typeof (lastArgs as Record<string, unknown>).evento_id === 'string'
        ? (lastArgs as Record<string, unknown>).evento_id
        : undefined;
      if (lastEvento && executed.length > 0) {
        try {
          await getPlan(String(lastEvento), token);
          finalContent = finalContent || 'Plano atualizado. Itens, participantes e rateio sincronizados.';
        } catch (_) {
          finalContent = finalContent || 'Ferramentas executadas com sucesso.';
        }
      }

      // Se nada foi executado e havia tools, logar ignorado
      if (executed.length === 0 && toolsToSend?.length) {
        console.debug(JSON.stringify({ route: '/llm/chat', provider: PROVIDER, model: MODEL, user_id: userId, info: 'tools present but no toolCalls' }));
      }

      result = { content: finalContent || '', toolCalls: executed };
    }
    const duration_ms = Math.round(performance.now() - started);

    // Cache idempotente curto (60s)
    if (idemKey) cache.set(idemKey, { content: result.content, toolCalls: result.toolCalls, ts: Date.now() });

    // Logs mínimos
    console.debug(JSON.stringify({ route: '/llm/chat', provider: PROVIDER, model: MODEL, user_id: userId, duration_ms, idempotent: Boolean(idemKey), toolCallsCount: result.toolCalls?.length ?? 0 }));

    return jsonResponse({ provider: PROVIDER, model: MODEL, content: result.content, toolCalls: result.toolCalls ?? undefined }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    if (/forbidden/i.test(msg)) return errorResponse('forbidden', 'Acesso negado', 403);
    if (/LLM_API_KEY ausente/i.test(msg)) return errorResponse('bad_request', msg, 400);
    if (/saas_chat \d{3}/i.test(msg)) return errorResponse('server_error', msg, 500);
    return errorResponse('server_error', msg, 500);
  }
});