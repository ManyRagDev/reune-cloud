import { normalize } from "@/core/nlp/normalize";
import { parsePeopleCount } from "@/core/nlp/ptNumbers";

const TYPE_RE = /\b(churrasco|piquenique|jantar|pizza|feijoada|aniversario|aniversário)\b/i;

export function extractSlotsByRules(
  text: string,
  draft?: { tipo_evento?: string; qtd_pessoas?: number }
) {
  const t = normalize(text);
  const tipo = (t.match(TYPE_RE)?.[1] ?? draft?.tipo_evento ?? "").toLowerCase();
  const qtd = parsePeopleCount(t) ?? draft?.qtd_pessoas;
  return {
    tipo_evento: tipo || undefined,
    qtd_pessoas: qtd && qtd > 0 ? qtd : undefined,
    is_confirm: isConfirm(t),
  };
}

export function isConfirm(text: string) {
  const t = normalize(text);
  return /\b(ok|sim|beleza|perfeito|isso|pode seguir|segue|manda ver|sugira|sugestao|to dentro|bora)\b/i.test(t);
}