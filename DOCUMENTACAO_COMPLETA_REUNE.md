# 📚 DOCUMENTAÇÃO COMPLETA DO BANCO DE DADOS REUNE

**Última atualização:** 2025-12-07  
**Tamanho do banco:** ~15 MB  
**Usuários cadastrados:** 9  
**Projeto Supabase ID:** `tfrogqqqmgfgfybesglq`

---

## 📊 1. ESTATÍSTICAS DOS DADOS

| Tabela | Registros |
|--------|-----------|
| event_items | 57 |
| conversation_analytics | 43 |
| table_reune (eventos) | 18 |
| notifications | 17 |
| email_logs | 17 |
| conversation_messages | 14 |
| waitlist_reune | 14 |
| event_invitations | 11 |
| profiles | 9 |
| friend_requests | 7 |
| admin_settings | 6 |
| email_templates | 5 |
| event_participants | 4 |
| event_confirmations | 3 |
| friendships | 3 |
| user_addresses | 2 |
| conversation_contexts | 2 |
| event_secret_santa_participants | 0 |
| event_secret_santa_pairs | 0 |
| event_organizers | 0 |
| confirmation_history | 0 |
| item_assignments | 0 |
| user_feedback | 0 |
| event_dynamics | 0 |
| event_secret_santa | 0 |

---

## 🗄️ 2. ESTRUTURA COMPLETA DO BANCO

### 2.1 `profiles` - Perfis de Usuário

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | - | PK, referencia auth.users |
| `display_name` | text | Yes | null | Nome de exibição |
| `username` | text | Yes | null | Username único (@usuario) |
| `avatar_url` | text | Yes | null | URL do avatar |
| `phone` | text | Yes | null | Telefone |
| `city` | text | Yes | null | Cidade |
| `state` | text | Yes | null | Estado |
| `country` | text | Yes | 'Brasil' | País |
| `bio` | text | Yes | null | Biografia |
| `language` | text | Yes | 'pt-BR' | Idioma |
| `favorite_event_type` | text | Yes | null | Tipo de evento favorito |
| `accept_notifications` | boolean | Yes | false | Aceita notificações |
| `allow_search_by_username` | boolean | Yes | true | Permite busca por username |
| `terms_accepted_at` | timestamptz | Yes | null | Data aceite dos termos |
| `hide_profile_prompt` | boolean | Yes | false | Ocultar prompt de completar perfil |
| `founder_member` | boolean | Yes | false | Membro fundador (legado) |
| `is_founder` | boolean | Yes | false | **É fundador** |
| `founder_since` | timestamptz | Yes | null | Data desde fundador |
| `premium_until` | date | Yes | null | Premium até |
| `storage_multiplier` | integer | Yes | 1 | Multiplicador de storage (3x para founders) |
| `created_at` | timestamptz | Yes | now() | Data criação |
| `updated_at` | timestamptz | Yes | now() | Data atualização |

**RLS Policies:**
- SELECT: Apenas usuários autenticados podem ver perfis
- UPDATE: Usuários só podem atualizar próprio perfil
- INSERT: Usuários só podem criar próprio perfil
- DELETE: Não permitido

---

### 2.2 `table_reune` - Eventos

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | bigint | No | nextval (auto) | PK |
| `user_id` | uuid | No | - | FK → Criador do evento |
| `title` | text | No | '' | Título do evento |
| `description` | text | Yes | null | Descrição |
| `event_date` | date | No | CURRENT_DATE | Data do evento |
| `event_time` | text | No | '12:00' | Horário |
| `location` | text | Yes | null | Localização completa |
| `public_location` | text | Yes | null | Localização mascarada (para eventos públicos) |
| `is_public` | boolean | Yes | true | Evento público |
| `status` | text | Yes | 'active' | Status (active, published, etc.) |
| `max_attendees` | integer | Yes | null | Máximo de participantes |
| `qtd_pessoas` | integer | Yes | null | Quantidade de pessoas |
| `tipo_evento` | text | Yes | null | Tipo (churrasco, festa, etc.) |
| `categoria_evento` | text | Yes | null | Categoria (almoço, jantar, lanche) |
| `subtipo_evento` | text | Yes | null | Subtipo (pizza, feijoada, fondue) |
| `finalidade_evento` | text | Yes | null | Finalidade (aniversário, confraternização) |
| `menu` | text | Yes | null | Prato principal |
| `inclui_bebidas` | boolean | Yes | true | Inclui bebidas |
| `inclui_entradas` | boolean | Yes | true | Inclui entradas |
| `created_by_ai` | boolean | Yes | false | Criado pelo chatbot |
| `created_at` | timestamptz | No | now() | Data criação |
| `updated_at` | timestamptz | Yes | now() | Data atualização |

