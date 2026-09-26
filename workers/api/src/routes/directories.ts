import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireSession, verifyProjectOwnership } from '../middleware/auth';
import { DIRECTORIES, getDirectoriesByCategory, getDirectoryBySlug, generateSubmissionData } from '../lib/directory-database';

const directories = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /list -- public list of all directories (no auth)
directories.get('/list', async (c) => {
  const category = c.req.query('category');
  const dirs = getDirectoriesByCategory(category || undefined);
  return c.json({ directories: dirs, total: dirs.length });
});

// GET /categories -- list available categories
directories.get('/categories', async (c) => {
  const categories = [...new Set(DIRECTORIES.map(d => d.category))];
  return c.json({ categories });
});

// Authenticated routes below
directories.use('/:projectId/*', requireSession);

// GET /:projectId/status -- get submission status for all directories
directories.get('/:projectId/status', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId')!);
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const submissions = await result.db.listDirectorySubmissions(result.project.id);
  const stats = await result.db.getDirectorySubmissionStats(result.project.id);

  // Merge directory info with submission status
  const submissionMap = new Map(submissions.map((s: any) => [s.directory_slug, s]));
  const merged = DIRECTORIES.map(dir => ({
    ...dir,
    submission: submissionMap.get(dir.slug) || null,
  }));

  return c.json({ directories: merged, stats, total: DIRECTORIES.length });
});

// POST /:projectId/submit -- mark a directory as submitted/update status
directories.post('/:projectId/submit', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId')!);
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json() as {
    directory_slug: string;
    status: string;
    notes?: string;
    listing_url?: string;
  };

  if (!body.directory_slug) return c.json({ error: 'directory_slug is required' }, 400);

  const dir = getDirectoryBySlug(body.directory_slug);
  if (!dir) return c.json({ error: 'Unknown directory' }, 400);

  const validStatuses = ['pending', 'submitted', 'approved', 'rejected', 'skipped'];
  if (!validStatuses.includes(body.status)) return c.json({ error: 'Invalid status' }, 400);

  const submission = await result.db.upsertDirectorySubmission({
    id: crypto.randomUUID(),
    project_id: result.project.id,
    directory_slug: body.directory_slug,
    status: body.status,
    submitted_at: body.status === 'submitted' ? new Date().toISOString() : null,
    notes: body.notes || null,
    listing_url: body.listing_url || null,
  });

  return c.json(submission);
});

// DELETE /:projectId/submit/:slug -- remove a submission record
directories.delete('/:projectId/submit/:slug', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId')!);
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  await result.db.deleteDirectorySubmission(result.project.id, c.req.param('slug')!);
  return c.json({ ok: true });
});

// GET /:projectId/auto-fill -- generate submission data from brand config
directories.get('/:projectId/auto-fill', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId')!);
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const config = await result.db.getBrandConfig(result.project.id);
  if (!config) return c.json({ error: 'Configure brand first' }, 400);

  const data = generateSubmissionData(config);
  return c.json(data);
});

// GET /:projectId/domain-rating -- check domain rating via OpenPageRank
directories.get('/:projectId/domain-rating', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId')!);
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const domain = c.req.query('domain');
  if (!domain) return c.json({ error: 'domain query param is required' }, 400);

  const apiKey = c.env.OPENPAGERANK_API_KEY;
  if (!apiKey) return c.json({ error: 'OpenPageRank API key not configured' }, 500);

  try {
    const res = await fetch('https://openpagerank.keywordseverywhere.com/v1/domains/bulk', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domains: [domain], include_history: false }),
    });

    if (!res.ok) {
      return c.json({ error: 'OpenPageRank API error', status: res.status }, 502);
    }

    const data = await res.json() as {
      results: Array<{
        domain: string;
        found: boolean;
        open_page_rank: number | null;
        rank: number | null;
      }>;
    };

    const entry = data.results?.[0];
    if (!entry?.found || entry.open_page_rank === null) {
      return c.json({ domain, page_rank: null, page_rank_decimal: null, rank: null, error: 'Domain not found' });
    }

    return c.json({
      domain: entry.domain,
      page_rank: Math.floor(entry.open_page_rank),
      page_rank_decimal: entry.open_page_rank,
      rank: entry.rank === null ? null : String(entry.rank),
    });
  } catch (err) {
    return c.json({ error: 'Failed to fetch domain rating' }, 500);
  }
});

export { directories };
