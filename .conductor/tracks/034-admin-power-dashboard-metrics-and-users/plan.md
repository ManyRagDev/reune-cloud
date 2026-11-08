# Track 034: Painel Administrativo 360° (Métricas GA4 & Dados Unificados de Usuários)

## Contexto & Objetivo
Transformar o `/admin` em um Centro de Comando Administrativo definitivo, unificando métricas de tráfego do Google Analytics 4 (GA4 Data API) e dados completos de negócio (usuários cadastrados, sorteios relâmpago sem cadastro, eventos sociais ReUNE, status de envelopes lacrados e leads).

---

## Fases de Execução

### Fase 1: Backend Supabase (Expansão de Dados e Edge Functions)
- [x] 1.1 Atualizar `supabase/functions/get-admin-data/index.ts` para buscar sorteios relâmpago (`quick_secret_santas` e `quick_secret_santa_participants`) e eventos sociais gerais (`table_reune`).
- [x] 1.2 Criar Edge Function `supabase/functions/get-ga-metrics/index.ts` para consultar a Google Analytics Data API v1beta (métricas em tempo real e consolidadas de 30 dias), com fallback estruturado e guia de configuração de credenciais.

### Fase 2: Tipagem e Estrutura de Dados
- [x] 2.1 Atualizar `src/types/admin.ts` para incluir interfaces de `QuickSecretSantaAdmin`, `ReuneEventAdmin` e `GAMetricsData`.

### Fase 3: Redesign do Painel Administrativo (`AdminDashboard.tsx`)
- [x] 3.1 Criar barra de KPIs 360° no topo (Total de Usuários, Sorteios Relâmpago, Amigo Secreto com Conta, Eventos ReUNE, Acessos GA4 e Envelopes Abertos).
- [x] 3.2 Implementar Aba **Métricas & Tráfego GA4**: usuários ativos agora, ranking de páginas mais acessadas, tabela de eventos de conversão e painel de status da API com modal explicativo.
- [x] 3.3 Implementar Aba **Sorteios Relâmpago (Sem Cadastro ⚡)**: listagem de grupos, contagem de amigos, proporção de envelopes abertos vs lacrados, lista expansível de participantes e busca rápida.
- [x] 3.4 Implementar Aba **Eventos ReUNE Gerais (🍖)**: listagem de eventos com data, quantidade de pessoas, tipo e status.
- [x] 3.5 Harmonizar as abas existentes (**Usuários**, **Amigo Secreto com Conta**, **Waitlist** e **Email Center**).

### Fase 4: Verificação, Qualidade & Deploy
- [x] 4.1 Executar `npm run type-check` para validar integridade do TypeScript (0 erros).
- [x] 4.2 Executar suíte de testes unitários (`npm run test:unit` - 199/199 testes passando).
- [x] 4.3 Validar build de produção (`npm run build` - 5.39s).
- [x] 4.4 Fazer commit e push para deploy automático na Vercel.