**RLS Policies:**
- SELECT: Ver eventos públicos ou próprios ou onde é organizador
- INSERT: Criar eventos próprios (user_id = auth.uid())
- UPDATE: Atualizar apenas próprios eventos
- DELETE: Deletar apenas próprios eventos

---

### 2.3 `event_items` - Itens/Insumos do Evento

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | bigint | No | nextval (auto) | PK |
| `event_id` | bigint | No | - | FK → table_reune |
| `nome_item` | text | No | - | Nome do item |
| `quantidade` | numeric | No | 0 | Quantidade |
| `unidade` | text | No | 'un' | Unidade (un, kg, L, g) |
| `valor_estimado` | numeric | No | 0 | Valor estimado |
| `categoria` | text | No | 'geral' | Categoria |
| `prioridade` | text | No | 'B' | Prioridade (A, B, C) |
| `created_at` | timestamptz | No | now() | Data criação |
| `updated_at` | timestamptz | No | now() | Data atualização |

**RLS Policies:**
- SELECT: Ver se é dono, evento público ou convidado confirmado
- INSERT/UPDATE/DELETE: Organizadores E convidados confirmados

---

### 2.4 `event_participants` - Participantes do Evento

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | bigint | No | nextval (auto) | PK |
| `event_id` | bigint | No | - | FK → table_reune |
| `nome_participante` | text | No | - | Nome |
| `contato` | text | Yes | null | Email/telefone |
| `status_convite` | text | No | 'pendente' | Status (pendente, confirmado, recusado) |
| `created_at` | timestamptz | No | now() | Data criação |
| `updated_at` | timestamptz | No | now() | Data atualização |

**Unique Constraint:** `(event_id, nome_participante)`

---

### 2.5 `event_invitations` - Convites de Evento

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `event_id` | bigint | No | - | FK → table_reune |
| `participant_email` | text | No | - | Email do convidado |
| `participant_name` | text | Yes | null | Nome do convidado |
| `invitation_token` | uuid | No | gen_random_uuid() | Token único do convite |
| `status` | text | Yes | 'pending' | Status (pending, accepted, declined) |
| `sent_at` | timestamptz | Yes | now() | Data envio |
| `responded_at` | timestamptz | Yes | null | Data resposta |
| `created_at` | timestamptz | Yes | now() | Data criação |
| `updated_at` | timestamptz | Yes | now() | Data atualização |

**Unique Constraint:** `(event_id, participant_email)`

---

### 2.6 `event_organizers` - Co-organizadores do Evento

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `event_id` | bigint | Yes | - | FK → table_reune |
| `user_id` | uuid | No | - | FK → usuário organizador |
| `added_by` | uuid | No | - | Quem adicionou |
| `added_at` | timestamptz | Yes | now() | Data adição |

---

### 2.7 `friendships` - Amizades

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `user_id_1` | uuid | No | - | Usuário 1 (menor UUID) |
| `user_id_2` | uuid | No | - | Usuário 2 (maior UUID) |
| `created_at` | timestamptz | No | now() | Data criação |

**Unique Constraint:** `(user_id_1, user_id_2)`

---

### 2.8 `friend_requests` - Solicitações de Amizade

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `sender_id` | uuid | No | - | Quem enviou |
| `receiver_id` | uuid | Yes | null | Quem recebeu (se já cadastrado) |
| `receiver_email` | text | No | - | Email do destinatário |
| `invitation_token` | uuid | Yes | gen_random_uuid() | Token para aceitar via link |
| `status` | text | No | 'pending' | Status (pending, accepted, rejected) |
| `created_at` | timestamptz | No | now() | Data criação |
| `responded_at` | timestamptz | Yes | null | Data resposta |

**Unique Constraint:** `(sender_id, receiver_email)`

---

### 2.9 `notifications` - Notificações

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `user_id` | uuid | No | - | Destinatário |
| `event_id` | bigint | Yes | null | FK → table_reune (opcional) |
| `type` | text | No | - | Tipo (friend_request, event_invite, etc.) |
| `title` | text | No | - | Título |
| `message` | text | No | - | Mensagem |
| `read` | boolean | Yes | false | Lida |
| `metadata` | jsonb | Yes | null | Dados extras |
| `created_at` | timestamptz | Yes | now() | Data criação |

