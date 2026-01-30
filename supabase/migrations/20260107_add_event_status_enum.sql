-- Create a new ENUM type for event_status
CREATE TYPE public.event_status AS ENUM ('draft', 'created', 'finalized', 'cancelled');

-- Alter table_reune to use the new ENUM type
ALTER TABLE public.table_reune
ALTER COLUMN status TYPE public.event_status USING (
    CASE
        WHEN status = 'draft' THEN 'draft'::public.event_status
        WHEN status = 'published' THEN 'created'::public.event_status -- Map 'published' to 'created'
        WHEN status = 'cancelled' THEN 'cancelled'::public.event_status
        ELSE 'draft'::public.event_status -- Default to 'draft' for any unexpected values
    END
);

-- Update default value
ALTER TABLE public.table_reune
ALTER COLUMN status SET DEFAULT 'draft'::public.event_status;

-- Remove old CHECK constraint as it's now managed by the ENUM type
ALTER TABLE public.table_reune
DROP CONSTRAINT IF EXISTS "table_reune_status_check";
