# MentionPilot — Handover Document

## What Is This

MentionPilot is a standalone AI visibility monitoring platform for startups. It helps users track if AI assistants (ChatGPT, Claude, Gemini, Perplexity) recommend their product, optimize content for AI citation, monitor social mentions, and submit to directories.

**Live URLs:**
- Web: https://mentionpilot-web.pages.dev
- API: https://mentionpilot-api.sarthakagrawal927.workers.dev
- Health check: https://mentionpilot-api.sarthakagrawal927.workers.dev/health

**Origin:** Spun off from SaaS Maker (https://github.com/sarthakagrawal927/saas-maker). SaaS Maker retains a basic AI Mention Check feature with a cross-link to MentionPilot.

---

## Architecture

```
mentionpilot/
├── apps/web/                          # Next.js 15 (Vercel)
│   ├── src/app/                       # Pages (12 total)
│   │   ├── page.tsx                   # Landing page (feature-rich)
│   │   ├── check/page.tsx             # Free AI Brand Check (public, no auth)
│   │   ├── tools/page.tsx             # Free Tools Hub
│   │   ├── login/page.tsx             # Google OAuth login
│   │   └── (dashboard)/
│   │       ├── layout.tsx             # Auth guard + sidebar + user menu
│   │       └── dashboard/
│   │           ├── page.tsx           # AI Visibility Score + prompt suggestions
│   │           ├── mentions/          # Brand config, prompts, run check, results
│   │           ├── analytics/         # Trends, SoV, platforms, sentiment, citations
│   │           ├── axp/              # AXP Shadow Site management
│   │           ├── geo/              # GEO score, crawlability, schema, llms.txt
│   │           ├── social/           # Unified feed (HN + Reddit + PH)
│   │           ├── directories/      # 87 directories + submission tracker
│   │           └── settings/         # Schedule, alerts, danger zone
│   ├── src/lib/
│   │   ├── auth.ts                   # Auth.js config (Google OAuth → API token)
│   │   ├── api.ts                    # Server-side fetch helper
│   │   ├── api-client.ts            # Client-side fetch with auto-token
│   │   └── utils.ts                 # cn() utility
│   ├── src/components/ui/           # shadcn: button, card, input, label, badge, separator
│   └── e2e/                         # 7 Playwright test files (16 tests)
│
├── workers/api/                      # Cloudflare Workers (Hono)
│   ├── src/
│   │   ├── index.ts                 # App + cron handler (40+ routes)
│   │   ├── db.ts                    # D1 database methods (~40 methods)
│   │   ├── types.ts                 # Bindings + Variables
│   │   ├── middleware/auth.ts       # Session auth + project ownership
│   │   ├── routes/
│   │   │   ├── auth.ts             # /v1/auth — callback, me, logout
│   │   │   ├── brands.ts           # /v1/brands — config CRUD + schedule
│   │   │   ├── prompts.ts          # /v1/prompts — CRUD (max 20)
│   │   │   ├── checks.ts           # /v1/checks — trigger, list, detail, dashboard
│   │   │   ├── free-check.ts       # /v1/free-check — public, rate limited by IP
│   │   │   ├── analytics.ts        # /v1/analytics — trends, SoV, sentiment, citations, visibility score, prompt discovery
│   │   │   ├── geo.ts             # /v1/geo — GEO score, crawlability, schema, llms.txt (public)
│   │   │   ├── social.ts          # /v1/social — HN, Reddit, PH, unified feed
│   │   │   ├── axp.ts             # /v1/axp — crawl, pages CRUD, serve, log, middleware code gen
│   │   │   ├── directories.ts     # /v1/directories — list, status, submit, auto-fill
│   │   │   ├── public.ts          # /v1/public — leaderboards, categories (SEO)
│   │   │   ├── reports.ts         # /v1/reports — report generation
│   │   │   ├── api-keys.ts        # /v1/api-keys — placeholder
│   │   │   └── teams.ts           # /v1/teams — placeholder
│   │   └── lib/
│   │       ├── ai-engine.ts        # 4-platform query engine + response analysis
│   │       ├── site-crawler.ts     # Domain crawl + auto-prompt generation
│   │       ├── geo-tools.ts        # GEO score, crawlability, schema, llms.txt
│   │       ├── axp-crawler.ts      # Multi-page crawler + AI content optimizer
│   │       ├── hn-monitor.ts       # Hacker News Algolia API
│   │       ├── reddit-monitor.ts   # Reddit public JSON API
│   │       ├── ph-monitor.ts       # Product Hunt via HN crosspost
│   │       ├── prompt-discovery.ts # AI-powered prompt suggestion
│   │       └── directory-database.ts # 87 curated directories
│   ├── src/__tests__/              # 5 Vitest test files (36 tests)
│   └── wrangler.toml               # D1 binding, cron trigger
│
├── packages/
│   ├── shared/src/index.ts         # All TypeScript types
│   └── db/migrations/              # 8 SQL migrations
│       ├── 0001_initial.sql        # users, sessions, projects, brand_configs, prompts, checks, results
│       ├── 0002_free_checks.sql    # free_checks table
│       ├── 0003_scheduled_checks.sql # ALTER projects ADD check_schedule, last_scheduled_check
│       ├── 0004_axp.sql            # axp_pages, axp_bot_visits, axp_configs
│       ├── 0005_directory_submissions.sql # directory_submissions
│       ├── 0006_badge.sql          # badge widget config
│       ├── 0007_unified_ai_config.sql # unified AI provider config
│       └── 0008_api_keys.sql       # API keys table (P8.2)
│
├── docs/research/                  # 4 industry research reports
├── plans/                          # Archived roadmap versions
├── ROADMAP.md                      # 34 features across 9 phases (all implemented)
└── agents.md                       # AI agent context
```

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui |
| API | Cloudflare Workers, Hono framework |
| Database | Cloudflare D1 (SQLite) + Drizzle |
| Auth | better-auth with Google OAuth (web proxies to API session) |
| Testing | Vitest (unit), Playwright (e2e) |
| Deployment | Cloudflare Pages (web, OpenNext bundle), Cloudflare Workers (API) |
| Package Manager | pnpm with workspaces |

---

## Database

**D1 Database:** `mentionpilot-db`
**Database ID:** `628e1584-aa4a-4181-96ad-3fd234c88498`
**Region:** WNAM (West North America)
**Cloudflare Account:** `7d048325699a5acddb44d3be31cf6ba9`

### Tables

| Table | Purpose |
|-------|---------|
| `users` | Auth users (id, email, name, avatar_url) |
| `sessions` | Session tokens (token_hash → user_id) |
| `projects` | Brand monitoring projects (name, slug, check_schedule) |
| `brand_configs` | Brand details + BYOK API keys (one per project) |
| `prompts` | Saved check prompts (max 20/project) |
| `checks` | Check runs (status, mention_rate, summary) |
| `results` | Per-prompt × per-platform results (mentions, sentiment, position, citations) |
| `free_checks` | Public free brand checks (IP rate-limited) |
| `axp_pages` | AI-optimized page versions for AXP |
| `axp_bot_visits` | Bot visit logs (which AI bot, when, which page) |
| `axp_configs` | AXP deploy configuration (origin URL, deploy key) |
| `directory_submissions` | Submission tracker (directory_slug, status, notes) |

All migrations applied. Booleans stored as 0/1 integers, JSON as TEXT, timestamps as TEXT (ISO 8601).

---

## Environment Variables

### Cloudflare Pages (apps/web)

| Variable | Description | Status |
|----------|-------------|--------|
| `NEXT_PUBLIC_API_URL` | API base URL | Set: `https://mentionpilot-api.sarthakagrawal927.workers.dev` |
| `BETTER_AUTH_SECRET` | better-auth secret | **NOT SET — generate via `openssl rand -base64 32`** |
| `BETTER_AUTH_URL` | Public URL of the web app | **NOT SET — set to `https://mentionpilot-web.pages.dev`** |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | **NOT SET — needs Google Cloud Console setup** |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | **NOT SET — needs Google Cloud Console setup** |

### Cloudflare Workers (workers/api)

| Variable | Description | Status |
|----------|-------------|--------|
| `DB` | D1 database binding | Set via wrangler.toml |
| `ENVIRONMENT` | Environment name | Set: `production` |
| `OPENAI_API_KEY` | For free brand checks (our cost) | **NOT SET — set in CF dashboard** |
| `GOOGLE_API_KEY` | For free brand checks (our cost) | **NOT SET — set in CF dashboard** |

---

## Auth Setup (Incomplete)

Google OAuth is coded but credentials aren't configured yet. To complete:

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URI: `https://mentionpilot-web.pages.dev/api/auth/callback/google`
4. Set on Cloudflare Pages (Project Settings → Environment Variables):
   - `AUTH_GOOGLE_ID` = Client ID
   - `AUTH_GOOGLE_SECRET` = Client Secret
   - `BETTER_AUTH_SECRET` = output of `openssl rand -base64 32`
   - `BETTER_AUTH_URL` = `https://mentionpilot-web.pages.dev`
5. Redeploy: push to main triggers `.github/workflows/deploy-web.yml`.

Auth flow: Google OAuth → better-auth handler at `/api/auth/[...all]` → session created → web calls API `POST /v1/auth/callback` to mint API token → client fetches token from `/api/token`.

---

## API Endpoints Reference

### Public (no auth)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| POST | `/v1/free-check` | Trigger free brand check (rate limited 3/hr/IP) |
| GET | `/v1/free-check/:id` | Poll free check results |
| POST | `/v1/geo/geo-score` | GEO score analysis |
| POST | `/v1/geo/crawlability` | AI bot crawlability check |
| POST | `/v1/geo/schema` | Schema markup analysis |
| POST | `/v1/geo/llms-txt` | llms.txt generator |
| GET | `/v1/public/leaderboard/:category` | SEO leaderboard page |
| GET | `/v1/public/categories` | List categories |
| GET | `/v1/directories/list` | List all 87 directories |
| GET | `/v1/directories/categories` | Directory categories |

### AXP Serve (deploy-key auth)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/axp/serve/:projectId?path=&key=` | Serve optimized content to AI bots |
| POST | `/v1/axp/serve/:projectId/log` | Log bot visit |

### Authenticated (session token)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/auth/callback` | Create user + session from OAuth |
| GET | `/v1/auth/me` | Get current user |
| POST | `/v1/auth/logout` | Destroy session |
| GET/POST/DELETE | `/v1/brands/:pid/config` | Brand config CRUD |
| PATCH | `/v1/brands/:pid/schedule` | Set check schedule (daily/weekly/null) |
| GET/POST | `/v1/prompts/:pid` | Prompt CRUD |
| DELETE | `/v1/prompts/:pid/:id` | Delete prompt |
| POST | `/v1/checks/:pid` | Trigger check |
| GET | `/v1/checks/:pid` | List checks |
| GET | `/v1/checks/:pid/dashboard` | Dashboard aggregate |
| GET | `/v1/checks/:pid/:checkId` | Check detail + results |
| GET | `/v1/analytics/:pid/trends` | Mention rate history |
| GET | `/v1/analytics/:pid/share-of-voice` | Brand vs competitors |
| GET | `/v1/analytics/:pid/platform-breakdown` | Per-platform rates |
| GET | `/v1/analytics/:pid/sentiment-breakdown` | Positive/neutral/negative |
| GET | `/v1/analytics/:pid/citations` | Top cited domains |
| GET | `/v1/analytics/:pid/citation-analysis` | Deep citation analysis |
| GET | `/v1/analytics/:pid/discover-prompts` | AI prompt suggestions |
| GET | `/v1/analytics/:pid/visibility-score` | Composite 0-100 score |
| GET | `/v1/social/:pid/hn` | HN brand mentions |
| GET | `/v1/social/:pid/hn/competitors` | HN competitor mentions |
| GET | `/v1/social/:pid/reddit` | Reddit mentions |
| GET | `/v1/social/:pid/producthunt` | PH mentions |
| GET | `/v1/social/:pid/feed` | Unified feed (all sources) |
| POST | `/v1/axp/:pid/crawl` | Trigger site crawl |
| GET | `/v1/axp/:pid/pages` | List optimized pages |
| GET/PUT/DELETE | `/v1/axp/:pid/pages/:pageId` | Page content CRUD |
| GET | `/v1/axp/:pid/stats` | Token savings stats |
| GET | `/v1/axp/:pid/analytics` | Bot visit analytics |
| POST/GET | `/v1/axp/:pid/config` | AXP deploy config |
| GET | `/v1/axp/:pid/middleware-code` | Generated middleware code |
| GET | `/v1/directories/:pid/status` | All directories + submission status |
| POST | `/v1/directories/:pid/submit` | Mark directory as submitted |
| DELETE | `/v1/directories/:pid/submit/:slug` | Remove submission |
| GET | `/v1/directories/:pid/auto-fill` | Pre-filled submission data |
| POST | `/v1/reports/:pid/generate` | Generate JSON report |

---

## Tests

### Unit Tests (Vitest) — 36/36 passing

```bash
cd workers/api && pnpm test
```

Files:
- `ai-engine.test.ts` — 13 tests (mention detection, position, sentiment, competitors, citations)
- `geo-tools.test.ts` — 7 tests (GEO score, schema analysis, llms.txt generation)
- `site-crawler.test.ts` — 4 tests (prompt generation from site info)
- `prompt-discovery.test.ts` — 4 tests (prompt suggestion logic)
- `axp-crawler.test.ts` — 8 tests (page optimization, token estimation)

### E2E Tests (Playwright) — 16/16 passing

```bash
cd apps/web && pnpm test:e2e
```

Files:
- `landing.spec.ts` — 3 tests (title, tagline, CTA)
- `free-check.spec.ts` — 2 tests (page load, no-signup message)
- `dashboard.spec.ts` — 2 tests (home load, sidebar links)
- `mentions.spec.ts` — 3 tests (config form, loading state, run button)
- `geo.spec.ts` — 1 test (page load)
- `tools.spec.ts` — 3 tests (tools hub, 4 tools visible, CTA)
- `navigation.spec.ts` — 2 tests (landing→dashboard, sidebar navigation)

---

## Deploy Commands

```bash
# API (Cloudflare Workers)
cd workers/api && pnpm deploy   # wrangler deploy

# Web (Cloudflare Pages) — push to main triggers .github/workflows/deploy-web.yml
# Manual deploy:
cd apps/web
pnpm cf:build                    # opennextjs-cloudflare build → apps/web/.open-next
wrangler deploy --dry-run --outdir .cf-pages-bundle
mkdir -p .cf-pages-out
cp -r .open-next/assets/. .cf-pages-out/
cp .cf-pages-bundle/worker.js .cf-pages-out/_worker.js
wrangler pages deploy .cf-pages-out --project-name=mentionpilot-web --branch=main

# D1 migrations
cd workers/api && wrangler d1 migrations apply mentionpilot-db --remote
```

---

## Key Design Decisions

1. **BYOK (Bring Your Own Keys)** — Users provide their own LLM API keys. Zero cost to us for user checks. Free brand checks use our keys (OPENAI_API_KEY, GOOGLE_API_KEY env vars).

2. **Static export removed** — Was `output: "export"` in next.config.ts, removed to support server-side auth routes. Web now ships as an OpenNext Cloudflare worker bundle deployed to Pages.

3. **Session auth via API** — better-auth handles Google OAuth on the frontend at `/api/auth/[...all]`. On sign-in, the web calls our API's `/v1/auth/callback` which creates the user + session. The API token is stored in the better-auth session and exposed via `/api/token` for client-side API calls.

4. **AXP middleware is user-deployed** — We generate the code (Cloudflare Worker or Vercel middleware), user copies it to their project. Middleware calls our API's `/v1/axp/serve/:projectId` to get optimized content, authenticated by a deploy key.

5. **Reddit uses public JSON endpoints** — No auth needed, but rate limited. Reddit's `.json` suffix on any URL returns JSON. Gracefully handles 429 rate limits.

6. **Prompt discovery is heuristic, not AI** — The prompt suggestion engine uses category detection, feature extraction, and competitor names — no LLM call needed. Fast and free.

7. **87 directories are hardcoded** — In `directory-database.ts`, not in D1. Submission status is tracked in D1 per project.

---

## What's Not Done / Known Issues

1. **Google OAuth not configured** — Needs credentials from Google Cloud Console + env vars on Cloudflare Pages.
2. **Free brand check API keys not set** — OPENAI_API_KEY and GOOGLE_API_KEY need to be set in Cloudflare Workers dashboard for the public free check to work.
3. **Teams + multi-brand are placeholders** — Routes exist but are stubs.
4. **No email/Slack alert system** — Settings page has the UI but no backend implementation.
5. **Leaderboard data is empty** — `/v1/public/leaderboard/:category` returns structure but no real rankings (needs aggregated check data).
6. **Content Gap Analysis (P3.5)** — Listed in roadmap but not implemented.
7. **better-auth uses memoryAdapter** — Per `apps/web/src/lib/auth.ts`, the in-memory adapter resets on worker restart. The web frontend treats the API as the source of truth for sessions, so this is intentional but limits any auth state living only on the web.

---

## Competitive Context

Research reports in `docs/research/`:
- `ai-brand-monitoring-industry-report.md` — 25+ tools mapped, pricing, features
- `reddit-monitoring-tools-deep-dive.md` — GummySearch shutdown, Reddit API situation, tool deep dives
- `seo-analysis-ai-visibility-tools.md` — SEO strategies of competitors
- `ai-visibility-tools-deep-dive.md` — Technical deep dives on Otterly, Gauge, Peec, Scrunch, etc.

Key competitors: Peec AI ($103+/mo), Gauge ($100-599/mo), Otterly ($29+/mo), Scrunch ($250+/mo). MentionPilot differentiates on: free tier, BYOK model, combined AI + social monitoring, AXP at startup pricing, 87-directory submission tracker.

---

## Quick Start (Local Dev)

```bash
pnpm install
pnpm dev:api   # starts Cloudflare Workers at localhost:8787
pnpm dev:web   # starts Next.js at localhost:3000
```

For tests:
```bash
pnpm --filter @mentionpilot/api test        # 36 unit tests
cd apps/web && pnpm test:e2e                 # 16 e2e tests
```
