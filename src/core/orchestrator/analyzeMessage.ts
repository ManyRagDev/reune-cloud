// src/core/orchestrator/analyzeMessage.ts
import { getLlmSuggestions } from "@/api/llm/chat";
import { LlmMessage } from "@/types/llm";
import { z } from "zod";
import { parseToIsoDate } from "@/core/nlp/date-parser";

export interface MessageAnalysis {
  intencao:
    | "criar_evento"
    | "definir_menu"
    | "confirmar_evento"
    | "mostrar_itens"
    | "editar_evento"
    | "adicionar_participantes"
    | "encerrar_conversa"
    | "out_of_domain"
    | "desconhecida";
  categoria_evento?: string | null;
  subtipo_evento?: string | null;
  finalidade_evento?: string | null;
  menu?: string | null;
  qtd_pessoas?: number | null;
  data_evento?: string | null;
  hora_evento?: string | null;
  inclui_bebidas?: boolean | null;
  inclui_entradas?: boolean | null;
  nivel_confianca: number;
}

// 🔹 Validação leve com Zod para garantir formato coerente
const MessageAnalysisSchema = z.object({
  intencao: z.string(),
  categoria_evento: z.string().nullable().optional(),
  subtipo_evento: z.string().nullable().optional(),
  finalidade_evento: z.string().nullable().optional(),
  menu: z.string().nullable().optional(),
  qtd_pessoas: z.number().nullable().optional(),
  data_evento: z.string().nullable().optional(),
  hora_evento: z.string().nullable().optional(),
  inclui_bebidas: z.boolean().nullable().optional(),
  inclui_entradas: z.boolean().nullable().optional(),
  nivel_confianca: z.number().min(0).max(1).default(0.5)
});

const normalize = (s?: string | null) => (s ? s.trim().toLowerCase() : null);

export async function analyzeMessage(
  userText: string,
  context?: {
    tipo_evento?: string;
    qtd_pessoas?: number;
    data_evento?: string;
    menu?: string;
    eventoStatus?: string;
  }
): Promise<MessageAnalysis> {
  const systemPrompt = `
Você é um analisador semântico especializado em extrair informações de eventos sociais.

🎯 TAREFA:
Analise a mensagem do usuário e extraia TODAS as informações relevantes sobre o evento, sempre retornando JSON 100% válido.

📚 ESTRUTURA HIERÁRQUICA DE EVENTOS:
- categoria_evento: forma social (almoço, jantar, lanche, piquenique, café da manhã, brunch)
- subtipo_evento: estilo culinário (churrasco, feijoada, pizza, fondue, lasanha, sushi)
- finalidade_evento: motivo emocional (aniversário, encontro de amigos, confraternização, celebração)
- menu: prato principal específico (lasanha, carnes, massas, frutos do mar)

💬 INTENÇÕES POSSÍVEIS:
- criar_evento
- definir_menu
- confirmar_evento
- mostrar_itens
- editar_evento
- adicionar_participantes
- encerrar_conversa
- out_of_domain
- desconhecida

🧩 REGRAS DE EXTRAÇÃO:
1. "churrasco" é subtipo_evento; categoria_evento deve ser inferida (geralmente "almoço").
2. "jantar" é categoria_evento, não subtipo.
3. Se mencionar apenas prato (ex: "lasanha"), classifique como menu.
4. Datas aceitas: dd/mm/yyyy, dd/mm, "dia X de mês", ou formato ISO.
5. Horários: formato 24h, "19h", "7 da noite".
6. Quantidade de pessoas: números seguidos de palavras como "pessoas" ou "convidados".

🧠 CONTEXTO ATUAL DO EVENTO:
${context?.tipo_evento ? `Tipo: ${context.tipo_evento}` : "Nenhum evento em andamento"}
${context?.qtd_pessoas ? `Pessoas: ${context.qtd_pessoas}` : ""}
${context?.data_evento ? `Data: ${context.data_evento}` : ""}
${context?.menu ? `Menu: ${context.menu}` : ""}
${context?.eventoStatus ? `Status: ${context.eventoStatus}` : ""}

⚙️ FORMATO DE SAÍDA:
Retorne **apenas JSON puro** (sem markdown, sem explicações). 
O JSON deve seguir EXATAMENTE o formato abaixo:

{
  "intencao": "criar_evento",
  "categoria_evento": "almoço",
  "subtipo_evento": "churrasco",
  "finalidade_evento": null,
  "menu": null,
  "qtd_pessoas": 10,
  "data_evento": "2025-12-25",
  "hora_evento": "12:00",
  "inclui_bebidas": true,
  "inclui_entradas": false,
  "nivel_confianca": 0.92
}

Se algum dado não for encontrado, use null.
`;

  try {
    const messages: LlmMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userText }
    ];

    const result = await getLlmSuggestions(systemPrompt, messages, 0.3);

    if (result?.content) {
      // Extrair trecho JSON de forma segura
      const jsonStart = result.content.indexOf("{");
      const jsonEnd = result.content.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = result.content.slice(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonString);

        // Validação e normalização
        const safe = MessageAnalysisSchema.safeParse(parsed);
        if (!safe.success) throw new Error("Formato inválido do LLM");

        const data = safe.data;
        
        // 🔹 Normalizar data para ISO
        const normalizedDate = data.data_evento ? parseToIsoDate(data.data_evento) : null;
        
        if (normalizedDate && data.data_evento) {
          console.log('[analyzeMessage] Data detectada e normalizada:', {
            original: data.data_evento,
            normalized: normalizedDate
          });
        }
        
        return {
          intencao: (data.intencao as MessageAnalysis["intencao"]) || "desconhecida",
          categoria_evento: normalize(data.categoria_evento),
          subtipo_evento: normalize(data.subtipo_evento),
          finalidade_evento: normalize(data.finalidade_evento),
          menu: normalize(data.menu),
          qtd_pessoas: data.qtd_pessoas ?? null,
          data_evento: normalizedDate,
          hora_evento: data.hora_evento ?? null,
          inclui_bebidas: data.inclui_bebidas ?? null,
          inclui_entradas: data.inclui_entradas ?? null,
          nivel_confianca: data.nivel_confianca ?? 0.5
        };
      }
    }
  } catch (error) {
    console.warn("[analyzeMessage] LLM falhou, usando fallback heurístico:", error);
  }

  // 🔹 Fallback heurístico robusto
  return fallbackAnalysis(userText, context);
}

