-- GlobeNews — backend hardening for the community layer.
-- Now that any signed-in reader can write publicly, the database needs its own
-- defences: server-side rate limits, input validation, and a report trail.
-- Run once: SQL Editor → New query → paste → Run.

-- ── 1) Rate limits enforced in the DATABASE ────────────────────────────────
-- Client-side throttling is trivially bypassed; these policies count the
-- user's own recent rows, so a scripted client is limited too.

-- Posts: 10 per hour.
drop policy if exists "own posts insert" on public.posts;
create policy "own posts insert" on public.posts for insert
  with check (
    auth.uid() = user_id
    and (
      select count(*) from public.posts p
      where p.user_id = auth.uid() and p.created_at > now() - interval '1 hour'
    ) < 10
  );

-- Comments: 30 per hour.
drop policy if exists "own comments insert" on public.comments;
create policy "own comments insert" on public.comments for insert
  with check (
    auth.uid() = user_id
    and (
      select count(*) from public.comments c
      where c.user_id = auth.uid() and c.created_at > now() - interval '1 hour'
    ) < 30
  );

-- Polls: 5 per day (a poll is a heavier object than a comment).
drop policy if exists "authed create polls" on public.polls;
create policy "authed create polls" on public.polls for insert
  with check (
    auth.uid() = created_by
    and array_length(options, 1) between 2 and 6
    and (
      select count(*) from public.polls p
      where p.created_by = auth.uid() and p.created_at > now() - interval '1 day'
    ) < 5
  );

-- ── 2) Input validation the client can't skip ──────────────────────────────
alter table public.polls drop constraint if exists polls_question_len;
alter table public.polls
  add constraint polls_question_len check (char_length(question) between 5 and 200);

-- ── 3) Reports — a paper trail for anything abusive ────────────────────────
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id   uuid not null,
  reason      text check (char_length(reason) <= 500),
  created_at  timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

create index if not exists reports_target_idx on public.reports (target_type, target_id);
alter table public.reports enable row level security;

-- Reporters may file and see their own reports; nobody else can read them.
drop policy if exists "own reports" on public.reports;
create policy "own reports" on public.reports for all
  using (auth.uid() = reporter_id) with check (auth.uid() = reporter_id);

-- Review queue: run this in the SQL editor to see what's been reported.
--   select target_type, target_id, count(*) as reports, max(created_at) as latest
--   from public.reports group by 1, 2 order by reports desc, latest desc;
