import { getLlmSuggestions } from "@/api/llm/chat";
import { LlmMessage } from "@/types/llm";

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
  categoria_evento?: string;
  subtipo_evento?: string;
  finalidade_evento?: string;
  menu?: string;
  qtd_pessoas?: number;
  data_evento?: string;
  hora_evento?: string;
  inclui_bebidas?: boolean;
  inclui_entradas?: boolean;
  nivel_confianca: number;
}

export async function analyzeMessage(
  userText: string,
  context?: { tipo_evento?: string; qtd_pessoas?: number; data_evento?: string }
): Promise<MessageAnalysis> {
  const systemPrompt = `Você é um analisador semântico especializado em extrair informações de eventos sociais.

TAREFA: Analise a mensagem do usuário e extraia TODAS as informações relevantes sobre o evento.

ESTRUTURA HIERÁRQUICA DE EVENTOS:
- categoria_evento: forma social (almoço, jantar, lanche, piquenique, café da manhã, brunch)
- subtipo_evento: estilo culinário (churrasco, feijoada, pizza, fondue, lasanha, sushi)
- finalidade_evento: motivo emocional (aniversário, encontro de amigos, confraternização, celebração)
- menu: prato principal específico (lasanha, carnes, massas, frutos do mar)

INTENÇÕES POSSÍVEIS:
- criar_evento: usuário quer criar/iniciar um evento
- definir_menu: usuário está definindo cardápio/comida
- confirmar_evento: usuário confirma ("sim", "ok", "perfeito", "isso mesmo")
- mostrar_itens: usuário quer ver lista de itens ("mostre", "lista", "itens")
- editar_evento: usuário quer mudar algo ("editar", "mudar", "alterar")
- adicionar_participantes: usuário quer adicionar pessoas
- encerrar_conversa: usuário se despede
- out_of_domain: mensagem completamente fora de contexto
- desconhecida: não conseguiu identificar

REGRAS DE EXTRAÇÃO:
1. "churrasco" é subtipo_evento, categoria_evento deve ser inferida (geralmente "almoço")
2. "jantar" é categoria_evento, não subtipo
3. Se mencionar apenas prato (ex: "lasanha"), classifique como menu
4. Datas aceitas: dd/mm/yyyy, dd/mm, "dia X de mês", ISO
5. Horários: formato 24h ou "19h", "7 da noite"
6. Quantidade de pessoas: números com contexto ("10 pessoas", "para 8")

CONTEXTO ATUAL DO EVENTO:
${context?.tipo_evento ? `Tipo: ${context.tipo_evento}` : 'Nenhum evento em andamento'}
${context?.qtd_pessoas ? `Pessoas: ${context.qtd_pessoas}` : ''}
${context?.data_evento ? `Data: ${context.data_evento}` : ''}

RETORNE APENAS JSON válido (sem markdown), com esta estrutura:
{
  "intencao": string,
  "categoria_evento": string | null,
  "subtipo_evento": string | null,
  "finalidade_evento": string | null,
  "menu": string | null,
  "qtd_pessoas": number | null,
  "data_evento": string | null,
  "hora_evento": string | null,
  "inclui_bebidas": boolean | null,
  "inclui_entradas": boolean | null,
  "nivel_confianca": number (0-1)
}`;

  try {
    const messages: LlmMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userText }
    ];

    const result = await getLlmSuggestions(systemPrompt, messages, 0.3);
    
    if (result?.content) {
      // Tentar extrair JSON da resposta
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          intencao: parsed.intencao || "desconhecida",
          categoria_evento: parsed.categoria_evento,
          subtipo_evento: parsed.subtipo_evento,
          finalidade_evento: parsed.finalidade_evento,
          menu: parsed.menu,
          qtd_pessoas: parsed.qtd_pessoas,
          data_evento: parsed.data_evento,
          hora_evento: parsed.hora_evento,
          inclui_bebidas: parsed.inclui_bebidas,
          inclui_entradas: parsed.inclui_entradas,
          nivel_confianca: parsed.nivel_confianca || 0.5
        };
      }
    }
  } catch (error) {
    console.warn('[analyzeMessage] LLM falhou, usando fallback heurístico:', error);
  }

  // Fallback heurístico
  return fallbackAnalysis(userText, context);
}

function fallbackAnalysis(text: string, context?: any): MessageAnalysis {
  const lower = text.toLowerCase().trim();
  
  // Detectar intenção por palavras-chave
  let intencao: MessageAnalysis['intencao'] = 'desconhecida';
  
  if (/\b(sim|ok|confirma|beleza|perfeito|pode seguir|isso|bora|quero)\b/i.test(lower)) {
    intencao = 'confirmar_evento';
  } else if (/\b(itens|lista|mostrar|mostra|mostre)\b/i.test(lower)) {
    intencao = 'mostrar_itens';
  } else if (/\b(editar|mudar|alterar|modificar|ajustar)\b/i.test(lower)) {
    intencao = 'editar_evento';
  } else if (/\b(participante|pessoas|convidado|dividir)\b/i.test(lower)) {
    intencao = 'adicionar_participantes';
  } else if (/\b(tchau|até|obrigado|valeu|flw)\b/i.test(lower)) {
    intencao = 'encerrar_conversa';
  } else if (/\b(churrasco|jantar|almoço|almoco|piquenique|festa|pizza|feijoada)\b/i.test(lower)) {
    intencao = 'criar_evento';
  } else if (/\b(lasanha|massa|carne|frango|peixe|sushi)\b/i.test(lower)) {
    intencao = 'definir_menu';
  }

  // Extrair categoria_evento
  const categoriaMatch = lower.match(/\b(jantar|almoço|almoco|lanche|piquenique|café da manhã|cafe da manha|brunch)\b/i);
  const categoria_evento = categoriaMatch ? categoriaMatch[1] : null;

  // Extrair subtipo_evento
  const subtipoMatch = lower.match(/\b(churrasco|feijoada|pizza|fondue|lasanha|sushi)\b/i);
  const subtipo_evento = subtipoMatch ? subtipoMatch[1] : null;

  // Extrair menu
  const menuMatch = lower.match(/\b(lasanha|massa|massas|carne|carnes|frango|peixe|sushi|frutos do mar)\b/i);
  const menu = menuMatch ? menuMatch[1] : null;

  // Extrair quantidade
  const qtdMatch = text.match(/\b(\d+)\s*(pessoa|pessoas|convidado|convidados)\b/i);
  const qtd_pessoas = qtdMatch ? parseInt(qtdMatch[1], 10) : null;

  // Extrair data
  const dateMatch = text.match(/\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{4}-\d{2}-\d{2})\b/i);
  const data_evento = dateMatch ? dateMatch[1] : null;

  return {
    intencao,
    categoria_evento,
    subtipo_evento,
    menu,
    qtd_pessoas,
    data_evento,
    nivel_confianca: 0.6
  };
}
