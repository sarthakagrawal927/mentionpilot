import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { getDb } from '../db';
import { crawlSite, generatePrompts } from '../lib/site-crawler';
import { queryPlatform, analyzeResponse } from '../lib/ai-engine';
import type { Platform } from '../lib/ai-engine';

const freeCheck = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const FREE_CHECK_PLATFORMS: Platform[] = ['openai', 'google']; // cheapest 2
const RATE_LIMIT_PER_HOUR = 3;

// POST / — trigger a free brand check
freeCheck.post('/', async (c) => {
  const body = await c.req.json() as { domain: string };
  if (!body.domain?.trim()) return c.json({ error: 'domain is required' }, 400);

  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const db = getDb(c.env.DB);

  // Rate limit
  const recentCount = await db.countRecentFreeChecks(ip);
  if (recentCount >= RATE_LIMIT_PER_HOUR) {
    return c.json({ error: 'Rate limit exceeded. Try again in an hour.' }, 429);
  }

  // Crawl site
  let siteInfo;
  try {
    siteInfo = await crawlSite(body.domain);
  } catch (err) {
    return c.json({ error: `Could not fetch ${body.domain}: ${(err as Error).message}` }, 400);
  }

  const prompts = generatePrompts(siteInfo);
  const checkId = crypto.randomUUID();

  const check = await db.createFreeCheck({
    id: checkId,
    domain: body.domain,
    brand_name: siteInfo.brand_name,
    ip_address: ip,
  });

  // Run check in background
  c.executionCtx.waitUntil((async () => {
    const results: any[] = [];
    let mentions = 0;
    let total = 0;

    // We use env vars for API keys (our cost)
    const apiKeys: Record<Platform, string | undefined> = {
      openai: (c.env as any).OPENAI_API_KEY,
      google: (c.env as any).GOOGLE_API_KEY,
      anthropic: undefined,
      perplexity: undefined,
    };

    const activePlatforms = FREE_CHECK_PLATFORMS.filter(p => apiKeys[p]);

    for (const promptText of prompts) {
      for (const platform of activePlatforms) {
        try {
          const response = await queryPlatform(platform, apiKeys[platform]!, promptText);
          const analysis = analyzeResponse(
            response.responseText,
            siteInfo.brand_name,
            [],
            body.domain,
            []
          );

          results.push({
            prompt: promptText,
            platform,
            model: response.model,
            brand_mentioned: analysis.brand_mentioned,
            brand_sentiment: analysis.brand_sentiment,
            brand_position: analysis.brand_position,
            brand_cited: analysis.brand_cited,
            response_preview: response.responseText.slice(0, 500),
            latency_ms: response.latencyMs,
          });

          if (analysis.brand_mentioned) mentions++;
          total++;
        } catch {
          total++;
        }
      }
    }

    const mentionRate = total > 0 ? mentions / total : 0;
    await db.updateFreeCheck(checkId, {
      status: 'completed',
      mention_rate: mentionRate,
      results: JSON.stringify(results),
      completed_at: new Date().toISOString(),
    });
  })().catch(err => {
    db.updateFreeCheck(checkId, {
      status: 'failed',
      completed_at: new Date().toISOString(),
    }).catch(() => {});
  }));

  return c.json({ id: checkId, brand_name: siteInfo.brand_name, prompts, status: 'running' }, 201);
});

// GET /:id — poll for results
freeCheck.get('/:id', async (c) => {
  const db = getDb(c.env.DB);
  const check = await db.getFreeCheck(c.req.param('id'));
  if (!check) return c.json({ error: 'Not found' }, 404);

  return c.json({
    ...check,
    results: JSON.parse(check.results || '[]'),
  });
});

export { freeCheck };
