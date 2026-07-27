/**
 * Utilitários para parsing e sanitização de dados
 */

/**
 * Sanitiza e converte eventoId para o formato correto
 * Resolve o bug de strings "null" e "undefined" que chegam do backend
 */
export function parseEventoId(eventoId: string | null | undefined): string | null {
  // Se for null ou undefined, retorna null
  if (eventoId === null || eventoId === undefined) {
    return null;
  }

  // Trim espaços
  const trimmed = eventoId.trim();

  // Se for string vazia após trim, retorna null
  if (trimmed === '') {
    return null;
  }

  // Se for string literal "null" ou "undefined" (case-insensitive), converte para null
  if (trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
    return null;
  }

  // Retorna o valor sanitizado (com trim aplicado)
  return trimmed;
}

/**
 * Verifica se um valor parece ser um ID válido (UUID ou número)
 */
export function isValidId(value: string | null | undefined): boolean {
  if (!value || value === 'null' || value === 'undefined') {
    return false;
  }

  // Verifica se é UUID (versão 4)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(value)) {
    return true;
  }

  // Verifica se é número
  if (!isNaN(Number(value))) {
    return true;
  }

  return false;
}
