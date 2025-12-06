# Plano de Implementação: Admin Email Center

## 📋 Resumo Executivo

Expandir o painel admin existente para criar um **Admin Center completo** de gerenciamento de comunicações por e-mail com leads/waitlist, incluindo:
- Dashboard de gerenciamento de leads
- Sistema de templates de e-mail editáveis
- Envio manual e automático de e-mails via Resend
- Logs completos de envios
- Interface moderna seguindo o design do Index2.tsx

---

## 🔍 Análise da Situação Atual

### ✅ O que já existe e funciona:

1. **Tabela Supabase: `waitlist_reune`**
   - Campos: `id`, `email`, `created_at`
   - Política RLS para inserção pública
   - Índices otimizados

2. **Edge Function: `send-invitation-email`**
   - Já integrada com Resend API
   - Template HTML profissional
   - Validação com Zod
   - Bom padrão para seguir

3. **Edge Function: `waitlist`**
   - Adiciona e-mails à waitlist
   - Integração com Meta Conversions API

4. **Edge Function: `get-admin-data`**
   - Busca dados para o admin dashboard
   - Autenticação por senha

5. **AdminDashboard.tsx**
   - Tela básica mostrando waitlist e eventos
   - Autenticação simples (senha: "2025")

### ❌ O que falta implementar:

1. **Campos adicionais na tabela `waitlist_reune`**
   - `name` - Nome do lead
   - `origin` - Origem do cadastro
   - `welcome_email_sent` - Se recebeu e-mail de boas-vindas
   - `welcome_email_sent_at` - Quando recebeu

2. **Tabelas novas**
   - `email_templates` - Templates editáveis
   - `email_logs` - Histórico de envios

3. **Edge Functions novas**
   - `send-admin-email` - Envio manual com template
   - `get-email-templates` - CRUD de templates
   - `get-email-logs` - Buscar logs

4. **Interface completa de gerenciamento**
   - Dashboard de leads com ações
   - Editor de templates
   - Visualizador de logs
   - Envio manual via modal

---

## ⚠️ Problemas Identificados e Soluções

### PROBLEMA 1: Usuário menciona tabela "leads" que não existe
**Análise**: A tabela atual é `waitlist_reune`, não `leads`
**Solução**: Usar e expandir `waitlist_reune` ao invés de criar nova tabela
**Justificativa**: Mantém consistência e evita migração de dados

### PROBLEMA 2: Campo "name" não está sendo capturado
**Análise**: Landing pages atuais só capturam e-mail
**Solução**:
- Adicionar campo `name TEXT` (nullable) à `waitlist_reune`
- Manter dados existentes com `name = NULL`
- Futuro: adicionar input de nome nas landing pages
**Justificativa**: Permite personalização de e-mails

### PROBLEMA 3: Segurança do Admin
**Análise**: Senha hardcoded "2025" no código
**Solução**:
- **Curto prazo**: Manter senha atual mas validar via Edge Function
- **Longo prazo**: Migrar para Supabase Auth com roles
**Justificativa**: Não quebrar sistema existente

### PROBLEMA 4: Envio automático pode gerar spam
**Análise**: Disparar e-mails automaticamente é arriscado
**Solução**:
- Implementar mas deixar **desativado por padrão**
- Admin ativa via configuração quando quiser
- Adicionar flag `auto_welcome_enabled` nas configurações
**Justificativa**: Segurança e controle

---

## 🗄️ Arquitetura de Banco de Dados

### Migration 1: Expandir `waitlist_reune`

```sql
-- Adicionar novos campos à waitlist_reune
ALTER TABLE public.waitlist_reune
  ADD COLUMN name TEXT,
  ADD COLUMN origin TEXT DEFAULT 'unknown',
  ADD COLUMN welcome_email_sent BOOLEAN DEFAULT false,
  ADD COLUMN welcome_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Índices para performance
CREATE INDEX idx_waitlist_reune_name ON public.waitlist_reune(name);
CREATE INDEX idx_waitlist_reune_welcome_sent ON public.waitlist_reune(welcome_email_sent);

-- Comentários
COMMENT ON COLUMN public.waitlist_reune.name IS 'Nome do lead (opcional)';
COMMENT ON COLUMN public.waitlist_reune.origin IS 'Origem do cadastro (landing, invite, etc)';
COMMENT ON COLUMN public.waitlist_reune.welcome_email_sent IS 'Se já recebeu e-mail de boas-vindas';
```

### Migration 2: Criar `email_templates`

