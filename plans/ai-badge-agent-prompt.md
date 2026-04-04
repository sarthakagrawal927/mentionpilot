# AI Visibility Badge -- Implementation Plan

**Created:** 2026-04-04
**Status:** Planned
**Effort:** M (3-5 days)
**Depends on:** P6.3 visibility-score endpoint (already implemented at `GET /v1/analytics/:pid/visibility-score`)

---

## Overview

Build an embeddable "AI Visibility Badge" widget that MentionPilot users can drop into their website with a single script tag. The badge displays a compact view of their AI visibility score (e.g. "Mentioned by 4/5 AI assistants") and links back to MentionPilot -- creating a viral distribution loop identical to "Powered by Intercom" or "Built with Vercel" badges.

The widget is a standalone vanilla JS bundle with zero dependencies, light/dark theme support, and fetches data from a new public API endpoint that is aggressively cached.

---

## Architecture Decisions

1. **Vanilla JS, not React** -- zero dependencies, tiny bundle (<5KB gzipped). Users paste one `<script>` tag.
2. **Shadow DOM** -- isolates badge styles from host page CSS. No conflicts.
3. **New public API route** -- `/v1/badge/:projectId` on the existing Hono worker. No auth required; data is public by design (users opt in by embedding the badge). Cached via `Cache-Control` headers + Cloudflare edge cache.
4. **No new database table** -- badge data is derived from existing `checks` and `results` tables. One lightweight query per request, cached for 1 hour.
5. **Build with esbuild** -- single IIFE bundle, built as part of the monorepo. Hosted on Cloudflare (either via the worker itself as a static asset, or via a CDN path).

---

## Phase 1: Badge API Endpoint

### File: `workers/api/src/routes/badge.ts`

Create a new Hono route file following the same pattern as `workers/api/src/routes/public.ts` (no auth middleware).

#### `GET /v1/badge/:projectId`

**Request:** No auth, no body. Optional query param `?format=json` (default) or `?format=svg` (stretch goal for static badge images).

**Response shape:**

```json
{
  "project_id": "abc-123",
  "brand_name": "Acme",
  "score": 72,
  "grade": "B",
  "platforms_checked": 4,
  "platforms_mentioned": 3,
  "mention_rate": 0.75,
  "platform_details": [
    { "platform": "openai", "mentioned": true },
    { "platform": "anthropic", "mentioned": true },
    { "platform": "google", "mentioned": false },
    { "platform": "perplexity", "mentioned": true }
  ],
  "last_checked": "2026-04-03T06:00:00Z",
  "dashboard_url": "https://mentionpilot-web.vercel.app/dashboard",
  "cached_at": "2026-04-04T12:00:00Z"
}
```

**Implementation details:**

- Query pattern: reuse the same SQL logic from `workers/api/src/routes/analytics.ts` lines 234-306 (the `visibility-score` endpoint), but stripped down to only the fields needed for the badge.
- Key queries (reference `workers/api/src/db.ts` methods):
  1. `getProjectById(projectId)` -- get project, extract brand name via `getBrandConfig(projectId)`.
  2. Get latest completed check: `SELECT id, brand_mention_rate, created_at FROM checks WHERE project_id = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 1`.
  3. Get per-platform mention data: `SELECT platform, brand_mentioned FROM results WHERE check_id = ?` -- aggregate into platform_details.
  4. Compute the score using the same algorithm as the visibility-score endpoint (mention 0-30, sentiment 0-20, position 0-20, citation 0-15, reach 0-15).
- Set response headers:
  - `Cache-Control: public, max-age=3600, s-maxage=3600` (1-hour cache)
  - `Access-Control-Allow-Origin: *` (must be loadable from any domain)
  - `Content-Type: application/json`
- Return 404 if project doesn't exist or has no completed checks.
- Add a `db.ts` helper method `getBadgeData(projectId)` that encapsulates the queries above into a single optimized function (avoid N+1).

#### CORS Note

The existing CORS middleware in `workers/api/src/index.ts` (lines 26-32) already uses `origin: (origin) => origin` which reflects the requesting origin. This works for the badge. But the badge endpoint should also work when loaded with no `Origin` header (direct browser fetch), so ensure the route explicitly sets `Access-Control-Allow-Origin: *` on the response.

