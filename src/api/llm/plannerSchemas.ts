import { z } from 'zod';

const intentEnum = z.enum([
  'create_event',
  'update_event',
  'generate_items',
  'confirm_event',
  'small_talk',
  'unknown',
]);

const numericId = z.string().regex(/^\d+$/, 'evento_id deve ser numerico');

const baseEnvelope = z.object({
  intent: intentEnum,
  payload: z.record(z.any()).default({}),
  confidence: z.coerce.number().min(0).max(1).default(0),
}).passthrough();

const eventPayload = z.object({
  tipo_evento: z.string().min(1).optional(),
  categoria_evento: z.string().optional(),
  subtipo_evento: z.string().optional(),
  qtd_pessoas: z.coerce.number().int().positive().optional(),
  data_evento: z.string().optional(),
  menu: z.string().optional(),
  finalidade_evento: z.string().optional(),
  evento_id: numericId.optional(),
}).passthrough();

const createEventEnvelope = baseEnvelope.extend({
  intent: z.literal('create_event'),
  payload: eventPayload,
});

const generateItemsEnvelope = baseEnvelope.extend({
  intent: z.literal('generate_items'),
  payload: eventPayload,
});

const updateEventEnvelope = baseEnvelope.extend({
  intent: z.literal('update_event'),
  payload: eventPayload,
});

const confirmEventEnvelope = baseEnvelope.extend({
  intent: z.literal('confirm_event'),
  payload: eventPayload,
});

const smallTalkEnvelope = baseEnvelope.extend({
  intent: z.literal('small_talk'),
});

const unknownEnvelope = baseEnvelope.extend({
  intent: z.literal('unknown'),
});

export const plannerEnvelopeSchema = z.union([
  createEventEnvelope,
  generateItemsEnvelope,
  updateEventEnvelope,
  confirmEventEnvelope,
  smallTalkEnvelope,
  unknownEnvelope,
  baseEnvelope,
]);

export type PlannerEnvelope = z.infer<typeof plannerEnvelopeSchema>;
