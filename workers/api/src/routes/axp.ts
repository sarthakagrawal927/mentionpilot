import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireSession, verifyProjectOwnership } from '../middleware/auth';
import { getDb } from '../db';
import { crawlSiteForAXP } from '../lib/axp-crawler';

const axp = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ---- Authenticated routes ----

// POST /:projectId/crawl -- trigger a full site crawl
axp.post('/:projectId/crawl', requireSession, async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId')!);
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json() as { url: string; max_pages?: number };
  if (!body.url?.trim()) return c.json({ error: 'url is required' }, 400);

  const maxPages = Math.min(body.max_pages || 20, 50);
  const projectId = result.project.id;

  // Run crawl in background
  c.executionCtx.waitUntil((async () => {
    try {
      const pages = await crawlSiteForAXP(body.url, maxPages);
      for (const page of pages) {
        await result.db.upsertAXPPage({
          id: crypto.randomUUID(),
          project_id: projectId,
          source_url: page.url,
          source_path: page.path,
          title: page.title || null,
          optimized_content: page.optimizedContent,
          source_token_count: page.sourceTokenCount,
          optimized_token_count: page.optimizedTokenCount,
        });
      }
    } catch (err) {
      console.error('AXP crawl failed:', err);
    }
  })());

  return c.json({ status: 'crawling', max_pages: maxPages }, 202);
});

// GET /:projectId/pages -- list optimized pages
axp.get('/:projectId/pages', requireSession, async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId')!);
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const pages = await result.db.listAXPPages(result.project.id);
  return c.json({ pages });
});

// GET /:projectId/pages/:pageId -- get a single page with content
axp.get('/:projectId/pages/:pageId', requireSession, async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId')!);
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const page = await result.db.getAXPPageById(c.req.param('pageId')!);
  if (!page || page.project_id !== result.project.id) return c.json({ error: 'Not found' }, 404);
  return c.json(page);
});

// PUT /:projectId/pages/:pageId -- update optimized content
axp.put('/:projectId/pages/:pageId', requireSession, async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId')!);
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json() as { content: string };
  if (!body.content) return c.json({ error: 'content is required' }, 400);

  const page = await result.db.getAXPPageById(c.req.param('pageId')!);
  if (!page || page.project_id !== result.project.id) return c.json({ error: 'Not found' }, 404);

  await result.db.updateAXPPageContent(page.id, body.content);
  return c.json({ ok: true });
});

// DELETE /:projectId/pages/:pageId -- delete a page
axp.delete('/:projectId/pages/:pageId', requireSession, async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId')!);
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const deleted = await result.db.deleteAXPPage(c.req.param('pageId')!);
  if (!deleted) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

// GET /:projectId/stats -- AXP token savings stats
axp.get('/:projectId/stats', requireSession, async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId')!);
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const stats = await result.db.getAXPStats(result.project.id);
  const reduction = stats.total_source_tokens > 0
    ? Math.round((1 - stats.total_optimized_tokens / stats.total_source_tokens) * 100)
    : 0;

  return c.json({ ...stats, token_reduction_percent: reduction });
});

// GET /:projectId/analytics -- bot visit analytics
axp.get('/:projectId/analytics', requireSession, async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId')!);
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const days = parseInt(c.req.query('days') || '30');
  const analytics = await result.db.getAXPBotAnalytics(result.project.id, days);
  return c.json(analytics);
});

// POST /:projectId/config -- save deploy config
axp.post('/:projectId/config', requireSession, async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId')!);
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json() as { origin_url: string; deploy_type?: string };
  if (!body.origin_url?.trim()) return c.json({ error: 'origin_url is required' }, 400);

  const deployKey = crypto.randomUUID().replace(/-/g, '');
  const config = await result.db.upsertAXPConfig({
    id: crypto.randomUUID(),
    project_id: result.project.id,
    origin_url: body.origin_url.trim(),
    deploy_type: body.deploy_type || 'cloudflare',
    deploy_key: deployKey,
  });

  return c.json(config);
});

// GET /:projectId/config -- get deploy config
axp.get('/:projectId/config', requireSession, async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId')!);
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const config = await result.db.getAXPConfig(result.project.id);
  return c.json(config);
});

