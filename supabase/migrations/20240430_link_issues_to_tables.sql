-- Migration: Link public_issues to beaches and profiles

-- 1. Add user_id to public_issues
ALTER TABLE public.public_issues 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);

-- 2. Optional: If you want to link beach_location to the beaches table properly, 
-- we could add a beach_id column. But for now, we'll keep it as text to match your previous request,
-- and just fetch the strings from the beaches table.

-- Update policies to handle user_id
DROP POLICY IF EXISTS "Public can insert issues" ON public.public_issues;
CREATE POLICY "Public can insert issues" ON public.public_issues
    FOR INSERT WITH CHECK (true);

-- Allow users to update their own issues (optional, but good practice)
CREATE POLICY "Users can update own issues" ON public.public_issues
    FOR UPDATE USING (auth.uid() = user_id);
