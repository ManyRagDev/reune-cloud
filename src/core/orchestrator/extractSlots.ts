import { normalize } from "@/core/nlp/normalize";

const TYPE_RE = /\b(churrasco|piquenique|jantar|pizza|feijoada|aniversario|aniversário|festa)\b/i;
const DATE_RE = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}\s+de\s+\w+|\d{4}-\d{2}-\d{2})\b/i;
// Só captura número quando vier com “pessoa(s)/convidado(s)/participante(s)”
const PEOPLE_COUNT_RE = /\b(\d+)\s*(pessoa|pessoas|convidado|convidados|participante|participantes)\b/i;

export function extractSlotsByRules(
  text: string,
  draft?: { tipo_evento?: string; qtd_pessoas?: number; data_evento?: string },
) {
  const t = normalize(text);

  // 1) tipo_evento
  const tipoNovo = t.match(TYPE_RE)?.[1]?.toLowerCase();
  const tipo = tipoNovo || draft?.tipo_evento || undefined;

  // 2) data_evento (prioriza padrões claros)
  const dataNovo = t.match(DATE_RE)?.[1] || undefined;
  const data = dataNovo || draft?.data_evento || undefined;

  // 3) qtd_pessoas (NUNCA usar número puro; exige palavra de contexto)
  let qtdNovo: number | undefined = undefined;
  const qtdMatch = t.match(PEOPLE_COUNT_RE);
  if (qtdMatch) {
    const parsed = Number(qtdMatch[1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      qtdNovo = parsed;
    }
  }
  const qtd = (qtdNovo !== undefined ? qtdNovo : draft?.qtd_pessoas) ?? undefined;

  return {
    tipo_evento: tipo,
    qtd_pessoas: qtd,
    data_evento: data,
    is_confirm: isConfirm(t),
  };
}

export function isConfirm(text: string) {
  const t = normalize(text);
  return /\b(ok|sim|beleza|perfeito|isso|pode seguir|segue|manda ver|sugira|sugestao|to dentro|bora)\b/i.test(t);
}
