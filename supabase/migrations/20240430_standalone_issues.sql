-- TidelQ Standalone Issues Database System
-- Migration: Create isolated tables for Community Issues page

-- 1. Issue Reports Table
CREATE TABLE IF NOT EXISTS public.issue_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    beach_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Pollution', 'Infrastructure', 'Safety', 'Wildlife', 'Other')),
    description TEXT,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN PROGRESS', 'RESOLVED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Issue Votes Table (One upvote per user)
CREATE TABLE IF NOT EXISTS public.issue_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    issue_id UUID REFERENCES public.issue_reports(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, issue_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_issue_reports_beach_id ON public.issue_reports(beach_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_category ON public.issue_reports(category);
CREATE INDEX IF NOT EXISTS idx_issue_votes_issue_id ON public.issue_votes(issue_id);

-- RLS Policies
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_votes ENABLE ROW LEVEL SECURITY;

-- Issue Reports Policies
DROP POLICY IF EXISTS "Public can see issues" ON public.issue_reports;
CREATE POLICY "Public can see issues" ON public.issue_reports
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create issues" ON public.issue_reports;
CREATE POLICY "Authenticated users can create issues" ON public.issue_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authors can update their issues" ON public.issue_reports;
CREATE POLICY "Authors can update their issues" ON public.issue_reports
    FOR UPDATE USING (auth.uid() = user_id);

-- Issue Votes Policies
DROP POLICY IF EXISTS "Anyone can see issue votes" ON public.issue_votes;
CREATE POLICY "Anyone can see issue votes" ON public.issue_votes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own votes" ON public.issue_votes;
CREATE POLICY "Users can manage their own votes" ON public.issue_votes
    FOR ALL USING (auth.uid() = user_id);

-- View for aggregated counts (Optional but helpful)
CREATE OR REPLACE VIEW public.issue_stats AS
SELECT 
    ir.*,
    COALESCE(v.count, 0) as vote_count
FROM public.issue_reports ir
LEFT JOIN (
    SELECT issue_id, COUNT(*) as count 
    FROM public.issue_votes 
    GROUP BY issue_id
) v ON ir.id = v.issue_id;
