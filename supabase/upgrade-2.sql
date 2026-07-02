-- GlobeNews — upgrade 2: permanent articles + real "most read" windows +
-- hardened engagement writes. Run once in the Supabase dashboard:
-- SQL Editor → New query → paste → Run.

-- ── 1) Persistent story store ───────────────────────────────────────────────
-- Every story seen by the app is upserted here, so /article/[id] links stay
-- alive after the story rotates out of the live feed.
create table if not exists public.stories (
  id           text primary key,          -- the app's story id (hash)
  link         text not null unique,      -- normalized source URL
  title        text not null,
  source       text,
  source_id    text,
  lean         text,
  category     text,
  summary      text,
  image_url    text,
  published_at timestamptz,
  lat          double precision,
  lng          double precision,
  city         text,
  country      text,
  placement    text,
  first_seen   timestamptz not null default now()
);

alter table public.stories enable row level security;

drop policy if exists "public read stories" on public.stories;
create policy "public read stories" on public.stories for select using (true);

-- Server upserts use the anon key (no privileged backend key in this app), so
-- anon may write. Rows are only ever read back by their exact id, and every
-- field is length/shape-validated in code before render.
drop policy if exists "anon insert stories" on public.stories;
create policy "anon insert stories" on public.stories for insert with check (true);
drop policy if exists "anon update stories" on public.stories;
create policy "anon update stories" on public.stories for update using (true);

-- ── 2) Daily engagement — enables honest "most read today/this week" ───────
create table if not exists public.story_engagement_daily (
  link   text not null,
  day    date not null default current_date,
  views  integer not null default 0,
  clicks integer not null default 0,
  primary key (link, day)
);

create index if not exists sed_day_idx on public.story_engagement_daily (day desc);
alter table public.story_engagement_daily enable row level security;

drop policy if exists "public read daily engagement" on public.story_engagement_daily;
create policy "public read daily engagement"
  on public.story_engagement_daily for select using (true);

-- ── 3) Harden + extend the engagement RPC ───────────────────────────────────
-- Validates inputs (rejects junk kinds / oversized links) and now also writes
-- the per-day row so windowed rankings are real.
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
  if p_kind not in ('view', 'click') then return; end if;
  if p_link is null or length(p_link) = 0 or length(p_link) > 2048 then return; end if;

  insert into public.story_engagement (link, title, source, views, clicks, updated_at)
  values (
    p_link, left(coalesce(p_title, ''), 300), left(coalesce(p_source, ''), 120),
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

  insert into public.story_engagement_daily (link, day, views, clicks)
  values (
    p_link, current_date,
    case when p_kind = 'view' then 1 else 0 end,
    case when p_kind = 'click' then 1 else 0 end
  )
  on conflict (link, day) do update set
    views  = story_engagement_daily.views  + (case when p_kind = 'view'  then 1 else 0 end),
    clicks = story_engagement_daily.clicks + (case when p_kind = 'click' then 1 else 0 end);
end;
$$;

grant execute on function public.increment_engagement(text, text, text, text) to anon;
