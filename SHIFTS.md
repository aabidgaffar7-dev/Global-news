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
2. Widen Africa coverage beyond South Africa (e.g. Nigeria, Kenya, Egypt outlets) with suggested leans for Aabid to approve; the new `/sources` region bar shows it is thin (proposed).
3. Re-add Korea and Turkey outlets with working feed URLs (Korea Herald and Hurriyet were dropped for 0 items) and test candidates with `check-feeds.mjs` (proposed; needs Aabid's PC to test).
5. Add a "Compare coverage" view: pick a topic and show how outlets of different leans headline it side by side (proposed; split into a data step then a UI step).
6. Show the region filter on the home feed too (category pages and `/popular` done), reusing `lib/regions.ts` (proposed).
7. Add a "Report a broken feed" link on `/source/[id]` for outlets showing no stories (needs a destination: an email address or GitHub issues link from Aabid; `/api/health` is done) (proposed).
9. Add a "Compare coverage" data step: group stories by shared topic keywords across outlets of different leans in `lib/news.ts` (proposed).
10. Add a lean filter to `/popular` (search already has one) so readers can see the leaderboard by vantage point (proposed).
11. Add a "Report a broken feed" or "Suggest an outlet" form once Aabid picks a destination (proposed).

## Added outlets (Aabid approved all 10 and their leans on 2026-10-21; now in `lib/feeds.ts`; URLs still unverified, so the PC feed check matters)
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
(nothing right now)

## Shift log (newest first)
- 2026-10-26 (shift 9): `/popular` now has a region chip row (works with the topic and time filters, URL-based `?region=`). Search already had a lean filter, so that backlog item was closed. Only one task this shift. Lint and build pass.
- 2026-10-25 (shift 8): Category pages now have a region chip row (with story counts) that filters the article grid. Added `/api/health`: JSON of per-outlet story counts, latest story time and a `silent` list for uptime monitoring. Lint and build pass.
- 2026-10-24 (shift 7): `/source/[id]` now shows when the outlet's latest story was published, or an amber "feed may be down" warning if it has none; `/sources` flags outlets with no live stories and revalidates every 10 min. Only one task this shift. Lint and build pass (the sandbox is offline, so the flags only show with live data).
- 2026-10-23 (shift 6): Added an outlet page `/source/[id]` (lean badge, city/country, live story count, full sortable story list); outlet names on `/sources` link to it and all outlets are in the sitemap. Added a region filter chip row to search results (new shared `lib/regions.ts`, with ~40 more countries mapped so story locations classify). Lint and build pass.
- 2026-10-22 (shift 5): Lean labels were already on story cards and the article page, so I closed that item. Added `/sources` ("Our sources"): all rated outlets grouped by lean with country, plus a coverage-by-region bar chart (Africa, Oceania and Latin America are thinnest). Linked from About, the footer and the sitemap. Lint and build pass.
- 2026-10-22 (follow-up): HuffPost's feed redirects to an empty XML doc, so it's removed. Aabid tested four left candidates (all healthy) and left the pick to Claude: added Mother Jones and Democracy Now! (both `left`, both mostly news reporting rather than opinion), giving 2 left vs 2 right. WelcomePicker starter list now uses Mother Jones instead of HuffPost. Old `huffpost` follows in Supabase just go quiet; no schema change. The Nation (50 items) and The Intercept (20) also passed if more left coverage is wanted.
- 2026-10-22: HuffPost's new feed URL also returns 0 items on Aabid's PC. `check-feeds.mjs` now takes candidate URLs as arguments and shows where a 0-item feed actually landed. Waiting on Aabid to test candidate left-leaning replacements and approve one.
- 2026-10-21 (feed check 2): Final failure was HuffPost (200 but 0 items). It's the only `left` outlet now that Haaretz is gone and is in WelcomePicker, so I kept it and swapped to `https://www.huffpost.com/section/front-page/feed` (unverified; Aabid to re-run the check). If still 0 items, replace with another left-leaning outlet.
- 2026-10-21 (feed check): Aabid ran the check on his PC: 38/42 healthy. Removed Haaretz (403, blocks bots), Korea Herald and Hurriyet Daily News (200 but 0 items; feed URL/format wrong). Candidates to re-add later with a working feed URL. One more failure was above the screenshot; waiting on its name.
- 2026-10-21 (follow-up): Aabid approved all 10 proposed outlets and leans; added them to `lib/feeds.ts` (roster now 41). Lint and build pass.
- 2026-10-21 (shift 4): `scripts/check-feeds.mjs` now imports the real roster from `lib/feeds.ts` (the old hardcoded list had drifted, e.g. CBC vs Global News) and runs in parallel. The cloud sandbox has no outbound internet, so feed health could NOT be tested here; needs a run on Aabid's PC. Added 10 proposed outlets with suggested leans for Aabid to approve. Lint and build pass.
- 2026-10-20 (shift 3): Replaced the create-next-app README with a real one (what GlobeNews is, local run, env table, Supabase SQL run order inferred from file dependencies, so please sanity-check it). Lint and build pass.
- 2026-10-19 (shift 2): Added `.env.example` (all 6 env vars the code reads, with where each comes from; Supabase required, rest optional) and un-ignored it in `.gitignore`. Lint and build pass.
- 2026-10-19: Cleared all lint errors/warnings (build already passed). Real code fixes for the two expression warnings; documented eslint-disables for intentional set-state-in-effect (localStorage/SSR) patterns, one `any` (globe handle) and Date.now in a server page. Created SHIFTS.md.
