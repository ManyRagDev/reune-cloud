ALTER TABLE public.item_assignments
ADD COLUMN IF NOT EXISTS confirmado BOOLEAN NOT NULL DEFAULT false;
