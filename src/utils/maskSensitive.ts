/**
 * Utilitário de máscara para dados sensíveis na UI.
 * Decisão T2.6: valor_estimado são estimativas de supermercado, não PII real.
 * A máscara existe como utilidade para uso futuro se necessário.
 */

export function maskCurrency(value: number): string {
  return 'R$ **,**';
}

export function maskText(text: string, showFirst = 3): string {
  if (text.length <= showFirst + 3) return text;
  return text.slice(0, showFirst) + '***';
}

export function shouldMaskPrices(isOrganizer: boolean, isEventOwner: boolean): boolean {
  return !isOrganizer && !isEventOwner;
}