// GET /:projectId/middleware-code -- generate middleware code
axp.get('/:projectId/middleware-code', requireSession, async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId')!);
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const config = await result.db.getAXPConfig(result.project.id);
  if (!config) return c.json({ error: 'Configure AXP first' }, 400);

  const deployType = c.req.query('type') || config.deploy_type;
  const apiBase = 'https://api.mentionpilot.com';

  if (deployType === 'vercel') {
    const code = `// middleware.ts -- Place in your Next.js project root
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AI_BOTS = [
  'GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Google-Extended',
  'PerplexityBot', 'cohere-ai', 'Applebot-Extended',
];

const MENTIONPILOT_API = '${apiBase}';
const PROJECT_ID = '${result.project.id}';
const DEPLOY_KEY = '${config.deploy_key}';

export async function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  const botMatch = AI_BOTS.find(bot => ua.toLowerCase().includes(bot.toLowerCase()));

  if (!botMatch) return NextResponse.next();

  const path = request.nextUrl.pathname;

  try {
    const res = await fetch(
      \`\${MENTIONPILOT_API}/v1/axp/serve/\${PROJECT_ID}?path=\${encodeURIComponent(path)}&key=\${DEPLOY_KEY}\`
    );

    if (res.ok) {
      const data = await res.json();
      if (data.content) {
        fetch(\`\${MENTIONPILOT_API}/v1/axp/serve/\${PROJECT_ID}/log\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bot_name: botMatch, user_agent: ua, path, key: DEPLOY_KEY }),
        }).catch(() => {});

        return new NextResponse(data.content, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-MentionPilot': 'optimized' },
        });
      }
    }
  } catch {}

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};`;
    return c.json({ type: 'vercel', code });
  }

  // Cloudflare Worker
  const code = `// MentionPilot AXP Worker -- Deploy to Cloudflare Workers
const AI_BOTS = [
  'GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Google-Extended',
  'PerplexityBot', 'cohere-ai', 'Applebot-Extended',
];

const MENTIONPILOT_API = '${apiBase}';
const PROJECT_ID = '${result.project.id}';
const DEPLOY_KEY = '${config.deploy_key}';
const ORIGIN = '${config.origin_url}';

export default {
  async fetch(request) {
    const ua = request.headers.get('user-agent') || '';
    const botMatch = AI_BOTS.find(bot => ua.toLowerCase().includes(bot.toLowerCase()));

    if (!botMatch) {
      const url = new URL(request.url);
      url.hostname = new URL(ORIGIN).hostname;
      return fetch(new Request(url, request));
    }

    const path = new URL(request.url).pathname;

    try {
      const res = await fetch(
        \`\${MENTIONPILOT_API}/v1/axp/serve/\${PROJECT_ID}?path=\${encodeURIComponent(path)}&key=\${DEPLOY_KEY}\`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          fetch(\`\${MENTIONPILOT_API}/v1/axp/serve/\${PROJECT_ID}/log\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bot_name: botMatch, user_agent: ua, path, key: DEPLOY_KEY }),
          }).catch(() => {});

          return new Response(data.content, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-MentionPilot': 'optimized' },
          });
        }
      }
    } catch {}

    const url = new URL(request.url);
    url.hostname = new URL(ORIGIN).hostname;
    return fetch(new Request(url, request));
  },
};`;
  return c.json({ type: 'cloudflare', code });
});

// ---- Public routes (called by deployed middleware) ----

// GET /serve/:projectId -- serve optimized content to AI bots
axp.get('/serve/:projectId', async (c) => {
  const projectId = c.req.param('projectId')!;
  const path = c.req.query('path') || '/';
  const key = c.req.query('key');

  if (!key) return c.json({ error: 'key required' }, 401);

  const db = getDb(c.env.DB);
  const config = await db.getAXPConfig(projectId);
  if (!config || config.deploy_key !== key) return c.json({ error: 'Invalid key' }, 401);
  if (!config.enabled) return c.json({ error: 'AXP disabled' }, 404);

  const page = await db.getAXPPage(projectId, path);
  if (!page) return c.json({ content: null }, 404);

  return c.json({ content: page.optimized_content, title: page.title, path: page.source_path });
});

// POST /serve/:projectId/log -- log a bot visit
axp.post('/serve/:projectId/log', async (c) => {
  const projectId = c.req.param('projectId')!;
  const body = await c.req.json() as { bot_name: string; user_agent: string; path: string; key: string };

  if (!body.key) return c.json({ error: 'key required' }, 401);

  const db = getDb(c.env.DB);
  const config = await db.getAXPConfig(projectId);
  if (!config || config.deploy_key !== body.key) return c.json({ error: 'Invalid key' }, 401);

  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || null;

  await db.logBotVisit({
    id: crypto.randomUUID(),
    project_id: projectId,
    bot_name: body.bot_name,
    user_agent: body.user_agent,
    path: body.path,
    served_optimized: true,
    ip_address: ip,
  });

  return c.json({ ok: true });
});

export { axp };
