# GlobeNews

A neutral, reader-ranked world news web app. Stories rise on reader engagement, not editorial selection.

- **Political-lean transparency** — international outlets are hand-rated and labeled by vantage point.
- **Neutral AI key points** — short summaries written with the Claude API, always attributed to the source outlet.
- **Sources** — RSS feeds first, supplemented by GNews and NewsData.
- **Community layer** — votes, threaded discussion, polls, user posts and moderation.

Built with Next.js (App Router), Supabase (auth + Postgres) and Cesium (the 3D globe).

> This project uses a newer Next.js with breaking changes. Read the guides in `node_modules/next/dist/docs/` before changing framework-level code (see `AGENTS.md`).

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run lint`, `npm run build`, `npm start`.
`npm install` also copies Cesium's static assets into `public/cesium` (`scripts/copy-cesium.mjs`).

## Environment variables

Listed with their sources in [`.env.example`](.env.example). Never commit `.env.local` or real keys. In production, set them in Vercel → Project → Settings → Environment Variables.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon public key |
| `NEXT_PUBLIC_SITE_URL` | no | Public URL for metadata, sitemap and robots |
| `ANTHROPIC_API_KEY` | no | AI key-point summaries (skipped without it) |
| `GNEWS_API_KEY` | no | GNews source (skipped without it) |
| `NEWSDATA_API_KEY` | no | NewsData source (skipped without it) |

## Database setup (Supabase)

Create a Supabase project, then in the dashboard open **SQL Editor → New query**, paste each file from [`supabase/`](supabase) and run it, **in this order**:

1. `schema.sql` — popularity engine (per-article reader signals)
2. `upgrade-2.sql` — permanent articles, "most read" windows, hardened engagement writes
3. `auth-schema.sql` — profiles, follows, reading history
4. `community-schema.sql` — votes, threaded comments, polls (needs the profiles table from step 3)
5. `posts-schema.sql` — user posts and user-submitted polls (needs step 4)
6. `saved-schema.sql` — "Save for later" bookmarks
7. `hardening.sql` — database-enforced rate limits, validation, report trail (needs steps 4–5)

Each file is written to be re-runnable (`if not exists` / `drop policy if exists`).

## Maintenance

- `node scripts/check-feeds.mjs` — checks that the curated RSS feeds are still reachable.

## Deployment

Deployed on Vercel from `main`.
