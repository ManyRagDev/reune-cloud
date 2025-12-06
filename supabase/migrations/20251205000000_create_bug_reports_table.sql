-- Create bug_reports table for user bug reporting system
CREATE TABLE IF NOT EXISTS bug_reports (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'fixed', 'rejected')),
    user_agent TEXT,
    url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS bug_reports_user_id_idx ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS bug_reports_status_idx ON bug_reports(status);
CREATE INDEX IF NOT EXISTS bug_reports_created_at_idx ON bug_reports(created_at DESC);

-- Enable RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can insert their own bug reports
CREATE POLICY "Users can insert their own bug reports"
    ON bug_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own bug reports
CREATE POLICY "Users can view their own bug reports"
    ON bug_reports
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE bug_reports IS 'Stores user-reported bugs with bonus incentive system';
