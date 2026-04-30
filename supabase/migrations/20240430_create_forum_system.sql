-- TidelQ Public Forum Database System
-- Migration: Create forum system tables, functions, and RLS policies

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Posts Table
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  title text not null,
  content text not null,
  is_deleted boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Comments Table
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  content text not null,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- 3. Votes Table
create table if not exists public.votes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  vote_type smallint not null check (vote_type in (1, -1)),
  created_at timestamp with time zone default now(),
  constraint one_vote_per_item unique (user_id, post_id, comment_id),
  constraint post_or_comment check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  )
);

-- 4. Bookmarks Table
create table if not exists public.bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(user_id, post_id)
);

-- 5. Reports Table
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  reason text not null,
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists idx_posts_user_id on public.posts(user_id);
create index if not exists idx_posts_created_at on public.posts(created_at);
create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_comments_user_id on public.comments(user_id);
create index if not exists idx_comments_parent_id on public.comments(parent_comment_id);
create index if not exists idx_votes_post_id on public.votes(post_id);
create index if not exists idx_votes_comment_id on public.votes(comment_id);

-- Voting Logic Function
create or replace function public.handle_vote(
  p_user_id uuid,
  p_post_id uuid default null,
  p_comment_id uuid default null,
  p_vote_type smallint default 1
) returns void as $$
begin
  -- Check if exact same vote exists
  if exists (
    select 1 from public.votes 
    where user_id = p_user_id 
    and (post_id = p_post_id or (p_post_id is null and post_id is null))
    and (comment_id = p_comment_id or (p_comment_id is null and comment_id is null))
    and vote_type = p_vote_type
  ) then
    -- Remove vote (toggle off)
    delete from public.votes 
    where user_id = p_user_id 
    and (post_id = p_post_id or (p_post_id is null and post_id is null))
    and (comment_id = p_comment_id or (p_comment_id is null and comment_id is null));
  else
    -- Insert new vote or update existing one (switch type)
    insert into public.votes (user_id, post_id, comment_id, vote_type)
    values (p_user_id, p_post_id, p_comment_id, p_vote_type)
    on conflict (user_id, post_id, comment_id) 
    do update set vote_type = p_vote_type;
  end if;
end;
$$ language plpgsql security definer;

-- RLS Policies
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.reports enable row level security;

-- Posts Policies
drop policy if exists "Public can see active posts" on public.posts;
create policy "Public can see active posts" on public.posts
  for select using (not is_deleted);

drop policy if exists "Users can create posts" on public.posts;
create policy "Users can create posts" on public.posts
  for insert with check (auth.uid() = user_id);

drop policy if exists "Authors can update their posts" on public.posts;
create policy "Authors can update their posts" on public.posts
  for update using (auth.uid() = user_id);

-- Comments Policies
drop policy if exists "Anyone can see comments" on public.comments;
create policy "Anyone can see comments" on public.comments
  for select using (true);

drop policy if exists "Users can create comments" on public.comments;
create policy "Users can create comments" on public.comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "Authors can update their comments" on public.comments;
create policy "Authors can update their comments" on public.comments
  for update using (auth.uid() = user_id);

-- Votes Policies
drop policy if exists "Users can see all votes" on public.votes;
create policy "Users can see all votes" on public.votes
  for select using (true);

drop policy if exists "Users can manage their own votes" on public.votes;
create policy "Users can manage their own votes" on public.votes
  for all using (auth.uid() = user_id);

-- Bookmarks Policies
drop policy if exists "Users can see their own bookmarks" on public.bookmarks;
create policy "Users can see their own bookmarks" on public.bookmarks
  for select using (auth.uid() = user_id);

drop policy if exists "Users can manage their own bookmarks" on public.bookmarks;
create policy "Users can manage their own bookmarks" on public.bookmarks
  for all using (auth.uid() = user_id);

-- Reports Policies
drop policy if exists "Users can create reports" on public.reports;
create policy "Users can create reports" on public.reports
  for insert with check (auth.uid() = user_id);

-- Realtime Configuration
-- Ensure these tables are in the realtime publication
-- (Note: In some Supabase setups, you might need to manually enable this in the dashboard)
begin;
  -- Add to existing publication if it exists, or create a new one
  -- This is a simplified approach; usually you do this via dashboard or specific commands
  -- alter publication supabase_realtime add table public.posts, public.votes;
commit;
