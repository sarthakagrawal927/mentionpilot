import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { getDb } from '../db';
import { WIDGET_JS } from './badge-widget-bundle';

const badge = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /widget.js — serve the embeddable widget script
badge.get('/widget.js', (c) => {
  return new Response(WIDGET_JS, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
});

// GET /:projectId — public badge data (no auth)
badge.get('/:projectId', async (c) => {
  const projectId = c.req.param('projectId');
  const db = getDb(c.env.DB);

  const project = await db.getProjectById(projectId);
  if (!project) return c.json({ error: 'Project not found' }, 404);

  const config = await db.getBrandConfig(projectId);
  if (!config) return c.json({ error: 'Project not found' }, 404);

  // Check badge is enabled
  if (!config.badge_enabled) return c.json({ error: 'Badge disabled' }, 403);

  // Get latest completed check
  const latestCheck = await c.env.DB.prepare(
    `SELECT id, brand_mention_rate, created_at FROM checks WHERE project_id = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 1`
  ).bind(projectId).first();

  if (!latestCheck) return c.json({ error: 'No completed checks' }, 404);

  // Get per-platform results
  const { results: checkResults } = await c.env.DB.prepare(
    `SELECT brand_mentioned, brand_sentiment, brand_position, brand_cited, platform FROM results WHERE check_id = ?`
  ).bind(latestCheck.id as string).all();

  if (checkResults.length === 0) return c.json({ error: 'No results' }, 404);

  // Aggregate platform details
  const platformMap = new Map<string, { mentioned: boolean }>();
  for (const r of checkResults) {
    const p = r.platform as string;
    if (!platformMap.has(p)) {
      platformMap.set(p, { mentioned: false });
    }
    if (r.brand_mentioned) {
      platformMap.get(p)!.mentioned = true;
    }
  }

  const platform_details = Array.from(platformMap.entries()).map(([platform, data]) => ({
    platform,
    mentioned: data.mentioned,
  }));

  const platforms_checked = platformMap.size;
  const platforms_mentioned = platform_details.filter(p => p.mentioned).length;

  // Compute visibility score (same algorithm as analytics visibility-score endpoint)
  const total = checkResults.length;
  const mentionRate = (latestCheck.brand_mention_rate as number) || 0;
  const mentionScore = Math.round(mentionRate * 30);

  const mentionedResults = checkResults.filter(r => r.brand_mentioned);
  const positiveCount = mentionedResults.filter(r => r.brand_sentiment === 'positive').length;
  const sentimentScore = mentionedResults.length > 0 ? Math.round((positiveCount / mentionedResults.length) * 20) : 0;

  const positionedResults = mentionedResults.filter(r => r.brand_position && (r.brand_position as number) > 0);
  let positionScore = 0;
  if (positionedResults.length > 0) {
    const avgPosition = positionedResults.reduce((sum, r) => sum + (r.brand_position as number), 0) / positionedResults.length;
    positionScore = Math.round(Math.max(0, 20 - (avgPosition - 1) * 4));
  }

  const citedCount = checkResults.filter(r => r.brand_cited).length;
  const citationScore = Math.round((citedCount / total) * 15);

  const platformsMentionedSet = new Set(mentionedResults.map(r => r.platform as string));
  const totalPlatforms = new Set(checkResults.map(r => r.platform as string));
  const reachScore = totalPlatforms.size > 0 ? Math.round((platformsMentionedSet.size / totalPlatforms.size) * 15) : 0;

  const score = mentionScore + sentimentScore + positionScore + citationScore + reachScore;

  let grade = 'F';
  if (score >= 80) grade = 'A';
  else if (score >= 65) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 35) grade = 'D';

  return c.json({
    project_id: projectId,
    brand_name: config.brand_name,
    score,
    grade,
    platforms_checked,
    platforms_mentioned,
    mention_rate: Math.round(mentionRate * 100) / 100,
    platform_details,
    last_checked: latestCheck.created_at,
    dashboard_url: 'https://mentionpilot-web.vercel.app/dashboard',
    cached_at: new Date().toISOString(),
  }, 200, {
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    'Access-Control-Allow-Origin': '*',
  });
});

export { badge };
