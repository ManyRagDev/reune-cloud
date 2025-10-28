
-- Drop the existing constraint if it exists
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated constraint with all notification types used in the system
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'friend_request',
    'friend_accepted',
    'friend_request_accepted',
    'event_invite',
    'organizer_invite',
    'invitation_confirmed',
    'invitation_accepted',
    'suggestion_accepted',
    'suggestion_rejected',
    'friendship_invite_activated'
  )
);
