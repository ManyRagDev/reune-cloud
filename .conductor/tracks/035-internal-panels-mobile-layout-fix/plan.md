# Track 035: Correção de Responsividade e Vazamento nos Painéis Internos do ReUNE (Dashboard, Detalhes do Evento, Lista de Itens & Amigo Secreto)

## 🎯 Objetivo
Eliminar completamente qualquer vazamento horizontal (`horizontal scroll / overflow`), cortes visuais e desalinhamentos nos painéis internos da aplicação no modo mobile (viewports 360px a 412px, testando criticamente em 375px), cobrindo:
1. **Dashboard do ReUNE (`Dashboard.tsx`):**
   - Conter tabs de filtro (`TODOS`, `MEUS`, `VOU!`, `PENDENTES`) sem esticar o documento.
   - Eliminar vazamento dos cards de evento (remover rotação no mobile `sm:rotate-[...]`, posicionar badges de status de forma segura sem coordenadas negativas externas no mobile).
   - Ajustar header e ações para telas estreitas (360px - 375px).
   - Otimizar Banner de Amigo Secreto e FAB flutuante para evitar overflow.
2. **Painel de Detalhes do Evento (`EventDetails.tsx`):**
   - Navbar interna com `min-w-0 flex-1`, truncamento elegante do título do evento e adaptação do seletor de status.
   - Ajustar cabeçalhos de edição e ações de presença (Data, Hora, Local) para quebrar fluidamente (`flex-col sm:flex-row`).
   - **Formulário e Lista de Insumos/Suprimentos:** Reestruturar formulário de adição e edição de itens para garantir que o input de quantidade, o seletor de unidade e o botão de adicionar caibam perfeitamente na largura mobile sem vazamentos.
3. **Amigo Secreto Integrado no ReUNE:**
   - Otimizar o Top Banner de Amigo Secreto (`DINÂMICA ATIVA`) e os botões de ação para mobile (`w-full sm:w-auto` / layout responsivo).
   - Otimizar o Card de Dinâmicas (`🎁 Dinâmicas do Evento`) com padding adaptável e botões bem posicionados.
   - Otimizar atalhos de Amigo Secreto nos cards do Dashboard.
4. **Validação E2E com Playwright:**
   - Executar inspeção automatizada em viewports 360x800 e 375x812 para atestar `scrollWidth === clientWidth` (zero horizontal overflow) em todas as telas internas.

---

## 📋 Checklist de Execução

- [x] **Fase 1: Correção do Dashboard (`Dashboard.tsx`)**
  - [x] Adicionar contenção de overflow e largura máxima na raiz (`overflow-x-clip min-h-screen bg-white font-sans`)
  - [x] Corrigir container de tabs (`w-full max-w-full min-w-0 overflow-x-auto pb-2 scrollbar-hide`)
  - [x] Ajustar rotações dos cards para mobile (apenas ativar rotação em telas `md:`, mantendo mobile reto e contido)
  - [x] Ajustar posição do badge de status (`top-2 right-2` ou offset contido no mobile)
  - [x] Ajustar Navbar superior para telas pequenas (360px-375px) com espaçamento e tamanhos táteis adequados
  - [x] Ajustar banner de Amigo Secreto e tooltip do FAB para não extrapolar a tela

- [x] **Fase 2: Correção dos Detalhes do Evento (`EventDetails.tsx`)**
  - [x] Aplicar contenção de overflow na raiz da tela (`overflow-x-clip min-h-screen`)
  - [x] Corrigir Navbar interna (adicionar `min-w-0 flex-1` aos wrappers, truncamento no título e seletor compacto)
  - [x] Corrigir cabeçalhos e linhas de confirmação de presença (Data, Horário, Local) com `flex flex-col sm:flex-row`
  - [x] Reestruturar formulário de adicionar insumo (`📦 Lista de Insumos`):
    - Em mobile: input numérico + select em linha e botão Adicionar em linha própria ou grid flexível
    - Garantir que nenhum elemento exceda a largura do card
  - [x] Reestruturar edição inline de insumo existente e resumo de custos

- [x] **Fase 3: Otimização do Amigo Secreto Dentro do ReUNE**
  - [x] Top Banner rosa do Amigo Secreto com layout de botões responsivo (`flex-col sm:flex-row` ou grid no mobile)
  - [x] Card de Dinâmicas do Evento com padding responsivo (`p-3 sm:p-4`) e layout vertical para os dados do sorteio e botão "Gerenciar"
  - [x] Botão de atalho do Amigo Secreto no card do Dashboard

- [x] **Fase 4: Validação Automatizada e Evidências**
  - [x] Executar script de Playwright em 375px e 360px
  - [x] Confirmar que `hasHorizontalScroll === false` e `overflowingCount === 0`
  - [x] Gerar novas screenshots para conferência visual
