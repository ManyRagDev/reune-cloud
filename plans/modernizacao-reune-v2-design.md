# Plano de Modernização do ReUNE - Design System V2

## 📋 Resumo Executivo

Modernização visual do ReUNE baseada nas 5 telas mobile desenvolvidas em `novo_front/`, expandindo para versões desktop e aplicando em todas as páginas do aplicativo.

---

## 🎨 Design System V2 - Especificação Completa

### 1. Paleta de Cores (Expandida do novo_front)

```typescript
// Novo design system - src/lib/design-v2.ts

export const DesignV2 = {
  // Cores Principais (do novo_front)
  primary: "#CCFF00",      // Acid Lime - ações primárias, CTAs
  secondary: "#FF00FF",    // Electric Magenta - destaques, badges
  alert: "#FF4800",        // International Orange - alertas, urgência
  
  // Cores Base
  background: "#F2F0E9",   // Newsprint - fundo principal
  surface: "#FFFFFF",      // Branco puro - cards, inputs
  text: "#000000",         // Preto - texto principal
  textMuted: "#4A4A4A",    // Cinza escuro - texto secundário
  
  // Cores de Estado (combinando com neobrutalism existente)
  success: "#22CC88",
  warning: "#FFD93D",      // Amarelo do sistema atual
  error: "#FF4444",
  info: "#A8D8FF",
  
  // Cores de Categoria (para eventos)
  churrasco: "#FF6B35",    // Laranja fogo
  pizza: "#FF69B4",        // Rosa
  festa: "#FF00FF",        // Magenta
  reuniao: "#A8D8FF",      // Azul claro
};
```

### 2. Tipografia

```typescript
export const TypographyV2 = {
  display: "'Space Grotesk', sans-serif",    // Títulos, headings
  mono: "'Space Mono', monospace",            // Datas, dados técnicos
  marker: "'Permanent Marker', cursive",      // Destaques, stickers
};
```

### 3. Tokens de Estilo

```typescript
export const TokensV2 = {
  // Bordas
  borderWidth: "3px",
  borderColor: "#000000",
  borderRadius: "0px",     // Brutalista = sem border-radius
  
  // Sombras (Hard shadows - estilo brutalista)
  shadow: {
    sm: "2px 2px 0px 0px #000000",
    md: "4px 4px 0px 0px #000000",
    lg: "6px 6px 0px 0px #000000",
  },
  
  // Espaçamento
  spacing: {
    xs: "0.25rem",   // 4px
    sm: "0.5rem",    // 8px
    md: "1rem",      // 16px
    lg: "1.5rem",    // 24px
    xl: "2rem",      // 32px
  },
  
  // Animações
  transition: "all 0.15s ease-out",
  
  // Transforms interativos
  hover: {
    translate: "translate(2px, 2px)",
    shadow: "2px 2px 0px 0px #000000",
  },
  active: {
    translate: "translate(4px, 4px)",
    shadow: "0px 0px 0px 0px #000000",
  },
};
```

---

## 🗺️ Mapeamento de Telas

### Telas do novo_front → Páginas do App

| Tela novo_front | Páginas Existentes | Descrição |
|-----------------|-------------------|-----------|
| `home_(the_feed)` | `Dashboard.tsx` | Feed principal de eventos do usuário |
| `create_event_(the_setup)` | `CreateEvent.tsx` | Formulário de criação de evento |
| `event_dashboard_(the_hub)` | Parte de `EventDetails.tsx` | Dashboard/visualização do evento |
| `guest_list_(the_crew)` | Parte de `EventDetails.tsx` | Lista de participantes/convidados |
| `supplies_(the_stash)` | Parte de `EventDetails.tsx` | Lista de itens/suprimentos |

### Novas Telas a Criar (Extraídas de EventDetails)

1. **`EventDashboard.tsx`** - Visão geral do evento (hub)
2. **`GuestList.tsx`** - Gerenciamento de convidados (crew)  
3. **`SuppliesList.tsx`** - Lista de itens para trazer (stash)

### Outras Telas a Modernizar

