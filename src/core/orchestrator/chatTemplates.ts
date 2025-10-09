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
    "Olá! Sou o UNE.AI e vou ajudar a organizar seus eventos. Diga o tipo de evento e quantas pessoas.",
    "Oi! 👋 Que legal te ver aqui! Vamos planejar um evento? Me conta o que você tem em mente.",
    "Hey! Pronto pra organizar algo incrível? Me diz que tipo de evento você quer fazer!",
  ],

  // Perguntas sobre quantidade
  ask_qtd: [
    "Show! Vamos de {{categoria_evento}} 🍽️ Quantas pessoas participarão?",
    "Legal, um {{categoria_evento}}! Quantas pessoas devo considerar?",
    "Perfeito 👌 E quantas pessoas vão participar?",
  ],

  // Perguntas sobre categoria quando só temos subtipo
  ask_categoria: [
    "Legal, {{subtipo_evento}} entre amigos! Vai ser de dia (mais pra almoço) ou à noite (mais pra jantar)?",
    "Bacana! {{subtipo_evento}} é ótimo 😋 Será durante o dia ou à noite?",
    "Show! {{subtipo_evento}} vai ser incrível. É mais um almoço ou jantar?",
  ],

  // Perguntas sobre menu
  ask_menu: [
    "Perfeito! Já pensou no cardápio principal?",
    "Ótimo! E qual será o menu? Se quiser, posso sugerir algumas opções 😉",
    "Legal! Tem algo em mente para o cardápio?",
  ],

  // Perguntas sobre data
  ask_data: [
    "Perfeito! {{categoria_evento}} para {{qtd_pessoas}} pessoas. Qual será a data do evento?",
    "Show! E quando vai ser? Me passa a data 📅",
    "Ótimo! Qual a data que você está pensando?",
  ],

  // Confirmação de evento completo
  confirm_event: [
    "Perfeito! {{categoria_evento}} para {{qtd_pessoas}} pessoas — posso montar a lista de itens?",
    "Ótimo 🎉 Um {{categoria_evento}} para {{qtd_pessoas}} pessoas. Vamos gerar os preparativos?",
    "Show! Tenho tudo que preciso. Posso sugerir a lista de itens agora?",
  ],

  // Menu confirmado
  menu_confirmed: [
    "Excelente escolha 😋 {{menu}} é demais! Qual será a data do evento?",
    "Perfeito! {{menu}} vai ficar incrível 🍽️ Me passa a data agora?",
    "Ótima escolha! {{menu}} combina muito. Quando vai ser?",
  ],

  // Itens gerados
  items_generated: [
    "Listei itens e quantidades para **{{categoria_evento}} de {{qtd_pessoas}} pessoas**. Quer revisar antes de dividir?",
    "Pronto! Montei a lista de itens para o seu {{categoria_evento}} 🎉 O que você acha?",
    "Tá aqui! Lista completa para {{qtd_pessoas}} pessoas. Revisa aí e me diz o que acha!",
  ],

  // Itens confirmados
  items_confirmed: [
    "Ótimo! Os itens estão confirmados. Agora, quer adicionar participantes para dividir os custos?",
    "Perfeito! Lista aprovada ✅ Vamos adicionar os participantes agora?",
    "Show! Itens OK. Quer que eu te ajude a dividir entre os participantes?",
  ],

  // Evento finalizado
  event_finalized: [
    "Evento criado com sucesso! 🎉 Você pode vê-lo no seu dashboard.",
    "Tudo pronto! 🎊 Seu evento está no dashboard agora.",
    "Feito! ✨ Pode conferir todos os detalhes no dashboard.",
  ],

  // Erros - Desvio de contexto
  erro_desvio_contexto: [
    "😄 Ainda não tenho relógio interno, mas posso te ajudar com o evento!",
    "Haha, boa! Mas quero saber mais sobre o seu evento — o que vai ser?",
    "😂 Adorei, mas vamos focar no evento? Me conta o que você quer organizar!",
  ],

  // Erros - Ambiguidade
  erro_ambiguidade: [
    "Entendi, mas fiquei na dúvida — é mais um almoço, jantar ou algo diferente?",
    "Hmm, não tenho certeza se entendi. Pode me dar mais detalhes?",
    "Quase lá! Pode me explicar melhor o que você tem em mente?",
  ],

  // Erros - Dado inválido
  erro_dado_invalido: [
    "Hmm, essa data parece fora do normal 😅 pode revisar?",
    "Ops! Esse número não parece certo. Vamos tentar de novo?",
    "😅 Acho que algo não bateu. Pode verificar esse dado?",
  ],

  // Erros - Ruído textual
  erro_ruido: [
    "😂 adorei a energia! Agora, bora planejar o evento?",
    "Haha! Gostei 😄 E aí, qual evento você quer criar?",
    "😆 Muito bom! Mas me conta: o que vamos organizar hoje?",
  ],

  // Erros - Fora de escopo
  erro_fora_escopo: [
    "Haha, isso é interessante, mas meu foco é te ajudar com eventos. Quer criar um agora?",
    "😅 Não sou expert nisso, mas em eventos eu mando bem! Vamos planejar um?",
    "Essa não é bem minha praia, mas posso te ajudar a organizar eventos incríveis! Bora?",
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
