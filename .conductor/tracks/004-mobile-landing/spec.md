# Protocolo de Interrogatório: Refactor Mobile Landing Page (Index2)

## Contexto
O usuário relatou que a página `Index2.tsx` (Landing Page) está perfeita no Desktop, mas "quebrada" no mobile ("visualização ruim, muito fora da tela").

## Diagnóstico Preliminar (Análise de Código)
1. **Overflow Horizontal:** Elementos decorativos (orbs) de `w-96` (384px) e `text-5xl` podem estar estourando a largura de celulares menores.
2. **Menu de Navegação:** Atualmente os links ("Recursos", "Preços") estão dentro de uma `div` com `hidden md:flex`. Ou seja, no mobile **eles desaparecem completamente**, restando apenas o Logo e o botão "Entrar".
3. **Typography:** Títulos `text-5xl` a `text-8xl` são muito grandes para mobile.
4. **Padding:** `py-32` e `py-24` criam espaços em branco excessivos em telas pequenas.

## Perguntas de Alta Entropia

1. **Menu Mobile:**
   - [x] Criar um "Hamburger Menu" (ícone de 3 risquinhos) que abre uma gaveta/modal com os links?
   - [ ] Manter simplificado (apenas Logo + Entrar) como está hoje?
   - [ ] Criar uma barra de navegação inferior (bottom bar) fixa?

2. **Seção Hero (Topo):**
   - Os "Orbs" (luzes flutuantes) de fundo devem ser:
     - [x] Escondidos no mobile para limpar a visão?
     - [ ] Reduzidos de tamanho para caber na tela?

3. **Vídeo de Demo:**
   - O container do vídeo deve ocupar 100% da largura no mobile (edge-to-edge) ou manter margens laterais?
   mantenha as margens laterais, gerando mais conforto visual no mobile.

4. **Botões de Ação:**
   - Na Hero, temos dois botões grandes lado a lado ("Comece agora" e "Ver Demo"). No mobile, prefere que eles fiquem empilhados (um embaixo do outro) para maximizar o tamanho do clique?
   sim

---
 aguardando respostas para gerar `plan.md`.
