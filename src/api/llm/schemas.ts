import { z } from 'zod';

// Schemas Zod para validação de payloads das ferramentas
export const uuidStr = z.string().min(1);

export const generateItemListSchema = z.object({
  evento_id: uuidStr,
  tipo_evento: z.enum(['churrasco', 'piquenique', 'jantar']),
  qtd_pessoas: z.number().int().min(1),
  preferencias: z.record(z.any()).optional(),
});

// Alinhar ao domínio Item: todos os campos obrigatórios
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

export const confirmItemsSchema = z.object({
  evento_id: uuidStr,
  itens_editados: z.array(itemSchema),
});

export const computeCostSplitSchema = z.object({
  evento_id: uuidStr,
});

// Alinhar ao domínio Participant
const participantSchema = z.object({
  id: z.string().optional(),
  nome_participante: z.string().min(1),
  contato: z.string().optional().nullable(),
  status_convite: z.enum(['pendente', 'confirmado', 'recusado']).default('pendente'),
  preferencias: z.record(z.any()).optional().nullable(),
  valor_responsavel: z.number().optional().nullable(),
});

export const addParticipantsSchema = z.object({
  evento_id: uuidStr,
  participantes: z.array(participantSchema),
});

export const getPlanSchema = z.object({
  evento_id: uuidStr,
});

export const toolSchemas = {
  generateItemList: generateItemListSchema,
  confirmItems: confirmItemsSchema,
  computeCostSplit: computeCostSplitSchema,
  addParticipants: addParticipantsSchema,
  getPlan: getPlanSchema,
} as const;

export type ToolSchemaName = keyof typeof toolSchemas;

export function validateToolParams<T extends ToolSchemaName>(name: T, args: unknown) {
  const schema = toolSchemas[name];
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { ok: false as const, error: msg };
  }
  return { ok: true as const, data: parsed.data };
}