import { normalize } from "@/core/nlp/normalize";
import { parsePeopleCount } from "@/core/nlp/ptNumbers";

const TYPE_RE = /\b(churrasco|piquenique|jantar|pizza|feijoada|aniversario|aniversário|festa)\b/i;
const DATE_RE = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}\s+de\s+\w+|\d{4}-\d{2}-\d{2})\b/i;

export function extractSlotsByRules(
  text: string,
  draft?: { tipo_evento?: string; qtd_pessoas?: number; data_evento?: string }
) {
  const t = normalize(text);
  const tipo = (t.match(TYPE_RE)?.[1] ?? draft?.tipo_evento ?? "").toLowerCase();
  const qtd = parsePeopleCount(t) ?? draft?.qtd_pessoas;
  const dateMatch = t.match(DATE_RE);
  const data = dateMatch?.[1] ?? draft?.data_evento;
  
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