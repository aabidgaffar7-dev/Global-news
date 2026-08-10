-- GlobeNews — user posts + user-submitted polls.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- (Requires community-schema.sql to have been run first.)

-- ── 1) Opinion posts ───────────────────────────────────────────────────────
-- Discussion on a post reuses the existing `comments` table with
-- link = 'post:<uuid>', so threads, replies and comment voting work as-is.
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null check (char_length(title) between 3 and 300),
  body       text check (char_length(body) <= 10000),
  topic      text check (char_length(topic) <= 60),
  created_at timestamptz not null default now(),
  deleted    boolean not null default false
);

create index if not exists posts_created_idx on public.posts (created_at desc);
alter table public.posts enable row level security;

drop policy if exists "public read posts" on public.posts;
create policy "public read posts" on public.posts for select using (true);
drop policy if exists "own posts insert" on public.posts;
create policy "own posts insert" on public.posts for insert
  with check (auth.uid() = user_id);
drop policy if exists "own posts update" on public.posts;
create policy "own posts update" on public.posts for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 2) Post votes ──────────────────────────────────────────────────────────
create table if not exists public.post_votes (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  value      smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_votes_post_idx on public.post_votes (post_id);
alter table public.post_votes enable row level security;

drop policy if exists "public read post votes" on public.post_votes;
create policy "public read post votes"
  on public.post_votes for select using (true);
drop policy if exists "own post votes" on public.post_votes;
create policy "own post votes" on public.post_votes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 3) Let readers create polls, not just vote in them ─────────────────────
alter table public.polls
  add column if not exists created_by uuid references auth.users (id) on delete set null;

drop policy if exists "authed create polls" on public.polls;
create policy "authed create polls" on public.polls for insert
  with check (auth.uid() = created_by);
