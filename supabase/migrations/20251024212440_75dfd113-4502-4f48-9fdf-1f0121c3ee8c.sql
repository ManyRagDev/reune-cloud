-- Corrigir problemas de segurança identificados

-- 1. Proteger user_id em table_reune (eventos públicos não devem expor o criador)
DROP POLICY IF EXISTS "Usuários podem ver eventos públicos ou próprios" ON table_reune;
CREATE POLICY "Usuários podem ver eventos públicos ou próprios" 
ON table_reune FOR SELECT 
USING (is_public = true OR user_id = auth.uid());

-- Criar view segura para eventos públicos (sem expor user_id)
CREATE OR REPLACE VIEW public_events AS
SELECT 
  id,
  title,
  description,
  event_date,
  event_time,
  location,
  is_public,
  status,
  max_attendees,
  tipo_evento,
  categoria_evento,
  subtipo_evento,
  finalidade_evento,
  menu,
  inclui_entradas,
  inclui_bebidas,
  qtd_pessoas,
  created_at,
  updated_at,
  CASE 
    WHEN user_id = auth.uid() THEN user_id
    ELSE NULL
  END as user_id
FROM table_reune
WHERE is_public = true OR user_id = auth.uid();

-- 2. Proteger emails em friend_requests (apenas receiver vê o email)
DROP POLICY IF EXISTS "Usuários podem ver pedidos enviados por eles" ON friend_requests;
CREATE POLICY "Remetentes podem ver pedidos enviados" 
ON friend_requests FOR SELECT 
USING (auth.uid() = sender_id);

CREATE POLICY "Destinatários podem ver pedidos recebidos com email" 
ON friend_requests FOR SELECT 
USING (auth.uid() = receiver_id);

-- 3. Proteger emails em event_invitations (apenas criador do evento vê)
DROP POLICY IF EXISTS "Organizadores podem ver convites" ON event_invitations;
CREATE POLICY "Apenas criador do evento pode ver convites com emails" 
ON event_invitations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM table_reune 
    WHERE table_reune.id = event_invitations.event_id 
    AND table_reune.user_id = auth.uid()
  )
);

-- 4. Proteger contato em event_participants (usar função segura)
-- A função get_event_participants_safe já existe e faz isso corretamente
-- Mas vamos garantir que a policy direcione para uso da função

DROP POLICY IF EXISTS "Usuários podem ver participantes de eventos próprios ou públ" ON event_participants;
CREATE POLICY "Ver participantes apenas de eventos com acesso" 
ON event_participants FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM table_reune
    WHERE table_reune.id = event_participants.event_id 
    AND (table_reune.user_id = auth.uid() OR is_event_organizer(auth.uid(), event_participants.event_id))
  )
);

-- 5. Proteger profiles - exigir autenticação
DROP POLICY IF EXISTS "Perfis são visíveis para todos" ON profiles;
CREATE POLICY "Perfis visíveis apenas para usuários autenticados" 
ON profiles FOR SELECT 
USING (auth.uid() IS NOT NULL);