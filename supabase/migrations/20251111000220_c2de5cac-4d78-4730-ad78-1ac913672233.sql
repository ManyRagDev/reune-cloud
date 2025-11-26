-- Criar bucket para screenshots de marketing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'screenshots',
  'screenshots',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Permitir que todos possam fazer upload (para modo marketing)
CREATE POLICY "Qualquer um pode fazer upload de screenshots"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'screenshots');

-- Permitir que todos possam visualizar screenshots
CREATE POLICY "Screenshots são públicos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'screenshots');

-- Permitir deletar screenshots próprios
CREATE POLICY "Usuários podem deletar seus screenshots"
ON storage.objects
FOR DELETE
USING (bucket_id = 'screenshots');