| Página | Prioridade | Complexidade |
|--------|------------|--------------|
| `Index.tsx` (Home/App) | Alta | Média |
| `Login.tsx` | Alta | Baixa |
| `AcceptInvite.tsx` | Alta | Baixa |
| `NotFound.tsx` | Média | Baixa |
| Páginas Secret Santa | Média | Média |
| Páginas Admin | Baixa | Média |

---

## 📐 Especificação de Layouts (Mobile + Desktop)

### 1. Home / Feed (Dashboard)

**Mobile (já existe em novo_front):**
- Header fixo com logo "ROLÊ" rotacionada + avatar usuário
- Banner marquee com frases divertidas
- Cards de evento empilhados verticalmente
- FAB (Floating Action Button) para novo evento
- Cada card: data em destaque, título, horário/local, avatares dos participantes

**Desktop (a criar):**
```
┌─────────────────────────────────────────────────────────────┐
│  [LOGO]  ROLÊ                              [Avatar] [Notif] │
├─────────────────────────────────────────────────────────────┤
│  SEUS ROLÊS                              [+ Novo Rolê]      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   EVENTO 1   │  │   EVENTO 2   │  │   EVENTO 3   │      │
│  │   (Card)     │  │   (Card)     │  │   (Card)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           EVENTO DESTAQUE (próximo)                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```
- Grid de cards 3 colunas
- Card de destaque para próximo evento (maior)
- Sidebar com resumo do usuário (opcional)

---

### 2. Criar Evento (CreateEvent)

**Mobile (já existe):**
- Header com botão fechar + título "NOVO ROLÊ"
- Form em etapas visuais:
  - O QUE VAI ROLAR? (textarea grande)
  - QUANDO? / QUE HORAS? (grid 2 colunas)
  - ONDE? (input + preview de mapa)
  - QUAL A VIBE? (seletor de emojis horizontal)
  - DETALHES SUJOS (textarea)
- Botão fixo inferior "BOTA PRA GERAR"

**Desktop:**
```
┌─────────────────────────────────────────────────────────────┐
│  [←]  NOVO ROLÊ                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   O QUE VAI ROLAR?                                          │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                                                     │   │
│   │           [Textarea grande centralizado]            │   │
│   │                                                     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   QUANDO?          QUE HORAS?                               │
│   ┌──────────────┐  ┌──────────────┐                       │
│   │   [Date]     │  │   [Time]     │                       │
│   └──────────────┘  └──────────────┘                       │
│                                                             │
│   ONDE?                                                     │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  [Input de endereço]        [Mapa preview]          │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   QUAL A VIBE?                    DETALHES SUJOS            │
│   [🥩][🍺][🍕][🎉]                ┌──────────────────┐     │
│                                   │                  │     │
│                                   │   [Textarea]     │     │
│                                   │                  │     │
│                                   └──────────────────┘     │
│                                                             │
│              ┌─────────────────────────────────────┐       │
│              │      BOTA PRA GERAR [bolt]          │       │
│              └─────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```
- Layout em 2 colunas para desktop
- Preview de mapa maior e funcional
- Seletor de vibe com mais opções visíveis

---

### 3. Dashboard do Evento (EventDashboard) - NOVA TELA

**Mobile:**
- Header com back + título do evento
- Hero card com:
  - Data em destaque (estilo calendário)
  - Título grande
  - Info data/hora/local
  - Avatares dos participantes
  - Preview do mapa
- Toggle RSVP "Tô Dentro / Tô Fora"
- Grid 2x2 de ações:
  - QUEM VAI (guests)
  - O QUE LEVAR (supplies)
  - RESENHA (chat)
  - AJUSTES (settings)
- Feed de atividades recentes
- Botão fixo "Mandar pros chegados"

