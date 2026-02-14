# Spec: Landing Page V3 — Neubrutalism

## Objetivo
Criar uma landing page alternativa na rota `/v3`, com estilo **Neubrutalism**, para A/B test contra a landing atual (`/` → Index2).

## Estilo Visual: Neubrutalism
- **Bordas grossas** pretas/escuras (3-4px)
- **Sombras sólidas** deslocadas (offset shadows) sem blur
- **Cores vibrantes** (backgrounds sólidos: amarelo, laranja, rosa, branco, preto)
- **Tipografia bold** e impactante
- **Cards com cantos arredondados** mínimos ou retos + borda grossa
- **Sem gradientes suaves** — apenas blocos de cor sólida
- **Botões com borda grossa** + sombra sólida + hover com deslocamento da sombra
- **Whitespace generoso** para contraste com elementos pesados

## Seções da Página (mesmas da Index2, re-estilizadas)
1. **Navbar** — Fixa, estilo brutalist
2. **Hero** — Headline bold, badges com borda grossa, CTAs brutalist
3. **Demo Video** — Container com borda grossa e sombra offset
4. **Features Grid** — Cards com borda grossa + sombras sólidas
5. **How It Works** — Steps com números em blocos sólidos
6. **Benefits** — Checklist com estilo brutal
7. **Final CTA** — Grande, bold, impactante
8. **Footer** — Reutilizar `<Footer />` existente

## Restrições
- Usar mesmos textos/conteúdos da Index2 (para comparação justa)
- Manter responsividade mobile
- Reutilizar `Footer`, `ThemeToggle`, `Sheet` da stack existente
- Usar Framer Motion para animações (como Index2)
- **Não** criar componentes separados — tudo dentro de `LandingV3.tsx`
- Rota: `/v3`
