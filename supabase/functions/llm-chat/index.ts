// Supabase Edge Function: POST /llm/chat
// Usa Lovable AI Gateway para chat com Gemini 2.5 Flash
// Recursos: autenticação, rate-limit, tool calling, idempotência

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

// Configuração Groq API
// Use a variável de ambiente GROQ_API_KEY (não exponha a chave do front)
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile'; // Modelo gratuito no Groq
const DEFAULT_TEMP = 0.3;
const MAX_TOOL_ITERS = 3;

// Supabase config
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

// Cache e rate limiting
const cache = new Map<string, { content: string; toolCalls?: ToolCall[]; ts: number }>();
const rateWindowMs = 60_000;
const rateLimitPerUser = 10;
const userHits = new Map<string, number[]>();

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}

function errorResponse(code: string, message: string, status: number, details?: unknown) {
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

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const arr = userHits.get(userId) || [];
  const recent = arr.filter((t) => now - t < rateWindowMs);
  recent.push(now);
  userHits.set(userId, recent);
  return recent.length <= rateLimitPerUser;
}

// RPC helpers para chamar Postgres functions
async function postRpc<TResponse>(rpcName: string, payload: unknown, userToken: string): Promise<TResponse> {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL não configurado');
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/${rpcName}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userToken}`,
  };
  if (SUPABASE_ANON_KEY) headers['apikey'] = SUPABASE_ANON_KEY;
  
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`rpc:${rpcName} ${res.status} ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as TResponse;
  return (await res.text()) as unknown as TResponse;
}

