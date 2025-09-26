-- Add necessary columns for event management to table_reune
ALTER TABLE public.table_reune 
ADD COLUMN title TEXT NOT NULL DEFAULT '',
ADD COLUMN description TEXT,
ADD COLUMN event_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN event_time TIME NOT NULL DEFAULT '00:00:00',
ADD COLUMN location TEXT,
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
ADD COLUMN status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled')),
ADD COLUMN max_attendees INTEGER DEFAULT 50,
ADD COLUMN is_public BOOLEAN DEFAULT true,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_table_reune_updated_at
    BEFORE UPDATE ON public.table_reune
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create RLS policies for secure access
CREATE POLICY "Users can view public events" 
ON public.table_reune 
FOR SELECT 
USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own events" 
ON public.table_reune 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own events" 
ON public.table_reune 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own events" 
ON public.table_reune 
FOR DELETE 
USING (user_id = auth.uid());