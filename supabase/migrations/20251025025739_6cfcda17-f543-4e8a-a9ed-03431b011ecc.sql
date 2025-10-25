-- Adicionar RLS policy para permitir deleção de amizades
CREATE POLICY "Usuários podem deletar próprias amizades"
ON public.friendships
FOR DELETE
USING (
  auth.uid() = user_id_1 OR auth.uid() = user_id_2
);