/**
 * Parser de comandos de edição de itens
 * Track 006: Edição de itens via comandos naturais no chat
 */

export type EditOperation = 'add' | 'remove' | 'update' | 'multiply';

export interface EditItemCommand {
  operation: EditOperation;
  target: 'specific' | 'category' | 'all';
  itemName?: string;
  category?: 'comida' | 'bebida' | 'descartaveis' | 'decoracao' | 'combustivel' | 'outros';
  quantity?: number;
  quantityDelta?: number; // para "mais 10" ou "menos 5"
  multiplier?: number;    // para "dobrar", "triplicar"
  rawText: string;
}

/**
 * Verifica se o texto é um comando de edição de itens
 * Retorna o comando parseado ou null se não for comando
 */
export function parseItemCommand(text: string): EditItemCommand | null {
  const normalized = text.toLowerCase().trim();

  // Padrão 1: Remover item (tira, remove, exclui, apaga)
  const removePatterns = [
    /^(?:tira|remove|exclui|apaga|retira)\s+(?:o\s+|a\s+)?(.+?)(?:\s+da\s+lista)?$/i,
    /^(?:tira|remove|exclui|apaga|retira)\s+(?:o\s+|a\s+)?item\s+(.+?)$/i,
    /^nao\s+(?:quer|preciso|quero)\s+(?:o\s+|a\s+)?(.+)$/i,
  ];
  
  for (const pattern of removePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        operation: 'remove',
        target: 'specific',
        itemName: match[1].trim(),
        rawText: text,
      };
    }
  }

  // Padrão 2: Adicionar item (adiciona, coloca, inclui, põe)
  const addPatterns = [
    /^(?:adiciona|coloca|inclui|poe|põe)\s+(\d+(?:[,.]\d+)?)?\s*(.+?)(?:\s+a\s+mais)?$/i,
    /^(?:adiciona|coloca|inclui|poe|põe)\s+(?:mais\s+)?(\d+(?:[,.]\d+)?)?\s*(.+)$/i,
    /^(?:bota|coloca)\s+(\d+(?:[,.]\d+)?)?\s*(.+)$/i,
  ];
  
  for (const pattern of addPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const quantity = match[1] ? parseFloat(match[1].replace(',', '.')) : undefined;
      return {
        operation: 'add',
        target: 'specific',
        itemName: match[2].trim(),
        quantity,
        rawText: text,
      };
    }
  }

  // Padrão 3: Atualizar quantidade (aumenta, diminui, muda, altera)
  const updatePatterns = [
    /^(?:aumenta|sobe|mais)\s+(?:a\s+|o\s+)?(.+?)\s+(?:para|pra|a|em)\s+(\d+(?:[,.]\d+)?)$/i,
    /^(?:diminui|reduz|baixa)\s+(?:a\s+|o\s+)?(.+?)\s+(?:para|pra|a|em)\s+(\d+(?:[,.]\d+)?)$/i,
    /^(?:muda|altera|troca)\s+(?:a\s+|o\s+)?(.+?)\s+(?:para|pra)\s+(\d+(?:[,.]\d+)?)$/i,
    /^(?:deixa|faz)\s+(?:a\s+|o\s+)?(.+?)\s+(?:ser|ficar|com)\s+(\d+(?:[,.]\d+)?)$/i,
  ];
  
  for (const pattern of updatePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        operation: 'update',
        target: 'specific',
        itemName: match[1].trim(),
        quantity: parseFloat(match[2].replace(',', '.')),
        rawText: text,
      };
    }
  }

  // Padrão 4: Multiplicar (dobrar, triplicar, etc)
  const multiplyPatterns = [
    /^(?:dobra|dobrar|duplica)\s+(?:a\s+|o\s+)?(.+?)(?:\s+de\s+novo)?$/i,
    /^(?:triplica|triplicar)\s+(?:a\s+|o\s+)?(.+)$/i,
    /^(?:multiplica\s+por\s+(\d+))\s+(?:a\s+|o\s+)?(.+)$/i,
  ];
  
  for (const pattern of multiplyPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      let multiplier = 2;
      let itemName = match[1].trim();
      
      // Se for multiplica por N
      if (match[2]) {
        multiplier = parseInt(match[1], 10);
        itemName = match[2].trim();
      } else if (normalized.includes('triplica')) {
        multiplier = 3;
      }
      
      // Verificar se é "tudo" ou categoria
      const isAll = itemName.match(/^(tudo|todos|todas)$/i);
      const isCategory = itemName.match(/^(comida|bebida|carne|descartavel|decoracao)$/i);
      
      return {
        operation: 'multiply',
        target: isAll ? 'all' : isCategory ? 'category' : 'specific',
        itemName: isAll || isCategory ? undefined : itemName,
        category: isCategory ? mapCategory(itemName) : undefined,
        multiplier,
        rawText: text,
      };
    }
  }

  // Padrão 5: Quantidade delta ("mais 10 cervejas", "menos 5 refrigerantes")
  const deltaPatterns = [
    /^(?:mais\s+)(\d+(?:[,.]\d+)?)\s*(.+)$/i,
    /^(?:menos\s+)(\d+(?:[,.]\d+)?)\s*(.+)$/i,
  ];
  
  for (const pattern of deltaPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const isMore = normalized.startsWith('mais');
      const delta = parseFloat(match[1].replace(',', '.'));
      
      return {
        operation: 'update',
        target: 'specific',
        itemName: match[2].trim(),
        quantityDelta: isMore ? delta : -delta,
        rawText: text,
      };
    }
  }

  return null;
}

/**
 * Mapeia nomes de categorias comuns para o formato do sistema
 */
