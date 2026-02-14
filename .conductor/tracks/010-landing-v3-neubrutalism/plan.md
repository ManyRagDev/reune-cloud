# Plan: Dark Mode — Landing V3

## Paleta Calculada

### Light Mode (atual)
| Token     | Hex       | Uso                    |
|-----------|-----------|------------------------|
| yellow    | `#FFD93D` | Destaques, badges      |
| orange    | `#FF6B35` | CTAs, acentos          |
| pink      | `#FF69B4` | Stickers, badges       |
| white     | `#FFFDF7` | Fundos de card, texto  |
| black     | `#1A1A1A` | Bordas, texto, sombras |
| cream     | `#FFF8E1` | Fundos de seção        |
| mint      | `#B8F3D0` | Badges, checks         |
| sky       | `#A8D8FF` | Cards, steps           |
| lavender  | `#D4BBFF` | Cards                  |

### Dark Mode (calculada)
| Token     | Hex       | Raciocínio                                      |
|-----------|-----------|-------------------------------------------------|
| yellow    | `#FFD93D` | Mantém — bom contraste em fundo escuro          |
| orange    | `#FF8C5A` | Levemente clareado para leitura em fundo escuro |
| pink      | `#FF7EC3` | Levemente clareado                              |
| white     | `#F5F0E8` | Usado como cor de texto (não fundo)             |
| black     | `#1A1A1A` | Mantém — bordas e sombras continuam pretas      |
| cream     | `#2A2520` | Escurecido drasticamente — fundo de seção       |
| mint      | `#3D6B50` | Dessaturado/escuro — badge/check legível        |
| sky       | `#3A5C7A` | Dessaturado/escuro — cards/steps                |
| lavender  | `#4A3D6B` | Dessaturado/escuro — cards                      |
| bg (novo) | `#1E1B18` | Fundo principal da página                       |
| cardBg    | `#2D2926` | Fundo de cards (substitui white nos cards)      |

**Princípios de cor escura:**
- Bordas e sombras: continuam `#1A1A1A` (já escuro, funciona)
- Cores de destaque (yellow, orange, pink): levemente clareadas pra manter vibrance
- Fundos: tons quentes escuros (`#1E1B18`, `#2A2520`) pra manter o tom acolhedor
- Texto principal: `#F5F0E8` (creme claro, não branco puro — evita fadiga visual)
- Cards: `#2D2926` com borda preta funciona bem pois o card é mais claro que o bg

## Etapas

### Implementação do Toggle
- [ ] Criar estado `isDark` com `useState`, lendo `localStorage` no mount
- [ ] Persistir em `localStorage` ao alternar
- [ ] Adicionar botão de toggle na navbar (integrado ao design, não flutuante)

### Paleta Dinâmica
- [ ] Criar objeto `NBDark` com cores calculadas para dark mode
- [ ] Criar variável `C` que seleciona `NB` ou `NBDark` baseado em `isDark`
- [ ] Substituir todas as refs de `NB.xxx` por `C.xxx` no JSX

### Ajustes Específicos Dark Mode
- [ ] Texto principal: `C.text` (branco creme no dark, preto no light)
- [ ] Fundos de seção: `C.bg` e `C.sectionBg`
- [ ] Cards: `C.cardBg` no dark, `NB.white` no light
- [ ] Bordas e sombras: manter sempre `#1A1A1A`
- [ ] Opacidades de texto: revisar se ficam legíveis no dark
- [ ] CTA final: manter laranja full-width (funciona em ambos)

### Verificação
- [ ] Build sem erros
- [ ] Light mode inalterado visualmente
- [ ] Dark mode com contraste adequado em todas as seções