---

### 2.10 `user_addresses` - Endereços do Usuário

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `user_id` | uuid | No | - | FK → profiles |
| `nickname` | text | No | - | Apelido (Casa, Trabalho) |
| `street` | text | No | - | Rua |
| `number` | text | No | - | Número |
| `complement` | text | Yes | null | Complemento |
| `neighborhood` | text | No | - | Bairro |
| `city` | text | No | - | Cidade |
| `state` | text | No | - | Estado |
| `zip_code` | text | No | - | CEP |
| `country` | text | No | 'Brasil' | País |
| `is_primary` | boolean | No | false | Endereço principal |
| `created_at` | timestamptz | No | now() | Data criação |
| `updated_at` | timestamptz | No | now() | Data atualização |

---

### 2.11 `waitlist_reune` - Lista de Espera / Leads

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `email` | text | No | - | Email (único) |
| `name` | text | Yes | null | Nome |
| `origin` | text | Yes | 'unknown' | Origem (landing, amigo-secreto, etc.) |
| `is_founder` | boolean | Yes | true | É founder (da waitlist) |
| `welcome_email_sent` | boolean | Yes | false | Email de boas-vindas enviado |
| `welcome_email_sent_at` | timestamptz | Yes | null | Data envio |
| `created_at` | timestamptz | No | now() | Data criação |

**RLS:** Apenas INSERT público (qualquer pessoa pode se inscrever)

---

### 2.12 `email_templates` - Templates de Email

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `name` | text | No | - | Slug único (boas_vindas, etc.) |
| `subject` | text | No | - | Assunto do email |
| `html_content` | text | No | - | HTML do email |
| `description` | text | Yes | null | Descrição |
| `variables` | jsonb | Yes | '[]' | Variáveis suportadas |
| `is_active` | boolean | Yes | true | Ativo |
| `created_at` | timestamptz | Yes | now() | Data criação |
| `updated_at` | timestamptz | Yes | now() | Data atualização |

**Templates existentes:**
- `boas_vindas` - Email de boas-vindas
- `atualizacao_lancamento` - Atualização de lançamento
- `convite_exclusivo` - Convite exclusivo

---

### 2.13 `email_logs` - Logs de Envio de Email

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `lead_id` | uuid | Yes | null | FK → waitlist_reune |
| `lead_email` | text | No | - | Email destino |
| `template_name` | text | No | - | Nome do template usado |
| `status` | text | No | - | success, failed, pending |
| `error_message` | text | Yes | null | Mensagem de erro |
| `metadata` | jsonb | Yes | '{}' | Metadados (resend_message_id, etc.) |
| `sent_at` | timestamptz | Yes | now() | Data envio |
| `created_at` | timestamptz | Yes | now() | Data criação |

---

### 2.14 `admin_settings` - Configurações Admin

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `key` | text | No | - | Chave única |
| `value` | jsonb | No | - | Valor |
| `description` | text | Yes | null | Descrição |
| `created_at` | timestamptz | Yes | now() | Data criação |
| `updated_at` | timestamptz | Yes | now() | Data atualização |

**Configurações existentes:**
| Key | Value | Descrição |
|-----|-------|-----------|
| auto_welcome_enabled | false | Enviar welcome email automaticamente |
| from_email | "ReUNE <noreply@reuneapp.com.br>" | Email remetente |
| from_name | "ReUNE" | Nome remetente |
| default_welcome_template | "boas_vindas" | Template padrão |
| admin_email | "admin@reuneapp.com.br" | Email do admin |
| email_daily_limit | 1000 | Limite diário de emails |

---

### 2.15 `event_secret_santa` - Amigo Secreto

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `event_id` | bigint | No | - | FK → table_reune (1:1) |
| `min_value` | numeric | Yes | null | Valor mínimo do presente |
| `max_value` | numeric | Yes | null | Valor máximo do presente |
| `draw_date` | timestamptz | Yes | null | Data do sorteio |
| `has_drawn` | boolean | Yes | false | Sorteio realizado |
| `rules_json` | jsonb | Yes | '{}' | Regras customizadas |
| `created_at` | timestamptz | No | now() | Data criação |
| `updated_at` | timestamptz | No | now() | Data atualização |