```sql
-- Tabela de templates de e-mail
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  description TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Política: apenas service role pode modificar
CREATE POLICY "Apenas service role pode modificar templates"
ON public.email_templates
USING (false);

-- Índices
CREATE INDEX idx_email_templates_name ON public.email_templates(name);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Templates iniciais
INSERT INTO public.email_templates (name, subject, description, html_content, variables) VALUES
('boas_vindas', 'Bem-vindo ao ReUNE! 🎉', 'E-mail de boas-vindas para novos leads',
'<html><!-- Template HTML aqui --></html>',
'["nome", "email"]'::jsonb),

('atualizacao_lancamento', 'Novidades do ReUNE 🚀', 'Atualização sobre o lançamento',
'<html><!-- Template HTML aqui --></html>',
'["nome"]'::jsonb),

('convite_exclusivo', 'Você tem acesso exclusivo! ✨', 'Convite para recursos VIP',
'<html><!-- Template HTML aqui --></html>',
'["nome", "codigo_acesso"]'::jsonb);
```

### Migration 3: Criar `email_logs`

```sql
-- Tabela de logs de envio de e-mail
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.waitlist_reune(id) ON DELETE SET NULL,
  lead_email TEXT NOT NULL,
  template_name TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Política: apenas service role pode visualizar
CREATE POLICY "Apenas service role pode ver logs"
ON public.email_logs
USING (false);

-- Índices
CREATE INDEX idx_email_logs_lead_id ON public.email_logs(lead_id);
CREATE INDEX idx_email_logs_template_name ON public.email_logs(template_name);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

-- Comentários
COMMENT ON COLUMN public.email_logs.lead_email IS 'Email do destinatário (guardado para caso lead seja deletado)';
COMMENT ON COLUMN public.email_logs.metadata IS 'Dados extras: resend_message_id, variables, etc';
```

### Migration 4: Configurações do Admin

```sql
-- Tabela de configurações do admin
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas service role pode modificar settings"
ON public.admin_settings
USING (false);

-- Configuração inicial
INSERT INTO public.admin_settings (key, value, description) VALUES
('auto_welcome_enabled', 'false'::jsonb, 'Enviar e-mail de boas-vindas automaticamente para novos leads'),
('from_email', '"ReUNE <noreply@reuneapp.com.br>"'::jsonb, 'E-mail remetente padrão'),
('default_welcome_template', '"boas_vindas"'::jsonb, 'Template padrão de boas-vindas');
```

---

## 🔌 Edge Functions

### 1. `send-admin-email` (Nova)

**Propósito**: Enviar e-mail manual para lead(s) usando template

**Input**:
```typescript
{
  lead_ids: string[], // IDs dos leads
  template_name: string,
  variables?: Record<string, string>, // Variáveis do template
  password: string // Admin auth
}
```

**Fluxo**:
1. Validar senha admin
2. Buscar template do banco
3. Para cada lead:
   - Buscar dados do lead
   - Substituir variáveis no HTML
   - Enviar via Resend
   - Registrar log
   - Atualizar `welcome_email_sent` se for template de boas-vindas

**Arquivo**: `supabase/functions/send-admin-email/index.ts`

### 2. `get-email-templates` (Nova)

**Propósito**: CRUD de templates de e-mail

**Endpoints**:
- `GET /` - Listar todos
- `GET /:id` - Buscar um
- `POST /` - Criar novo
- `PUT /:id` - Atualizar
- `DELETE /:id` - Deletar

**Auth**: Validar senha admin

**Arquivo**: `supabase/functions/email-templates/index.ts`

### 3. `get-email-logs` (Nova)

**Propósito**: Buscar logs de envios com filtros

**Input**:
```typescript
{
  password: string,
  filters?: {
    lead_id?: string,
    template_name?: string,
    status?: 'success' | 'failed',
    start_date?: string,
    end_date?: string
  },
  limit?: number,
  offset?: number
}
```

**Output**: Lista paginada de logs

**Arquivo**: `supabase/functions/get-email-logs/index.ts`

### 4. Modificar `get-admin-data` (Existente)

**Adicionar**:
- Buscar configurações (`admin_settings`)
- Retornar campos novos da `waitlist_reune`

### 5. Modificar `waitlist` (Existente)

**Adicionar**:
- Capturar `name` e `origin` se fornecidos
- Trigger para envio automático de boas-vindas (se `auto_welcome_enabled = true`)

---

## 🎨 Componentes React

### Estrutura de Pastas

