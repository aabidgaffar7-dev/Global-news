-- GlobeNews — community layer: votes, threaded discussion, and polls.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

-- ── 0) Public profiles ─────────────────────────────────────────────────────
-- Discussion needs author names, so profiles become publicly readable.
-- (Only display_name/bio live here — no emails, no private data.)
drop policy if exists "own profile read" on public.profiles;
drop policy if exists "public read profiles" on public.profiles;
create policy "public read profiles" on public.profiles for select using (true);

-- ── 1) Article votes ───────────────────────────────────────────────────────
create table if not exists public.article_votes (
  link       text not null,
  user_id    uuid not null references auth.users (id) on delete cascade,
  value      smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (link, user_id)
);

create index if not exists article_votes_link_idx on public.article_votes (link);
alter table public.article_votes enable row level security;

drop policy if exists "public read article votes" on public.article_votes;
create policy "public read article votes"
  on public.article_votes for select using (true);
drop policy if exists "own article votes" on public.article_votes;
create policy "own article votes" on public.article_votes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 2) Threaded comments ───────────────────────────────────────────────────
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  link       text not null,
  user_id    uuid not null references auth.users (id) on delete cascade,
  parent_id  uuid references public.comments (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  deleted    boolean not null default false
);

create index if not exists comments_link_idx on public.comments (link, created_at desc);
alter table public.comments enable row level security;

drop policy if exists "public read comments" on public.comments;
create policy "public read comments"
  on public.comments for select using (true);
drop policy if exists "own comments insert" on public.comments;
create policy "own comments insert" on public.comments for insert
  with check (auth.uid() = user_id);
drop policy if exists "own comments update" on public.comments;
create policy "own comments update" on public.comments for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 3) Comment votes ───────────────────────────────────────────────────────
create table if not exists public.comment_votes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  value      smallint not null check (value in (-1, 1)),
  primary key (comment_id, user_id)
);

alter table public.comment_votes enable row level security;
drop policy if exists "public read comment votes" on public.comment_votes;
create policy "public read comment votes"
  on public.comment_votes for select using (true);
drop policy if exists "own comment votes" on public.comment_votes;
create policy "own comment votes" on public.comment_votes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 4) Polls ───────────────────────────────────────────────────────────────
create table if not exists public.polls (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  options    text[] not null,
  category   text,
  created_at timestamptz not null default now(),
  closes_at  timestamptz
);

alter table public.polls enable row level security;
drop policy if exists "public read polls" on public.polls;
create policy "public read polls" on public.polls for select using (true);

create table if not exists public.poll_votes (
  poll_id      uuid not null references public.polls (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  option_index smallint not null check (option_index >= 0),
  created_at   timestamptz not null default now(),
  primary key (poll_id, user_id)
);

create index if not exists poll_votes_poll_idx on public.poll_votes (poll_id);
alter table public.poll_votes enable row level security;

drop policy if exists "public read poll votes" on public.poll_votes;
create policy "public read poll votes"
  on public.poll_votes for select using (true);
drop policy if exists "own poll votes" on public.poll_votes;
create policy "own poll votes" on public.poll_votes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 5) Seed a few opening polls ────────────────────────────────────────────
insert into public.polls (question, options, category)
select * from (values
  ('Should news feeds be ranked by readers instead of editors?',
   array['Yes — readers should decide','No — editors add judgment','A mix of both'], 'world'),
  ('How much do you trust the news you read day to day?',
   array['A lot','Somewhat','Not much','Not at all'], 'world'),
  ('Do political-lean labels on sources change how you read a story?',
   array['Yes, a lot','A little','No difference'], 'politics')
) as seed(question, options, category)
where not exists (select 1 from public.polls);
