# Track 016 — Visibilidade do Amigo Secreto no Dashboard e Conexão com Eventos/Festas

## Objetivo
Unir a logística da festa (data, local, comes e bebes) com a dinâmica do Amigo Secreto. Tornar o Amigo Secreto evidente e convidativo no Dashboard e permitir vincular facilmente o sorteio a um evento existente ou criar uma nova festa com Amigo Secreto ativado.

---

## Arquivos Impactados
- `src/pages/Dashboard.tsx`:
  - Botão de atalho direto no Header e Hero Section.
  - Banner Neobrutalista "🎁 Organizar Amigo Secreto".
  - Diálogo de Criação/Vinculação: *"Vincular a uma festa existente"* ou *"Criar nova festa com Amigo Secreto"*.
  - Busca da dinâmica de secret santa nos eventos do Dashboard para exibir badge temático `🎁 Amigo Secreto` e atalho para o sorteio.
- `src/pages/CreateEvent.tsx`:
  - Switch/Card opcional: *"Ativar Amigo Secreto para esta festa 🎁"*.
  - Se ativado, cria o registro em `event_dynamics` e `event_secret_santa` associado ao evento recém-criado.
- `src/pages/EventDetails.tsx`:
  - Subir a visibilidade do card de Amigo Secreto para área nobre da tela quando ativo.

---

## Plano de Execução Detalhado

### Fase 1: Vinculação na Criação de Eventos (`CreateEvent.tsx`)
- [x] **1.1 Adicionar opção de Amigo Secreto no formulário:**
  - Checkbox/card estilizado: *"Ativar Amigo Secreto neste evento 🎁"*.
  - Campos opcionais: valor mínimo e máximo do presente.
- [x] **1.2 Persistência atômica:**
  - Após criar o evento na `table_reune`, se o switch estiver ativo, inserir em `event_dynamics` (`type: 'secret_santa'`) e `event_secret_santa`.

### Fase 2: Hub de Amigo Secreto no Dashboard (`Dashboard.tsx`)
- [x] **2.1 Modal de Escolha Inteligente ao clicar em "Amigo Secreto":**
  - Se o usuário tem eventos cadastrados, oferecer:
    - *Opção 1:* "Vincular a uma festa existente" (seleciona evento da lista e vai para o setup).
    - *Opção 2:* "Criar um novo evento para a revelação" (vai para o CreateEvent com o Amigo Secreto pré-selecionado).
- [x] **2.2 Detecção de Amigo Secreto no Feed de Eventos:**
  - Consultar `event_dynamics` ou `categoria_evento` no `fetchEvents`.
  - Exibir badge vibrante `🎁 Amigo Secreto` e botão de ação direta "Gerenciar Sorteio" ou "Ver Meu Amigo".

### Fase 3: Destaque na Tela de Detalhes (`EventDetails.tsx`)
- [x] **3.1 Promover o card de dinâmica:**
  - Dar visibilidade destacada para o Amigo Secreto junto às informações centrais do evento.

### Fase 4: Validação e Testes
- [x] **4.1 Executar `npm run type-check`** (0 erros).
- [x] **4.2 Executar `npm run test:unit`** (183/183 verdes).
- [x] **4.3 Executar `npm run build`** (geração limpa).

---

## Critérios de Aceite (Definition of Done)
1. Ao criar qualquer evento/festa (churrasco, confraternização), o organizador pode ativar o Amigo Secreto com um clique.
2. No Dashboard, o usuário vê com clareza quais eventos têm Amigo Secreto e pode sortear/tirar nomes sem caçar a opção.
3. Clicar em "Amigo Secreto" no Dashboard permite escolher entre criar uma nova festa ou vincular a um rolê já existente.
4. Código 100% tipado, testado e com build de produção aprovado.
