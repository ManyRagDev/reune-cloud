/**
 * Adapter para normalizar itens vindos da LLM
 * Previne erros de tipo e formato antes de enviar para o banco
 */

import type { Item } from '@/types/domain';

interface RawLlmItem {
  nome_item?: string;
  quantidade?: number | string;
  unidade?: string;
  valor_estimado?: number | string;
  categoria?: string;
  prioridade?: string;
  [key: string]: unknown;
}

/**
 * Remove code fences (```json ... ```) do conteúdo LLM
 */
export function stripCodeFence(content: string): string {
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenceMatch ? fenceMatch[1].trim() : content.trim();
}

/**
 * Normaliza um valor numérico (aceita string ou number)
 */
function normalizeNumber(value: unknown, defaultValue = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(',', '.'));
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Normaliza string (garantindo não-vazio)
 */
function normalizeString(value: unknown, defaultValue = ''): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return defaultValue;
}

/**
 * Valida e normaliza prioridade
 */
function normalizePriority(value: unknown): 'A' | 'B' | 'C' {
  const str = normalizeString(value, 'B').toUpperCase();
  if (str === 'A' || str === 'B' || str === 'C') {
    return str as 'A' | 'B' | 'C';
  }
  return 'B';
}

/**
 * Converte item bruto da LLM para o formato esperado pelo banco
 */
export function normalizeItem(raw: RawLlmItem): Partial<Item> | null {
  const nome = normalizeString(raw.nome_item);
  if (!nome) {
    console.warn('[itemAdapter] Item sem nome, ignorando:', raw);
    return null;
  }

  const normalized: Partial<Item> = {
    nome_item: nome,
    quantidade: normalizeNumber(raw.quantidade, 1),
    unidade: normalizeString(raw.unidade, 'un'),
    valor_estimado: normalizeNumber(raw.valor_estimado, 0),
    categoria: normalizeString(raw.categoria, 'geral'),
    prioridade: normalizePriority(raw.prioridade),
  };

  console.debug('[itemAdapter] Normalizado:', { raw, normalized });
  return normalized;
}

/**
 * Processa resposta da LLM e retorna array de itens normalizados
 */
export function parseLlmItemsResponse(content: string): Partial<Item>[] {
  try {
    // Remove code fences se existirem
    const cleaned = stripCodeFence(content);
    
    // Parse JSON
    const parsed = JSON.parse(cleaned);
    
    // Garante que é array
    const rawItems: RawLlmItem[] = Array.isArray(parsed) ? parsed : [parsed];
    
    console.debug('[itemAdapter] Raw items:', rawItems.length);
    
    // Normaliza e filtra nulos
    const normalized = rawItems
      .map(normalizeItem)
      .filter((item): item is Partial<Item> => item !== null);
    
    console.debug('[itemAdapter] Normalized items:', normalized.length);
    
    if (normalized.length === 0) {
      throw new Error('Nenhum item válido após normalização');
    }
    
    return normalized;
  } catch (error) {
    console.error('[itemAdapter] Erro ao processar resposta LLM:', error);
    throw new Error(`Falha ao processar itens da LLM: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
  }
}
