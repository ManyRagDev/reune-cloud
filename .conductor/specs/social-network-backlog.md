# 🌟 Backlog & Especificação: ReUNE Social (Upgrade Fase 2)

> **Status:** 📋 Backlog / Fase Futura  
> **Prioridade:** Pós-estabilização do Core (Organização de Eventos + Assistente IA)  
> **Conceito-Chave:** "Come for the tool, stay for the network" (Rede Social Privada de Círculos Reais & Memórias)

---

## 1. Visão de Produto: O que é o ReUNE Social?

O ReUNE Social **não é** um feed público estilo Instagram/TikTok com seguidores e likes de estranhos.  
É uma **Rede Social Privada de Baixa Pressão (Low-Pressure Social Network)** focada em:
1. **Identidade & Gamificação:** O "Strava da Vida Social" (estatísticas reais de encontros, badges de reputação).
2. **Círculos Recorrentes:** Espaços permanentes para turmas reais (A Pelada de Terça, A Turma da Faculdade, A Família Silva).
3. **Cápsula do Tempo & Álbuns Colaborativos:** Fotos pós-evento compartilhadas em alta qualidade entre quem realmente estava lá.

---

## 2. Pilares Funcionais (Módulos do Upgrade)

### Módulo A: Perfil Social & Reputação ("Strava do Rolê")
- **Histórico Social:**
  - Contador de eventos participados e organizados no ano/histórico.
  - Litragem estimada de bebidas e quilos de carnes/alimentos celebrados.
- **Badges de Reputação (Gamificação Social):**
  - ⚡ *Pagador Relâmpago:* Paga o Pix da cota em menos de 10 minutos.
  - 🔥 *Mestre da Brasa:* Eleito churrasqueiro oficial pelos participantes em 3+ eventos.
  - 👑 *Inimigo do Fim:* Presença confirmada em eventos até a saideira.
  - 🎁 *Amigo de Ouro:* Nota máxima na entrega de presentes do Amigo Secreto.
- **Perfil Minimalista:**
  - @username único, bio curta, preferências gastronômicas (ex: "Bebo cerveja artesanal, vegetariano, alérgico a camarão").

### Módulo B: Círculos Permanentes (Tribos & Grupos)
- **Criação de Círculos:**
  - Grupos como "Pelada do Aterro", "República Copo Sujo", "Churrasco da Família".
- **Memória Coletiva:**
  - Histórico de todos os eventos realizados pelo grupo.
  - Mural de fotos acumulado.
- **Botão "Bora Marcar o Próximo?":**
  - Une.AI sugere novo evento baseado no intervalo médio de encontros daquele círculo (ex: a cada 15 dias).
  - Pré-popula as preferências alimentares e de bebidas de todos os membros do círculo.

### Módulo C: A Cápsula do Tempo (Álbum Pós-Evento)
- **Ativação Pós-Evento (Dia D+1):**
  - Notificação suave aos confirmados: *"O evento acabou! Suba aqui suas fotos antes de esquecer."*
- **Upload Coletivo:**
  - Qualquer convidado pode subir fotos direto do navegador (sem compressão brutal do WhatsApp).
  - Mural privado acessível apenas pelos confirmados no evento.
- **Recap da IA:**
  - Une.AI gera uma legenda divertida resumindo os números do evento (ex: *"18 amigos reunidos, 12kg de carne devorados e 45 fotos memoráveis"*).

---

## 3. Modelo de Dados Futuro (Extensão Supabase)

```sql
-- Perfis Sociais
CREATE TABLE profiles_social (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  dietary_preferences JSONB DEFAULT '{"drinks_alcohol": true, "vegetarian": false, "restrictions": []}'::jsonb,
  stats JSONB DEFAULT '{"events_hosted": 0, "events_attended": 0, "fast_pix_count": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conquistas / Badges do Usuário
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_slug TEXT NOT NULL, -- 'fast_pix', 'braza_master', 'last_standing'
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_slug)
);

-- Círculos de Amigos
CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membros do Círculo
CREATE TABLE circle_members (
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (circle_id, user_id)
);

-- Mídia e Fotos dos Eventos (Cápsula do Tempo)
CREATE TABLE event_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id BIGINT REFERENCES table_reune(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  media_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Estratégia de Transição: Como Chegamos Lá

1. **Fase 1 (Atual - Foco Total):** 
   - Estabilizar e aperfeiçoar o motor de criação de eventos, cálculo cultural e assistente Une.AI.
   - Tornar o fluxo de planejamento e edição 100% natural, confiável e sem atrito.
2. **Fase 1.5 (Ponte):**
   - Adicionar álbum de fotos simples pós-evento (MVP de memória).
   - Coletar preferências do usuário durante os RSVPs.
3. **Fase 2 (Upgrade Social):**
   - Ativação de perfis, badges e Círculos.