---

### 2.16 `event_secret_santa_participants` - Participantes Amigo Secreto

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `secret_santa_id` | uuid | No | - | FK → event_secret_santa |
| `user_id` | uuid | No | - | ID do participante |
| `display_name` | text | Yes | null | Nome de exibição |
| `email` | text | Yes | null | Email |
| `status` | text | No | 'pending' | Status (pending, confirmed) |
| `wishlist_text` | text | Yes | null | Lista de desejos (texto) |
| `wishlist_link` | text | Yes | null | Link da wishlist |
| `created_at` | timestamptz | No | now() | Data criação |
| `updated_at` | timestamptz | No | now() | Data atualização |

---

### 2.17 `event_secret_santa_pairs` - Pares do Sorteio

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `secret_santa_id` | uuid | No | - | FK → event_secret_santa |
| `giver_id` | uuid | No | - | Quem dá o presente |
| `receiver_id` | uuid | No | - | Quem recebe |
| `created_at` | timestamptz | No | now() | Data criação |

---

### 2.18 `conversation_messages` - Mensagens do Chat

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `user_id` | uuid | No | - | Usuário |
| `evento_id` | bigint | Yes | null | FK → table_reune |
| `role` | text | No | - | 'user' ou 'assistant' |
| `content` | text | No | - | Conteúdo da mensagem |
| `metadata` | jsonb | Yes | '{}' | Metadados |
| `timestamp` | timestamptz | No | now() | Data/hora |

---

### 2.19 `conversation_contexts` - Contexto do Chat

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `user_id` | uuid | No | - | Usuário |
| `evento_id` | bigint | Yes | null | FK → table_reune |
| `state` | text | No | 'idle' | Estado da conversa |
| `collected_data` | jsonb | Yes | '{}' | Dados coletados |
| `missing_slots` | text[] | Yes | '{}' | Slots faltantes |
| `last_intent` | text | Yes | null | Última intenção detectada |
| `summary` | text | Yes | null | Resumo |
| `confidence_level` | numeric | Yes | 0.5 | Nível de confiança |
| `created_at` | timestamptz | Yes | now() | Data criação |
| `updated_at` | timestamptz | Yes | now() | Data atualização |

---

### 2.20 `conversation_analytics` - Analytics do Chat

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `user_id` | uuid | No | - | Usuário |
| `evento_id` | bigint | Yes | null | FK → table_reune |
| `message_id` | uuid | Yes | null | FK → conversation_messages |
| `intent` | text | No | - | Intenção detectada |
| `confidence_level` | numeric | No | - | Nível de confiança |
| `response_type` | text | Yes | null | Tipo de resposta |
| `user_corrected` | boolean | Yes | false | Usuário corrigiu |
| `user_confused` | boolean | Yes | false | Usuário confuso |
| `clarification_needed` | boolean | Yes | false | Precisou clarificação |
| `response_time_ms` | integer | Yes | null | Tempo de resposta |
| `tokens_used` | integer | Yes | null | Tokens usados |
| `metadata` | jsonb | Yes | '{}' | Metadados |
| `created_at` | timestamptz | Yes | now() | Data criação |

---

### 2.21 `item_assignments` - Atribuição de Itens

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `event_id` | bigint | No | - | FK → table_reune |
| `item_id` | bigint | No | - | FK → event_items |
| `participant_id` | bigint | No | - | FK → event_participants |
| `quantidade_atribuida` | numeric | Yes | 0 | Quantidade atribuída |
| `confirmado` | boolean | Yes | false | Confirmado |
| `created_at` | timestamptz | Yes | now() | Data criação |
| `updated_at` | timestamptz | Yes | now() | Data atualização |

**Unique Constraint:** `(event_id, item_id, participant_id)`

---

### 2.22 `event_confirmations` - Confirmações de Evento

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `event_id` | bigint | No | - | FK → table_reune |
| `user_id` | uuid | No | - | Usuário |
| `presence_confirmed` | boolean | Yes | false | Presença confirmada |
| `date_confirmed` | boolean | Yes | false | Data confirmada |
| `time_confirmed` | boolean | Yes | false | Horário confirmado |
| `location_confirmed` | boolean | Yes | false | Local confirmado |
| `alternative_date` | date | Yes | null | Data alternativa |
| `alternative_time` | text | Yes | null | Horário alternativo |
| `alternative_location` | text | Yes | null | Local alternativo |
| `created_at` | timestamptz | No | now() | Data criação |
| `updated_at` | timestamptz | No | now() | Data atualização |

