-- Remover constraint antiga de tipo de notificação
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Adicionar constraint atualizada com todos os tipos necessários
ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  -- Tipos de amizade
  'friend_request',
  'friend_request_accepted',
  'friend_request_rejected',
  'friendship_invite_activated',
  
  -- Tipos de convites para eventos
  'organizer_invite',
  'event_invite',
  'invitation_accepted',
  'invitation_confirmed',
  
  -- Tipos de sugestões
  'suggestion_accepted',
  'suggestion_rejected'
));

-- Comentário explicativo
COMMENT ON CONSTRAINT notifications_type_check ON notifications IS 
'Garante que apenas tipos válidos de notificação sejam inseridos na tabela';