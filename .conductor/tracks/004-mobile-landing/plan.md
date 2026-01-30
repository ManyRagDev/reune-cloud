# Plan: Mobile Landing Page Refactor

## Objetivos
- Tornar a Landing Page (`Index2.tsx`) 100% responsiva.
- Corrigir overflow horizontal.
- Implementar menu de navegação mobile.
- Otimizar experiência de toque (botões maiores/empilhados).

## Mudanças Propostas

### 1. `src/pages/Index2.tsx`
- [x] **Navegação:**
  - Adicionar componente `Sheet` / `DropdownMenu` ou div colapsável para o menu mobile.
  - Gatilho: Ícone `Menu` (hamburger) visível apenas em `md:hidden`.
- [x] **Hero:**
  - Orbs: Adicionar classe `hidden md:block`.
  - Botões: `flex-col gap-4 w-full sm:w-auto` no mobile.
  - Título: Ajuste de `text-5xl` para `text-4xl` em mobile se necessário, ou garantir `break-words`.
- [x] **Espaçamento:**
  - Reduzir `py-32` para `py-12` ou `py-16` em telas pequenas.

## Validação
1. Abrir modo responsivo do navegador (iPhone SE / 12).
2. Verificar se menu abre/fecha.
3. Verificar se não há scroll horizontal.
4. Verificar se botões estão empilhados e fáceis de clicar.
