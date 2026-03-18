import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';

const publicRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /leaderboard/:category — public AI visibility leaderboard by category
publicRoutes.get('/leaderboard/:category', async (c) => {
  const category = c.req.param('category');
  return c.json({
    category,
    title: `Top AI-Visible ${category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Tools`,
    description: `Rankings of ${category.replace(/-/g, ' ')} tools by AI visibility across ChatGPT, Claude, Gemini, and Perplexity.`,
    updated_at: new Date().toISOString(),
    rankings: [],
    cta: {
      text: 'Check your own AI visibility',
      url: '/check',
    },
  });
});

// GET /categories — list available categories for leaderboards
publicRoutes.get('/categories', async (c) => {
  const categories = [
    'crm', 'project-management', 'analytics', 'feedback', 'email-marketing',
    'marketing-automation', 'customer-support', 'ecommerce', 'design-tools',
    'developer-tools', 'productivity', 'collaboration', 'security',
    'monitoring', 'testing', 'devops', 'ai-tools', 'database',
    'hosting', 'cms', 'hr-tools', 'accounting', 'communication',
    'video-conferencing', 'file-storage',
  ];
  return c.json({
    categories: categories.map(slug => ({
      slug,
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      url: `/leaderboard/${slug}`,
    })),
  });
});

export { publicRoutes };