**Desktop:**
```
┌─────────────────────────────────────────────────────────────────┐
│  [←]  CHURRAS DO PEDRO                              [Avatar]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────┐  ┌─────────────────────────────┐ │
│  │                          │  │  QUEM VAI          [15]     │ │
│  │    HERO CARD             │  │  O QUE LEVAR       [!]      │ │
│  │    (Evento info +        │  │  RESENHA           [●]      │ │
│  │     participantes)       │  │  AJUSTES                    │ │
│  │                          │  └─────────────────────────────┘ │
│  │  [Mapa embed]            │  ┌─────────────────────────────┐ │
│  │                          │  │  ÚLTIMAS DO ROLÊ            │ │
│  └──────────────────────────┘  │  • Malu confirmou...        │ │
│                                │  • João pegou Cerveja       │ │
│  ┌──────────────────────────┐  │  • Falta gelo!!             │ │
│  │  Tô Dentro  |  Tô Fora   │  └─────────────────────────────┘ │
│  └──────────────────────────┘                                 │
│                                                                 │
│        ┌─────────────────────────────────────────┐             │
│        │    Mandar pros chegados [share]         │             │
│        └─────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. Lista de Convidados (GuestList) - NOVA TELA

**Mobile (já existe):**
- Header com back + título "A GALERA"
- Marquee com status: "// 14 CONFIRMADOS // 3 TÃO FORA..."
- Tabs: VAI / TALVEZ / NÃO VAI
- Lista de cards:
  - Avatar (grayscale + contraste)
  - Nome
  - Badge "Trazendo: [item]"
  - Ícone de status (check, thumb_up, skull)
- Destaque para organizador (sticker "ADM")
- Estados especiais: "MIOLOU" (riscado), loading skeleton
- Footer com botão "CHAMAR MAIS GENTE"

**Desktop:**
```
┌─────────────────────────────────────────────────────────────────┐
│  [←]  A GALERA - CHURRAS DO PEDRO                             │
│  // 14 CONFIRMADOS // 3 TÃO FORA // 5 ENROLANDO // ...        │
├─────────────────────────────────────────────────────────────────┤
│  [VAI 14]  [TALVEZ 5]  [NÃO VAI 3]                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CONFIRMADOS                    PENDENTES                       │
│  ┌────────────────────────┐    ┌────────────────────────┐      │
│  │ 👤 Pedro Santos   [ADM]│    │ 👤 João Pedro    [P]   │      │
│  │    Traz: Carvão+Gelo   │    │                        │      │
│  ├────────────────────────┤    ├────────────────────────┤      │
│  │ 👤 Ana Clara           │    │ 👤 Rafael T.     [M]   │      │
│  │    Traz: Picanha (2kg) │    │    MIOLOU              │      │
│  ├────────────────────────┤    └────────────────────────┘      │
│  │ 👤 Lucas B.            │                                    │
│  │    Traz: Nada (mão...) │    [CHAMAR MAIS GENTE]            │
│  └────────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. Lista de Suprimentos (SuppliesList) - NOVA TELA

**Mobile (já existe):**
- Header com back + título "O Que Levar"
- Progress bar "Meta de Caos" com %
- Seções categorizadas:
  - 🍖 COMES (TÁ PAGO?)
  - 🍻 MAMAR (BEBIDAS)  
  - 🧊 TRALHA (GELO E TALS)
- Cada item:
  - Nome em fonte mono
  - Badge com quem está levando (se alguém)
  - Botão "Eu Levo" (se não atribuído)
  - Avatar do responsável
  - Estado "claimed" = tachado + fundo primary
- Input fixo inferior para adicionar item

