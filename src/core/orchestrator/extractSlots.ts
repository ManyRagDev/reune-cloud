import { normalize } from "@/core/nlp/normalize";

const TYPE_RE = /\b(churrasco|piquenique|jantar|pizza|feijoada|aniversario|aniversário|festa|almoço|almoco|lanche|lasanha)\b/i;
// Captura datas: dd/mm/yyyy, dd/mm, yyyy-mm-dd, "dia 15 de novembro", "15 de novembro"
const DATE_RE = /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|(?:dia\s+)?\d{1,2}\s+de\s+\w+(?:\s+de\s+\d{4})?|\d{4}-\d{2}-\d{2})\b/i;
// Regex melhorado: captura número APENAS quando seguido de palavra relacionada a pessoas
const PEOPLE_COUNT_RE = /\b(\d+)\s*(pessoa|pessoas|convidado|convidados|participante|participantes)\b/i;

export function extractSlotsByRules(
  text: string,
  draft?: { tipo_evento?: string; qtd_pessoas?: number; data_evento?: string },
) {
  const t = normalize(text);

  // 1. Extrair tipo de evento
  const tipoNovo = t.match(TYPE_RE)?.[1]?.toLowerCase();

  // 2. Extrair quantidade - com contexto para evitar pegar números de data
  const qtdMatch = t.match(PEOPLE_COUNT_RE);
  const qtdNovo = qtdMatch ? parseInt(qtdMatch[1], 10) : undefined;

  // 3. Extrair data
  const dateMatch = t.match(DATE_RE);
  const dataNovo = dateMatch?.[1];

  // 4. Merge hierárquico: novo > draft (mantém valores antigos só se não houver novo)
  const tipo = tipoNovo || draft?.tipo_evento;
  const qtd = qtdNovo !== undefined ? qtdNovo : draft?.qtd_pessoas;
  const data = dataNovo || draft?.data_evento;

  return {
    tipo_evento: tipo || undefined,
    qtd_pessoas: qtd && qtd > 0 ? qtd : undefined,
    data_evento: data || undefined,
    is_confirm: isConfirm(t),
  };
}

export function isConfirm(text: string) {
  const t = normalize(text);
  return /\b(ok|sim|beleza|perfeito|isso|pode seguir|segue|manda ver|sugira|sugestao|to dentro|bora)\b/i.test(t);
}
