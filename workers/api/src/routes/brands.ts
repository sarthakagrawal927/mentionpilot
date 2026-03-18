import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireSession, verifyProjectOwnership } from '../middleware/auth';
import type { BrandConfigRecord, AIPlatform } from '@mentionpilot/shared';

const brands = new Hono<{ Bindings: Bindings; Variables: Variables }>();
brands.use('*', requireSession);

const VALID_PLATFORMS: AIPlatform[] = ['openai', 'anthropic', 'google', 'perplexity'];
const MAX_COMPETITORS = 5;
const VALID_SCHEDULES = ['daily', 'weekly'];

function toConfigRecord(row: any): BrandConfigRecord {
  return {
    id: row.id,
    project_id: row.project_id,
    brand_name: row.brand_name,
    brand_aliases: JSON.parse(row.brand_aliases || '[]'),
    brand_url: row.brand_url,
    competitors: JSON.parse(row.competitors || '[]'),
    platforms: JSON.parse(row.platforms || '[]'),
    has_openai_key: !!row.openai_api_key,
    has_anthropic_key: !!row.anthropic_api_key,
    has_google_key: !!row.google_api_key,
    has_perplexity_key: !!row.perplexity_api_key,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// GET /:projectId/config
brands.get('/:projectId/config', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const row = await result.db.getBrandConfig(result.project.id);
  return c.json(row ? toConfigRecord(row) : null);
});

// POST /:projectId/config
brands.post('/:projectId/config', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json();
  if (!body.brand_name?.trim()) return c.json({ error: 'brand_name is required' }, 400);

  const competitors = body.competitors || [];
  if (competitors.length > MAX_COMPETITORS) return c.json({ error: `Max ${MAX_COMPETITORS} competitors` }, 400);

  const platforms = body.platforms || ['openai', 'anthropic', 'google', 'perplexity'];
  if (!platforms.every((p: string) => VALID_PLATFORMS.includes(p as AIPlatform))) {
    return c.json({ error: 'Invalid platform' }, 400);
  }

  const row = await result.db.upsertBrandConfig({
    id: crypto.randomUUID(),
    project_id: result.project.id,
    brand_name: body.brand_name.trim(),
    brand_aliases: JSON.stringify(body.brand_aliases || []),
    brand_url: body.brand_url || null,
    competitors: JSON.stringify(competitors),
    platforms: JSON.stringify(platforms),
    openai_api_key: body.openai_api_key || null,
    anthropic_api_key: body.anthropic_api_key || null,
    google_api_key: body.google_api_key || null,
    perplexity_api_key: body.perplexity_api_key || null,
  });

  return c.json(toConfigRecord(row));
});

// DELETE /:projectId/config
brands.delete('/:projectId/config', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  await result.db.deleteBrandConfig(result.project.id);
  return c.json({ ok: true });
});

// PATCH /:projectId/schedule — set or clear the check schedule
brands.patch('/:projectId/schedule', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json();
  const schedule = body.schedule ?? null;

  if (schedule !== null && !VALID_SCHEDULES.includes(schedule)) {
    return c.json({ error: 'Invalid schedule. Use "daily", "weekly", or null.' }, 400);
  }

  await result.db.updateProjectSchedule(result.project.id, schedule);
  return c.json({ ok: true, schedule });
});

export { brands };
