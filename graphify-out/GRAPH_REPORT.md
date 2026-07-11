# Graph Report - .  (2026-07-10)

## Corpus Check
- 86 files · ~96,787 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 340 nodes · 748 edges · 29 communities (15 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.68)
- Token cost: 137,100 input · 1,600 output

## Community Hubs (Navigation)
- Home, Search & Engagement API
- For You & Recommendations
- About & Account Pages
- Account Stats & Recent API
- Package Dependencies
- Category Pages
- Article Reading Experience
- TypeScript Config
- Popular Leaderboard
- Root Layout & Fonts
- Project Docs
- Favicon Generator
- OG Share Image
- Auth Middleware
- ESLint Config
- Next.js Config
- PostCSS Config
- Feed Check Script
- File Icon Asset
- Globe Icon Asset
- Next.js Logo Asset
- Earth Night Texture
- Starfield Texture
- Vercel Logo Asset
- Window Icon Asset

## God Nodes (most connected - your core abstractions)
1. `getAllStories()` - 28 edges
2. `timeAgo()` - 27 edges
3. `getUser` - 19 edges
4. `LEAN_META` - 17 edges
5. `compilerOptions` - 16 edges
6. `storyPlace()` - 15 edges
7. `getServerSupabase` - 15 edges
8. `CATEGORY_META` - 14 edges
9. `Story` - 14 edges
10. `normalizeUrl()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `SavedList()` --calls--> `timeAgo()`  [EXTRACTED]
  components/SavedList.tsx → lib/format.ts
- `POST()` --calls--> `recordEngagement()`  [EXTRACTED]
  app/api/engage/route.ts → lib/engagement.ts
- `GET()` --calls--> `getAllStories()`  [EXTRACTED]
  app/api/recent/route.ts → lib/news.ts
- `generateMetadata()` --calls--> `resolveStory()`  [EXTRACTED]
  app/article/[id]/page.tsx → lib/article.ts
- `ArticlePage()` --calls--> `resolveStory()`  [EXTRACTED]
  app/article/[id]/page.tsx → lib/article.ts

## Import Cycles
- None detected.

## Communities (29 total, 14 thin omitted)

### Community 0 - "Home, Search & Engagement API"
Cohesion: 0.07
Nodes (43): POST(), Home(), metadata, SearchPage(), Inner, categorize(), CITIES, City (+35 more)

### Community 1 - "For You & Recommendations"
Cohesion: 0.11
Nodes (26): ArticlePage(), metadata, RecCard(), CategoryCard(), PopularCard(), RANK_BADGE, RankRow(), ArticleCard() (+18 more)

### Community 2 - "About & Account Pages"
Cohesion: 0.10
Nodes (17): metadata, PRINCIPLES, metadata, metadata, AttributedStory, Follow, FollowingHub(), LocationCard (+9 more)

### Community 3 - "Account Stats & Recent API"
Cohesion: 0.11
Nodes (23): AccountPage(), computeStreak(), GET(), Item, FollowingPage(), relative(), ForYouPage(), HistoryPage() (+15 more)

### Community 4 - "Package Dependencies"
Cohesion: 0.06
Nodes (32): dependencies, @anthropic-ai/sdk, cesium, @extractus/article-extractor, next, react, react-dom, react-globe.gl (+24 more)

### Community 5 - "Category Pages"
Cohesion: 0.10
Nodes (16): CategoryPage(), generateMetadata(), VALID, metadata, Row, metadata, SearchResults(), Sort (+8 more)

### Community 6 - "Article Reading Experience"
Cohesion: 0.12
Nodes (17): generateMetadata(), ReadSourceButton(), SaveButton(), SaveStory, ShareButton(), ViewPing(), ArticleSummary, cache (+9 more)

### Community 7 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Popular Leaderboard"
Cohesion: 0.22
Nodes (14): metadata, PopularPage(), RANK_BADGE, WINDOWS, RankInfo(), EngagementKind, getPopularity(), getWindowPopularity() (+6 more)

### Community 9 - "Root Layout & Fonts"
Cohesion: 0.28
Nodes (5): fraunces, inter, metadata, LINKS, SiteFooter()

### Community 10 - "Project Docs"
Cohesion: 0.33
Nodes (7): Next.js Agent Rules (breaking-changes notice for AI agents), CLAUDE.md Pointer to AGENTS.md, create-next-app Bootstrapper, Geist Font Family, GlobeNews Project README (stock create-next-app), Next.js Framework, Vercel Deployment Platform

## Knowledge Gaps
- **114 isolated node(s):** `metadata`, `PRINCIPLES`, `metadata`, `Item`, `metadata` (+109 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `timeAgo()` connect `For You & Recommendations` to `About & Account Pages`, `Account Stats & Recent API`, `Category Pages`, `Article Reading Experience`, `Popular Leaderboard`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `getAllStories()` connect `Popular Leaderboard` to `Home, Search & Engagement API`, `For You & Recommendations`, `About & Account Pages`, `Account Stats & Recent API`, `Category Pages`, `Article Reading Experience`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `getUser` connect `Account Stats & Recent API` to `For You & Recommendations`, `About & Account Pages`, `Category Pages`, `Article Reading Experience`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `metadata`, `PRINCIPLES`, `metadata` to the rest of the system?**
  _114 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Home, Search & Engagement API` be split into smaller, more focused modules?**
  _Cohesion score 0.07003367003367003 - nodes in this community are weakly interconnected._
- **Should `For You & Recommendations` be split into smaller, more focused modules?**
  _Cohesion score 0.10853658536585366 - nodes in this community are weakly interconnected._
- **Should `About & Account Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.0957983193277311 - nodes in this community are weakly interconnected._