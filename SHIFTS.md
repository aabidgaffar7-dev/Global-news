# GlobeNews build shifts

Claude works on GlobeNews in small daily shifts from the cloud. This file is the handoff between shifts: read it first, update it last.

## Rules
- Work only on the `claude/shifts` branch. Never push to `main`. Keep one open pull request from `claude/shifts` into `main`; Aabid merges it when he's happy.
- One focused task per shift. Small, finished, and working beats big and half-done.
- Before pushing, `npm run lint` and `npm run build` must pass.
- Follow AGENTS.md: read the guides in node_modules/next/dist/docs/ before writing Next.js code.
- Never buy anything or sign up for anything. If something costs money, ask Aabid: what, why, cost, link, free alternative.
- Never ask for API keys or passwords in chat. Say where to paste them and list the variable name in `.env.example`.
- Outlet political-lean ratings are Aabid's call. Propose them; don't decide them.
- Don't run or change Supabase schema/SQL without Aabid's OK.

## About GlobeNews
- Neutral world news platform: stories rise on reader engagement, not editorial selection.
- Political-lean transparency: international outlets hand-rated and labeled by vantage point.
- Neutral AI key-point summaries (Claude API) with prominent attribution to the source outlet.
- Sources: RSS first, supplemented by GNews and NewsData.
- Community layer: votes, discussion, polls, user posts, moderation.

## Backlog (proposed; Aabid can reorder or veto)
1. Replace the default create-next-app README with a real one: what GlobeNews is, how to run it, env setup, which Supabase SQL files to run in what order.
2. Run `scripts/check-feeds.mjs`; fix or flag dead feeds.
3. Propose more international outlets to widen coverage, with suggested lean labels for Aabid to approve.

## Waiting on Aabid
(nothing yet)

## Shift log (newest first)
- 2026-10-19 (shift 2): Added `.env.example` (all 6 env vars the code reads, with where each comes from; Supabase required, rest optional) and un-ignored it in `.gitignore`. Lint and build pass.
- 2026-10-19: Cleared all lint errors/warnings (build already passed). Real code fixes for the two expression warnings; documented eslint-disables for intentional set-state-in-effect (localStorage/SSR) patterns, one `any` (globe handle) and Date.now in a server page. Created SHIFTS.md.
