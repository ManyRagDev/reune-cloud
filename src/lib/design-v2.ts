/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ReUNE Design System V2 - Neo-Brutalismo Pop
 * Baseado nas telas de novo_front/
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PALETA DE CORES
// ═══════════════════════════════════════════════════════════════════════════════

export const ColorsV2 = {
  // Cores Principais (do novo_front)
  primary: "#CCFF00" as const,      // Acid Lime - ações primárias, CTAs
  secondary: "#FF00FF" as const,    // Electric Magenta - destaques, badges
  alert: "#FF4800" as const,        // International Orange - alertas, urgência
  
  // Cores Base
  background: "#F2F0E9" as const,   // Newsprint - fundo principal
  surface: "#FFFFFF" as const,      // Branco puro - cards, inputs
  text: "#000000" as const,         // Preto - texto principal
  textMuted: "#4A4A4A" as const,    // Cinza escuro - texto secundário
  
  // Cores de Estado (compatibilidade com neobrutalism.ts)
  success: "#22CC88" as const,
  warning: "#FFD93D" as const,      // Amarelo do sistema atual
  error: "#FF4444" as const,
  info: "#A8D8FF" as const,
  
  // Cores de Categoria (para eventos)
  churrasco: "#FF6B35" as const,    // Laranja fogo
  pizza: "#FF69B4" as const,        // Rosa
  festa: "#FF00FF" as const,        // Magenta
  reuniao: "#A8D8FF" as const,      // Azul claro
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOGRAFIA
// ═══════════════════════════════════════════════════════════════════════════════

export const TypographyV2 = {
  display: "'Space Grotesk', sans-serif" as const,     // Títulos, headings
  mono: "'Space Mono', monospace" as const,            // Datas, dados técnicos
  marker: "'Permanent Marker', cursive" as const,      // Destaques, stickers
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TOKENS DE ESTILO
// ═══════════════════════════════════════════════════════════════════════════════

export const TokensV2 = {
  // Bordas
  borderWidth: "3px" as const,
  borderColor: "#000000" as const,
  borderRadius: "0px" as const,     // Brutalista = sem border-radius
  
  // Sombras (Hard shadows - estilo brutalista)
  shadow: {
    sm: "2px 2px 0px 0px #000000" as const,
    md: "4px 4px 0px 0px #000000" as const,
    lg: "6px 6px 0px 0px #000000" as const,
  },
  
  // Espaçamento
  spacing: {
    xs: "0.25rem" as const,   // 4px
    sm: "0.5rem" as const,    // 8px
    md: "1rem" as const,      // 16px
    lg: "1.5rem" as const,    // 24px
    xl: "2rem" as const,      // 32px
    "2xl": "3rem" as const,   // 48px
  },
  
  // Animações
  transition: "all 0.15s ease-out" as const,
  
  // Transforms interativos
  hover: {
    translate: "translate(2px, 2px)" as const,
    shadow: "2px 2px 0px 0px #000000" as const,
  },
  active: {
    translate: "translate(4px, 4px)" as const,
    shadow: "0px 0px 0px 0px #000000" as const,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSES UTILITÁRIAS TAILWIND
// ═══════════════════════════════════════════════════════════════════════════════

export const tw = {
  // Bordas
  border: "border-[3px] border-black",
  borderDashed: "border-[3px] border-black border-dashed",
  
  // Sombras
  shadow: "shadow-[4px_4px_0px_0px_#000000]",
  shadowSm: "shadow-[2px_2px_0px_0px_#000000]",
  shadowLg: "shadow-[6px_6px_0px_0px_#000000]",
  
  // Estados interativos
  interactive: "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150",
  
  // Inputs
  input: "border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#000000] focus:outline-none focus:bg-[#CCFF00] transition-all duration-150",
  
  // Botões
  button: "border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] font-bold uppercase tracking-tight",
  buttonPrimary: "bg-[#CCFF00] border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] font-bold uppercase tracking-tight hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150",
  buttonSecondary: "bg-[#FF00FF] text-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] font-bold uppercase tracking-tight hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150",
  buttonDark: "bg-black text-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] font-bold uppercase tracking-tight hover:bg-gray-900 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150",
  
  // Cards
  card: "bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000000]",
  cardPrimary: "bg-[#CCFF00] border-[3px] border-black shadow-[4px_4px_0px_0px_#000000]",
  cardSecondary: "bg-[#FF00FF] text-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000000]",
  
  // Tipografia
  fontDisplay: "font-['Space_Grotesk',sans-serif]",
  fontMono: "font-['Space_Mono',monospace]",
  fontMarker: "font-['Permanent_Marker',cursive]",
  
  // Títulos
  heading: "font-['Space_Grotesk',sans-serif] font-bold tracking-tight",
  headingXl: "font-['Space_Grotesk',sans-serif] font-bold text-4xl md:text-5xl tracking-tighter",
  headingLg: "font-['Space_Grotesk',sans-serif] font-bold text-3xl tracking-tight",
  headingMd: "font-['Space_Grotesk',sans-serif] font-bold text-2xl tracking-tight",
  
  // Labels
  label: "font-['Space_Mono',monospace] text-sm font-bold uppercase tracking-wider",
  
  // Fundos
  bgPage: "bg-[#F2F0E9]",
  bgSurface: "bg-white",
  bgPrimary: "bg-[#CCFF00]",
  bgSecondary: "bg-[#FF00FF]",
  
  // Utils
  rotateNeg: "-rotate-1",
  rotatePos: "rotate-1",
  rotateNeg2: "-rotate-2",
  rotatePos2: "rotate-2",
  skewNeg: "-skew-x-6",
  skewPos: "skew-x-6",
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// BREAKPOINTS RESPONSIVOS
// ═══════════════════════════════════════════════════════════════════════════════

export const Breakpoints = {
  sm: "640px" as const,
  md: "768px" as const,
  lg: "1024px" as const,
  xl: "1280px" as const,
  "2xl": "1536px" as const,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMAÇÕES (Framer Motion variants)
// ═══════════════════════════════════════════════════════════════════════════════

export const Animations = {
  // Entrada suave
  fadeIn: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, ease: "easeOut" },
  },
  
  // Entrada com scale
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.15, ease: "easeOut" },
  },
  
  // Stagger para listas
  stagger: {
    animate: { transition: { staggerChildren: 0.05 } },
  },
  
  // Hover card
  cardHover: {
    rest: { y: 0, boxShadow: "4px 4px 0px 0px #000000" },
    hover: { y: -2, boxShadow: "6px 6px 0px 0px #000000" },
  },
  
  // Press button
  buttonPress: {
    rest: { scale: 1 },
    tap: { scale: 0.98 },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TEMAS POR TIPO DE EVENTO
// ═══════════════════════════════════════════════════════════════════════════════

export const EventThemes = {
  churrasco: {
    color: ColorsV2.churrasco,
    icon: "Flame",
    emoji: "🥩",
  },
  pizza: {
    color: ColorsV2.pizza,
    icon: "Pizza",
    emoji: "🍕",
  },
  festa: {
    color: ColorsV2.festa,
    icon: "PartyPopper",
    emoji: "🎉",
  },
  reuniao: {
    color: ColorsV2.reuniao,
    icon: "Briefcase",
    emoji: "💼",
  },
  aniversario: {
    color: "#FFD93D",
    icon: "Cake",
    emoji: "🎂",
  },
  default: {
    color: ColorsV2.primary,
    icon: "Calendar",
    emoji: "📅",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TIPO DE RETORNO DO TEMA
// ═══════════════════════════════════════════════════════════════════════════════

export type EventThemeType = keyof typeof EventThemes;

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITÁRIO: Obter cor de status do convidado
// ═══════════════════════════════════════════════════════════════════════════════

export function getGuestStatusColor(status: 'confirmed' | 'maybe' | 'declined' | 'pending'): string {
  switch (status) {
    case 'confirmed':
      return ColorsV2.primary;
    case 'maybe':
      return ColorsV2.warning;
    case 'declined':
      return ColorsV2.textMuted;
    case 'pending':
      return ColorsV2.secondary;
    default:
      return ColorsV2.textMuted;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITÁRIO: Obter ícone/label de status do convidado
// ═══════════════════════════════════════════════════════════════════════════════

export function getGuestStatusLabel(status: 'confirmed' | 'maybe' | 'declined' | 'pending'): string {
  switch (status) {
    case 'confirmed':
      return "VAI";
    case 'maybe':
      return "TALVEZ";
    case 'declined':
      return "NÃO VAI";
    case 'pending':
      return "ENROLANDO";
    default:
      return "ENROLANDO";
  }
}