### Wire up in `workers/api/src/index.ts`

Add alongside existing route mounts (line ~54):

```
import { badge } from './routes/badge';
app.route('/v1/badge', badge);
```

### Add to shared types: `packages/shared/src/index.ts`

Add a `BadgeData` interface matching the response shape above. Follow the pattern of existing types like `FreeCheckResult` (lines 126-147).

---

## Phase 2: Embeddable Widget Script

### New package: `packages/badge-widget/`

Create a new workspace package in the monorepo.

```
packages/badge-widget/
  package.json          # name: @mentionpilot/badge-widget
  tsconfig.json
  src/
    index.ts            # Entry point -- scans for <div data-mentionpilot-badge>
    badge.ts            # Badge class -- fetch, render, theme
    styles.ts           # CSS-in-JS (template literal strings for Shadow DOM)
  build.ts              # esbuild script
  dist/
    mentionpilot-badge.js    # IIFE output (<5KB gzipped)
    mentionpilot-badge.min.js
```

Add `"packages/badge-widget"` is already covered by the existing `pnpm-workspace.yaml` glob `"packages/*"`.

### Widget API (User-Facing)

**Option A: Script tag (primary)**

```html
<script
  src="https://mentionpilot-api.sarthakagrawal927.workers.dev/v1/badge/widget.js"
  data-project-id="abc-123"
  data-theme="auto"
  data-position="bottom-right"
  async
></script>
```

Or embed inline:

```html
<div
  data-mentionpilot-badge
  data-project-id="abc-123"
  data-theme="dark"
></div>
<script src="https://mentionpilot-api.sarthakagrawal927.workers.dev/v1/badge/widget.js" async></script>
```

**Option B: React component (optional, Phase 4)**

```tsx
import { MentionPilotBadge } from '@mentionpilot/badge-widget/react';

<MentionPilotBadge projectId="abc-123" theme="auto" />
```

### Configuration Options

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-project-id` | string | required | The MentionPilot project ID |
| `data-theme` | `"light"` \| `"dark"` \| `"auto"` | `"auto"` | `auto` reads `prefers-color-scheme` |
| `data-position` | `"inline"` \| `"bottom-right"` \| `"bottom-left"` | `"inline"` | Fixed position or inline |
| `data-size` | `"sm"` \| `"md"` | `"sm"` | Badge size |
| `data-expanded` | `"true"` \| `"false"` | `"false"` | Start expanded or collapsed |

### Widget Behavior

1. **On load:** Find all `[data-mentionpilot-badge]` divs, or read `data-project-id` from the `<script>` tag itself.
2. **Fetch:** `GET https://mentionpilot-api.sarthakagrawal927.workers.dev/v1/badge/{projectId}` -- single request, cached.
3. **Render collapsed state:** Small pill badge showing:
   - AI visibility icon (inline SVG, no external assets)
   - "Mentioned by 3/4 AI assistants" or "AI Score: 72/100"
   - Subtle "Powered by MentionPilot" text
4. **On click:** Expand to a mini-report card (still within Shadow DOM) showing:
   - Per-platform breakdown (green check / red X for each of: ChatGPT, Claude, Gemini, Perplexity)
   - Overall score and grade
   - "Last checked: 2 hours ago"
   - "View full report" link --> `https://mentionpilot-web.vercel.app/dashboard`
   - "Get your own badge" link --> `https://mentionpilot-web.vercel.app/check` (the free brand check -- converts visitors to users)
5. **Click outside or X button:** Collapse back.
6. **Error handling:** If fetch fails, badge hides itself entirely. No broken states on the host page.

### Implementation Details

**`src/index.ts`** -- Entry point (IIFE)

```
(function() {
  // Find script tag or [data-mentionpilot-badge] elements
  // Extract config from data attributes
  // Create Badge instance(s)
  // Handle DOMContentLoaded if needed
})();
```

**`src/badge.ts`** -- Core class

- Uses `attachShadow({ mode: 'closed' })` to isolate styles
- Fetches data once, stores in memory
- Renders collapsed/expanded states via innerHTML (no virtual DOM -- keep it simple)
- Listens for click events to toggle
- Detects `prefers-color-scheme` for auto theme via `matchMedia('(prefers-color-scheme: dark)')`
- All SVG icons are inline template literals (the 4 platform logos as simple icons, a checkmark, an X mark)