---

### 2.23 `confirmation_history` - Histórico de Sugestões

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `event_id` | bigint | No | - | FK → table_reune |
| `user_id` | uuid | No | - | Quem sugeriu |
| `confirmation_type` | text | No | - | Tipo (date, time, location) |
| `original_value` | text | Yes | null | Valor original |
| `suggested_value` | text | Yes | null | Valor sugerido |
| `status` | text | Yes | 'pending' | Status (pending, accepted, rejected) |
| `organizer_response` | text | Yes | null | Resposta do organizador |
| `responded_at` | timestamptz | Yes | null | Data resposta |
| `responded_by` | uuid | Yes | null | Quem respondeu |
| `created_at` | timestamptz | Yes | now() | Data criação |
| `updated_at` | timestamptz | Yes | now() | Data atualização |

---

### 2.24 `event_dynamics` - Dinâmicas do Evento

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `event_id` | bigint | No | - | FK → table_reune |
| `type` | text | No | - | Tipo (secret_santa, etc.) |
| `created_at` | timestamptz | No | now() | Data criação |
| `updated_at` | timestamptz | No | now() | Data atualização |

---

### 2.25 `user_feedback` - Feedback do Usuário

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | uuid | No | gen_random_uuid() | PK |
| `user_id` | uuid | No | - | Usuário |
| `evento_id` | bigint | Yes | null | FK → table_reune |
| `message_id` | uuid | Yes | null | FK → conversation_messages |
| `feedback_type` | text | No | - | Tipo de feedback |
| `rating` | integer | Yes | null | Avaliação (1-5) |
| `comment` | text | Yes | null | Comentário |
| `created_at` | timestamptz | Yes | now() | Data criação |

---

### 2.26 `founder_members` (VIEW) - View de Membros Fundadores

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | ID do usuário |
| `is_founder` | boolean | É fundador |
| `founder_since` | timestamptz | Desde quando |
| `premium_until` | date | Premium até |
| `storage_multiplier` | integer | Multiplicador storage |
| `signup_date` | timestamptz | Data cadastro |
| `email` | varchar | Email |
| `premium_status` | text | Status premium (Active/Expired/None) |

---

