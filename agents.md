# MentionPilot

AI visibility platform for startups. Track, optimize, and improve how AI assistants (ChatGPT, Claude, Gemini, Perplexity) talk about your product.

## Vision

The affordable, self-serve AI visibility platform that the startup market is missing. Combines AI mention monitoring, GEO optimization, social monitoring, and an AXP-style shadow site — all in one product at startup-friendly pricing.

## Architecture

- **Framework**: Next.js 15 (app router)
- **Styling**: Tailwind CSS
- **Database**: Cloudflare D1 (SQLite)
- **API**: Cloudflare Workers + Hono
- **Auth**: Auth.js with Google OAuth
- **Deployment**: Cloudflare (API) + Vercel (dashboard)
- **Runtime**: Bun preferred
- **Monorepo**: pnpm workspaces
- **Testing**: Vitest + Playwright

## Key Principles

- BYOK (Bring Your Own Keys) for AI platform queries — zero cost to us
- Self-serve, no sales team required
- Free tier that provides instant value (free AI brand check, GEO score checker)
- Startup-friendly pricing ($9-29/mo)
- Feature parity with $300+/mo tools at 1/10th the price

## Competitive Landscape

- Peec AI ($103+/mo, $29M raised) — monitoring only, enterprise
- Profound ($499+/mo, $20M raised) — agent analytics, enterprise
- Scrunch AI ($250+/mo, $19M raised) — AXP shadow site, enterprise
- Gauge ($100-599/mo, YC S24) — monitoring + content creation
- Otterly ($29+/mo) — GEO audit, cheapest paid option
- Nightwatch ($32/mo) — hybrid SEO + AI monitoring
- Frase ($49/mo) — content platform with AI tracking
- Trakkr (free tier) — programmatic SEO, basic free monitoring

## Differentiation

1. Combined AI + social monitoring in one product (nobody does this)
2. AXP shadow site at startup pricing (Scrunch charges $250+/mo)
3. Free instant brand check (no signup required)
4. BYOK model keeps our costs near zero
5. GEO optimization tools included (Gauge charges $599/mo for this)
