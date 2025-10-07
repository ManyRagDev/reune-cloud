import type { Item, Participant, DistributionRow } from '@/types/domain';

// Heurística simples por tipo de item
export const estimateQuantityPerPerson = (item: string): number => {
  const lower = item.toLowerCase();
  if (lower.includes('carne')) return 0.4; // kg por pessoa
  if (lower.includes('bebida')) return 1; // litros por pessoa
  return 1; // unidade por pessoa como default
};

// Divisão de custos simples: rateio igual entre participantes não recusados
export function computeCostSplit(items: Item[], participants: Participant[]): DistributionRow[] {
  const activeParticipants = participants.filter((p) => p.status_convite !== 'recusado');
  const baseParticipants = activeParticipants.length > 0 ? activeParticipants : participants;

  const rows: DistributionRow[] = [];
  for (const item of items) {
    const perCost = Number(item.valor_estimado || 0) / Math.max(1, baseParticipants.length);
    const perQty = Number(item.quantidade || 0) / Math.max(1, baseParticipants.length);
    for (const p of baseParticipants) {
      rows.push({
        id: crypto.randomUUID(),
        item_id: item.id,
        participante_id: p.id,
        quantidade_atribuida: Number.isFinite(perQty) ? perQty : 0,
        valor_rateado: Number.isFinite(perCost) ? perCost : 0,
        observacoes: null,
      });
    }
  }
  return rows;
}