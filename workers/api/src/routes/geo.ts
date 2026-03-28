import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { analyzeGEOScore, checkCrawlability, analyzeSchema, generateLlmsTxt } from '../lib/geo-tools';
import { crawlSite } from '../lib/site-crawler';
import { validatePublicUrl } from '../lib/url-validator';
import { rateLimit } from '../lib/rate-limiter';

const geo = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const GEO_RATE_LIMIT = 10;       // requests
const GEO_RATE_WINDOW = 60_000;  // per minute

// Rate limit middleware for all GEO endpoints
geo.use('*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  if (!rateLimit(`geo:${ip}`, GEO_RATE_LIMIT, GEO_RATE_WINDOW)) {
    return c.json({ error: 'Rate limit exceeded. Max 10 requests per minute.' }, 429);
  }
  await next();
});

// POST /geo-score — public, no auth
geo.post('/geo-score', async (c) => {
  const body = (await c.req.json()) as { url: string };
  if (!body.url?.trim()) return c.json({ error: 'url is required' }, 400);

  let url: string;
  try {
    url = validatePublicUrl(body.url.trim());
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MentionPilot/1.0 (GEO Score Checker)' },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const score = analyzeGEOScore(html, url);
    return c.json(score);
  } catch (err) {
    return c.json({ error: `Could not fetch ${url}: ${(err as Error).message}` }, 400);
  }
});

// POST /crawlability — public, no auth
geo.post('/crawlability', async (c) => {
  const body = (await c.req.json()) as { url: string };
  if (!body.url?.trim()) return c.json({ error: 'url is required' }, 400);

  let validatedUrl: string;
  try {
    validatedUrl = validatePublicUrl(body.url.trim());
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }

  try {
    const result = await checkCrawlability(validatedUrl);
    return c.json(result);
  } catch (err) {
    return c.json({ error: `Could not check ${body.url}: ${(err as Error).message}` }, 400);
  }
});

// POST /schema — public, no auth
geo.post('/schema', async (c) => {
  const body = (await c.req.json()) as { url: string };
  if (!body.url?.trim()) return c.json({ error: 'url is required' }, 400);

  let url: string;
  try {
    url = validatePublicUrl(body.url.trim());
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MentionPilot/1.0 (Schema Analyzer)' },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const analysis = analyzeSchema(html);
    return c.json(analysis);
  } catch (err) {
    return c.json({ error: `Could not fetch ${url}: ${(err as Error).message}` }, 400);
  }
});

// POST /llms-txt — public, no auth
geo.post('/llms-txt', async (c) => {
  const body = (await c.req.json()) as { url: string };
  if (!body.url?.trim()) return c.json({ error: 'url is required' }, 400);

  let validatedUrl: string;
  try {
    validatedUrl = validatePublicUrl(body.url.trim());
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }

  try {
    const siteInfo = await crawlSite(validatedUrl);
    const result = generateLlmsTxt({
      brand_name: siteInfo.brand_name,
      url: validatedUrl,
      description: siteInfo.description,
      features: siteInfo.features,
      h1s: [],
      h2s: [],
    });
    return c.json(result);
  } catch (err) {
    return c.json({ error: `Could not crawl ${body.url}: ${(err as Error).message}` }, 400);
  }
});

export { geo };