```
src/
├── pages/
│   ├── AdminDashboard.tsx (MODIFICAR)
│   └── AdminEmailCenter.tsx (NOVA)
├── components/
│   └── admin/
│       ├── EmailTemplateEditor.tsx (NOVA)
│       ├── EmailLogViewer.tsx (NOVA)
│       ├── SendEmailModal.tsx (NOVA)
│       ├── LeadTable.tsx (NOVA)
│       └── AdminHeader.tsx (NOVA)
```

### 1. AdminDashboard.tsx (Modificar)

**Mudanças**:
- Adicionar tab "Email Center"
- Modernizar com design do Index2
- Animated orbs (gradiente admin: amber/purple)
- Floating header

### 2. AdminEmailCenter.tsx (Nova)

**Layout**:
```
┌─────────────────────────────────────────┐
│ 📊 Cards de Estatísticas                │
│  - Total Leads                           │
│  - E-mails Enviados (hoje/semana/mês)   │
│  - Taxa de sucesso                       │
│  - Leads sem boas-vindas                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📋 Tabs                                  │
│  [Leads] [Templates] [Logs]             │
└─────────────────────────────────────────┘

TAB 1: LEADS
┌─────────────────────────────────────────┐
│ Filtros: Nome | Email | Origem | Status │
│ Ação em lote: [Enviar e-mail]           │
│                                           │
│ Tabela:                                  │
│ ☑ Nome | Email | Data | Origem | Status │
│   - Boas-vindas enviado? ✓/✗            │
│   - Último envio: 05/12/2025 14:30      │
│   - [Enviar agora] [Ver logs]           │
└─────────────────────────────────────────┘

TAB 2: TEMPLATES
┌─────────────────────────────────────────┐
│ [+ Novo Template]                        │
│                                           │
│ Cards de Templates:                      │
│ ┌─────────────────┐                     │
│ │ 📧 Boas-vindas  │                     │
│ │ Ativo ●         │                     │
│ │ [Editar] [Test] │                     │
│ └─────────────────┘                     │
└─────────────────────────────────────────┘

TAB 3: LOGS
┌─────────────────────────────────────────┐
│ Filtros: Email | Template | Status | Data│
│                                           │
│ Tabela de Logs:                          │
│ Data | Email | Template | Status | Erro  │
│ [Ver detalhes] [Reenviar]               │
└─────────────────────────────────────────┘
```

**Features**:
- Seleção múltipla de leads
- Envio em lote
- Filtros avançados
- Ordenação de colunas
- Paginação

### 3. SendEmailModal.tsx (Nova)

**Layout**:
```
┌─────────────────────────────────────────┐
│ Enviar E-mail                            │
├─────────────────────────────────────────┤
│ Destinatários: 5 leads selecionados     │
│                                           │
│ Template: [Dropdown] ▼                   │
│                                           │
│ Variáveis do template:                   │
│ nome: ___________________________        │
│ codigo_acesso: __________________        │
│                                           │
│ Preview: [Ver preview do e-mail]         │
│                                           │
│          [Cancelar] [Enviar 📧]          │
└─────────────────────────────────────────┘
```

### 4. EmailTemplateEditor.tsx (Nova)

**Features**:
- Editor de código HTML (Monaco ou CodeMirror)
- Preview ao vivo
- Sistema de variáveis: {{nome}}, {{email}}, etc.
- Salvar e testar template
- Enviar e-mail de teste

### 5. EmailLogViewer.tsx (Nova)

**Features**:
- Tabela paginada de logs
- Filtros avançados
- Detalhes do envio em modal
- Opção de reenviar
- Export para CSV

---

## 🎨 Design Moderno

### Tema do Admin: Amber/Purple

```typescript
// Animated Orbs
<motion.div className="bg-amber-500/20 rounded-full blur-3xl" />
<motion.div className="bg-purple-500/20 rounded-full blur-3xl" />

// Gradient Text
<h1 className="bg-gradient-to-r from-amber-500 to-purple-500 bg-clip-text text-transparent">
  Admin Email Center
</h1>

// Cards com Gradient Border
<div className="border-2 bg-card/80 backdrop-blur-xl rounded-3xl">
  <div className="h-2 bg-gradient-to-r from-amber-500 to-purple-500" />
  {/* Card content */}
</div>

// Buttons
<Button className="bg-gradient-to-r from-amber-500 to-purple-500 hover:from-amber-600 hover:to-purple-600">
  Enviar E-mail
</Button>
```

### Componentes UI:
- Floating header com glassmorphism
- Cards com hover effects
- Badges para status (success: green, failed: red, pending: yellow)
- Motion animations (framer-motion)
- Toast notifications (sonner)

---

## 🔐 Segurança

### Autenticação Admin

**Atual**: Senha hardcoded "2025"
**Mantido**: Por compatibilidade

