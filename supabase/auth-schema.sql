-- GlobeNews — accounts schema (profiles, follows, reading history).
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

-- ── Profiles ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  bio          text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile write"  on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile write"  on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Follows ────────────────────────────────────────────────────────────────
-- kind ∈ 'category' | 'location' | 'keyword'; value = the slug / city / keyword.
create table if not exists public.follows (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null,
  value      text not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, value)
);

create index if not exists follows_user_idx on public.follows (user_id);
alter table public.follows enable row level security;

drop policy if exists "own follows" on public.follows;
create policy "own follows" on public.follows for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Reading history ────────────────────────────────────────────────────────
create table if not exists public.reading_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  link       text not null,
  title      text,
  source     text,
  category   text,
  viewed_at  timestamptz not null default now(),
  unique (user_id, link)
);

create index if not exists reading_history_user_idx on public.reading_history (user_id, viewed_at desc);
alter table public.reading_history enable row level security;

drop policy if exists "own history" on public.reading_history;
create policy "own history" on public.reading_history for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