// Tools disponíveis para o LLM
const defaultTools = [
  {
    type: 'function',
    function: {
      name: 'generateItemList',
      description: 'Gerar lista inicial de itens para um evento',
      parameters: {
        type: 'object',
        properties: {
          evento_id: { type: 'string', description: 'ID do evento' },
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
      name: 'addParticipants',
      description: 'Adicionar participantes ao evento',
      parameters: {
        type: 'object',
        properties: {
          evento_id: { type: 'string' },
          participantes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nome_participante: { type: 'string' },
                contato: { type: 'string' },
              },
              required: ['nome_participante'],
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
  return await postRpc<{ 
    evento: Record<string, unknown>; 
    itens: Array<Record<string, unknown>>; 
    participantes: Array<Record<string, unknown>>; 
  }>('get_event_plan', { evento_id }, userToken);
}

function estimateQuantityPerPersonSimple(itemName: string): number {
  const lower = itemName.toLowerCase();
  if (lower.includes('carne')) return 0.4;
  if (lower.includes('linguiça') || lower.includes('linguica')) return 0.2;
  if (lower.includes('pão') || lower.includes('pao')) return 2;
  if (lower.includes('cerveja')) return 2;
  if (lower.includes('refrigerante')) return 1;
  if (lower.includes('carvão') || lower.includes('carvao')) return 1;
  return 1;
}

// Validação Zod
const uuidStr = z.string().min(1);
const generateItemListSchema = z.object({
  evento_id: uuidStr,
  tipo_evento: z.enum(['churrasco', 'piquenique', 'jantar']),
  qtd_pessoas: z.number().int().min(1),
});
const itemSchema = z.object({
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
const participantSchema = z.object({
  nome_participante: z.string().min(1),
  contato: z.string().optional(),
});
const addParticipantsSchema = z.object({
  evento_id: uuidStr,
  participantes: z.array(participantSchema),
});
const getPlanSchema = z.object({ evento_id: uuidStr });

const edgeToolSchemas: Record<string, z.ZodSchema<unknown>> = {
  generateItemList: generateItemListSchema,
  confirmItems: confirmItemsSchema,
  addParticipants: addParticipantsSchema,
  getPlan: getPlanSchema,
};

// Executar tool calls
async function runToolCall(
  userId: string, 
  call: ToolCall, 
  userToken: string
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const started = performance.now();
  const name = call?.name;
  const args = call?.arguments || {};
  
  try {
    const evento_id = String(args.evento_id || '').trim();
    if (!evento_id) return { ok: false, error: 'evento_id obrigatório' };

    // Verificar acesso ao evento
    const plan = await getPlan(evento_id, userToken).catch((e) => {
      const msg = e instanceof Error ? e.message : String(e);
      if (/42501|not authorized/i.test(msg)) throw new Error('forbidden');
      throw e;
    });
    
    if (String(plan.evento?.user_id) !== String(userId)) {
      console.debug(JSON.stringify({ tool: name, evento_id, error: 'forbidden' }));
      return { ok: false, error: 'forbidden' };
    }

    switch (name) {
      case 'generateItemList': {
        const tipo_evento = String(args.tipo_evento || 'churrasco');
        const qtd_pessoas = Number(args.qtd_pessoas || 0);
        
        // Gerar itens baseados no tipo de evento
        const baseSuggestions = tipo_evento === 'churrasco' 
          ? [
              { name: 'Carne bovina', unit: 'kg', category: 'proteina', priority: 'A' as const },
              { name: 'Linguiça', unit: 'kg', category: 'proteina', priority: 'B' as const },
              { name: 'Pão de alho', unit: 'un', category: 'acompanhamento', priority: 'B' as const },
              { name: 'Cerveja', unit: 'L', category: 'bebida', priority: 'A' as const },
              { name: 'Refrigerante', unit: 'L', category: 'bebida', priority: 'B' as const },
              { name: 'Carvão', unit: 'kg', category: 'suprimento', priority: 'A' as const },
            ]
          : [
              { name: 'Comida', unit: 'kg', category: 'geral', priority: 'A' as const },
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
        
        await postRpc('items_replace_for_event', { evento_id, itens }, userToken);
        const finalPlan = await getPlan(evento_id, userToken);
        console.debug(JSON.stringify({ tool: name, evento_id, ok: true, count: itens.length }));
        return { ok: true, data: { plan: finalPlan } };
      }
      
      case 'confirmItems': {
        const itens_editados = Array.isArray(args.itens_editados) ? args.itens_editados : [];
        await postRpc('items_replace_for_event', { evento_id, itens: itens_editados }, userToken);
        const finalPlan = await getPlan(evento_id, userToken);
        console.debug(JSON.stringify({ tool: name, evento_id, ok: true }));
        return { ok: true, data: { plan: finalPlan } };
      }
      
      case 'addParticipants': {
        const participantes = Array.isArray(args.participantes) ? args.participantes : [];
        await postRpc('participants_bulk_upsert', { evento_id, participantes }, userToken);
        console.debug(JSON.stringify({ tool: name, evento_id, ok: true }));
        return { ok: true, data: { participantes } };
      }
      
      case 'getPlan': {
        const plan2 = await getPlan(evento_id, userToken);
        console.debug(JSON.stringify({ tool: name, evento_id, ok: true }));
        return { ok: true, data: { plan: plan2 } };
      }
      
      default:
        return { ok: false, error: 'unknown_tool' };
    }
  } catch (e) {
    const duration_ms = Math.round(performance.now() - started);
    const msg = e instanceof Error ? e.message : String(e);
    console.error(JSON.stringify({ tool: name, duration_ms, error: msg }));
    if (/forbidden/i.test(msg)) return { ok: false, error: 'forbidden' };
    return { ok: false, error: msg };
  }
}

// Chamar Groq API (OpenAI-compatible)
async function callGroqAI(
  messages: Message[], 
  temperature: number,
  tools?: Array<Record<string, unknown>>
): Promise<{ content: string; toolCalls?: ToolCall[] }> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY não configurado');
  }

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature,
  };
  
  if (tools && tools.length) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 429) {
      throw new Error('Rate limit excedido no Groq. Aguarde um momento.');
    }
    if (res.status === 401) {
      throw new Error('Chave Groq inválida ou ausente.');
    }
    throw new Error(`Groq API error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { 
    choices?: Array<{ 
      message?: { 
        content?: string | null; 
        tool_calls?: Array<{ 
          id?: string; 
          function: { name: string; arguments: string } 
        }> 
      } 
    }> 
  };
  
  const choice = data.choices?.[0];
  const content = choice?.message?.content ?? '';
  const toolCalls = choice?.message?.tool_calls?.map((tc) => {
    let parsed: unknown;
    try {
      parsed = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
    } catch {
      parsed = { raw: tc.function.arguments };
    }
    return { 
      name: tc.function.name, 
      arguments: parsed as Record<string, unknown>, 
      id: tc.id 
    };
  });
  
  return { content, toolCalls };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return errorResponse('bad_request', 'Método não permitido', 405);
    }

    // Autenticação
    const auth = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return errorResponse('unauthorized', 'Token ausente', 401);
    }
    const token = auth.substring('Bearer '.length);
    const userId = decodeJwtSub(token);
    if (!userId) {
      return errorResponse('unauthorized', 'Token inválido', 401);
    }

    // Rate limit
    if (!checkRateLimit(userId)) {
      return errorResponse('rate_limit', 'Rate limit excedido', 429);
    }

    // Verificar chave de idempotência
    const idemKey = req.headers.get('Idempotency-Key') || undefined;
    if (idemKey) {
      const ent = cache.get(idemKey);
      if (ent && Date.now() - ent.ts <= 60_000) {
        return jsonResponse({ 
          provider: 'groq', 
          model: MODEL, 
          content: ent.content, 
          toolCalls: ent.toolCalls 
        }, 200);
      }
    }

    // Parse body
    const body = await req.json();
    const messages: Message[] = Array.isArray(body?.messages) ? body.messages : [];
    const systemPrompt: string | undefined = body?.systemPrompt || undefined;
    const tools: Array<Record<string, unknown>> | undefined = Array.isArray(body?.tools) ? body.tools : undefined;
    const temperature = typeof body?.temperature === 'number' ? body.temperature : DEFAULT_TEMP;

    if (!messages.length) {
      return errorResponse('bad_request', 'messages requerido', 400);
    }

    // System prompt padrão
    const systemDefault = 'Você é a UNE.AI, assistente para planejamento de eventos. Seja direto e claro. Use as ferramentas disponíveis quando necessário.';
    const msgs: Message[] = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...messages] 
      : [{ role: 'system', content: systemDefault }, ...messages];

    // Loop de execução de tools (max 3 iterações)
    const toolsToSend = Array.isArray(tools) ? tools : [];
    const messagesState: Message[] = [...msgs];
    const executed: ToolCall[] = [];
    let finalContent = '';

    const started = performance.now();
    
    for (let iter = 0; iter < MAX_TOOL_ITERS; iter++) {
      const stepRes = await callGroqAI(messagesState, temperature, toolsToSend);
      
      console.debug(JSON.stringify({ 
        iteration: iter + 1, 
        user_id: userId, 
        toolCallsCount: stepRes.toolCalls?.length ?? 0 
      }));

      if (!stepRes.toolCalls || stepRes.toolCalls.length === 0) {
        finalContent = stepRes.content || (executed.length ? 'Ferramentas executadas com sucesso.' : stepRes.content || '');
        break;
      }

      // Executar primeira tool call
      const call = stepRes.toolCalls[0];

      // Validar com Zod
      const schema = edgeToolSchemas[call.name];
      if (!schema) {
        return errorResponse('bad_request', `Tool desconhecida: ${call.name}`, 400);
      }
      
      const parsed = schema.safeParse(call.arguments);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({ 
          path: i.path, 
          message: i.message 
        }));
        console.error(JSON.stringify({ 
          tool: call.name, 
          validated: false, 
          details 
        }));
        return errorResponse('bad_request', `Parâmetros inválidos para ${call.name}`, 400, details);
      }

      // Executar tool
      const validatedArgs = parsed.data as Record<string, unknown>;
      const r = await runToolCall(userId, { name: call.name, arguments: validatedArgs, id: call.id }, token);

      executed.push({ name: call.name, arguments: validatedArgs, id: call.id });

      if (!r.ok) {
        if (r.error === 'forbidden') {
          return errorResponse('forbidden', 'Acesso negado ao evento', 403);
        }
        return errorResponse('server_error', r.error || 'Falha ao executar ferramenta', 500);
      }

      // Adicionar resultado da tool às mensagens
      messagesState.push({ 
        role: 'tool', 
        name: call.name, 
        content: JSON.stringify(r.data ?? { ok: true }), 
        tool_call_id: call.id 
      });
    }

    const duration_ms = Math.round(performance.now() - started);

    // Cache
    if (idemKey) {
      cache.set(idemKey, { 
        content: finalContent, 
        toolCalls: executed, 
        ts: Date.now() 
      });
    }

    console.debug(JSON.stringify({ 
      provider: 'groq', 
      model: MODEL, 
      user_id: userId, 
      duration_ms,
      toolCallsExecuted: executed.length 
    }));

    return jsonResponse({ 
      provider: 'groq', 
      model: MODEL, 
      content: finalContent, 
      toolCalls: executed.length ? executed : undefined 
    }, 200);
    
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    console.error('Edge function error:', msg);
    
    if (/forbidden/i.test(msg)) {
      return errorResponse('forbidden', 'Acesso negado', 403);
    }
    if (/Rate limit excedido/i.test(msg)) {
      return errorResponse('rate_limit', msg, 429);
    }
    if (/Créditos insuficientes/i.test(msg)) {
      return errorResponse('payment_required', msg, 402);
    }
    
    return errorResponse('server_error', msg, 500);
  }
});
