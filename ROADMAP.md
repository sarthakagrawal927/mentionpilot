# MentionPilot — Prioritized Roadmap

Every feature ranked by impact, effort, and build order. We build everything — this is the sequence.

---

## Phase 1: Core Platform + Instant Value (Sprint 1-2)

The foundation. Get a working product with a free lead magnet that drives organic traffic from day one.

### P1.1 — Project Scaffolding
- **Priority:** 1
- **Effort:** S
- Monorepo setup (pnpm workspaces)
- Next.js 15 dashboard app
- Cloudflare Workers API (Hono)
- D1 database + migrations
- Auth.js with Google OAuth
- Tailwind + shadcn/ui
- CI/CD (GitHub Actions → Cloudflare + Vercel)

### P1.2 — AI Mention Check (Core)
- **Priority:** 2
- **Effort:** M
- Brand config (name, aliases, URL, competitors)
- BYOK API key management (OpenAI, Anthropic, Google, Perplexity)
- Prompt management (CRUD, max 20/project)
- On-demand check execution (query all platforms in parallel)
- Response analysis (mention detection, position, sentiment, citations, competitor detection)
- Results dashboard (per-prompt × per-platform matrix, expandable responses)
- Check history with mention rate
- *Note: Port and expand from SaaS Maker's implementation*

### P1.3 — Free Instant AI Brand Check (Lead Magnet)
- **Priority:** 3
- **Effort:** M
- Public page: paste your domain, no signup
- Auto-generate 5 prompts from domain content (crawl homepage, extract product info)
- Run against 2 platforms (we eat the cost — pennies per check)
- Show results immediately: mentioned or not, sentiment, position, competitors
- CTA: "Want to track this over time? Sign up."
- SEO-optimized landing page targeting "AI brand check", "does ChatGPT know my brand"
- *This is the #1 market gap — nobody offers instant gratification*

