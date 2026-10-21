# GlobeNews build shifts

Claude works on GlobeNews in small daily shifts from the cloud. This file is the handoff between shifts: read it first, update it last.

## Rules
- Work only on the `claude/shifts` branch. Never push to `main`. Keep one open pull request from `claude/shifts` into `main`; Aabid merges it when he's happy.
- Up to two focused tasks per shift; the second only if it can be finished cleanly. Small, finished, and working beats big and half-done.
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
1. Re-run `node scripts/check-feeds.mjs` from a machine with open internet (cloud shifts are network-blocked) and fix or drop dead feeds. (Needs Aabid's PC: run it and paste the output, or say "fine".)
2. Add the outlets Aabid approves from the proposal list below (one entry each in `lib/feeds.ts`). (blocked on Aabid's approval of outlets and leans)
3. Show each story's outlet lean label on the story card/detail page if it is not already prominent (proposed).
4. Add a "Sources" or "How we rate outlets" page explaining the lean labels and the roster (proposed).
5. Add a coverage-by-region indicator so readers can see which parts of the world have thin coverage (proposed).

## Proposed outlets (Aabid decides outlets and leans; URLs are unverified because cloud shifts can't reach the internet)
Current roster has 31 outlets, heavy on US/UK and light on South Asia, Middle East, Africa, SE Asia, Latin America and Korea/Turkey. Suggested leans are only a starting point.
- Dawn (Karachi, Pakistan): https://www.dawn.com/feeds/home - center
- The Hindu (Chennai, India): https://www.thehindu.com/news/feeder/default.rss - center-left
- Haaretz (Tel Aviv): https://www.haaretz.com/srv/haaretz-latest-headlines - left
- Arab News (Riyadh): https://www.arabnews.com/rss.xml - intl (Gulf state-aligned vantage point)
- Daily Maverick (Cape Town): https://www.dailymaverick.co.za/dmrss/ - center-left
- The Straits Times (Singapore): https://www.straitstimes.com/news/world/rss.xml - center
- Korea Herald (Seoul): http://www.koreaherald.com/common/rss_xml.php?ct=102 - center
- Hurriyet Daily News (Istanbul): https://www.hurriyetdailynews.com/rss - center-right
- MercoPress (Montevideo, Latin America): https://en.mercopress.com/rss - center
- Buenos Aires Times (Argentina): https://www.batimes.com.ar/feed - center

## Waiting on Aabid
(nothing yet)

## Shift log (newest first)
- 2026-10-21 (shift 4): `scripts/check-feeds.mjs` now imports the real roster from `lib/feeds.ts` (the old hardcoded list had drifted, e.g. CBC vs Global News) and runs in parallel. The cloud sandbox has no outbound internet, so feed health could NOT be tested here; needs a run on Aabid's PC. Added 10 proposed outlets with suggested leans for Aabid to approve. Lint and build pass.
- 2026-10-20 (shift 3): Replaced the create-next-app README with a real one (what GlobeNews is, local run, env table, Supabase SQL run order inferred from file dependencies, so please sanity-check it). Lint and build pass.
- 2026-10-19 (shift 2): Added `.env.example` (all 6 env vars the code reads, with where each comes from; Supabase required, rest optional) and un-ignored it in `.gitignore`. Lint and build pass.
- 2026-10-19: Cleared all lint errors/warnings (build already passed). Real code fixes for the two expression warnings; documented eslint-disables for intentional set-state-in-effect (localStorage/SSR) patterns, one `any` (globe handle) and Date.now in a server page. Created SHIFTS.md.
