-- Migration: Create public_issues table

CREATE TABLE IF NOT EXISTS public.public_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    beach_location TEXT,
    category TEXT,
    status TEXT DEFAULT 'open',
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.public_issues ENABLE ROW LEVEL SECURITY;

-- Add policies
DROP POLICY IF EXISTS "Public can see issues" ON public.public_issues;
CREATE POLICY "Public can see issues" ON public.public_issues
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert issues" ON public.public_issues;
CREATE POLICY "Public can insert issues" ON public.public_issues
    FOR INSERT WITH CHECK (true);

-- Allow public to update votes (for the upvote feature)
-- We'll just allow UPDATE for simplicity on public issues since anyone can upvote.
DROP POLICY IF EXISTS "Public can update issues" ON public.public_issues;
CREATE POLICY "Public can update issues" ON public.public_issues
    FOR UPDATE USING (true);

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_public_issues_votes ON public.public_issues(votes DESC);