// ========================================================
// 🧩 FALLBACK HEURÍSTICO (regex + palavras-chave)
// ========================================================
function fallbackAnalysis(text: string, context?: any): MessageAnalysis {
  const lower = text.toLowerCase().trim();

  let intencao: MessageAnalysis["intencao"] = "desconhecida";

  if (/\b(sim|ok|confirma|confirmar|beleza|perfeito|pode seguir|pode confirmar|isso|bora|quero|tá ótimo|ta otimo|está ótimo|esta otimo|lista ok|confirmar lista|confirmar itens)\b/i.test(lower))
    intencao = "confirmar_evento";
  else if (/\b(itens|lista|mostrar|mostra|mostre)\b/i.test(lower))
    intencao = "mostrar_itens";
  else if (/\b(editar|mudar|alterar|modificar|ajustar)\b/i.test(lower))
    intencao = "editar_evento";
  else if (/\b(participante|pessoas|convidado|dividir)\b/i.test(lower))
    intencao = "adicionar_participantes";
  else if (/\b(tchau|até|obrigado|valeu|flw)\b/i.test(lower))
    intencao = "encerrar_conversa";
  else if (/\b(churrasco|jantar|almoço|almoco|piquenique|festa|pizza|feijoada)\b/i.test(lower))
    intencao = "criar_evento";
  else if (/\b(lasanha|massa|carne|frango|peixe|sushi)\b/i.test(lower))
    intencao = "definir_menu";

  const categoriaMatch = lower.match(
    /\b(jantar|almoço|almoco|lanche|piquenique|café da manhã|cafe da manha|brunch)\b/i
  );
  const subtipoMatch = lower.match(/\b(churrasco|feijoada|pizza|fondue|lasanha|sushi)\b/i);
  const menuMatch = lower.match(
    /\b(lasanha|massa|massas|carne|carnes|frango|peixe|sushi|frutos do mar)\b/i
  );
  const qtdMatch = text.match(/\b(\d+)\s*(pessoa|pessoas|convidado|convidados)\b/i);
  const dateMatch = text.match(/\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{4}-\d{2}-\d{2})\b/i);
  const horaMatch = text.match(
    /\b(\d{1,2})\s*(h|horas|da\s+noite|da\s+manhã|da\s+tarde)\b/i
  );

  const inclui_bebidas = /\b(cerveja|refrigerante|vinho|bebida)\b/i.test(lower);
  const inclui_entradas = /\b(salgadinho|petisco|entrada|aperitivo)\b/i.test(lower);

  // 🔹 Normalizar data extraída para ISO
  const extractedDate = dateMatch ? dateMatch[1] : null;
  const normalizedDate = extractedDate ? parseToIsoDate(extractedDate) : null;

  if (normalizedDate && extractedDate) {
    console.log('[fallbackAnalysis] Data detectada e normalizada:', {
      original: extractedDate,
      normalized: normalizedDate
    });
  }

  return {
    intencao,
    categoria_evento: categoriaMatch ? categoriaMatch[1].toLowerCase() : null,
    subtipo_evento: subtipoMatch ? subtipoMatch[1].toLowerCase() : null,
    finalidade_evento: null,
    menu: menuMatch ? menuMatch[1].toLowerCase() : null,
    qtd_pessoas: qtdMatch ? parseInt(qtdMatch[1], 10) : null,
    data_evento: normalizedDate,
    hora_evento: horaMatch ? horaMatch[1] : null,
    inclui_bebidas,
    inclui_entradas,
    nivel_confianca: 0.6
  };
}
