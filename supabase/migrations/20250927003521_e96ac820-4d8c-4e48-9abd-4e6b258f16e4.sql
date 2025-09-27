-- Remover definitivamente a constraint de foreign key para permitir dados de teste
ALTER TABLE public.table_reune DROP CONSTRAINT IF EXISTS table_reune_user_id_fkey;

-- Limpar dados existentes
DELETE FROM public.table_reune;

-- Inserir eventos fictícios para teste com UUIDs válidos
-- Evento 1: Evento público de outro usuário (simula "convite recebido")
INSERT INTO public.table_reune (
  title, 
  description, 
  event_date, 
  event_time, 
  location, 
  user_id, 
  is_public, 
  status,
  max_attendees
) VALUES (
  'Festa de Ano Novo 2025',
  'Celebração do Réveillon com música ao vivo, jantar especial e queima de fogos. Vista incrível da praia!',
  '2025-12-31',
  '20:00:00',
  'Praia de Copacabana, Rio de Janeiro',
  '11111111-1111-1111-1111-111111111111',
  true,
  'published',
  150
);

-- Evento 2: Workshop público
INSERT INTO public.table_reune (
  title, 
  description, 
  event_date, 
  event_time, 
  location, 
  user_id, 
  is_public, 
  status,
  max_attendees
) VALUES (
  'Workshop de Desenvolvimento Web',
  'Aprenda React, TypeScript e Supabase em um workshop hands-on de dia inteiro. Inclui certificado.',
  '2025-02-15',
  '09:00:00',
  'Centro de Convenções - São Paulo',
  '22222222-2222-2222-2222-222222222222',
  true,
  'published',
  80
);

-- Evento 3: Evento criado pelo usuário DEV
INSERT INTO public.table_reune (
  title, 
  description, 
  event_date, 
  event_time, 
  location, 
  user_id, 
  is_public, 
  status,
  max_attendees
) VALUES (
  'Meetup ReUNE - Networking Tech',
  'Encontro mensal da comunidade tech para networking, palestras e troca de experiências.',
  '2025-02-08',
  '19:00:00',
  'Hub de Inovação - Pinheiros, SP',
  'd0000000-0000-0000-0000-000000000123',
  false,
  'published',
  60
);

-- Evento 4: Hackathon público
INSERT INTO public.table_reune (
  title, 
  description, 
  event_date, 
  event_time, 
  location, 
  user_id, 
  is_public, 
  status,
  max_attendees
) VALUES (
  'Hackathon 2025',
  '48 horas de programação intensa! Desenvolva soluções inovadoras e concorra a prêmios incríveis.',
  '2025-03-22',
  '18:00:00',
  'Universidade de São Paulo - IME',
  '33333333-3333-3333-3333-333333333333',
  true,
  'published',
  200
);

-- Evento 5: Evento privado (não deve aparecer no dashboard)
INSERT INTO public.table_reune (
  title, 
  description, 
  event_date, 
  event_time, 
  location, 
  user_id, 
  is_public, 
  status,
  max_attendees
) VALUES (
  'Churrasco da Galera',
  'Churrasco exclusivo para os amigos próximos. Cada um traz algo!',
  '2025-02-10',
  '15:00:00',
  'Sítio do João - Cotia',
  '44444444-4444-4444-4444-444444444444',
  false,
  'published',
  25
);