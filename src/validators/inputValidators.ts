/**
 * Validadores de input — garantem que dados extraídos do usuário
 * sejam válidos antes de chegar ao LLM ou ao banco.
 */

import { z } from 'zod';

const tipoEventoSchema = z
  .string()
  .min(1, 'Tipo de evento é obrigatório')
  .max(100, 'Tipo de evento muito longo')
  .trim();

const qtdPessoasSchema = z
  .number({ invalid_type_error: 'Quantidade de pessoas deve ser um número' })
  .int('Quantidade de pessoas deve ser inteira')
  .positive('Quantidade de pessoas deve ser maior que zero')
  .max(10000, 'Quantidade de pessoas deve ser no máximo 10000');

const dataEventoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
  .refine(
    (val) => {
      const [year, month, day] = val.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    },
    { message: 'Data inexistente' }
  );

const menuSchema = z
  .string()
  .max(200, 'Menu muito longo')
  .trim()
  .optional()
  .nullable();

export const eventoDataSchema = z.object({
  tipo_evento: tipoEventoSchema,
  qtd_pessoas: qtdPessoasSchema,
  data_evento: dataEventoSchema.optional().nullable(),
  menu: menuSchema,
  finalidade_evento: z.string().max(100).trim().optional().nullable(),
});

export const itemEditSchema = z.object({
  operation: z.enum(['add', 'remove', 'update', 'multiply'], {
    errorMap: () => ({ message: 'Operação inválida. Use: add, remove, update ou multiply.' }),
  }),
  itemName: z.string().min(1, 'Nome do item é obrigatório').max(200).trim().optional().nullable(),
  quantity: z.number().positive('Quantidade deve ser positiva').optional().nullable(),
  multiplier: z.number().positive('Multiplicador deve ser positivo').optional().nullable(),
});

export type ValidatedEventoData = z.infer<typeof eventoDataSchema>;
export type ValidatedItemEdit = z.infer<typeof itemEditSchema>;

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  error?: string;
}

export function validateEventData(data: unknown): ValidationResult<ValidatedEventoData> {
  const result = eventoDataSchema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  const firstError = result.error.errors[0];
  return { valid: false, error: firstError.message };
}

export function validateItemEdit(data: unknown): ValidationResult<ValidatedItemEdit> {
  const result = itemEditSchema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  const firstError = result.error.errors[0];
  return { valid: false, error: firstError.message };
}