function mapCategory(categoryName: string): EditItemCommand['category'] {
  const mapping: Record<string, EditItemCommand['category']> = {
    'comida': 'comida',
    'bebida': 'bebida',
    'carne': 'comida',
    'descartavel': 'descartaveis',
    'descartáveis': 'descartaveis',
    'decoracao': 'decoracao',
    'decoração': 'decoracao',
  };
  return mapping[categoryName] || 'outros';
}

/**
 * Encontra um item na lista pelo nome (fuzzy matching)
 */
export function findItemByName<T extends { nome_item: string }>(itemName: string, items: T[]): T | undefined {
  const normalizedSearch = itemName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Busca exata primeiro
  const exactMatch = items.find(item => 
    item.nome_item.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedSearch
  );
  if (exactMatch) return exactMatch;
  
  // Busca parcial
  const partialMatch = items.find(item => {
    const normalizedItem = item.nome_item.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalizedItem.includes(normalizedSearch) || normalizedSearch.includes(normalizedItem);
  });
  if (partialMatch) return partialMatch;
  
  // Busca por palavras-chave
  const keywords = normalizedSearch.split(/\s+/);
  return items.find(item => {
    const normalizedItem = item.nome_item.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return keywords.some(keyword => normalizedItem.includes(keyword));
  });
}

/**
 * Gera mensagem de feedback para o usuário sobre a edição
 */
export function generateEditFeedback(command: EditItemCommand, itemName?: string): string {
  switch (command.operation) {
    case 'add':
      return `Pronto! Adicionei ${command.quantity ? command.quantity + ' ' : ''}${itemName || command.itemName} na lista ✓`;
    
    case 'remove':
      return `Removido! Tirei ${itemName || command.itemName} da lista ✓`;
    
    case 'update':
      if (command.quantityDelta) {
        const direction = command.quantityDelta > 0 ? 'aumentei' : 'diminui';
        return `${direction.charAt(0).toUpperCase() + direction.slice(1)}! Ajustei ${itemName || command.itemName} ${Math.abs(command.quantityDelta) > 0 ? 'em ' + Math.abs(command.quantityDelta) : ''} ✓`;
      }
      return `Alterado! ${itemName || command.itemName} agora é ${command.quantity} ✓`;
    
    case 'multiply':
      const multiplierText = command.multiplier === 2 ? 'dobrado' : command.multiplier === 3 ? 'triplicado' : `multiplicado por ${command.multiplier}`;
      const targetText = command.target === 'all' ? 'todos os itens' : 
                        command.target === 'category' ? `os itens de ${command.category}` : 
                        itemName || command.itemName;
      return `Feito! ${multiplierText.charAt(0).toUpperCase() + multiplierText.slice(1)} ${targetText} ✓`;
    
    default:
      return 'Pronto! Alteração feita ✓';
  }
}

/**
 * Pré-triagem de intenção de edição de itens.
 * Mais permissiva que parseItemCommand — usada para decidir se vale chamar o LLM
 * ou se podemos executar diretamente.
 *
 * confidence: 'high'   → parseItemCommand() deve resolver, executar sem LLM
 * confidence: 'medium' → enviar para LLM com contexto de edição ativo
 * confidence: 'low'    → pode ser edição, enviar para LLM normalmente
 */
export function detectEditIntentFromMessage(message: string): {
  isEditCommand: boolean;
  confidence: 'high' | 'medium' | 'low';
  suggestedOperation?: 'add' | 'remove' | 'update' | 'multiply';
} {
  const lower = message.toLowerCase().trim();

  // ─── ALTA CONFIANÇA: verbos imperativos explícitos no início da frase ────
  const highConfidence: Array<[RegExp, 'add' | 'remove' | 'update' | 'multiply']> = [
    [/^(adiciona|coloca|bota|inclui|põe|poe)\s+/i, 'add'],
    [/^(tira|remove|exclui|apaga|retira|deleta)\s+/i, 'remove'],
    [/^(muda|altera|troca|modifica)\s+.+\s+(pra|para)\s+\d+/i, 'update'],
    [/^(aumenta|sobe|diminui|reduz|baixa)\s+.+\s+(pra|para|a|em)\s+\d+/i, 'update'],
    [/^(dobra|duplica|triplica|multiplica)\s+/i, 'multiply'],
    [/^nao\s+(quero|preciso|quer)\s+/i, 'remove'],
  ];

  for (const [pattern, op] of highConfidence) {
    if (pattern.test(lower)) {
      return { isEditCommand: true, confidence: 'high', suggestedOperation: op };
    }
  }

  // ─── MÉDIA CONFIANÇA: palavra de edição + quantidade numérica ────────────
  const editKeywords = ['mais', 'menos', 'adicional', 'extra', 'falta', 'sobra'];
  const hasEditKeyword = editKeywords.some(kw => lower.includes(kw));
  const hasNumber = /\d+/.test(lower);
  const hasItemWord = /\b(cerveja|carne|pão|pao|gelo|refrigerante|agua|água|carvão|carvao|item|produto)\b/i.test(lower);

  if (hasEditKeyword && hasNumber) {
    return { isEditCommand: true, confidence: 'medium' };
  }
  if (hasEditKeyword && hasItemWord) {
    return { isEditCommand: true, confidence: 'medium' };
  }

  // ─── BAIXA CONFIANÇA: contexto sugere manipulação de lista ───────────────
  if (lower.includes('lista') || lower.includes('item') || lower.includes('itens')) {
    return { isEditCommand: true, confidence: 'low' };
  }

  return { isEditCommand: false, confidence: 'low' };
}
