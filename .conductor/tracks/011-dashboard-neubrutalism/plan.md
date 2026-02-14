# 011 — Dashboard & Internal Pages → Neubrutalism V3

## 🎯 Objetivo
Transformar o Dashboard, CreateEvent e EventDetails do estilo corporativo/gradient atual para o **Neubrutalism V3**, criando uma experiência visual divertida, criativa e energética — mantendo toda a lógica de negócio intacta.

## 🧠 Filosofia de Design

### ❌ O que mudar (eliminar)
- Gradients (`from-orange-500 to-amber-500`)
- `backdrop-blur`, `bg-card/50`, transparências
- `border-border/50`, `shadow-2xl` genéricos
- Floating pills headers (`rounded-3xl bg-card/80 backdrop-blur-xl`)
- Animated background orbs (`blur-3xl`)
- Look corporativo / "SaaS dashboard"

### ✅ O que trazer (Neubrutalism)
- Bordas grossas `border-[3px] border-[#1A1A1A]`
- Sombras sólidas `shadow-[4px_4px_0px_#1A1A1A]`
- Cores vibrantes e sólidas (`NBLight.yellow/orange/pink/mint/sky/lavender`)
- Micro-rotações em cards
- Stickers decorativos / emojis
- Tipografia **black** e expressiva
- Dark mode via `NBDark` palette
- Interações playful (hover → deslocamento de sombra, click → press)
- Cards como "post-its" com cores diferentes por tipo

---

## 📋 Checklist de Execução

### Fase 1: Dashboard.tsx (~750 linhas)
- [ ] 1.1 — Substituir background (remover orbs animados → `C.bg` sólido)
- [ ] 1.2 — Refatorar Header (de pill flutuante → top-bar sólida Neubrutalist com `nb.border`)
- [ ] 1.3 — Refatorar título/badges (remover gradients → cores sólidas + `nb.shadow`)
- [ ] 1.4 — Redesenhar Tabs (de pills corporativas → "sticker tabs" Neubrutalist)
- [ ] 1.5 — Redesenhar EventCard para estilo **post-it colorido**
  - Cada card tem cor de fundo diferente (yellow, pink, mint, sky, lavender)
  - Micro-rotação alternada (-1deg, 1deg, -0.5deg...)
  - Badge de status como sticker (👑/✓/⏳)
  - Emoji gigante de fundo semi-transparente baseado no tipo
  - Hover → rotação 0 + lift + sombra cresce
- [ ] 1.6 — Estado vazio: ilustração divertida com sticker + CTA vibrante
- [ ] 1.7 — Dark mode: usar `NBDark` palette via toggle
- [ ] 1.8 — Testar rendering com dados e sem dados

### Fase 2: CreateEvent.tsx (~737 linhas)
- [ ] 2.1 — Substituir background e header (mesma abordagem do Dashboard)
- [ ] 2.2 — Refatorar template selector (de pills → sticker tags coloridos)
- [ ] 2.3 — Refatorar form card (remover gradient glow → `nb.border` + `nb.shadowLg`)
- [ ] 2.4 — Estilizar inputs com `nb.input` tokens
- [ ] 2.5 — Estilizar botão de submit com `nb.button` + cor vibrante
- [ ] 2.6 — Estilizar lista de itens (de dashed border → bordered stickers)
- [ ] 2.7 — Dark mode support

### Fase 3: EventDetails.tsx (~2111 linhas) — MAIOR PÁGINA
- [ ] 3.1 — Background + header: mesma abordagem sólida
- [ ] 3.2 — Hero section do evento: card grande com cor + emoji do tipo
- [ ] 3.3 — Tabs de seções (Detalhes / Convidados / Itens): tabs Neubrutalist
- [ ] 3.4 — Seção de convidados: cards coloridos com iniciais
- [ ] 3.5 — Seção de itens/suprimentos: checklist estilo stickers
- [ ] 3.6 — Modal de convite: styled com `nb.border` + `nb.shadow`
- [ ] 3.7 — Botões de ação (confirmar presença, editar, etc): `nb.button`
- [ ] 3.8 — Dark mode support

### Fase 4: Verificação
- [ ] 4.1 — `npm run build` sem erros
- [ ] 4.2 — Verificar visual no browser (light + dark)
- [ ] 4.3 — Testar fluxo completo: criar evento → ver no dashboard → abrir detalhes

---

## 🎨 Paleta de Cores para Event Cards

| Index | Cor Fundo | Uso |
|-------|-----------|-----|
| 0 | `C.yellow` (#FFD93D) | Churrasco, Festa |
| 1 | `C.sky` (#A8D8FF) | Reunião, Meeting |
| 2 | `C.pink` (#FF69B4) | Aniversário |
| 3 | `C.mint` (#B8F3D0) | Jantar, Confra |
| 4 | `C.lavender` (#D4BBFF) | Outros |
| 5 | `C.orange` (#FF6B35) | Destaque / Próximo |

## 📐 Dimensões Mantidas
- Dashboard grid: `md:grid-cols-2 lg:grid-cols-3`
- Card max: sem limite, mas padding generoso
- Header: sticky top, full-width
- Mobile: stack em coluna única

## ⚠️ Regras
- **ZERO lógica de negócio alterada** — apenas JSX/CSS
- **Todos os imports existentes preservados** (Supabase, hooks, dialogs)
- **Dark mode integrado** — usar `useState` + `localStorage` como em `LandingV3`