### 2.27 `conversation_metrics` (VIEW) - Métricas de Conversa

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user_id` | uuid | Usuário |
| `date` | timestamptz | Data |
| `total_interactions` | bigint | Total interações |
| `avg_confidence` | numeric | Confiança média |
| `correction_count` | bigint | Correções |
| `clarification_count` | bigint | Clarificações |
| `avg_response_time_ms` | numeric | Tempo médio resposta |
| `unique_intents` | bigint | Intenções únicas |
| `events_touched` | bigint | Eventos tocados |

---

## 🔧 3. FUNÇÕES DO BANCO DE DADOS

### 3.1 Funções de Usuário/Perfil

| Função | Retorno | Descrição |
|--------|---------|-----------|
| `handle_new_user()` | trigger | Cria profile quando usuário se cadastra |
| `check_and_mark_founder()` | trigger | Marca usuário como founder se email está na waitlist |
| `create_missing_profiles()` | void | Cria profiles faltantes para auth.users |
| `get_profile_completion()` | integer | Percentual de completude do perfil |
| `get_my_email()` | text | Retorna email do usuário autenticado |
| `has_active_premium(user_id)` | boolean | Verifica se tem premium ativo |
| `get_storage_multiplier(user_id)` | integer | Retorna multiplicador de storage |
| `check_username_available(username)` | boolean | Verifica disponibilidade de username |

### 3.2 Funções de Evento

| Função | Retorno | Descrição |
|--------|---------|-----------|
| `is_event_organizer(user_id, event_id)` | boolean | Verifica se é organizador |
| `get_event_details_safe(event_id)` | table | Detalhes do evento com mascaramento |
| `get_event_participants_safe(event_id)` | table | Participantes (contato oculto para não-organizadores) |
| `get_event_organizers_safe(event_id)` | table | Lista de organizadores |
| `get_public_events()` | table | Eventos públicos com localização mascarada |
| `get_event_plan(evento_id)` | jsonb | Snapshot completo do evento |
| `mask_location(full_location)` | text | Mascara endereço residencial |

### 3.3 Funções de Itens/Participantes

| Função | Retorno | Descrição |
|--------|---------|-----------|
| `items_replace_for_event(evento_id, itens)` | jsonb[] | Substitui itens do evento |
| `participants_bulk_upsert(evento_id, participantes)` | jsonb[] | Upsert de participantes |
| `assign_items_bulk(event_id, assignments)` | jsonb | Atribuição em lote |
| `get_item_assignments(event_id)` | table | Lista atribuições |

### 3.4 Funções de Convite

| Função | Retorno | Descrição |
|--------|---------|-----------|
| `process_invitation(event_id, email, name, is_organizer)` | jsonb | Processa convite |
| `accept_event_invitation(token, user_id)` | jsonb | Aceita convite |

### 3.5 Funções de Amizade

| Função | Retorno | Descrição |
|--------|---------|-----------|
| `send_friend_request(identifier)` | jsonb | Envia solicitação |
| `respond_to_friend_request(request_id, accept)` | jsonb | Responde solicitação |
| `get_friends(search)` | table | Lista amigos |
| `get_pending_friend_requests()` | table | Solicitações pendentes |
| `search_user_by_identifier(identifier)` | table | Busca usuário por email/username |

### 3.6 Funções de Sugestões

| Função | Retorno | Descrição |
|--------|---------|-----------|
| `get_pending_suggestions(event_id)` | table | Sugestões pendentes |
| `respond_to_suggestion(suggestion_id, status, response)` | jsonb | Responde sugestão |

### 3.7 Funções de Amigo Secreto

| Função | Retorno | Descrição |
|--------|---------|-----------|
| `notify_secret_santa_draw(event_id, secret_santa_id, user_ids)` | void | Notifica participantes do sorteio |

---

## 🔐 4. TRIGGERS

| Trigger | Tabela | Evento | Função |
|---------|--------|--------|--------|
| `on_auth_user_created` | auth.users | AFTER INSERT | `handle_new_user()` |
| `trigger_check_founder_on_signup` | profiles | BEFORE INSERT | `check_and_mark_founder()` |
| `update_pending_invites_on_friendship` | friendships | AFTER INSERT | `update_pending_invites_on_friendship()` |
| `ensure_single_primary_address` | user_addresses | BEFORE INSERT/UPDATE | `ensure_single_primary_address()` |
| `update_*_updated_at` | várias | BEFORE UPDATE | `update_updated_at_column()` |

---

## 🌐 5. EDGE FUNCTIONS

| Função | Endpoint | Descrição |
|--------|----------|-----------|
| `waitlist` | /waitlist | Captura leads + Meta Conversions API |
| `send-invitation-email` | /send-invitation-email | Envia email de convite para evento |
| `send-friend-invitation-email` | /send-friend-invitation-email | Envia email de convite de amizade |
| `send-secret-santa-notification` | /send-secret-santa-notification | Notifica participantes do amigo secreto |
| `get-admin-data` | /get-admin-data | Dados para painel admin |
| `send-admin-email` | /send-admin-email | Envia emails pelo painel admin |
| `get-email-logs` | /get-email-logs | Logs de emails enviados |
| `email-templates` | /email-templates | CRUD de templates |
| `update-user-password` | /update-user-password | Atualiza senha do usuário |
| `generate-mockup` | /generate-mockup | Gera mockups de marketing |
| `llm-chat` | /llm-chat | Chat com IA (desativado - usa backend externo) |

---

## 🔑 6. SECRETS/VARIÁVEIS DE AMBIENTE

| Secret | Descrição |
|--------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anônima |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (admin) |
| `SUPABASE_DB_URL` | URL do banco de dados |
| `SUPABASE_PUBLISHABLE_KEY` | Chave publicável |
| `RESEND_API_KEY` | API key do Resend (emails) |
| `CHAT_API_SECRET_KEY` | Chave do backend externo de chat |
| `LOVABLE_API_KEY` | Chave da Lovable AI |
| `META_PIXEL_ID` | ID do Meta Pixel |
| `META_CONVERSIONS_TOKEN` | Token da Meta Conversions API |
| `META_TEST_CODE` | Código de teste Meta (removido em prod) |

---

## 📦 7. STORAGE BUCKETS

| Bucket | Público | Descrição |
|--------|---------|-----------|
| `avatars` | ✅ Sim | Avatares dos usuários |
| `screenshots` | ✅ Sim | Screenshots de marketing |

---

## 🤖 8. FLUXOS DE IA

### 8.1 Chat AI (UNE.AI)

**Endpoint externo:** `https://studio--studio-3500643630-eaa37.us-central1.hosted.app/api/chat`