**Validação**:
1. Frontend valida senha localmente
2. Edge Functions validam senha no backend
3. Service Role Key usado para bypass RLS

**Futuro** (Recomendado):
```sql
-- Adicionar campo is_admin à auth.users
ALTER TABLE auth.users ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Policy exemplo
CREATE POLICY "Admin pode ver templates"
ON public.email_templates
USING (auth.jwt() ->> 'is_admin' = 'true');
```

### RLS Policies

Todas as novas tabelas:
- **Default**: NEGAR acesso
- **Service Role**: PERMITIR tudo (Edge Functions)
- **Admin Auth**: Adicionar policies quando migrar para Supabase Auth

---

## 📊 Fluxos de Trabalho

### Fluxo 1: Envio Manual

```
1. Admin entra no Email Center
2. Seleciona leads na tabela (checkbox)
3. Clica "Enviar E-mail"
4. Modal abre:
   - Escolhe template
   - Preenche variáveis
   - Vê preview
5. Confirma envio
6. Edge Function processa:
   - Valida dados
   - Para cada lead:
     * Busca template
     * Substitui variáveis
     * Envia via Resend
     * Registra log
     * Atualiza lead
7. Toast de sucesso/erro
8. Tabela atualiza automaticamente
```

### Fluxo 2: Envio Automático (Boas-vindas)

```
1. Novo lead se cadastra na landing page
2. Edge Function `waitlist` insere no banco
3. Se `auto_welcome_enabled = true`:
   a. Busca template de boas-vindas
   b. Substitui variáveis (nome, email)
   c. Envia via Resend
   d. Registra log
   e. Atualiza `welcome_email_sent = true`
4. Se falhar:
   - Registra log com erro
   - Admin pode reenviar manualmente
```

### Fluxo 3: Editar Template

```
1. Admin vai para tab "Templates"
2. Clica "Editar" em um template
3. Editor abre com:
   - Monaco editor (HTML)
   - Preview ao vivo
   - Lista de variáveis disponíveis
4. Admin faz alterações
5. Clica "Salvar"
6. Edge Function valida e atualiza banco
7. Toast de confirmação
```

### Fluxo 4: Ver Logs

```
1. Admin vai para tab "Logs"
2. Aplica filtros:
   - Por e-mail
   - Por template
   - Por status
   - Por data
3. Tabela mostra resultados paginados
4. Clica "Ver detalhes" em um log:
   - Modal mostra metadata completa
   - Mensagem de erro (se houver)
   - Resend message ID
5. Opção de "Reenviar" se falhou
```

---

## 🚀 Plano de Implementação

### Fase 1: Banco de Dados (30 min)
1. ✅ Criar migration 1: Expandir `waitlist_reune`
2. ✅ Criar migration 2: Tabela `email_templates`
3. ✅ Criar migration 3: Tabela `email_logs`
4. ✅ Criar migration 4: Tabela `admin_settings`
5. ✅ Rodar migrations localmente e testar

### Fase 2: Edge Functions (1h)
1. ✅ Criar `send-admin-email/index.ts`
2. ✅ Criar `email-templates/index.ts`
3. ✅ Criar `get-email-logs/index.ts`
4. ✅ Modificar `get-admin-data/index.ts`
5. ✅ (Opcional) Modificar `waitlist/index.ts` para auto-send
6. ✅ Testar localmente com Supabase CLI

### Fase 3: Componentes Base (1h)
1. ✅ Criar `LeadTable.tsx` - Tabela de leads com ações
2. ✅ Criar `SendEmailModal.tsx` - Modal de envio
3. ✅ Criar `EmailTemplateEditor.tsx` - Editor de templates
4. ✅ Criar `EmailLogViewer.tsx` - Visualizador de logs
5. ✅ Criar `AdminHeader.tsx` - Header compartilhado

### Fase 4: Páginas Principais (1h)
1. ✅ Criar `AdminEmailCenter.tsx` - Dashboard principal
2. ✅ Modernizar `AdminDashboard.tsx` - Add tabs e design novo
3. ✅ Adicionar roteamento `/admin/email-center`
4. ✅ Integrar com Edge Functions

### Fase 5: Design & Polish (45 min)
1. ✅ Aplicar design moderno (amber/purple)
2. ✅ Adicionar animated orbs
3. ✅ Floating headers com glassmorphism
4. ✅ Motion animations
5. ✅ Responsive design
6. ✅ Loading states
7. ✅ Error handling

