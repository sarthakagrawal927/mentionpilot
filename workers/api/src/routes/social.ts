import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireSession, verifyProjectOwnership } from '../middleware/auth';
import { searchBrandMentions, searchHN } from '../lib/hn-monitor';
import { searchBrandOnReddit } from '../lib/reddit-monitor';
import { searchProductHunt } from '../lib/ph-monitor';

const social = new Hono<{ Bindings: Bindings; Variables: Variables }>();
social.use('*', requireSession);

// GET /:projectId/hn — search Hacker News for brand mentions
social.get('/:projectId/hn', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const config = await result.db.getBrandConfig(result.project.id);
  if (!config) return c.json({ error: 'Configure brand first' }, 400);

  const brandName = config.brand_name;
  const aliases: string[] = JSON.parse(config.brand_aliases || '[]');
  const days = parseInt(c.req.query('days') || '30');

  const mentions = await searchBrandMentions(brandName, aliases, days);
  return c.json({ mentions, total: mentions.length });
});

// GET /:projectId/hn/competitors — search HN for competitor mentions
social.get('/:projectId/hn/competitors', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const config = await result.db.getBrandConfig(result.project.id);
  if (!config) return c.json({ error: 'Configure brand first' }, 400);

  const competitors: { name: string }[] = JSON.parse(config.competitors || '[]');
  const days = parseInt(c.req.query('days') || '30');

  const results: Record<string, { mentions: number }> = {};
  for (const comp of competitors) {
    const mentions = await searchBrandMentions(comp.name, [], days);
    results[comp.name] = { mentions: mentions.length };
  }

  return c.json({ competitors: results });
});

// GET /hn/search — public HN search (for free tools)
social.get('/hn/search', async (c) => {
  const query = c.req.query('q');
  if (!query) return c.json({ error: 'q parameter required' }, 400);

  const { hits, total } = await searchHN(query);
  return c.json({ hits, total });
});

// GET /:projectId/reddit — search Reddit for brand mentions
social.get('/:projectId/reddit', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const config = await result.db.getBrandConfig(result.project.id);
  if (!config) return c.json({ error: 'Configure brand first' }, 400);

  const brandName = config.brand_name;
  const aliases: string[] = JSON.parse(config.brand_aliases || '[]');
  const timeFilter = (c.req.query('time') || 'month') as 'week' | 'month' | 'year';

  const mentions = await searchBrandOnReddit(brandName, aliases, timeFilter);
  return c.json({ mentions, total: mentions.length });
});

// GET /:projectId/producthunt — search PH for brand mentions
social.get('/:projectId/producthunt', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const config = await result.db.getBrandConfig(result.project.id);
  if (!config) return c.json({ error: 'Configure brand first' }, 400);

  const mentions = await searchProductHunt(config.brand_name);
  return c.json({ mentions, total: mentions.length });
});

// GET /:projectId/feed — unified feed from all sources
social.get('/:projectId/feed', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const config = await result.db.getBrandConfig(result.project.id);
  if (!config) return c.json({ error: 'Configure brand first' }, 400);

  const brandName = config.brand_name;
  const aliases: string[] = JSON.parse(config.brand_aliases || '[]');
  const days = parseInt(c.req.query('days') || '30');

  // Map days to Reddit time filter
  const redditTime: 'week' | 'month' | 'year' = days <= 7 ? 'week' : days <= 30 ? 'month' : 'year';

  // Run all searches in parallel
  const [hnResult, redditResult, phResult] = await Promise.allSettled([
    searchBrandMentions(brandName, aliases, days),
    searchBrandOnReddit(brandName, aliases, redditTime),
    searchProductHunt(brandName),
  ]);

  interface FeedItem {
    id: string;
    source: 'hackernews' | 'reddit' | 'producthunt';
    title: string;
    content: string | null;
    url: string;
    author: string | null;
    score: number | null;
    comments: number | null;
    created_at: string;
  }

  const feed: FeedItem[] = [];

  if (hnResult.status === 'fulfilled') {
    for (const m of hnResult.value) {
      feed.push({
        id: `hn_${m.id}`,
        source: 'hackernews',
        title: m.title || m.story_title || 'Comment',
        content: m.text ? m.text.replace(/<[^>]+>/g, '').slice(0, 300) : null,
        url: m.hn_url,
        author: m.author,
        score: m.points,
        comments: m.num_comments,
        created_at: m.created_at,
      });
    }
  }

  if (redditResult.status === 'fulfilled') {
    for (const m of redditResult.value) {
      feed.push({
        id: `reddit_${m.id}`,
        source: 'reddit',
        title: m.title || `r/${m.subreddit} comment`,
        content: (m.selftext || m.body || '').slice(0, 300) || null,
        url: m.permalink,
        author: m.author,
        score: m.score,
        comments: m.num_comments,
        created_at: m.created_at,
      });
    }
  }

  if (phResult.status === 'fulfilled') {
    for (const m of phResult.value) {
      feed.push({
        id: `ph_${m.id}`,
        source: 'producthunt',
        title: m.title,
        content: m.tagline,
        url: m.url,
        author: null,
        score: m.votes,
        comments: null,
        created_at: m.created_at,
      });
    }
  }

  // Sort by date, newest first
  feed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return c.json({
    feed: feed.slice(0, 100),
    total: feed.length,
    sources: {
      hackernews: hnResult.status === 'fulfilled' ? hnResult.value.length : 0,
      reddit: redditResult.status === 'fulfilled' ? redditResult.value.length : 0,
      producthunt: phResult.status === 'fulfilled' ? phResult.value.length : 0,
    },
  });
});

export { social };