**`src/styles.ts`** -- CSS strings

- Two theme objects: light and dark
- Light: white background, dark text, subtle border
- Dark: `#1a1a2e` background, white text, subtle border
- Animations: fade in, expand/collapse transition (CSS only, no JS animation library)
- Responsive: badge adapts if container is narrow
- All CSS is injected into the Shadow DOM `<style>` tag

**Bundle constraints:**
- Target: ES2020 (covers 97%+ of browsers)
- No external imports whatsoever -- no fetch polyfill needed (fetch is universal in ES2020 targets)
- Output: single IIFE file
- Size budget: <5KB gzipped, <15KB uncompressed

### Build Script: `packages/badge-widget/build.ts`

Use esbuild (already available via Vite in the monorepo):

```ts
import { build } from 'esbuild';

build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  outfile: 'dist/mentionpilot-badge.min.js',
});
```

Add to `package.json`:

```json
{
  "name": "@mentionpilot/badge-widget",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "bun run build.ts",
    "dev": "bun run build.ts --watch"
  },
  "devDependencies": {
    "esbuild": "^0.25.0",
    "typescript": "^5.9.0"
  }
}
```

---

## Phase 3: Serve Widget via API Worker

### Static asset route: `GET /v1/badge/widget.js`

Add a route in `workers/api/src/routes/badge.ts` that serves the built JS file. Two options:

**Option A (preferred): Inline the built JS as a string constant.**

After building `packages/badge-widget/dist/mentionpilot-badge.min.js`, a build step copies the output into a TypeScript constant in `workers/api/src/routes/badge.ts`:

```ts
// Auto-generated -- do not edit manually
const WIDGET_JS = `(function(){...minified code...})();`;

badgeRoutes.get('/widget.js', (c) => {
  return new Response(WIDGET_JS, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
```

This avoids needing Cloudflare Worker static assets or R2. The widget is tiny enough to inline.

**Option B: Serve from Vercel `public/` directory.**

Place `mentionpilot-badge.min.js` in `apps/web/public/badge/` and serve from `https://mentionpilot-web.vercel.app/badge/mentionpilot-badge.min.js`. Simpler but introduces a cross-domain dependency.

Recommend Option A for self-contained deployment.

### Build pipeline addition

Add a `scripts/build-badge.sh` at the monorepo root:

```bash
#!/bin/bash
cd packages/badge-widget && bun run build
# Copy built JS into a constant for the worker
node -e "
  const fs = require('fs');
  const js = fs.readFileSync('dist/mentionpilot-badge.min.js', 'utf-8');
  const out = 'export const WIDGET_JS = ' + JSON.stringify(js) + ';\\n';
  fs.writeFileSync('../../workers/api/src/routes/badge-widget-bundle.ts', out);
"
```

Then `workers/api/src/routes/badge.ts` imports from `./badge-widget-bundle`.

---

## Phase 4: Dashboard Integration

### Badge settings page

Add a new section to the existing settings page at `apps/web/src/app/(dashboard)/dashboard/settings/page.tsx`.

**Section: "Embeddable Badge"**

- Toggle: Enable/disable badge (controls whether the API returns data for this project)
- Preview: Live preview of the badge in both light and dark themes
- Code snippet: Copy-to-clipboard `<script>` tag pre-filled with the user's project ID
- Customization: Theme selector (light/dark/auto), size (sm/md), position (inline/fixed)
- The snippet updates live as the user changes options

This follows the same UI patterns as the existing settings page (`apps/web/src/app/(dashboard)/dashboard/settings/page.tsx`).

### Badge enable/disable

Add a column to `brand_configs`:

```sql
ALTER TABLE brand_configs ADD COLUMN badge_enabled INTEGER NOT NULL DEFAULT 0;
```

New migration file: `packages/db/migrations/0006_badge.sql`.

The `GET /v1/badge/:projectId` endpoint checks `badge_enabled = 1` before returning data. If disabled, return 403.

### DB method addition in `workers/api/src/db.ts`

Add `updateBadgeEnabled(projectId, enabled)` and include `badge_enabled` in the `getBrandConfig` return. Follow the existing pattern of column-level updates (reference `updateProjectSchedule` at line 62-65 of `db.ts`).

