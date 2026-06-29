-- GlobeNews — "Save for later" (bookmarks). Run once in the Supabase
-- dashboard: SQL Editor → New query → paste → Run.

create table if not exists public.saved (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  story_id   text,            -- in-app /article/[id] (when still in the live feed)
  link       text not null,   -- canonical source URL (stable id for de-dup)
  title      text,
  source     text,
  category   text,
  image_url  text,
  saved_at   timestamptz not null default now(),
  unique (user_id, link)
);

create index if not exists saved_user_idx on public.saved (user_id, saved_at desc);
alter table public.saved enable row level security;

drop policy if exists "own saved" on public.saved;
create policy "own saved" on public.saved for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