**Desktop:**
```
┌─────────────────────────────────────────────────────────────────┐
│  [←]  O QUE LEVAR - CHURRAS DO PEDRO                          │
├─────────────────────────────────────────────────────────────────┤
│  Meta de Caos: 65% GARANTIDO ████████████░░░░░░                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COMES                          BEBIDAS                         │
│  ┌────────────────────────┐    ┌────────────────────────┐      │
│  │ ✓ PICANHA (2KG)        │    │   CERVEJA (3 CAIXAS)   │      │
│  │   PEDRO LEVA           │    │   [Eu Levo]            │      │
│  ├────────────────────────┤    ├────────────────────────┤      │
│  │   PÃO DE ALHO          │    │ ✓ VODKA (ABS)          │      │
│  │   [Eu Levo]            │    │   MARIA LEVA           │      │
│  └────────────────────────┘    └────────────────────────┘      │
│                                                                 │
│  TRALHA                                                         │
│  ┌────────────────────────┐                                    │
│  │   GELO (2 SACOS)       │    [ADICIONAR ITEM ___ [+]]       │
│  │   [Eu Levo]            │                                    │
│  └────────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Componentes Reutilizáveis Necessários

### 1. Layout Components

```typescript
// src/components/v2/BrutalistContainer.tsx
interface BrutalistContainerProps {
  children: React.ReactNode;
  className?: string;
  shadow?: 'sm' | 'md' | 'lg';
  border?: boolean;
  background?: 'bg' | 'surface' | 'primary' | 'secondary';
}

// src/components/v2/StickyHeader.tsx
interface StickyHeaderProps {
  left?: React.ReactNode;      // Botão voltar
  center: React.ReactNode;     // Título
  right?: React.ReactNode;     // Avatar/ações
  showMarquee?: boolean;       // Banner marquee
  marqueeText?: string;
}

// src/components/v2/BottomAction.tsx
interface BottomActionProps {
  children: React.ReactNode;   // Conteúdo do botão
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'dark';
  fixed?: boolean;
}
```

### 2. Card Components

```typescript
// src/components/v2/EventCard.tsx
interface EventCardProps {
  id: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  attendees: Attendee[];
  status: 'upcoming' | 'today' | 'planning' | 'past';
  onClick: () => void;
}

// src/components/v2/GuestCard.tsx
interface GuestCardProps {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  status: 'confirmed' | 'maybe' | 'declined' | 'pending';
  isOrganizer?: boolean;
  bringing?: string;
  onClick?: () => void;
}

// src/components/v2/SupplyCard.tsx
interface SupplyCardProps {
  id: string;
  name: string;
  quantity: string;
  assignedTo?: {
    name: string;
    avatar?: string;
  };
  category: 'food' | 'drinks' | 'other';
  onClaim: () => void;
  onUnclaim?: () => void;
}
```

### 3. Interactive Components

```typescript
// src/components/v2/VibeSelector.tsx
interface VibeSelectorProps {
  options: { emoji: string; label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

// src/components/v2/RSVPToggle.tsx
interface RSVPToggleProps {
  value: 'in' | 'out' | null;
  onChange: (value: 'in' | 'out') => void;
}

// src/components/v2/ActionGrid.tsx
interface ActionGridProps {
  actions: {
    icon: string;
    label: string;
    badge?: number | string;
    alert?: boolean;
    onClick: () => void;
  }[];
}

// src/components/v2/CategoryHeader.tsx
interface CategoryHeaderProps {
  title: string;
  emoji?: string;
  rotate?: number;
  shadowColor?: string;
}
```

### 4. Input Components

```typescript
// src/components/v2/BrutalistInput.tsx
interface BrutalistInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: 'text' | 'date' | 'time' | 'email';
  icon?: string;
}

// src/components/v2/BrutalistButton.tsx
interface BrutalistButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
}
```

---

## 📱 Responsividade (Breakpoints)

```css
/* Mobile First */
/* Default: 0-639px - Layout mobile completo */

/* Tablet: 640px-1023px */
@media (min-width: 640px) {
  /* Ajustes de padding, fontes maiores */
  /* Grid pode começar a ser 2 colunas */
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  /* Layouts em multi-colunas */
  /* Sidebar opcional */
  /* Cards maiores */
}