---

## Phase 5: React Component (Optional)

If there's demand, publish a thin React wrapper:

### File: `packages/badge-widget/src/react.tsx`

```tsx
export function MentionPilotBadge({
  projectId,
  theme = 'auto',
  size = 'sm',
}: {
  projectId: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'sm' | 'md';
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Dynamically create the badge using the same core logic
    // Attach to ref.current
  }, [projectId, theme, size]);

  return <div ref={ref} />;
}
```

This is low priority. The vanilla JS script tag covers 99% of use cases. The React component would be a separate entry point in the esbuild config, outputting ESM.

---

## Phase 6: Tests

### API tests: `workers/api/src/__tests__/badge.test.ts`

Follow the pattern of existing test files (e.g., `workers/api/src/__tests__/ai-engine.test.ts`).

Test cases:
1. Returns 404 for non-existent project
2. Returns 403 when badge is disabled
3. Returns correct score and platform details for a project with completed checks
4. Returns correct `Cache-Control` headers
5. Returns correct `Access-Control-Allow-Origin: *` header
6. Handles project with no completed checks (returns 404 or empty state)
7. `widget.js` route returns valid JavaScript with correct content type

### Widget unit tests: `packages/badge-widget/src/__tests__/badge.test.ts`

Test cases:
1. Renders collapsed badge with correct score text
2. Expands on click, shows platform details
3. Collapses on click outside
4. Respects theme attribute (light/dark/auto)
5. Hides on fetch error
6. "Powered by MentionPilot" link is present and correct
7. Shadow DOM isolates styles

### E2E test: `apps/web/e2e/badge.spec.ts`

Test the settings page badge section:
1. Badge enable/disable toggle works
2. Code snippet updates when options change
3. Preview renders correctly

---

## File Change Summary

### New files

| File | Description |
|------|-------------|
| `workers/api/src/routes/badge.ts` | Badge API endpoint + widget.js serving |
| `workers/api/src/routes/badge-widget-bundle.ts` | Auto-generated: inlined widget JS |
| `workers/api/src/__tests__/badge.test.ts` | Badge API tests |
| `packages/badge-widget/package.json` | Widget package config |
| `packages/badge-widget/tsconfig.json` | TypeScript config |
| `packages/badge-widget/build.ts` | esbuild script |
| `packages/badge-widget/src/index.ts` | Widget entry point |
| `packages/badge-widget/src/badge.ts` | Badge core class |
| `packages/badge-widget/src/styles.ts` | CSS theme strings |
| `packages/badge-widget/src/__tests__/badge.test.ts` | Widget unit tests |
| `packages/db/migrations/0006_badge.sql` | Add badge_enabled column |
| `scripts/build-badge.sh` | Build + inline script |
| `apps/web/e2e/badge.spec.ts` | E2E tests for badge settings |

### Modified files

| File | Change |
|------|--------|
| `workers/api/src/index.ts` | Import and mount badge route (`app.route('/v1/badge', badge)`) |
| `workers/api/src/db.ts` | Add `getBadgeData()` and `updateBadgeEnabled()` methods |
| `packages/shared/src/index.ts` | Add `BadgeData` interface |
| `apps/web/src/app/(dashboard)/dashboard/settings/page.tsx` | Add badge settings section with preview, toggle, code snippet |
| `pnpm-workspace.yaml` | No change needed (already covers `packages/*`) |
| `package.json` (root) | Add `build:badge` script |

---

## API Contract

### `GET /v1/badge/:projectId`

**Auth:** None (public).

**Headers:**
- `Cache-Control: public, max-age=3600, s-maxage=3600`
- `Access-Control-Allow-Origin: *`

**Success (200):**

```json
{
  "project_id": "abc-123",
  "brand_name": "Acme",
  "score": 72,
  "grade": "B",
  "platforms_checked": 4,
  "platforms_mentioned": 3,
  "mention_rate": 0.75,
  "platform_details": [
    { "platform": "openai", "mentioned": true },
    { "platform": "anthropic", "mentioned": true },
    { "platform": "google", "mentioned": false },
    { "platform": "perplexity", "mentioned": true }
  ],
  "last_checked": "2026-04-03T06:00:00Z",
  "dashboard_url": "https://mentionpilot-web.vercel.app/dashboard",
  "cached_at": "2026-04-04T12:00:00Z"
}
```