### Fase 6: Testes & Deploy (30 min)
1. ✅ Testar fluxos completos
2. ✅ Verificar logs no Supabase
3. ✅ Testar envio real de e-mails
4. ✅ Deploy das Edge Functions
5. ✅ Deploy do frontend

**Tempo Total Estimado**: ~4h

---

## 📝 Arquivos a Criar/Modificar

### Migrations (4 novos)
- `supabase/migrations/YYYYMMDD_expand_waitlist_reune.sql`
- `supabase/migrations/YYYYMMDD_create_email_templates.sql`
- `supabase/migrations/YYYYMMDD_create_email_logs.sql`
- `supabase/migrations/YYYYMMDD_create_admin_settings.sql`

### Edge Functions (3 novas, 1 modificada)
- `supabase/functions/send-admin-email/index.ts` (NOVA)
- `supabase/functions/send-admin-email/utils.ts` (NOVA)
- `supabase/functions/email-templates/index.ts` (NOVA)
- `supabase/functions/get-email-logs/index.ts` (NOVA)
- `supabase/functions/get-admin-data/index.ts` (MODIFICAR)

### Componentes React (5 novos, 1 modificado)
- `src/pages/AdminEmailCenter.tsx` (NOVA)
- `src/pages/AdminDashboard.tsx` (MODIFICAR)
- `src/components/admin/LeadTable.tsx` (NOVA)
- `src/components/admin/SendEmailModal.tsx` (NOVA)
- `src/components/admin/EmailTemplateEditor.tsx` (NOVA)
- `src/components/admin/EmailLogViewer.tsx` (NOVA)
- `src/components/admin/AdminHeader.tsx` (NOVA)

### Types (1 novo)
- `src/types/admin.ts` (NOVA)

**Total**: ~15 arquivos novos/modificados

---

## ✅ Checklist de Aprovação

Antes de implementar, confirmar com usuário:

- [ ] ✅ Usar `waitlist_reune` ao invés de criar tabela `leads`?
- [ ] ✅ Adicionar campo `name` (nullable) para leads existentes?
- [ ] ✅ Deixar envio automático desativado por padrão?
- [ ] ✅ Manter senha "2025" ou migrar para Supabase Auth agora?
- [ ] ✅ Design amber/purple para admin está OK?
- [ ] ✅ Estrutura de templates/logs/settings proposta está adequada?

---

## 🎯 Resultado Final Esperado

Um admin dashboard moderno e completo onde o administrador pode:

1. ✅ Ver todos os leads com filtros e ordenação
2. ✅ Enviar e-mails manualmente (individual ou em lote)
3. ✅ Criar e editar templates de e-mail com preview
4. ✅ Ver logs completos de todos os envios
5. ✅ Reenviar e-mails que falharam
6. ✅ Configurar envio automático de boas-vindas
7. ✅ Experiência visual moderna e consistente com o resto do app

**Design**: Glassmorphism, gradient effects, animated orbs, floating headers, responsive, dark mode support.

**Performance**: Paginação, índices otimizados, Edge Functions rápidas.

**Segurança**: RLS policies, validação de senha, sanitização de inputs.

---

## 🚨 Perguntas para o Usuário

Antes de prosseguir com a implementação, preciso confirmar:

### 1. **Tabela "leads" vs "waitlist_reune"**
Você mencionou uma tabela "leads" mas ela não existe no banco. Existe apenas `waitlist_reune`.

**Devo usar e expandir `waitlist_reune`?** ✅ Sim / ❌ Não, criar nova tabela

### 2. **Campo "name" não está sendo capturado**
Atualmente as landing pages só capturam e-mail, não nome.

**Como proceder?**
- A) Adicionar campo `name` (nullable) e deixar NULL para dados existentes ✅
- B) Adicionar campo e também modificar landing pages para capturar nome agora
- C) Não adicionar campo "name"

### 3. **Envio automático de boas-vindas**
Pode gerar spam se não for bem configurado.

**Preferência:**
- A) Implementar mas deixar **desativado** por padrão (admin ativa quando quiser) ✅
- B) Implementar e deixar **ativado** por padrão
- C) Não implementar funcionalidade automática agora

### 4. **Sistema de autenticação admin**
Atualmente usa senha hardcoded "2025".

**O que fazer?**
- A) Manter senha "2025" por enquanto ✅
- B) Migrar agora para Supabase Auth com roles
- C) Criar sistema próprio de usuários admin

### 5. **Aprovação geral do plano**
O plano acima está alinhado com sua visão?

**Há algo que você:**
- Discorda?
- Quer mudar?
- Quer adicionar?
- Quer remover?

---

**Aguardando aprovação para iniciar implementação...**
