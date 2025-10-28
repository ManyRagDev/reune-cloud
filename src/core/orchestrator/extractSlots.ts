// src/core/orchestrator/extractSlots.ts
import { normalize } from "@/core/nlp/normalize";
import { parseToIsoDate } from "@/core/nlp/date-parser";

/**
 * Regexs refinados
 */
const CATEGORY_RE = /\b(almoço|almoco|jantar|lanche|piquenique|brunch|café da manhã|cafe da manha)\b/i;
const SUBTYPE_RE = /\b(churrasco|feijoada|pizza|fondue|sushi|lasanha|macarronada|rodízio|rodizio)\b/i;
const PURPOSE_RE = /\b(aniversário|aniversario|confraternização|confraternizacao|encontro|comemoração|celebração|casamento)\b/i;
const MENU_RE = /\b(lasanha|massa|massas|carne|carnes|frango|peixe|sushi|feijoada|pizza|fondue|frutos do mar|churrasco)\b/i;

// Captura datas: dd/mm/yyyy, dd/mm, yyyy-mm-dd, "dia 15 de novembro", "15 de novembro"
const DATE_RE =
  /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|(?:dia\s+)?\d{1,2}\s+de\s+\w+(?:\s+de\s+\d{4})?|\d{4}-\d{2}-\d{2})\b/i;

// Quantidade de pessoas (somente com contexto)
const PEOPLE_COUNT_RE =
  /\b(\d+)\s*(pessoa|pessoas|convidado|convidados|participante|participantes)\b/i;

// Hora do evento
const HOUR_RE = /\b(\d{1,2})\s*(h|horas|da\s+noite|da\s+manhã|da\s+tarde)\b/i;

// Itens complementares
const BEVERAGES_RE = /\b(cerveja|refrigerante|vinho|bebida|bebidas)\b/i;
const ENTRADAS_RE = /\b(salgadinho|petisco|entrada|aperitivo|tábua|tabua)\b/i;

/**
 * Extrai informações estruturadas do texto do usuário
 * com fallback heurístico e coerência hierárquica.
 */
export function extractSlotsByRules(
  text: string,
  draft?: {
    tipo_evento?: string;
    qtd_pessoas?: number;
    data_evento?: string;
    menu?: string;
    finalidade_evento?: string;
  }
) {
  const t = normalize(text);

  // 1️⃣ Categoria e subtipo de evento
  const categoria_evento = t.match(CATEGORY_RE)?.[1]?.toLowerCase() || draft?.tipo_evento || null;
  const subtipo_evento = t.match(SUBTYPE_RE)?.[1]?.toLowerCase() || null;

  // 2️⃣ Finalidade (motivo)
  const finalidade_evento = t.match(PURPOSE_RE)?.[1]?.toLowerCase() || draft?.finalidade_evento || null;

  // 3️⃣ Menu principal
  const menu = t.match(MENU_RE)?.[1]?.toLowerCase() || draft?.menu || null;

  // 4️⃣ Quantidade de pessoas
  const qtdMatch = t.match(PEOPLE_COUNT_RE);
  const qtd_pessoas = qtdMatch ? parseInt(qtdMatch[1], 10) : draft?.qtd_pessoas || null;

  // 5️⃣ Data e hora
  const dateMatch = t.match(DATE_RE);
  const rawDate = dateMatch?.[1] || draft?.data_evento || null;
  const data_evento = rawDate ? parseToIsoDate(rawDate) : null;

  const hourMatch = t.match(HOUR_RE);
  const hora_evento = hourMatch?.[1] || null;

  // 6️⃣ Extras
  const inclui_bebidas = BEVERAGES_RE.test(t);
  const inclui_entradas = ENTRADAS_RE.test(t);

  // 7️⃣ Intenção inferida (heurística)
  const intencao = inferIntent(t, categoria_evento, subtipo_evento, finalidade_evento, menu);

  // 8️⃣ Verificação de confirmação
  const is_confirm = isConfirm(t);

  return {
    intencao,
    categoria_evento,
    subtipo_evento,
    finalidade_evento,
    menu,
    qtd_pessoas,
    data_evento,
    hora_evento,
    inclui_bebidas,
    inclui_entradas,
    is_confirm,
  };
}

/**
 * Heurística leve para detectar intenção sem LLM
 */
function inferIntent(
  text: string,
  categoria?: string | null,
  subtipo?: string | null,
  finalidade?: string | null,
  menu?: string | null
): string {
  if (/\b(sim|ok|beleza|perfeito|isso|pode seguir|segue|manda ver|to dentro|bora)\b/i.test(text))
    return "confirmar_evento";
  if (/\b(itens|lista|mostrar|mostra|mostre)\b/i.test(text))
    return "mostrar_itens";
  if (/\b(editar|mudar|alterar|modificar|ajustar)\b/i.test(text))
    return "editar_evento";
  if (/\b(participante|convidado|adicionar|incluir|dividir)\b/i.test(text))
    return "adicionar_participantes";
  if (/\b(tchau|até|obrigado|valeu|flw)\b/i.test(text))
    return "encerrar_conversa";
  if (categoria || subtipo || finalidade) return "criar_evento";
  if (menu) return "definir_menu";
  return "desconhecida";
}

/**
 * Detecta confirmação direta do usuário
 */
export function isConfirm(text: string) {
  const t = normalize(text);
  return /\b(ok|sim|beleza|perfeito|isso|pode seguir|segue|manda ver|sugira|sugestao|to dentro|bora)\b/i.test(
    t
  );
}