**Not found (404):** Project doesn't exist or has no completed checks.
**Forbidden (403):** Badge is disabled for this project.

### `GET /v1/badge/widget.js`

**Auth:** None.
**Response:** JavaScript file (`Content-Type: application/javascript`).
**Cache:** 24 hours.

---

## Visual Design Spec

### Collapsed badge (default state)

```
+---------------------------------------------------+
|  [AI icon]  Mentioned by 3/4 AI assistants   [>]  |
|             Powered by MentionPilot               |
+---------------------------------------------------+
```

- Pill shape, rounded corners (border-radius: 9999px for sm, 12px for md)
- Subtle drop shadow
- Light theme: white bg, #111 text, #e5e5e5 border
- Dark theme: #1a1a2e bg, #f5f5f5 text, #333 border
- "Powered by MentionPilot" in 10px muted text, links to `https://mentionpilot-web.vercel.app`
- Hover: slight scale(1.02) transform

### Expanded state (on click)

```
+-------------------------------------------+
|  AI Visibility Score           72/100  B  |
|                                           |
|  ChatGPT      [check] Mentioned           |
|  Claude       [check] Mentioned           |
|  Gemini       [x]     Not mentioned       |
|  Perplexity   [check] Mentioned           |
|                                           |
|  Last checked: 2 hours ago                |
|                                           |
|  [View Full Report]  [Get Your Badge]     |
|                                           |
|  Powered by MentionPilot                  |
+-------------------------------------------+
```

- Card shape, 320px max width
- Smooth expand animation (max-height transition, 200ms ease)
- Platform names with simple colored dots (green = mentioned, red = not)
- Two CTAs:
  - "View Full Report" -> user's dashboard (or generic landing if not logged in)
  - "Get Your Badge" -> `https://mentionpilot-web.vercel.app/check` (free brand check page)
- Close button (X) top-right corner

---

## Growth / Viral Mechanics

1. **"Powered by MentionPilot"** link on every badge instance -- drives traffic from every site embedding the badge.
2. **"Get Your Badge"** CTA in expanded view -- converts curious visitors who see the badge on another site.
3. **Free brand check funnel** -- "Get Your Badge" links to `/check`, which is the free brand check (no signup). After seeing results, CTA to sign up and get their own badge.
4. **Social proof** -- Users embedding the badge on their site signals they care about AI visibility, normalizing the concept and creating category awareness.
5. **SEO** -- Every badge is a backlink to MentionPilot (nofollow is fine, the traffic matters more).

---

## Security Considerations

1. **No sensitive data exposed** -- The badge endpoint only returns aggregated scores, platform names, and mention booleans. No raw AI responses, no prompts, no API keys.
2. **Project ID is a UUID** -- Not guessable, not sequential.
3. **Badge opt-in** -- Users must explicitly enable the badge (badge_enabled flag). Disabled by default.
4. **Rate limiting** -- Apply Cloudflare's built-in rate limiting. The 1-hour cache means the actual DB is only hit once per project per hour regardless of badge traffic volume.
5. **No user tracking** -- The badge script does not set cookies, does not fingerprint, does not collect any data from the host page.

---

## Rollout Checklist

- [ ] Phase 1: Badge API endpoint (`/v1/badge/:projectId`)
- [ ] Phase 1: Badge types in shared package
- [ ] Phase 1: DB migration for `badge_enabled`
- [ ] Phase 1: DB methods (`getBadgeData`, `updateBadgeEnabled`)
- [ ] Phase 1: API tests
- [ ] Phase 2: Widget package scaffolding
- [ ] Phase 2: Widget core (fetch, render, theme, expand/collapse)
- [ ] Phase 2: Widget build script (esbuild)
- [ ] Phase 2: Widget unit tests
- [ ] Phase 3: Inline built JS into worker route
- [ ] Phase 3: Build pipeline script
- [ ] Phase 4: Dashboard settings section (toggle, preview, snippet)
- [ ] Phase 4: E2E tests
- [ ] Deploy API: `cd workers/api && npx wrangler deploy`
- [ ] Deploy web: `vercel --prod --yes`
- [ ] Verify badge loads on a test page
