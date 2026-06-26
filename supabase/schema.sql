-- GlobeNews — popularity engine schema.
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.

-- One row per article, accumulating reader signals.
create table if not exists public.story_engagement (
  link       text primary key,
  title      text,
  source     text,
  views      integer not null default 0,  -- opened the in-app summary
  clicks     integer not null default 0,  -- clicked through to the source
  updated_at timestamptz not null default now()
);

-- Index for "most popular" style queries later.
create index if not exists story_engagement_views_idx
  on public.story_engagement (views desc);

-- Lock the table down: anyone may READ aggregate counts (used for ranking),
-- nobody writes directly — writes go only through the function below.
alter table public.story_engagement enable row level security;

drop policy if exists "public read engagement" on public.story_engagement;
create policy "public read engagement"
  on public.story_engagement for select
  using (true);

-- Atomic upsert+increment. SECURITY DEFINER lets the anon role bump counts via
-- this function without granting direct table writes.
create or replace function public.increment_engagement(
  p_link text,
  p_title text,
  p_source text,
  p_kind text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.story_engagement (link, title, source, views, clicks, updated_at)
  values (
    p_link, p_title, p_source,
    case when p_kind = 'view' then 1 else 0 end,
    case when p_kind = 'click' then 1 else 0 end,
    now()
  )
  on conflict (link) do update set
    views  = story_engagement.views  + (case when p_kind = 'view'  then 1 else 0 end),
    clicks = story_engagement.clicks + (case when p_kind = 'click' then 1 else 0 end),
    title  = excluded.title,
    source = excluded.source,
    updated_at = now();
end;
$$;

grant execute on function public.increment_engagement(text, text, text, text) to anon;
