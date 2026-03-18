# AI Visibility Monitoring Tools: Exhaustive Deep-Dive Research

**Date:** 2026-03-17
**Purpose:** Understand what every major AI visibility tool actually does -- exact workflows, features, UX, technical approach -- to inform product decisions.

---

## Table of Contents

1. [Otterly.AI](#1-otterlyai)
2. [Gauge](#2-gauge)
3. [Peec AI](#3-peec-ai)
4. [Profound](#4-profound)
5. [Scrunch AI](#5-scrunch-ai)
6. [Trakkr](#6-trakkr)
7. [Nightwatch](#7-nightwatch)
8. [Frase](#8-frase)
9. [GEO (Generative Engine Optimization) Discipline](#9-geo-discipline)
10. [Gaming AI Mentions -- Tactics and Techniques](#10-gaming-ai-mentions)
11. [Cross-Tool Comparison Matrix](#11-cross-tool-comparison-matrix)
12. [Key Takeaways for Product Building](#12-key-takeaways)

---

## 1. Otterly.AI

**URL:** otterly.ai
**Founded:** ~2024 | **HQ:** Europe
**Users:** 20,000+ marketing/SEO professionals
**Recognition:** #10 on G2's 2026 Best Software Awards (Rookies of the Year), only AEO company in top 10

### Exact User Workflow

1. **Sign up** for a 14-day free trial (no credit card required)
2. **Create a workspace** -- each workspace isolates a client/brand with its own team members, reports, and audits
3. **Add search prompts** -- either manually type prompts (e.g., "best CRM for small business") or use the **AI Prompt Research Tool** to discover relevant prompts by entering keywords, brand names, or URLs
4. **Select AI engines** -- choose which platforms to track (ChatGPT, Google AI Overviews, Perplexity, MS Copilot; Google AI Mode and Gemini are paid add-ons)
5. **Select countries** -- multi-country support across 50+ countries, multi-language
6. **Wait ~5 minutes** -- reports generate quickly after adding prompts
7. **View dashboard** -- automated daily tracking begins; weekly automated reports are generated

### Dashboard Contents

The dashboard shows:

**Brand Reports:**
- **Total brand mentions** across all monitored prompts (e.g., "3,181 mentions across 410,785 prompts" for Adidas)
- **Brand coverage percentage** -- what % of tracked prompts mention the brand
- **Average brand position ranking** -- where in the AI response the brand appears
- **Share of Voice (SOV)** -- competitor comparison cards showing relative visibility
- **Brand coverage trend graph** -- time-series chart showing mentions over time (e.g., 13-day period)
- **Filtering** by timeframe, tags, AI engines, and geography

**Domain Rankings & Analytics:**
- All domains/URLs cited in AI responses, automatically tracked
- Position changes tracked weekly over time
- Link citations analysis showing which content gets referenced most

**Brand Visibility Index:**
- Industry-level visibility comparisons across brands within a sector

### Prompt Management

- **AI Prompt Research Tool** -- enter a keyword, brand name, or URL, and it suggests conversational search prompts that users actually type into AI engines
- Prompts are manually curated and added to a prompt library
- Add-on pricing: +100 extra prompts for $99/month
- Prompts are tracked daily across all selected engines

### Analysis Depth

- **Mention detection** -- binary: is brand mentioned or not
- **Position tracking** -- where in the AI response the brand is listed (1st, 2nd, etc.)
- **Citation/URL tracking** -- which specific URLs are cited as sources
- **Competitor benchmarking** -- side-by-side SOV comparison
- **No explicit sentiment analysis** in the core dashboard (the GEO audit covers content quality)

### GEO Audit Tool (25+ Factors)

The GEO audit is split into two sections:

**Crawlability Checker:**
- Server access check -- which bots are allowed/blocked at firewall level
- Robots.txt analysis -- bot permissions breakdown per crawler
- Verifies if AI bots (GPTBot, ClaudeBot, PerplexityBot, etc.) can reach content

**Content Checker (3 core metrics):**

1. **Static Content** -- identifies JavaScript-heavy pages hiding content from AI crawlers; checks whether content is static vs. dynamically generated
2. **AI Readiness** -- proprietary scoring across 13 evaluation categories:
   - Semantic Repetition (duplicate phrasing detection)
   - Summary Block (presence of concise high-level summaries)
   - Section Integrity (clear purpose, complete thoughts)
   - Modular Content Enhancements (self-contained, reusable modules)
   - External Link Suggestions (credibility-building opportunities)
   - Illustration Opportunities (where visuals would help)
   - Jargon and Metaphors (unclear/abstract language)
   - Readability (sentence structure and flow)
   - Paragraph Cohesion (logical sentence connections)
   - Tone and Language Check (audience alignment)
   - Clarity and Assertiveness (direct vs. hedging language)
   - Acronyms and Terminology (clear introduction, consistent use)
   - Specificity (concrete vs. generic statements)
3. **Structured Data** -- HTML organization, metadata quality, schema markup presence

Each category is scored 0-100%, with an overall composite readiness score. The audit provides specific actionable recommendations and can be downloaded as PDF.

**Notable finding:** Otterly dropped their llms.txt checker because their research showed it wasn't significantly impacting visibility in AI search engines.

### Reporting

- **Automated weekly reports** sent via email
- **CSV exports** for custom analysis
- **Google Looker Studio Connector** -- pulls AI search visibility metrics directly into Looker for custom dashboards
- **PDF download** of GEO audit reports
- **Unlimited brand reports** on all plans

### Technical Approach

- Uses actual LLM interfaces (not disclosed whether API or UI scraping explicitly)
- Daily monitoring frequency
- Tracks across ChatGPT, Google AI Overviews, Perplexity, MS Copilot (base), Google AI Mode and Gemini (add-ons)

### Pricing

| Plan | Price | Prompts | Engines | GEO Audits |
|------|-------|---------|---------|------------|
| Lite | $29/mo ($25 annual) | 15 | 4 base | 1,000/mo |
| Standard | $189/mo ($160 annual) | 100 | 4 base | 5,000/mo |
| Premium | $489/mo ($422 annual) | 400 | 4 base | 10,000/mo |
| Enterprise | Custom | Custom | All | Custom |

Add-ons: +100 prompts = $99/mo; Google AI Mode = $9-149/mo per plan; Google Gemini = $9-149/mo per plan.

Agency partners on Standard/Premium get 150/500 prompts respectively + unlimited workspaces + co-marketing.

### Unique Features

- **GEO Audit with 13-category AI Readiness scoring** -- most detailed on-page AI optimization audit in the market
- **Google Looker Studio connector** -- only tool with native Looker integration
- **Brand Visibility Index** -- industry-level benchmarking, not just competitor-level
- **Active experimentation program** -- they publish live GEO experiments publicly
- **Multi-language, 50+ country support** at all tiers
- **Website Citations Gap Analysis** -- identifies which competitor content gets more citations and why

### Case Studies

- 8x more AI citations in 12 months for a medical device company
- New brand went from zero authority to AI search mentions in 14 days
- Bacula Enterprise won AI search battle for HPC backup niche

---

## 2. Gauge

**URL:** withgauge.com
**Founded:** 2024 (Y Combinator S24)
**HQ:** San Francisco
**Focus:** GEO/AEO with content creation

### Exact User Workflow

1. **Sign up** -- free tier available, paid starts at $99/mo
2. **Configure prompts** -- Gauge tracks hundreds of customized prompts daily per client; prompts are created from keyword research converted into conversational AI query format
3. **Select AI platforms** -- Starter: ChatGPT only; Growth: ChatGPT, Google AIO, AI Mode, Gemini, Perplexity, Copilot; Enterprise adds Claude and Grok
4. **Monitor daily** -- prompts are run against real front-end interfaces (not APIs)
5. **Review Action Center** -- prioritized recommendations based on actual AI response patterns
6. **Use Content Engine** -- generate data-driven articles designed to earn AI citations
7. **Ask the Agentic Marketer** -- natural language Q&A about visibility data
8. **Track results** -- monitor citation pickup over time

### Dashboard Contents

- **Mention Rate** -- % of tracked AI answers mentioning the brand
- **Citation Rate** -- % of answers citing the company's website
- **Referral Traffic** -- direct traffic from AI platforms (via GA integration)
- **Competitive positioning** -- gap analysis showing where competitors appear but you don't
- **Citation Intelligence** -- which sources AI platforms reference most frequently
- **Trend analysis** -- real-time competitive benchmarking

### Prompt Management

- Prompts are configured per client, tracked daily
- Gauge converts keyword research into trackable conversational prompts
- Action Center suggests new prompts based on discovered gaps

### Analysis Depth

- **Mention detection** -- brand name presence in AI responses
- **Citation tracking** -- URL/source attribution
- **Competitive gap analysis** -- identifies prompts where competitors win
- **Source analysis** -- which external sites (Reddit, YouTube, LinkedIn, etc.) AI cites most

### Content Creation Engine

This is Gauge's standout feature. A 4-step workflow:

1. **Gap Identification** -- automatically discovers topics where competitors appear in AI but you don't
2. **Content Generation** -- AI drafts articles optimized for AI citation patterns (not just SEO), using structure, authority signals, and formats that get cited
3. **Human Review** -- team approves/edits before publishing
4. **Impact Tracking** -- monitors whether new content gets picked up by AI systems

Content is "grounded in what AI platforms are actually citing in your space, not guesswork." Starter plan: 3 articles/mo; Growth: 18; Enterprise: unlimited.

### Agentic AI Assistant ("Ask Gauge")

- Natural language interface for querying visibility data
- Ask questions like "Why are we losing to [competitor] on [topic]?" and get data-backed answers
- Eliminates need to manually interpret dashboards
- Covers organic, paid, and AI search data
- Starter plan: 100 agent chats/mo; Growth+: unlimited

### Reporting

- Export capabilities on Growth plan and above
- Google Analytics integration
- Google Search Console integration
- Slack integration for alerts
- No mention of PDF reports or Looker Studio connector

### Technical Approach

- Claims to use **real user interface data** rather than API endpoints
- This is a key differentiator: API responses can differ from what users see in ChatGPT/Gemini
- Daily monitoring frequency
- Processes 3,000-108,000+ answers per month depending on plan

### Pricing

| Plan | Price | Prompts | Engines | Articles | Agent Chats |
|------|-------|---------|---------|----------|-------------|
| Starter | $99/mo | 100 daily | ChatGPT only | 3/mo | 100/mo |
| Growth | $599/mo | 600 daily | 6 platforms | 18/mo | Unlimited |
| Enterprise | Custom | Custom | All (incl. Claude, Grok) | Unlimited | Unlimited |

### Unique Features

- **Content Creation Engine** -- only major tool that generates publication-ready articles from visibility gap data
- **Agentic AI assistant** -- conversational interface for data exploration (not just dashboards)
- **Y Combinator backed** -- signals venture trajectory and rapid iteration
- **UI scraping approach** -- claims more authentic data than API-based competitors
- **Integrated GA + GSC** -- connects AI visibility to traditional search performance

### Case Studies

- Eco: 5x AI visibility in under 4 weeks (416% boost in stablecoin search)
- Standard Metrics: 2x visibility in 2 weeks
- Vellum: 1.4% to 40.3% visibility over 7 months
- LedgerUp: 17x visibility in 1 month

---

## 3. Peec AI

**URL:** peec.ai
**Founded:** ~2024
**Users:** 1,000+ marketing teams within first months of launch

### Exact User Workflow

1. **Sign up** for a 7-day free trial (distinguishing factor -- most competitors offer 14-day)
2. **Add your brand** -- enter brand name and website URL
3. **Add competitors** -- select brands to benchmark against
4. **Select countries** -- up to 3 (Starter), 5 (Pro), 10+ (Enterprise)
5. **Review suggested prompts** -- Peec auto-generates relevant prompts based on your website content via a "Suggested" tab. Accept or reject with one click.
6. **Optionally add custom prompts** -- manually add specific queries to track
7. **View dashboard** -- daily tracking begins immediately

### Dashboard Contents

The main dashboard shows a bird's-eye view with:

- **Visibility percentage** -- % of chats that show the brand name
- **Position tracking** -- ranking among competitors in AI responses (past 7 days)
- **Sentiment analysis** -- positive, neutral, or negative brand descriptions
- **Share of Voice** -- competitive visibility comparison
- **Citation sources** -- which URLs AI references when mentioning brands
- **Citation frequency** -- how often specific sources are cited
- **Competitor comparison** -- side-by-side benchmarking
- **Time-period filtering** -- 7, 14, 30 days, or custom ranges

### Three Core Metrics

1. **Visibility** -- brand mention frequency across AI responses (market share indicator)
2. **Position** -- ranking relative to competitors within each response
3. **Sentiment** -- positive/neutral/negative tone of AI descriptions

All three are grounded in **Sources** -- the websites/content AI models reference.

### Prompt Management

- **Auto-suggested prompts** -- the "Suggested" tab generates relevant prompts based on website content analysis. This is a standout feature for reducing setup time.
- Users accept/reject suggestions with one click
- Custom prompts can be manually added
- Prompts run daily across ChatGPT, Gemini, Copilot (and reportedly Claude, Perplexity, DeepSeek)

### Analysis Depth

- **Visibility tracking** -- brand mention rate across platforms
- **Position tracking** -- competitive ranking in responses
- **Sentiment analysis** -- tone evaluation
- **Source/citation tracking** -- URL-level attribution
- **Content gap identification** -- where competitors get cited but you don't

### Technical Approach

- **UI scraping** (explicitly confirmed in their docs): "simulates real user interactions, ensuring the data we collect matches what the average user sees"
- They chose UI scraping over API access because "traditional API approaches produce different responses and sources compared to real user experiences"
- Daily monitoring frequency
- Results are probabilistic since AI responses naturally vary

### Reporting

- Time-period filtering and trend views
- Data exports available
- Looker Studio connector (Enterprise)
- API access (Enterprise)
- No PDF reports mentioned
- No scheduled email reports mentioned

### Pricing

| Plan | Price | Prompts | Countries | Features |
|------|-------|---------|-----------|----------|
| Starter | $89/mo | 25 | 3 | Unlimited seats, daily tracking |
| Pro | $199/mo | 100 | 5 | All Starter features + more |
| Enterprise | $499/mo | 300+ | 10+ | Looker, API, custom limits |

All plans include unlimited team seats.

### Unique Features

- **Auto-suggested prompts from website analysis** -- saves significant setup time vs. manual prompt creation
- **Unlimited team seats on all plans** -- unlike competitors who charge per seat
- **UI scraping approach** -- explicitly documented and positioned as more authentic
- **Clean, intuitive UX** -- reviewers consistently praise the minimal learning curve
- **7-day free trial** with prompt suggestions ready on first login

### Weaknesses

- Limited utility for unknown/new brands (need existing recognition to track)
- No retroactive historical data -- only tracks from subscription start date forward
- No integrated content creation or optimization tools
- No actionable recommendations for *how* to improve (monitoring only)
- Confusing graph visualizations with similar colors
- No mentioned SOC 2 or security certifications

---

## 4. Profound

**URL:** tryprofound.com
**Founded:** ~2024
**Positioning:** Enterprise-grade, premium platform
**Compliance:** SOC 2 Type II

### Exact User Workflow

1. **Sign up** -- Lite plan at $499/mo, or Enterprise with custom pricing
2. **Configure brand and competitors** -- define who you're tracking against
3. **Set up prompts** -- define the conversational queries to monitor (200 prompts on Lite)
4. **Install Agent Analytics** -- one-click Vercel integration, or server-side deployment via AWS, Cloudflare, Akamai, Fastly, Google Cloud, Netlify, or WordPress
5. **Monitor dashboard** -- three main modules: Answer Engine Insights, Agent Analytics, Conversation Explorer
6. **Explore Profound Index** -- free public data on industry-level AI visibility rankings

### Dashboard Contents

**Answer Engine Insights:**
- Visibility across ChatGPT, Perplexity, Gemini, Copilot, Google AI Overviews
- Each tracked prompt stored as a complete snapshot (position, prominence, cited sources)
- Share of Voice trends over time
- Platform-by-platform breakdown

**Agent Analytics Dashboard:**
- **AI Crawler Log** -- live view of every AI bot visit (GPTBot, ClaudeBot, PerplexityBot, etc.) with timestamps
- **Bot Verification** -- differentiates real AI bots from spoofed crawlers using official IP range validation
- **Content Performance** -- which pages AI models prefer, how often they're fetched
- **Human Traffic Attribution** -- visitors arriving from AI answer engine click-throughs
- **Technical Recommendations** -- HTML/rendering issues hiding content from AI crawlers
- **URL Submission** -- submit URLs directly to AI search indices for faster discovery

**Conversation Explorer:**
- Maps actual user questions/prompt clusters from AI engines
- Links inquiry patterns to visibility data
- Identifies rising topics
- Tests how linguistic variations affect inclusion rates across models

### Prompt Management

- Manual prompt configuration required
- 200 prompts on Lite, custom on Enterprise
- Users must define prompts and competitors upfront
- No auto-suggest feature mentioned

### Analysis Depth

- **Position and prominence** in each AI response
- **Citation source tracking** -- complete source attribution
- **AI crawler behavior correlation** -- connects which bots crawl which pages to which citations appear
- **Technical factors** -- renderability, schema clarity, canonical tags that influence inclusion
- **Attribution** -- estimates traffic from AI answers to specific landing pages

### Profound Index (Free Public Resource)

- Analyzes 400+ million real user conversations from double opt-in consumer panels
- 6+ million daily prompts
- Covers 12 industries (Streaming, Fast Food, Health Insurance, Semiconductors, etc.)
- Weekly updates showing brand rankings and visibility % changes per sector
- Uses 4-stage methodology: Real Conversations -> AI-Powered Filtering -> Intelligent Clustering (vector embeddings + ML) -> Ranked by Impact
- Free and publicly accessible

### Agent Analytics Technical Implementation

- **Server-side tracking** -- NOT JavaScript-based. Uses server logs to detect AI bots.
- Installs a lightweight server-side tracker that recognizes known AI user-agents
- Validates against official IP ranges to filter spoofers
- One-click Vercel integration (click Connect Account -> pick org and project -> hit Continue -> logs flow within 1 minute)
- Also integrates with AWS, Cloudflare, Akamai, Fastly, Google Cloud, Netlify, WordPress
- Captures data traditional JS-based analytics tools completely miss (bots don't execute JavaScript)

### Reporting

- All-time data history preservation (no data loss on plan changes)
- Export capabilities
- API access on higher tiers
- No Looker Studio connector mentioned
- No scheduled email reports mentioned

### Pricing

| Plan | Price | Engines | Companies | Prompts | History |
|------|-------|---------|-----------|---------|---------|
| Lite | $499/mo | 4 | 1 | 200 | All-time |
| Enterprise | Custom | All | Multiple | Custom | All-time |

### Unique Features

- **Agent Analytics with server-side bot tracking** -- the only tool that tracks actual AI crawler visits to your site at the server level, not just what AI says about you
- **Profound Index** -- free public data resource based on 400M+ real conversations, not simulated prompts
- **Conversation Explorer** -- maps real user prompt patterns, not just predetermined queries
- **One-click Vercel/CDN integrations** -- easiest deployment for Agent Analytics
- **Bot verification** -- validates crawlers against official IP ranges to prevent spoofed data
- **URL submission to AI indices** -- proactively push content to AI crawlers
- **All-time data retention** -- never lose historical data

### Weaknesses

- **Steep learning curve** -- requires understanding AI engine logic
- **Execution gap** -- intelligence without built-in optimization tools; requires external content platforms
- **Premium pricing** -- $499/mo minimum excludes SMBs
- **No content creation** -- monitoring and analysis only
- **Lower-tier restrictions** -- limited API access, multi-brand monitoring

---

## 5. Scrunch AI

**URL:** scrunch.com
**Founded:** ~2024
**Users:** 500+ companies (Lenovo, Clerk, Skims)
**Compliance:** SOC 2 Type II, GDPR

### Exact User Workflow

1. **Sign up** for a 7-day free trial
2. **Configure prompts** -- 350 custom prompts (Standard plan) organized by topics, personas, and customer journey stages
3. **Set up personas** -- 3 personas per Standard plan (e.g., "enterprise buyer," "developer," "CTO")
4. **Select AI engines** -- ChatGPT, Claude, Perplexity, Meta AI, Google AI Mode, Google AI Overviews, Gemini (7 engines)
5. **Install AXP** (optional) -- integrate with CDN (Cloudflare, Akamai, Vercel) for AI crawler optimization
6. **Connect GA4** -- link Google Analytics for traffic attribution
7. **Monitor dashboard** -- data refreshes every 3 days (daily for new prompts within first 14 days)

### Dashboard Contents

- **Multi-engine visibility tracking** across 7 major AI platforms
- **Brand sentiment analysis** -- tone of AI descriptions
- **Competitive benchmarking** -- side-by-side dashboards
- **Citation source tracking** -- which URLs appear in AI responses
- **Prompt-level monitoring** -- organized by topic, persona, journey stage
- **AI bot traffic monitoring** -- which AI crawlers visit and what they consume
- **Filtering capabilities** -- extensive prompt and platform filtering

### Agent Experience Platform (AXP) -- The Unique Product

AXP is the standout feature. It sits between your website and AI crawlers, serving optimized content to bots while maintaining the human experience unchanged.

**Three-step process:**

1. **INTERCEPT** -- auto-detects AI traffic via CDN integration (Cloudflare, Akamai, Vercel). When an AI crawler visits, it's routed to an optimized version.
2. **TRANSLATE** -- automatically scans and restructures pages, removing superfluous code AI doesn't value. No manual coding needed. The reduction is dramatic: their example shows a page going from 123,916 tokens (human version) to 1,255 tokens (AI version) -- a 99% reduction.
3. **SERVE** -- delivers AI-optimized content while humans continue seeing the normal site. Teams control how their brand is presented to AI agents.

**Performance example:**
- Human experience: 263,220 bytes
- Agent experience: 4,578 bytes
- Reduction: ~98%

AXP is currently in limited beta with early testers reporting 9x increases in sign-ups from AI search.

### GA4 Integration

- Tracks referral traffic from AI platforms
- Measures how many human visitors originate from AI-driven search
- Directly attributes conversions and sign-ups to AI search channels
- Visualizes AI traffic data in a cleaner dashboard than raw GA4
- Daily data updates

### Analysis Depth

- **Mention/visibility tracking** across 7 engines
- **Sentiment analysis**
- **Citation tracking** with URL-level detail
- **Competitive share of voice**
- **AI crawler behavior** (which bots visit, what pages, how often)
- **Traffic attribution** from AI to conversions

### Reporting

- Data exports available
- GA4 integration for attribution reporting
- No Looker Studio connector mentioned
- No PDF or scheduled reports mentioned
- Data API for integration with internal systems

### Technical Approach

- Unclear whether monitoring uses live consumer interfaces or API calls (documentation lacks transparency on this)
- Data refreshes every 3 days (daily for new prompts in first 14 days)
- AXP integrates at CDN level for bot content optimization
- PostHog analytics for product tracking internally

### Pricing

| Plan | Price | Prompts | Personas | Brands |
|------|-------|---------|----------|--------|
| Standard | $250-300/mo | 350 | 3 | Multi-brand |
| Higher tiers | Up to $1,000/mo | Custom | Custom | Custom |

Add-ons: +1 user = $25/mo; up to 5 additional users = $75/mo.
Annual discount: 2 months free (17% off).

### Unique Features

- **Agent Experience Platform (AXP)** -- the only tool that actively modifies what AI crawlers see, serving optimized "shadow site" content. This is the most technically innovative feature across all tools surveyed.
- **Persona-based monitoring** -- tracks how different buyer personas receive different AI recommendations
- **Broadest engine coverage** -- 7 AI platforms tracked
- **CDN-level integration** -- works with Cloudflare, Akamai, Vercel at infrastructure level
- **99% token reduction** for AI crawlers through content restructuring

### Weaknesses

- **"Insights" still in beta** -- limited optimization guidance
- **No integrated content creation** -- monitoring/optimization only
- **Premium pricing** -- $250+ minimum
- **3-day refresh cycle** -- slower than daily competitors
- **Limited actionable recommendations** for improving visibility
- **Unclear data collection methodology** -- not transparent about API vs. UI scraping

---

## 6. Trakkr

**URL:** trakkr.ai
**Founded:** 2024 | **Founder:** Mack Grenfell | **HQ:** London, UK
**Stats:** 24,129 brands tracked, 1.4M+ citations analyzed
**Distinction:** Only major platform offering a genuine free tier

### Exact User Workflow

1. **Sign up** for free (no credit card)
2. **Add brand** -- 1 brand on free tier
3. **Add prompts** -- 5 queries on free tier
4. **Select AI models** -- 6 models on free (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek); 8 on paid (adds Meta AI, Copilot)
5. **View daily updates** -- visibility tracking refreshes daily
6. **Review AI Copilot suggestions** -- built-in assistant provides "priority actions" to improve recommendations
7. **Use optimization tools** -- schema markup and content improvements without coding

### Dashboard Contents

- **AI Score** -- composite visibility metric with optimization suggestions
- **Visibility trends** -- time-series tracking across platforms
- **Mentions by model** -- which AI models mention the brand and how
- **Citation sources** -- which websites AI cites when mentioning the brand
- **Search queries** -- which prompts trigger brand recommendations
- **Perception monitoring** -- how AI describes the brand across trust, quality, and innovation dimensions
- **Competitor share-of-voice** -- relative visibility comparison

### Prompt Management

- 5 prompts on free tier, 50 on Growth, 50 per brand on Scale
- Prompt-level analytics showing which queries trigger mentions
- No auto-suggest feature mentioned

### Analysis Depth

- **Mention detection** across 6-8 AI models
- **Citation tracking** with source attribution
- **Sentiment analysis** across three dimensions: trust, quality, innovation
- **Perception monitoring** -- qualitative analysis of how AI describes the brand
- **Real-time alerts** for visibility changes

### Built-in Optimization Tools

- **Schema markup generator** -- creates AI-optimized structured data without coding
- **Content improvement suggestions** -- guides for making pages more likely to be recommended
- **AI Copilot** -- provides priority actions for improving visibility
- **Article credits** -- 1/mo (free), 5/mo (Growth), 25/mo (Scale) for creating optimized content

### Free Tier Details

The free plan provides:
- 1 brand tracking
- 5 queries/prompts
- 6 AI models (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek)
- 1 article credit/month
- 30-day data retention
- Basic tracking only (no citations, perception analysis, site optimization, exports, or executive reports)
- **Critical limitation:** Uses "basic models" (cheaper/efficient versions) as a proxy, NOT the same models that power ChatGPT's interface. Paid plans use "premium models" that match what users actually see.

### Pricing

| Plan | Price | Brands | Prompts | Models | Data Retention | Key Extras |
|------|-------|--------|---------|--------|----------------|------------|
| Free | $0 | 1 | 5 | 6 | 30 days | Basic tracking |
| Growth | $79/mo | 1 | 50 | 8 | 1 year | Citations, perception, optimization, exports, reports, 3 alerts |
| Scale | $399/mo | 10 | 50/brand | 8 | Unlimited | Unlimited seats, API, white-label ($49/client), unlimited alerts |

Add-ons: Extra brands $39/mo; Expanded prompts $39-99/mo; Article packs $49-149/mo.

### Unique Features

- **Genuine free tier** -- only major AI visibility tool with a permanent free plan
- **White-label portal** -- $49/client on Scale plan for agencies
- **Three-dimensional sentiment** -- trust/quality/innovation scoring (not just positive/negative)
- **Schema markup automation** -- generates structured data for AI optimization without coding
- **8 AI model coverage** on paid plans (broadest model count with Grok and DeepSeek)
- **Article credit system** -- AI-generated optimization content included in plans

### Weaknesses

- **Free tier uses inferior models** -- responses may differ from what real users see
- **Limited free plan** -- 5 prompts and 30-day retention is very restrictive
- **Newer platform** -- less proven track record
- **No Looker Studio or advanced integrations** mentioned

---

## 7. Nightwatch

**URL:** nightwatch.io
**Founded:** Pre-AI era (established SEO tool that added AI features)
**Rating:** 4.8/5 on Capterra

### Exact User Workflow

1. **Sign up** for a 14-day free trial (no credit card, no contracts)
2. **Add websites** -- 50-1,000 depending on plan
3. **Configure keywords** -- 250-10,000 daily tracked keywords
4. **Select platforms** -- traditional search (Google, Bing, Yahoo, DuckDuckGo) + AI (ChatGPT, Claude, Gemini, Perplexity)
5. **Set up localization** -- 107,000+ locations with zip-code precision
6. **View unified dashboard** -- combined traditional search + AI visibility
7. **Use NightOwl AI SEO Agent** -- automated SEO workflow assistant

### Dashboard Contents

- **AI Visibility Score** -- composite metric (shown on scale up to 94)
- **Share of Voice** -- competitive comparison across AI + traditional search
- **Sentiment Analysis** -- tone evaluation of AI brand mentions
- **Generative Rankings** -- positions in AI snapshots across platforms
- **Active Citations** -- count of sources referencing the brand
- **Traditional SERP rankings** alongside AI metrics
- **Model-level analytics** -- performance broken down by GPT-4o, Haiku, etc.

### Analysis Depth

The unique "dual-layer tracking" approach:
1. What AI systems say about your brand (response monitoring)
2. The web searches that LLMs execute when gathering real-time information (search behavior monitoring)

This gives visibility into how AI discovers content AND how it presents brands.

### Reporting

- Customizable automated reports
- Real-time keyword refresh on demand
- No specifics on PDF/export formats mentioned

### Technical Approach

- Combines traditional rank tracking infrastructure with AI monitoring
- On-demand keyword refresh capability
- 107,000+ geolocations for local tracking
- Includes site audit capabilities

### Pricing

| Plan | Price (monthly) | Price (annual) | Keywords | Websites |
|------|----------------|----------------|----------|----------|
| Starter | $39/mo | $32/mo | 250 | 50 |
| Professional | $99/mo | $82/mo | 1,000 | 200 |
| Enterprise | $699/mo | $559/mo | 10,000 | 1,000 |

### Unique Features

- **Combined traditional SEO + AI tracking** -- the only tool that unifies SERP rankings and AI visibility in one interface
- **Dual-layer tracking** -- monitors both AI responses AND the web searches LLMs perform
- **NightOwl AI SEO Agent** -- automates SEO workflows
- **107,000+ geolocations** -- most granular local tracking (zip-code level)
- **Established SEO heritage** -- years of rank tracking experience applied to AI
- **Budget-friendly entry point** -- starts at $32/mo annual

### Weaknesses

- **AI features are relatively new** -- limited real-world performance data
- **Limited social proof** for LLM feature specifically
- **SEO-first product** -- AI monitoring may feel bolted-on rather than native
- **No content creation or optimization tools** for AI specifically
- **No GA integration or traffic attribution** mentioned

---

## 8. Frase

**URL:** frase.io
**Positioning:** Full-stack SEO + GEO platform (content creation + tracking)

### Exact User Workflow

1. **Sign up** for a 7-day free trial (50 prompts, no credit card)
2. **Add brand and domain** -- connect Google Search Console
3. **Select prompts** to monitor across AI platforms
4. **View AI Visibility dashboard** -- daily updates across 8 platforms
5. **Run free GEO Score Checker** on any URL (no account needed for basic check)
6. **Create content** using the AI content editor with dual SEO + GEO optimization
7. **Track impact** -- monitor citation rates as content is published

### Dashboard Contents

- **AI Visibility Score** -- percentage of prompts mentioning the brand (e.g., 85% = brand appears in 85% of tracked prompts)
- **Appearance Rate** -- tracked over 30/60/90 day periods
- **Share of Voice** -- competitive positioning
- **Sentiment trends** -- how platforms describe the brand
- **Momentum Score** -- trend velocity indicating visibility direction
- **Citation status and frequency**
- **Platform-by-platform breakdown** across all 8 platforms
- **Competitive Gap Analysis** -- prompts where competitors win

### GEO Score Checker (Free Tool)

Anyone can check any URL without an account. Scores three pillars:

1. **Authority** (0-100) -- content depth, expertise, data-driven content, credible source citations. "Frase will suggest where to add references to boost trust."
2. **Readability** (0-100) -- natural language, clear structure, appropriate reading level. "Flags high-grade reading levels and offers suggestions to simplify."
3. **Structure** (0-100) -- formatting, organization, clean headings, snippet-ready formatting, standalone value.

Overall GEO Score: average of three pillars.
- 80+: Excellent
- 60-79: Good with improvement opportunities
- Below 60: Significant optimization potential

### Full-Stack Content Workflow

This is Frase's key differentiator -- it handles the entire content lifecycle:

1. **Research** -- keyword and topic research
2. **Brief creation** -- content outlines based on SERP analysis
3. **Writing** -- AI-assisted content generation
4. **SEO Optimization** -- traditional SEO score (real-time)
5. **GEO Optimization** -- AI citation score (real-time, alongside SEO score)
6. **Brand governance** -- voice/tone consistency
7. **Performance tracking** -- AI visibility monitoring

Users get a dual SEO + GEO score in the editor, optimizing for both Google rankings AND AI citations simultaneously.

### Analysis Depth

- **Visibility tracking** across 8 AI platforms (broadest coverage)
- **Share of voice** with competitive comparison
- **Sentiment analysis**
- **Citation tracking**
- **Momentum scoring** (trend velocity)
- **Gap analysis** (competitor-winning prompts)
- **Real-time alerts** for significant changes

### Reporting

- Data export (CSV/PDF) on higher tiers
- API access on higher tiers
- Historical data from 30 days (Starter) to unlimited (Enterprise)
- Real-time alerts for major changes
- No Looker Studio connector mentioned

### Technical Approach

- Daily monitoring across all 8 platforms
- Google Search Console integration for traditional SEO metrics
- AI crawler monitoring on Professional+ tiers
- Combined approach optimizing for both search engines and AI

### Pricing

| Plan | Price (annual) | Price (monthly) | AI Prompts | Platforms | History | Articles |
|------|----------------|-----------------|------------|-----------|---------|----------|
| Starter | $39/mo | $49/mo | 50 | 2 | 30 days | 10/mo |
| Professional | $103/mo | $129/mo | 200 | 3 | 90 days | 40/mo |
| Scale | $239/mo | $299/mo | 500 | 5 | 1 year | 100/mo |
| Enterprise | Custom | Custom | Custom | 8 | Unlimited | Custom |

### Unique Features

- **Full content lifecycle** in one platform -- research, write, optimize (SEO + GEO), track. No other tool covers this complete loop.
- **Free GEO Score Checker** -- public tool anyone can use without signing up
- **Dual SEO + GEO scoring** in real-time content editor
- **Broadest AI platform coverage** -- 8 platforms (ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews, Copilot, Grok, DeepSeek)
- **Most affordable entry** -- $39/mo annual for AI tracking (50 prompts)
- **Content creation + monitoring in one tool** -- unique integration of writing and tracking

### Weaknesses

- **Starter plan very limited** -- only 2 AI platforms, 50 prompts, 30-day history
- **AI tracking is newer addition** to an established SEO content tool
- **No GA integration** for traffic attribution from AI
- **No server-side bot tracking** like Profound's Agent Analytics
- **Content focus may not suit** pure monitoring/analytics use cases

---

## 9. GEO (Generative Engine Optimization) Discipline

### What GEO Is

GEO is the practice of optimizing content to increase visibility and citations in AI-powered search engines (ChatGPT, Perplexity, Gemini, Claude, Google AI Overviews), as distinct from traditional SEO which focuses on SERP rankings. The term comes from a Princeton research paper that demonstrated optimization methods can improve AI visibility by 30-40%.

Key distinction: "SEO gets you found. GEO gets you cited."

### How AI Engines Differ from Search Engines

- AI queries average 6.8 words vs. 2-3 words for Google searches
- AI engines don't index and rank the web -- they generate answers from training data + real-time search
- AI strongly favors **earned media** (authoritative third-party sources) over brand-owned content
- ~90% of ChatGPT citations come from pages outside Google's top 20 traditional results
- Wikipedia, YouTube, and Reddit are the three most consistently cited domains across all major AI systems
- AI evaluates content differently: structure, authority signals, and source credibility matter more than keyword density

### Best Practices (Ranked by Impact)

**1. Content Structure**
- Start each section with a clear, direct answer, then expand with context
- Use H2/H3 heading hierarchies to signal topics
- Add TL;DR statements under key headings for standalone answers
- Include FAQ sections (AI engines rely heavily on Q&A pairs)
- Build listicle-format ranking pages
- Create comparison scorecard tables
- Aim for 400-700 word guides with numbered processes

**2. Entity Authority**
- Maintain consistent brand mentions across the web
- Develop detailed About and author bio pages with E-E-A-T signals
- Build Wikipedia presence where appropriate
- Actively manage knowledge panels
- Use consistent business information across platforms

**3. Technical Foundations**
- Implement schema markup: Article, Organization, FAQ, HowTo, Breadcrumb, Product
- Deploy JSON-LD triple schema stacking
- Review robots.txt -- ensure AI crawlers (GPTBot, ClaudeBot, PerplexityBot) are NOT blocked
- Consider adding llms.txt file (markdown summary of site for AI consumption, though Otterly's research showed limited impact)
- Optimize load times and mobile performance
- Avoid JavaScript-heavy pages that hide content from AI bots
- Place quick answer blocks above the fold

**4. Content Quality**
- Publish original research and proprietary data
- Add expert commentary and unique frameworks
- Include specific statistics, data points, and numbers
- Add quotations from recognized experts
- Prioritize evidence-dense writing
- Create content with "standalone value" -- passages that make sense extracted from context
- Maintain 7-14 day content freshness cycles
- Add "Last updated" timestamps

**5. Earned Media and Digital PR**
- AI engines STRONGLY favor earned media over brand-owned content
- Guest posts on high-authority blogs
- Industry publication features
- Listings in reputable directories and "Best of" lists
- Press releases via PR wire services
- Expert endorsements and influencer mentions
- Thought leadership articles on external platforms

**6. Community Presence**
- Reddit engagement (see section 10 for details)
- Quora answers
- Review platform presence (G2, Capterra, Trustpilot)
- Social media consistency
- Forum participation in industry communities

**7. The llms.txt Protocol**
- Proposed standard by Jeremy Howard
- Markdown file at domain root (e.g., example.com/llms.txt)
- Summarizes site purpose, key pages, and how AI should reference content
- Being actively crawled by Microsoft, OpenAI, and others
- Acts like a "robots.txt for AI" -- guides which pages matter most
- Impact is debated (Otterly found limited effect; Mintlify and others see value)

### Measurement Framework

Core metrics to track:
- **AI Citation Frequency** -- how often brand appears in AI answers
- **Share of Voice** -- brand mentions vs. competitors across AI platforms
- **Citation Source Attribution** -- which of your pages get cited and why
- **Sentiment** -- how AI describes your brand
- **AI Crawler Traffic** -- which AI bots visit your site and what they consume
- **Referral Traffic** -- human visitors arriving from AI platform click-throughs

### Timeline Expectations

- Content optimization + schema: 2-4 weeks to impact AI citations
- Authority building: 3-6 months of consistent effort
- Reddit/community presence: 6+ months for substantial AI citation impact
- Full GEO program: expect 3-6 months for material results, with compounding over time

---

## 10. Gaming AI Mentions -- Tactics and Techniques

### How AI Discovers and Cites Brands

AI systems use three information sources:

1. **Training Data** -- internet snapshots taken 6-12 months before model release. Limited strategic value for immediate impact.
2. **User Memory/Knowledge Bases** -- user-specific, largely uncontrollable.
3. **Web Search Results** (PRIMARY TARGET) -- updated in real-time. After publishing content, it gets indexed by Bing/Google and can influence ChatGPT's responses immediately.

When ChatGPT processes a query with search, it: extracts a search query -> uses Bing to find results -> reads link descriptions and webpage content -> passes this as context to the LLM -> generates response with citations.

### Reddit as the #1 Gaming Vector

Reddit is the single most important external platform for AI visibility because:
- 40% of AI citations come from Reddit
- Google and OpenAI both pay Reddit for AI training data
- Reddit threads index on Google page one within hours
- AI systems read FULL thread content, including comments
- Saved content (not just upvoted) correlates with AI citations

**Specific Reddit tactics:**

1. **Strategic subreddit selection** -- map 10-15 communities where target audiences ask questions (r/entrepreneur, r/startups, r/SaaS, profession-specific subs)
2. **Comment on existing ranked threads** -- "a helpful comment on a ranked thread can outperform a new post" because AI reads the full thread
3. **20:1 engagement ratio** -- for every post mentioning your product, maintain 20+ purely helpful interactions
4. **Value-first credibility building** -- 2-3 months of genuine participation before any promotion
5. **Structure posts with WHY/WHAT/HOW/TL;DR format** -- numbered steps and concrete examples
6. **Include specific numbers, timelines, and tools** alongside failure narratives
7. **Optimize for "saves" not just upvotes** -- saved content correlates better with AI citations
8. **Use consistent username with transparent bio** -- authority signals that AI systems weigh

**What DOESN'T work:**
- Vote manipulation and coordinated upvoting -> shadowbans and domain blacklisting
- Keyword stuffing
- Hiring spam companies with reddit accounts
- Aggressive promotional posting schedules
- Fake accounts

**Timeline:** 6+ months for substantial results. This is "a years-long game, not a campaign."

### Content Gaming Techniques

**FAQ Hijacking:**
- Include explicit conclusions you want LLMs to repeat in FAQ content
- AI tends to "regurgitate your content" -- framing matters
- Whether content says "[brand] is great" or "[brand] is bad" makes little difference for search ranking but massive difference for LLM recommendations

**Semantic Framing:**
- Frame competitive comparisons favorably in your own content
- AI will pick up the framing and repeat it
- Include authoritative citations (G2, industry publications) alongside brand claims

**Title/Description Optimization:**
- Ensure titles and meta descriptions directly match likely AI query patterns
- AI pulls these for initial context before reading full pages

**Listicle Positioning:**
- Rank yourself #1 in your own "Best X" listicles
- AI heavily favors listicle format content for recommendation queries
- Publish 1-2 new listicles weekly, update existing ones every 7-14 days

**External Authority Seeding:**
- Guest posts on high-authority blogs mentioning your brand
- Industry publication features and "Best of" list inclusions
- Listings in reputable directories
- Well-upvoted Quora answers that casually mention your product
- Wikipedia presence (where appropriate)

**Structured Data Manipulation:**
- Article schema makes blog posts easier for AI to recognize as authoritative
- FAQ schema feeds AI with ready-made Q&A pairs
- Product schema helps AI recommend offerings in relevant prompts

### Ethical Boundaries

The consensus across sources: "the approach isn't about gaming systems but rather earning trust." However, the line between "optimization" and "manipulation" is blurry. Key distinctions:

- Legitimate: creating genuinely helpful Reddit content that happens to mention your brand
- Gray area: strategic placement of brand mentions in high-authority threads
- Illegitimate: vote manipulation, fake accounts, coordinated campaigns

OpenAI is expected to develop detection for gaming techniques, similar to Google's evolution against black-hat SEO.

---

## 11. Cross-Tool Comparison Matrix

### Pricing Comparison

| Tool | Entry Price | Mid-Tier | Enterprise | Free Tier |
|------|------------|----------|------------|-----------|
| Otterly | $29/mo | $189/mo | Custom | 14-day trial |
| Gauge | $99/mo | $599/mo | Custom | Free tier exists |
| Peec AI | $89/mo | $199/mo | $499/mo | 7-day trial |
| Profound | $499/mo | -- | Custom | Free Index only |
| Scrunch | $250-300/mo | -- | Up to $1,000/mo | 7-day trial |
| Trakkr | $0 (free) | $79/mo | $399/mo | Yes (permanent) |
| Nightwatch | $32/mo | $82/mo | $559/mo | 14-day trial |
| Frase | $39/mo | $103/mo | Custom | 7-day trial |

### AI Platform Coverage

| Tool | ChatGPT | Claude | Gemini | Perplexity | Google AIO | Copilot | Grok | DeepSeek | Meta AI |
|------|---------|--------|--------|------------|------------|---------|------|----------|---------|
| Otterly | Y | N | Add-on | Y | Y | Y | N | N | N |
| Gauge | Y | Ent. | Y | Y | Y | Y | Ent. | N | N |
| Peec AI | Y | Y | Y | Y | ? | Y | ? | Y | ? |
| Profound | Y | Y | Y | Y | Y | Y | ? | ? | ? |
| Scrunch | Y | Y | Y | Y | Y | ? | ? | ? | Y |
| Trakkr | Y | Y | Y | Y | ? | Y* | Y | Y | Y* |
| Nightwatch | Y | Y | Y | Y | ? | ? | ? | ? | ? |
| Frase | Y | Y | Y | Y | Y | Y | Y | Y | N |

### Feature Comparison

| Feature | Otterly | Gauge | Peec | Profound | Scrunch | Trakkr | Nightwatch | Frase |
|---------|---------|-------|------|----------|---------|--------|------------|-------|
| Mention tracking | Y | Y | Y | Y | Y | Y | Y | Y |
| Position tracking | Y | Y | Y | Y | Y | Y | Y | Y |
| Sentiment analysis | N | N | Y | N | Y | Y (3-dim) | Y | Y |
| Citation/URL tracking | Y | Y | Y | Y | Y | Y | Y | Y |
| Share of voice | Y | Y | Y | Y | Y | Y | Y | Y |
| Competitor benchmarking | Y | Y | Y | Y | Y | Y | Y | Y |
| Auto-suggest prompts | Y* | N | Y | N | N | N | N | N |
| Content creation | N | Y (engine) | N | N | N | Y (articles) | N | Y (full editor) |
| GEO audit/scoring | Y (25+ factors) | N | N | N | N | N | N | Y (GEO score) |
| Bot/crawler tracking | N | N | N | Y (server-side) | Y (AXP) | N | N | N |
| Traffic attribution | N | Y (GA) | N | Y (server-side) | Y (GA4) | N | N | N |
| Content optimization for bots | N | N | N | N | Y (AXP) | N | N | N |
| Traditional SEO tracking | N | N | N | N | N | N | Y | Y |
| Looker Studio | Y | N | Y (Ent) | N | N | N | N | N |
| API access | N | Ent. | Ent. | Ent. | Y | Scale | ? | Higher tiers |
| White-label | N | N | N | N | N | Y ($49/client) | N | N |
| Schema generation | N | N | N | N | N | Y | N | N |

### Data Collection Method

| Tool | Method | Frequency |
|------|--------|-----------|
| Otterly | Not disclosed | Daily |
| Gauge | UI scraping (claimed) | Daily |
| Peec AI | UI scraping (confirmed) | Daily |
| Profound | Not disclosed (monitoring) + server logs (Agent Analytics) | Daily |
| Scrunch | Not disclosed | Every 3 days (daily for new) |
| Trakkr | Free: basic/cheaper models; Paid: premium models | Daily |
| Nightwatch | Not disclosed | On-demand refresh |
| Frase | Not disclosed | Daily |

---

## 12. Key Takeaways for Product Building

### Market Segmentation

The tools fall into clear tiers:

**Pure Monitoring (Track and Report):**
- Otterly, Peec AI, Trakkr, Nightwatch
- Focus: see what AI says about you
- Value prop: visibility and competitive intelligence

**Monitoring + Optimization (Track, Analyze, Act):**
- Gauge (with content engine), Frase (with content editor), Scrunch (with AXP)
- Focus: not just monitoring but actively improving visibility
- Value prop: closing the loop from insight to action

**Enterprise Intelligence (Deep Analytics):**
- Profound (with Agent Analytics, Conversation Explorer)
- Focus: understanding HOW and WHY AI systems interact with your content
- Value prop: infrastructure-level visibility and attribution

### Underserved Areas (Gaps in the Market)

1. **Affordable full-stack tool** -- no tool under $100/mo combines monitoring + content creation + optimization recommendations effectively
2. **Real-time monitoring** -- all tools are daily at best, most are slower. No tool offers truly real-time alerting when a competitor starts getting mentioned.
3. **Multi-user collaboration** -- most tools are built for individual analysts, not teams. Peec's unlimited seats is an exception.
4. **Prompt discovery/research** -- only Otterly and Peec auto-suggest prompts. Most require manual configuration, which is a significant friction point.
5. **Cross-platform content impact** -- no tool tracks how a single piece of content performs across ALL AI platforms in one view
6. **Historical baselines** -- most tools only track from subscription start date. No retroactive data.
7. **Free/freemium** -- only Trakkr has a permanent free tier, but it uses inferior models. Market opportunity for a genuinely useful free tool.
8. **Attribution to revenue** -- only Scrunch (GA4) and Profound (server-side) attempt to connect AI visibility to actual business outcomes. This is the biggest gap.

### Technical Approaches Worth Noting

1. **UI scraping vs. API calls** -- tools that scrape the actual UI (Gauge, Peec) claim more authentic results since API responses differ from interface responses. This is a real trade-off between accuracy and scalability.
2. **Server-side bot tracking** (Profound) vs. **CDN-level content optimization** (Scrunch AXP) -- two very different technical approaches to the "bot side" of the equation. Profound observes; Scrunch intervenes.
3. **Basic vs. premium model tracking** (Trakkr's approach) -- using cheaper models as proxy is clever cost optimization but introduces accuracy questions.
4. **GEO scoring** (Frase, Otterly) -- automated content evaluation for AI-readiness is a high-value feature that could be a standalone product.

### What Users Actually Pay For

Based on pricing analysis, the market breaks down:
- **$0-50/mo:** Hobbyists, solo founders checking visibility (Trakkr free, Frase Starter, Nightwatch Starter, Otterly Lite)
- **$100-200/mo:** SMBs and marketing teams doing regular monitoring (Gauge Starter, Peec Pro, Otterly Standard)
- **$200-600/mo:** Agencies and growth teams with multiple clients (Gauge Growth, Scrunch Standard, Trakkr Scale, Frase Scale, Otterly Premium)
- **$500+/mo:** Enterprise brands needing deep analytics (Profound Lite, Nightwatch Enterprise)
