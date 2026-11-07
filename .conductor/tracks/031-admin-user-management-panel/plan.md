# Track 031: Painel Administrativo de Usuários & Controle de Acesso Restrito

## 🎯 Objetivo
Criar e configurar o Painel Administrativo com foco em gerenciamento e visualização de usuários cadastrados no ReUNE, condicionado **estritamente** aos usuários administradores autorizados (`emanuel.adm10@gmail.com` e usuário de teste `teste@reune.com` / `teste2@reune.dot`), com botão de acesso rápido flutuante disponível em qualquer lugar da tela para quem for admin.

---

## 🔒 Regras de Segurança e Acesso
1. **Whitelisted Admins:**
   - `emanuel.adm10@gmail.com`
   - `teste@reune.com` (e `teste2@reune.dot`)
2. **Bloqueio Total:** Ninguém mais pode acessar a rota `/admin` ou visualizar os dados. Se um usuário não autorizado tentar acessar, recebe tela amigável de Acesso Negado / 403 ou redirecionamento.
3. **Autenticação Direta:** Quando um dos emails autorizados estiver logado no ReUNE, o acesso é automático (sem precisar digitar senha extra toda vez).
4. **Proteção no Backend:** A Edge Function `get-admin-data` valida o token de autenticação do usuário logado contra a lista de emails autorizados.

---

## 🖥️ Experiência Visual & Acesso Global
- **Admin Launcher Flutuante (`AdminFloatingButton`):**
  - Componente flutuante discreto (ex: escudo/engrenagem com badge `ADMIN` no canto inferior da tela).
  - Só é renderizado se `useAuth()` estiver logado E o email for um dos admins.
  - Para qualquer outro visitante ou usuário comum: **100% invisível** (zero poluição visual).
  - Ao clicar, abre o painel `/admin` ou um drawer de consulta rápida.

---

## 📊 O Que o Painel Exibirá
1. **Lista de Usuários Cadastrados (`auth.users` + `profiles`):**
   - Nome / Username
   - Email
   - Data e hora de criação
   - Provedor de login (Google / Email)
   - Status de Founder / Assinatura
   - Busca em tempo real por nome ou email
   - Contador total de usuários
2. **Métricas Rápidas:**
   - Total de usuários cadastrados
   - Usuários cadastrados hoje / esta semana
   - Eventos criados
3. **Abas Integradas:**
   - Aba 1: Usuários Cadastrados (Nova e principal)
   - Aba 2: Lista de Espera (Waitlist)
   - Aba 3: Eventos Amigo Secreto
   - Aba 4: Central de Emails

---

## 🛠️ Plano de Implementação

### Fase 1: Camada de Autenticação Admin (`useAdmin` hook / helper)
- [x] Criar helper/hook `src/hooks/useAdmin.ts`:
  - Verifica se usuário está logado e se seu email está na lista `ADMIN_EMAILS`.
  - Exporta `isAdmin`, `userEmail`, `loading`.

### Fase 2: Proteção da Edge Function (`get-admin-data`)
- [x] Atualizar `supabase/functions/get-admin-data/index.ts`:
  - Suportar autenticação via JWT Bearer Token do Supabase do usuário logado.
  - Validar se o email do usuário logado é admin.
  - Retornar dados enriquecidos de usuários (`auth.users` + `profiles`: nome, email, provider, status founder, datas).
  - Deploy da Edge Function atualizada (versão ativa na nuvem).

### Fase 3: Reformulação do `AdminDashboard.tsx`
- [x] Substituir o formulário de senha manual por verificação nativa do `useAdmin`:
  - Se não for admin: exibe tela de "Acesso Restrito / Não Autorizado" com bloqueio completo.
  - Se for admin: carrega dados automaticamente com loading state elegante e tabs.
- [x] Implementar a aba **"Usuários Cadastrados"** com tabela rica (filtro de busca em tempo real, badges de status, provedor Google/Email, contadores).

### Fase 4: Botão de Acesso Global (`AdminFloatingButton`)
- [x] Criar `src/components/admin/AdminFloatingButton.tsx`.
- [x] Injetar no `src/App.tsx` para ficar disponível em qualquer rota/tela da aplicação quando o usuário logado for admin (100% invisível para os demais).

### Fase 5: Testes e Validação
- [x] Testes unitários de regras de autorização (`tests/unit/useAdmin.test.ts`).
- [x] Typecheck TypeScript (`npm run type-check`) com 0 erros.
- [x] Testes de regressão da suíte unitária (198 testes passando).
- [x] Build de produção com Vite validado com sucesso.
- [x] Atualizar tracks e documentação.
