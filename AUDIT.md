# Security & Quality Audit

Audit date: 2026-03-29

## CRITICAL

- [ ] **Auth callback accepts unverified email** `workers/api/src/routes/auth.ts:9-31`
  POST /v1/auth/callback blindly trusts `email` from request body. Any attacker can POST arbitrary emails to create sessions. Must verify the Google ID token server-side before trusting the email claim.

- [ ] **Dashboard hardcoded to projectId "demo"** `apps/web/src/app/(dashboard)/dashboard/page.tsx:37`, `analytics/page.tsx:79`, `social/page.tsx:75`, `mentions/page.tsx:55`, `axp/page.tsx:110`, `directories/page.tsx:137`
  Every dashboard page uses `useState("demo")` for projectId. Users share data in a single "demo" project. Must create a `useProject` hook that resolves the user's real project (auto-creating a default on first login).

- [ ] **Dashboard uses empty DEMO_TOKEN for API calls** `apps/web/src/app/(dashboard)/dashboard/page.tsx:10`, `analytics/page.tsx:9`, `social/page.tsx:16`, `mentions/page.tsx:37`, `axp/page.tsx:40`, `directories/page.tsx:31`
  Each page defines its own `DEMO_TOKEN = ""` and local `api()` function. Since the token is empty, the Authorization header is never sent -- all authenticated API calls fail silently. Must use the existing `apiFetch` from `apps/web/src/lib/api-client.ts` which calls `/api/token` for the real session token.

## HIGH

- [ ] **SSRF in site-crawler.ts** `workers/api/src/lib/site-crawler.ts:9-16`
  `crawlSite()` fetches any user-supplied URL with no validation. Attacker can pass `http://169.254.169.254/...` or `http://localhost:8787/...` to probe internal infrastructure. Must validate URL scheme (https/http only), resolve hostname, and block private/reserved IP ranges.

- [ ] **SSRF in geo.ts routes** `workers/api/src/routes/geo.ts:17`, `geo.ts:52`
  `geo-score` and `schema` endpoints fetch arbitrary user-supplied URLs server-side. Same SSRF risk as site-crawler. Must apply the same URL validation.

- [ ] **SSRF in geo-tools.ts crawlability check** `workers/api/src/lib/geo-tools.ts:184-188`
  `checkCrawlability()` fetches `robots.txt` and `llms.txt` at user-supplied origins.

- [ ] **No rate limiting on GEO endpoints** `workers/api/src/routes/geo.ts`
  All four GEO endpoints (geo-score, crawlability, schema, llms-txt) are public with no auth and no rate limiting. Must add 10 req/min per IP to prevent abuse.

## MEDIUM

- [ ] **Empty catch blocks swallow errors** across 6 dashboard pages (20+ catch blocks)
  `dashboard/page.tsx:50`, `analytics/page.tsx:115`, `social/page.tsx:95`, `mentions/page.tsx:100,124,162,186,197,211,222`, `axp/page.tsx:163,172,183,266,288,313,339,353`, `directories/page.tsx:192,286,325`
  All catch blocks silently swallow errors with no user feedback. Must add error state (`useState<string | null>`) and display error messages.

## LOW / INFORMATIONAL

- [ ] **CORS reflects any origin** `workers/api/src/index.ts:26-30`
  `origin: (origin) => origin` reflects the requesting origin. This is acceptable for a public API with bearer-token auth (no cookie auth), but should be locked to known origins in production.

- [ ] **No .env files committed** -- Verified clean. `.env` is in `.gitignore:6`. `.env.example` files exist at root and `apps/web/`.

- [ ] **No hardcoded secrets found** -- Grep confirms no API keys, tokens, or credentials in source. Placeholder strings like `"sk-..."` are UI hints only.

- [ ] **Deployment config** -- `vercel.json` exists at root. Workers deployed via `wrangler deploy`. No secrets in deployment configs.

- [ ] **Test coverage** -- 5 unit test files exist in `workers/api/src/__tests__/` (ai-engine, site-crawler, prompt-discovery, axp-crawler, geo-tools). 6 e2e tests in `apps/web/e2e/`. No dashboard component tests.
