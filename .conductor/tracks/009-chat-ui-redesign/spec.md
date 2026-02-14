# Especificação: Redesign Visual do Chat

## Contexto
O chat UNE.AI funcionalmente está bom, mas visualmente estava básico demais. Precisávamos de uma interface mais moderna e alinhada com a identidade visual do projeto.

## Design System Aplicado

### Cores
- **Primária (Laranja):** `hsl(16 100% 57%)` - Mensagens do usuário, CTAs
- **Secundária (Teal):** `hsl(173 100% 24%)` - Elementos do bot, destaques
- **Acento (Ciano):** `hsl(187 100% 42%)` - Sugestões, hover states
- **Dourado:** `hsl(45 100% 51%)` - Gradientes, detalhes

### Tipografia
- Fonte: Sistema (Inter via Tailwind)
- Tamanhos: 13-14px para mensagens, 11-12px para detalhes
- Pesos: 400 para texto, 500-600 para títulos

### Espaçamentos
- Gap entre mensagens: 12px
- Padding interno dos balões: 12px 16px
- Border radius: 18px (balões), 12px (cards), 24px (input)

## Componentes Principais

### 1. Header
```
Background: gradiente 135deg (laranja → dourado → teal)
Altura: ~80px
Elementos: Avatar + Nome + Status + Botões de ação
```

### 2. MessageBubble
```
Usuário:
  - Background: gradiente laranja
  - Texto: branco
  - Rabinho: direita inferior

Bot:
  - Background: branco
  - Borda: cinza claro
  - Texto: cinza escuro
  - Rabinho: esquerda inferior
```

### 3. ItemsCard
```
Background: teal claro (5% opacidade)
Borda: teal claro
Layout: Grid 2 colunas (nome/categoria | quantidade/preço)
Ícones: Emoji por categoria
Total: Destacado no final
```

### 4. SuggestionPill
```
Background: gradiente ciano claro
Texto: teal escuro
Border radius: 20px (pill)
Hover: Elevação + shadow
```

### 5. ChatInput
```
Background: cinza claro
Focus: Borda laranja + shadow laranja
Textarea: Auto-resize até 120px
Botão: Gradiente laranja, circular
```

## Animações

### Entrada de Mensagens
```css
@keyframes messageSlideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
Duration: 300ms
Easing: ease-out
```

### Typing Indicator
```css
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}
Duration: 1.4s
Easing: ease-in-out
```

### FAB Pulse
```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 107, 53, 0.4); }
  50% { box-shadow: 0 0 30px rgba(255, 107, 53, 0.6); }
}
Duration: 2s
```

## Responsividade
- Desktop: 420px de largura
- Mobile: 100% da largura (max-w-md)

## Acessibilidade
- Contraste adequado nas cores
- Focus states visíveis
- Alt text nas imagens
- ARIA labels nos botões

## Critérios de Aceitação
- [x] Design aplicado em todos os elementos
- [x] Animações suaves e não intrusivas
- [x] Cores consistentes com o design system
- [x] Funcionalidade preservada
- [x] Performance mantida (sem lag)