**Autenticação:** Bearer token (`VITE_CHAT_API_SECRET_KEY`)

**Fluxo:**
1. Usuário envia mensagem no ChatWidget
2. Frontend envia para backend externo com Authorization header
3. Backend processa via LLM e retorna resposta
4. Frontend persiste evento/itens no Supabase se necessário

**Orquestrador local** (`src/core/orchestrator/`):
- `chatOrchestrator.ts` - Orquestração principal
- `contextManager.ts` - Gerenciamento de contexto
- `classifyIntent.ts` - Classificação de intenção
- `extractSlots.ts` - Extração de slots
- `eventManager.ts` - Gerenciamento de eventos
- `itemAdapter.ts` - Adaptador de itens

---

## 📁 9. ESTRUTURA DO PROJETO

```
/
├── src/
│   ├── api/                    # APIs e clientes
│   │   └── llm/               # Cliente LLM
│   ├── assets/                # Imagens e vídeos
│   ├── components/            # Componentes React
│   │   ├── admin/            # Componentes admin
│   │   ├── events/           # Componentes de eventos
│   │   ├── friends/          # Componentes de amizade
│   │   ├── landing/          # Componentes da landing
│   │   ├── notifications/    # Notificações
│   │   ├── profile/          # Perfil do usuário
│   │   └── ui/               # Componentes shadcn/ui
│   ├── core/
│   │   ├── calc/             # Cálculos
│   │   ├── nlp/              # Processamento de linguagem
│   │   └── orchestrator/     # Orquestrador do chat
│   ├── data/                 # Dados estáticos
│   ├── db/                   # Repositórios do banco
│   │   └── repositories/     # Repos por entidade
│   ├── hooks/                # Custom hooks
│   ├── integrations/
│   │   └── supabase/         # Cliente Supabase (auto-gerado)
│   ├── lib/                  # Utilitários
│   ├── pages/                # Páginas da aplicação
│   ├── profiles/             # Perfis de IA (churrasco, pizza)
│   ├── types/                # Tipos TypeScript
│   └── utils/                # Utilitários gerais
├── supabase/
│   ├── functions/            # Edge Functions
│   ├── migrations/           # Migrações SQL
│   └── config.toml           # Configuração Supabase
├── public/                   # Arquivos públicos
└── email-templates/          # Templates de email (docs)
```

---

## 📊 10. DEPENDÊNCIAS PRINCIPAIS

| Pacote | Versão | Uso |
|--------|--------|-----|
| react | ^18.3.1 | Framework UI |
| react-router-dom | ^6.30.1 | Roteamento |
| @supabase/supabase-js | ^2.58.0 | Cliente Supabase |
| @tanstack/react-query | ^5.83.0 | Data fetching |
| tailwindcss-animate | ^1.0.7 | Animações |
| framer-motion | ^12.23.24 | Animações avançadas |
| lucide-react | ^0.462.0 | Ícones |
| react-hook-form | ^7.61.1 | Formulários |
| zod | ^3.25.76 | Validação |
| date-fns | ^3.6.0 | Manipulação de datas |
| recharts | ^2.15.4 | Gráficos |
| sonner | ^1.7.4 | Toasts |

---

## 📋 11. EXEMPLOS DE DADOS (JSON)

### profiles
```json
{
  "table_name": "profiles",
  "sample_data": [
    {
      "id": "b306e191-88e4-4f7b-ac78-e55622b07c9b",
      "display_name": "Júlia Costa",
      "username": "julinha",
      "avatar_url": "https://tfrogqqqmgfgfybesglq.supabase.co/storage/v1/object/public/avatars/...",
      "phone": "91985788282",
      "city": "Belém",
      "state": "PA",
      "country": "Brasil",
      "favorite_event_type": "Confraternização",
      "is_founder": true,
      "founder_since": "2025-10-25T03:12:13.441702+00",
      "premium_until": "2026-04-25",
      "storage_multiplier": 3
    }
  ]
}
```

