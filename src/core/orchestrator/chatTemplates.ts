// Templates de resposta natural e humanizada

type TemplateContext = {
  categoria_evento?: string;
  subtipo_evento?: string;
  qtd_pessoas?: number;
  menu?: string;
  data_evento?: string;
  hora_evento?: string;
  [key: string]: any;
};

const templates = {
  // Saudações iniciais
  greeting: [
    "Olá! Sou o UNE.AI e vou ajudar a organizar seu evento. Me conta: que tipo de encontro você está planejando e quantas pessoas vão?",
    "Oi! Vou te ajudar com seu evento. Qual o tipo de reunião e quantas pessoas participam?",
    "E aí! Vamos planejar seu evento juntos. Me fala: é um jantar, churrasco, festa? E quantas pessoas?",
  ],

  // Perguntas sobre tipo de evento
  ask_tipo_evento: [
    "Que tipo de evento você quer organizar?",
    "Me conta: que tipo de evento vai ser?",
    "Qual vai ser o estilo do evento?",
  ],

  // Perguntas sobre quantidade
  ask_qtd: [
    "Ótimo! {{categoria_evento}} é uma boa escolha. Quantas pessoas vão?",
    "Combinado! E quantas pessoas participam desse {{categoria_evento}}?",
    "Perfeito! Quantos amigos vão estar no {{categoria_evento}}?",
  ],

  // Perguntas sobre categoria quando só temos subtipo
  ask_categoria: [
    "Show! {{subtipo_evento}} é ótimo. Vai ser no almoço, jantar ou lanche?",
    "Perfeito! {{subtipo_evento}} combina. Qual o período: almoço, jantar ou lanche?",
    "Legal! {{subtipo_evento}} é uma boa pedida. Me diz: almoço, jantar ou lanche?",
  ],

  // Perguntas sobre menu
  ask_menu: [
    "Show! E o que vai ter de comida? Me conta o cardápio.",
    "Beleza! Qual vai ser o menu? Pode falar o que você tá pensando.",
    "Vamos lá! O que vocês vão comer? Me diz o cardápio.",
  ],

  // Perguntas sobre data
  ask_data: [
    "Ótimo! {{categoria_evento}} para {{qtd_pessoas}} pessoas. Qual vai ser a data?",
    "Show! E quando vai ser? Me passa a data.",
    "Perfeito! Qual a data que você tá pensando?",
  ],

  // Confirmação de evento completo
  confirm_event: [
    "Beleza! {{categoria_evento}} para {{qtd_pessoas}} pessoas. Vou montar a lista de itens, tá?",
    "Ótimo! Um {{categoria_evento}} para {{qtd_pessoas}} pessoas. Vamos gerar os preparativos?",
    "Show! Tenho tudo aqui. Posso sugerir a lista de itens agora?",
  ],

  // Menu confirmado
  menu_confirmed: [
    "Boa escolha! {{menu}} vai ficar ótimo. Qual a data do evento?",
    "Perfeito! {{menu}} combina muito. Me passa a data agora?",
    "Legal! {{menu}} é uma boa. Quando vai ser?",
  ],

  // Itens gerados
  items_generated: [
    "Pronto! 🎉 Olha só a lista completa pro {{categoria_evento}} de {{qtd_pessoas}} pessoas. O que achou?",
    "Feito! ✨ Montei tudo pro {{categoria_evento}} com {{qtd_pessoas}} pessoas. Dá uma conferida!",
    "Show! 🎊 Aqui está sua lista pro {{categoria_evento}} de {{qtd_pessoas}} pessoas. Tá bom assim?",
  ],

  // Itens confirmados
  items_confirmed: [
    "Ótimo! Lista aprovada. Quer adicionar os participantes agora?",
    "Perfeito! ✅ Vamos dividir entre os participantes?",
    "Show! Itens OK. Bora adicionar a galera?",
  ],

  // Evento finalizado
  event_finalized: [
    "Pronto! 🎊 Evento confirmado. Agora é só aproveitar!",
    "Feito! ✅ Tudo certo pro seu evento. Pode comemorar!",
    "Show! 🎉 Evento criado com sucesso. Bom demais!",
  ],

  // Erros - Desvio de contexto
  erro_desvio_contexto: [
    "Haha, adorei! Mas vamos focar no evento? Me conta o que você quer organizar.",
    "Legal! Mas quero saber mais sobre o seu evento. O que vai ser?",
    "Boa! Mas bora planejar o evento? Me fala mais sobre ele.",
  ],

  // Erros - Ambiguidade
  erro_ambiguidade: [
    "Entendi, mas fiquei na dúvida. É almoço, jantar ou outro tipo?",
    "Hmm, não tenho certeza. Pode me dar mais detalhes?",
    "Quase lá! Me explica melhor o que você tem em mente?",
  ],

  // Erros - Dado inválido
  erro_dado_invalido: [
    "Hmm, esse dado parece estranho. Pode revisar?",
    "Ops! Esse número não parece certo. Vamos tentar de novo?",
    "Acho que algo não bateu. Pode verificar?",
  ],

  // Erros - Ruído textual
  erro_ruido: [
    "Haha, adorei! Agora, bora planejar o evento?",
    "Legal! E aí, qual evento você quer criar?",
    "Muito bom! Mas me conta: o que vamos organizar?",
  ],

  // Erros - Fora de escopo
  erro_fora_escopo: [
    "Opa, não manjo muito disso. Meu negócio é planejar eventos. Vamos voltar pro assunto?",
    "Hmm, essa fugiu um pouco. Sou especialista em eventos. Bora focar nisso?",
    "Essa não é minha praia. Mas posso te ajudar com o evento. Vamos lá?",
  ],
};

// Função auxiliar para substituir placeholders
function fillTemplate(template: string, context: TemplateContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return context[key]?.toString() || match;
  });
}

// Função para selecionar template aleatório
export function getRandomTemplate(category: keyof typeof templates, context: TemplateContext = {}): string {
  const templateList = templates[category];
  if (!templateList || templateList.length === 0) {
    return "Desculpe, não entendi. Pode reformular?";
  }
  
  const randomIndex = Math.floor(Math.random() * templateList.length);
  const template = templateList[randomIndex];
  return fillTemplate(template, context);
}

// Função para obter template específico por índice
export function getTemplate(category: keyof typeof templates, index: number, context: TemplateContext = {}): string {
  const templateList = templates[category];
  if (!templateList || index >= templateList.length) {
    return getRandomTemplate(category, context);
  }
  
  return fillTemplate(templateList[index], context);
}

export { templates };