### P1.4 — Auto-Prompt Suggestion
- **Priority:** 4
- **Effort:** M
- Crawl user's brand URL
- Extract: product name, category, features, competitors mentioned on site
- Generate 10-15 relevant prompts automatically
- User accepts/rejects with one click (Peec AI's most praised UX feature)
- Prompt templates by SaaS category as fallback

### P1.5 — Scheduled Checks (Cron)
- **Priority:** 5
- **Effort:** S
- Daily or weekly automated checks (user configurable)
- Cloudflare Workers Cron Triggers
- Still BYOK — user's keys, user's cost (~$0.03/check)
- Email notification on completion

---

## Phase 2: Trends + Competitive Intelligence (Sprint 3)

Make repeat usage meaningful. This is where users start paying.

### P2.1 — Trend Dashboard
- **Priority:** 6
- **Effort:** M
- Line charts: mention rate over time, per-platform
- Sentiment trend (positive/neutral/negative over time)
- Position trend (average position in AI-generated lists)
- Citation rate trend
- Date range selector (7d, 30d, 90d)

### P2.2 — Share of Voice
- **Priority:** 7
- **Effort:** S
- Your mention rate vs each competitor's rate across same prompts
- Bar chart: "You: 30%, Competitor A: 65%, Competitor B: 45%"
- Platform breakdown (you win on Perplexity, lose on ChatGPT)
- Trend over time

### P2.3 — Competitor Deep Dive
- **Priority:** 8
- **Effort:** M
- Per-competitor report: which platforms mention them, position, sentiment, cited URLs
- "Competitor X gets mentioned by Perplexity 80% of the time because they cite [URL]"
- Identify what competitors are doing that you aren't
- Actionable insights

### P2.4 — Email/Slack Alerts
- **Priority:** 9
- **Effort:** S
- Configurable thresholds: "Alert me if mention rate drops below X%"
- Competitor overtake alerts: "Competitor X now outranks you on ChatGPT"
- Weekly summary email (mention rate, changes, top findings)
- Slack webhook integration

### P2.5 — Weekly AI Visibility Report
- **Priority:** 10
- **Effort:** M
- Automated weekly summary (email + in-app)
- Mention rate change, new competitors, best/worst prompts, top citations
- PDF export option
- White-labelable for agencies (future)

---

## Phase 3: GEO Optimization Tools (Sprint 4)

Help users IMPROVE their visibility, not just measure it. This is where the real value is.

### P3.1 — GEO Score Checker
- **Priority:** 11
- **Effort:** M
- Paste a URL → get scores across:
  - Authority (sources cited, statistics, expert quotes)
  - Readability (headings, summary blocks, FAQ format, paragraph length)
  - Structure (schema markup, modular content, semantic HTML)
- Overall GEO score 0-100
- Specific recommendations: "Add FAQ schema", "Include statistics", "Add summary block"
- Also exposed as free public tool (lead magnet, like Frase)

### P3.2 — AI Crawlability Checker
- **Priority:** 12
- **Effort:** S
- Check if GPTBot, ClaudeBot, PerplexityBot, Google-Extended can access user's site
- Parse robots.txt for AI bot rules
- Check meta tags (noai, noimageai)
- Attempt fetch with each bot's User-Agent
- Report: "GPTBot: Blocked, ClaudeBot: Allowed, PerplexityBot: Allowed"
- Fix recommendations
- Also exposed as free public tool

### P3.3 — Schema Markup Analyzer
- **Priority:** 13
- **Effort:** S
- Scan user's pages for existing schema markup
- Report what's present vs what's missing
- 71% of ChatGPT-cited pages use schema — this is critical
- Recommend: FAQPage, HowTo, SoftwareApplication, Organization, Product
- Generate schema markup snippets user can copy-paste

### P3.4 — llms.txt Generator
- **Priority:** 14
- **Effort:** S
- Crawl user's site
- Auto-generate llms.txt (emerging standard for AI crawlers)
- User reviews/edits
- Instructions for deployment
- Monitor if AI bots are accessing it

### P3.5 — Content Gap Analysis
- **Priority:** 15
- **Effort:** L
- Compare what AI says about competitors vs user
- Identify topics where competitors appear but user doesn't
- "Competitor X gets mentioned for [topic] — you have no content about this"
- Prioritized list of content to create
- This is Gauge's $599/mo feature — we do a simpler version

---

## Phase 4: AXP Shadow Site (Sprint 5)

The Scrunch killer. This is the most technically ambitious feature and the biggest differentiator.

### P4.1 — Site Crawler + AI-Optimized Version Generator
- **Priority:** 16
- **Effort:** L
- Crawl user's entire site (respect robots.txt, max pages configurable)
- Extract: product info, features, pricing, FAQs, testimonials, comparisons
- Generate AI-optimized version of each page:
  - Strip navigation, footers, JS, CSS, ads, sidebars
  - Restructure as clean markdown with clear sections
  - Include key facts, stats, quotes
  - Reduce token count by 90%+
- User reviews/edits the generated content in dashboard
- Version control (track changes over time)

### P4.2 — Cloudflare Worker Middleware (AXP Deploy)
- **Priority:** 17
- **Effort:** L
- One-click deploy: user connects their Cloudflare account
- Worker sits in front of their site
- Detects AI bot User-Agents (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, cohere-ai, etc.)
- AI bot → serve optimized version from our API
- Human → pass through to normal site
- Dashboard shows: which bots are visiting, frequency, pages hit

### P4.3 — Vercel Middleware Alternative
- **Priority:** 18
- **Effort:** M
- Same concept but for Vercel users
- Edge middleware that intercepts AI bot requests
- Serve optimized content from our API
- One-click integration via Vercel marketplace (stretch)

### P4.4 — AXP Analytics Dashboard
- **Priority:** 19
- **Effort:** M
- AI crawler visit logs (which bot, when, which page)
- Bot validation (verify against official IP ranges, filter spoofers)
- Before/after comparison (mention rate change after AXP deployment)
- Token reduction metrics ("Your site went from 124K tokens to 1.2K")

---

## Phase 5: Multi-Source Monitoring (Sprint 6)

Expand beyond AI to social platforms. Read-only, no posting — all legitimate.

### P5.1 — Hacker News Monitoring
- **Priority:** 20
- **Effort:** S
- HN has a fully open, free, public API (no auth required)
- Monitor brand + competitor mentions in posts and comments
- Real-time alerts (email, Slack)
- Sentiment analysis on mentions
- Zero cost, zero gray area

### P5.2 — Reddit Monitoring (Official API, Read-Only)
- **Priority:** 21
- **Effort:** M
- Reddit API (free for non-commercial read-only at 100 RPM)
- Monitor brand mentions across specified subreddits
- Keyword alerts with filtering (boolean operators, exclude terms)
- Sentiment analysis
- Read-only — never post, comment, or interact
- Fills the GummySearch vacuum for read-only monitoring

### P5.3 — Product Hunt Monitoring
- **Priority:** 22
- **Effort:** S
- Track when competitors launch/get discussed on PH
- Alert: "Competitor X just launched on Product Hunt"
- Monitor comments mentioning user's brand

### P5.4 — Unified Social Feed
- **Priority:** 23
- **Effort:** M
- Aggregate mentions from AI responses, HN, Reddit, PH into single feed
- Filter by source, sentiment, date
- The gap nobody fills: "AI + Social in one place"
- Currently costs 2+ subscriptions ($100-300/mo) elsewhere

---

## Phase 6: Intelligence + Insights (Sprint 7)

Higher-value analysis on top of all collected data.

### P6.1 — Citation Source Analysis
- **Priority:** 24
- **Effort:** M
- Track which domains AI cites most in user's category
- "AI cites Wikipedia 40%, G2 25%, Reddit 20%, your site 3%"
- Tells users WHERE to focus content/PR efforts
- Trend over time (are you getting cited more?)

### P6.2 — Prompt Discovery
- **Priority:** 25
- **Effort:** L
- Analyze user's product to reverse-engineer likely user prompts
- "Based on your category, these are the top 50 prompts people ask AI"
- More sophisticated than templates — personalized to their product
- Optional: use AI to generate prompt variations

### P6.3 — AI Visibility Score (Composite)
- **Priority:** 26
- **Effort:** M
- Single 0-100 score combining: mention rate, sentiment, position, citation rate, competitor comparison
- Easy to understand, easy to track, easy to share
- "Your AI Visibility Score: 42/100"
- Benchmarked against category average

---

## Phase 7: Growth + Programmatic SEO (Sprint 8)

These drive organic traffic and user acquisition.

### P7.1 — Public AI Visibility Leaderboards
- **Priority:** 27
- **Effort:** M
- Auto-generated pages: "Top 10 Most AI-Visible CRM Tools"
- One page per SaaS category (100+ categories)
- Updated weekly from our check data
- Brands that rank well share it; brands that don't investigate (and sign up)
- Each page is a separate SEO entry point

### P7.2 — "Best [Category] Tools According to AI" Pages
- **Priority:** 28
- **Effort:** M
- Run prompts like "What's the best CRM?" across all platforms
- Publish aggregated results publicly, updated weekly
- Rank for "[category] tool" searches
- Include "Check your own brand" CTA

### P7.3 — Self-Ranking Listicles + Comparison Pages
- **Priority:** 29
- **Effort:** S
- Blog: "Best AI Visibility Tools 2026" (rank ourselves #1, like every competitor does)
- Comparison pages: "MentionPilot vs Otterly", "MentionPilot vs Gauge"
- Alternative pages: "Scrunch AI Alternative", "Gauge Alternative"
- Target high-intent search terms

### P7.4 — Free Tools Hub
- **Priority:** 30
- **Effort:** S
- Landing page aggregating all free tools:
  - AI Brand Check (P1.3)
  - GEO Score Checker (P3.1)
  - AI Crawlability Checker (P3.2)
  - Schema Analyzer (P3.3)
- Each tool is a separate SEO entry point
- CatchIntent proves this works — they have 4 free tools driving organic traffic

---

## Phase 8: Agency + Pro Features (Sprint 9+)

Expansion once core product is stable and growing.

### P8.1 — White-Label Reports
- **Priority:** 31
- **Effort:** M
- Custom-branded PDF reports for agencies
- Upload logo, customize colors
- Scheduled delivery to agency's clients
- Agency pricing tier

### P8.2 — API Access
- **Priority:** 32
- **Effort:** M
- REST API for all monitoring data
- Webhook integrations
- For power users and integrations

### P8.3 — Team Management
- **Priority:** 33
- **Effort:** M
- Multiple users per account
- Role-based access (admin, viewer)
- Shared projects

### P8.4 — Multi-Brand Management
- **Priority:** 34
- **Effort:** S
- Manage multiple brands from one account
- Agency-friendly: one dashboard, many clients
- Per-brand billing

---

## Summary — Build Order

| # | Feature | Effort | Phase |
|---|---------|--------|-------|
| 1 | Project Scaffolding | S | 1 |
| 2 | AI Mention Check (Core) | M | 1 |
| 3 | Free Instant AI Brand Check | M | 1 |
| 4 | Auto-Prompt Suggestion | M | 1 |
| 5 | Scheduled Checks (Cron) | S | 1 |
| 6 | Trend Dashboard | M | 2 |
| 7 | Share of Voice | S | 2 |
| 8 | Competitor Deep Dive | M | 2 |
| 9 | Email/Slack Alerts | S | 2 |
| 10 | Weekly Visibility Report | M | 2 |
| 11 | GEO Score Checker | M | 3 |
| 12 | AI Crawlability Checker | S | 3 |
| 13 | Schema Markup Analyzer | S | 3 |
| 14 | llms.txt Generator | S | 3 |
| 15 | Content Gap Analysis | L | 3 |
| 16 | AXP Site Crawler + Generator | L | 4 |
| 17 | AXP Cloudflare Worker Deploy | L | 4 |
| 18 | AXP Vercel Middleware | M | 4 |
| 19 | AXP Analytics Dashboard | M | 4 |
| 20 | Hacker News Monitoring | S | 5 |
| 21 | Reddit Monitoring | M | 5 |
| 22 | Product Hunt Monitoring | S | 5 |
| 23 | Unified Social Feed | M | 5 |
| 24 | Citation Source Analysis | M | 6 |
| 25 | Prompt Discovery | L | 6 |
| 26 | AI Visibility Score | M | 6 |
| 27 | Public Leaderboards | M | 7 |
| 28 | "Best Tools According to AI" Pages | M | 7 |
| 29 | Listicles + Comparison Pages | S | 7 |
| 30 | Free Tools Hub | S | 7 |
| 31 | White-Label Reports | M | 8 |
| 32 | API Access | M | 8 |
| 33 | Team Management | M | 8 |
| 34 | Multi-Brand Management | S | 8 |

**Effort key:** S = 1-2 days, M = 3-5 days, L = 1-2 weeks
