-- Primeiro, vamos verificar e corrigir a constraint de tipos de notificação
-- Adicionar os tipos de notificação de amizade que estão faltando

-- Remover constraint antiga se existir
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Criar nova constraint com todos os tipos necessários
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'friend_request',
  'friend_request_accepted',
  'friend_request_rejected',
  'organizer_invite',
  'event_invite',
  'invitation_accepted',
  'invitation_confirmed',
  'suggestion_accepted',
  'suggestion_rejected'
));

-- Criar índice para melhorar performance de consultas de notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, read, created_at DESC);