/* Large Desktop: 1280px+ */
@media (min-width: 1280px) {
  /* Máximo de aproveitamento de espaço */
  /* 3 colunas de cards */
}
```

---

## 🎯 Plano de Implementação por Fases

### Fase 1: Fundação (Design System)
**Arquivos a criar/modificar:**
- `src/lib/design-v2.ts` - Tokens e paleta
- `src/components/v2/` - Pasta para novos componentes
- `src/index.css` - Adicionar fontes (Space Grotesk, Space Mono, Permanent Marker)

**Duração estimada:** 1-2 sessões

---

### Fase 2: Componentes Base
**Componentes a implementar:**
1. `BrutalistContainer`
2. `BrutalistButton`
3. `BrutalistInput`
4. `StickyHeader`
5. `BottomAction`
6. `EventCard`

**Duração estimada:** 2-3 sessões

---

### Fase 3: Páginas Principais Mobile
**Páginas a reescrever:**
1. `Dashboard.tsx` (home/feed)
2. `CreateEvent.tsx` (criar evento)
3. `EventDashboard.tsx` (nova - hub do evento)

**Duração estimada:** 3-4 sessões

---

### Fase 4: Sub-páginas do Evento
**Páginas a criar/modificar:**
1. `GuestList.tsx` (nova - lista de convidados)
2. `SuppliesList.tsx` (nova - lista de itens)
3. Refatorar `EventDetails.tsx` para redirecionar ou conter

**Duração estimada:** 2-3 sessões

---

### Fase 5: Versões Desktop
**Adaptações:**
1. Dashboard com grid 3 colunas
2. CreateEvent com layout 2 colunas
3. EventDashboard com sidebar
4. GuestList com 2 colunas
5. SuppliesList com grid de categorias

**Duração estimada:** 2-3 sessões

---

### Fase 6: Telas Secundárias
**Páginas:**
1. `Index.tsx` (home do app)
2. `Login.tsx`
3. `AcceptInvite.tsx`
4. `NotFound.tsx`

**Duração estimada:** 2 sessões

---

### Fase 7: Secret Santa (Opcional)
**Páginas:**
1. `SecretSantaLanding.tsx`
2. `SecretSantaSetup.tsx`
3. `SecretSantaParticipants.tsx`
4. `SecretSantaMyResult.tsx`
5. `SecretSantaWishlist.tsx`

**Duração estimada:** 2-3 sessões

---

## 🔧 Configurações Técnicas

### 1. Fontes (Google Fonts)

Adicionar ao `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
```

### 2. Tailwind Config

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        'acid-lime': '#CCFF00',
        'electric-magenta': '#FF00FF',
        'international-orange': '#FF4800',
        'newsprint': '#F2F0E9',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
        marker: ['Permanent Marker', 'cursive'],
      },
      boxShadow: {
        'hard': '4px 4px 0px 0px #000000',
        'hard-sm': '2px 2px 0px 0px #000000',
        'hard-lg': '6px 6px 0px 0px #000000',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
}
```

### 3. Extensão do shadcn/ui

Criar variações dos componentes existentes:
- `Button` → `BrutalistButton`
- `Card` → `BrutalistCard`
- `Input` → `BrutalistInput`

---

## ✅ Checklist de Qualidade

Antes de marcar cada fase como completa:

- [ ] Todos os componentes seguem o design system
- [ ] Responsividade testada (mobile, tablet, desktop)
- [ ] Animações suaves (framer-motion)
- [ ] Estados de loading implementados
- [ ] Estados de erro tratados
- [ ] Acessibilidade básica (contrastes, foco)
- [ ] Testes visuais em diferentes telas

---

## 📝 Notas de Implementação

### Essência do ReUNE a Manter
1. **Linguagem casual e divertida** - manter gírias como "Rolê", "Bagunça", "Galera"
2. **Foco em eventos sociais** - churrasco, pizza, festas
3. **Colaboração** - quem leva o quê, divisão de tarefas
4. **Simplicidade** - não sobrecarregar o usuário

### O que Mudar
1. **Visual** - transição para neo-brutalismo pop
2. **Navegação** - separar EventDetails em páginas menores
3. **Feedback visual** - mais animações, badges, destaques
4. **Mobile-first** - priorizar experiência mobile

### Decisões Técnicas
1. Manter `shadcn/ui` como base
2. Usar `lucide-react` para ícones (não Material Symbols)
3. Manter `framer-motion` para animações
4. Usar `sonner` para toasts
5. Acesso ao banco sempre via `src/api/rpc.ts`