### table_reune (eventos)
```json
{
  "table_name": "table_reune",
  "sample_data": [
    {
      "id": 38,
      "user_id": "10561249-73cb-4307-afa3-db17f464e6e6",
      "title": "Aniversário Simples",
      "description": "Comemoração de aniversário sem estresse, com bolo e salgadinhos.",
      "event_date": "2025-12-18",
      "event_time": "11:05",
      "location": "Casa — Av Amador bueno da veiga, 3060, São Paulo/SP",
      "is_public": true,
      "status": "published",
      "inclui_bebidas": true,
      "inclui_entradas": true,
      "created_by_ai": false
    }
  ]
}
```

### waitlist_reune
```json
{
  "table_name": "waitlist_reune",
  "sample_data": [
    {
      "id": "9a0aa8a8-9a83-41aa-a2c6-4f94168f6776",
      "email": "rhenanfuture@gmail.com",
      "name": null,
      "origin": "unknown",
      "is_founder": true,
      "welcome_email_sent": false
    }
  ]
}
```

### friendships
```json
{
  "table_name": "friendships",
  "sample_data": [
    {
      "id": "86a09348-f4c0-4fc7-84ee-9e1da151d9ae",
      "user_id_1": "10561249-73cb-4307-afa3-db17f464e6e6",
      "user_id_2": "ec35e92c-250e-4d26-ba68-43caa19c53b0",
      "created_at": "2025-10-27T15:57:17.003657+00"
    }
  ]
}
```

### user_addresses
```json
{
  "table_name": "user_addresses",
  "sample_data": [
    {
      "id": "03418b20-8d4b-420a-8253-c87841c63946",
      "user_id": "b306e191-88e4-4f7b-ac78-e55622b07c9b",
      "nickname": "Casa",
      "street": "Alameda Deus Proverá",
      "number": "171",
      "neighborhood": "Coqueiro",
      "city": "Ananindeua",
      "state": "PA",
      "zip_code": "67015-264",
      "country": "Brasil",
      "is_primary": true
    }
  ]
}
```

---

## 🔄 12. DIAGRAMA DE RELACIONAMENTOS

```
                                    ┌─────────────────┐
                                    │   auth.users    │
                                    │     (Supabase)  │
                                    └────────┬────────┘
                                             │ 1:1
                                             ▼
┌─────────────────┐                 ┌─────────────────┐
│ waitlist_reune  │◄────────────────│    profiles     │
│   (leads)       │   email match   │   (usuários)    │
└─────────────────┘                 └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
           ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
           │  table_reune    │      │   friendships   │      │  user_addresses │
           │   (eventos)     │      │   (amizades)    │      │   (endereços)   │
           └────────┬────────┘      └─────────────────┘      └─────────────────┘
                    │
     ┌──────────────┼──────────────┬──────────────┬──────────────┐
     │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  event_  │  │  event_  │  │  event_  │  │  event_  │  │  notifi- │
│  items   │  │ partici- │  │ invita-  │  │organizers│  │  cations │
│          │  │  pants   │  │  tions   │  │          │  │          │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
     │              │
     └──────┬───────┘
            ▼
     ┌──────────────┐
     │    item_     │
     │ assignments  │
     └──────────────┘

     ┌──────────────┐         ┌──────────────┐
     │event_secret_ │────────▶│event_secret_ │
     │    santa     │         │ participants │
     └──────────────┘         └──────────────┘
            │
            ▼
     ┌──────────────┐
     │event_secret_ │
     │    pairs     │
     └──────────────┘
```

---

## 🚀 13. AUTENTICAÇÃO

**Provider:** Supabase Auth (Email/Password)

**Configurações:**
- Auto-confirm email: **HABILITADO**
- Signup desabilitado: **NÃO**
- Anonymous users: **DESABILITADO**

**Fluxo:**
1. Usuário cadastra com email/senha
2. Trigger `on_auth_user_created` cria profile
3. Trigger `check_and_mark_founder` verifica waitlist
4. Se email está na waitlist → marca como founder com benefícios

---

## ⚠️ NOTA SOBRE FOUNDERS

**Comportamento atual:**
- Usuários existentes (até 07/12/2025): `is_founder = true`, 6 meses premium, 3x storage
- **Novos usuários:** Se email está na `waitlist_reune` → automaticamente vira founder
- **Novos usuários sem waitlist:** `is_founder = false`, sem benefícios

Para **desativar** a promoção automática de founder, remova o trigger `check_and_mark_founder` ou modifique sua lógica.

---

*Documentação gerada em 07/12/2025*
