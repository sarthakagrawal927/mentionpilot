import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Bindings, Variables } from './types';
import { auth } from './routes/auth';
import { brands } from './routes/brands';
import { prompts } from './routes/prompts';
import { checks } from './routes/checks';
import { freeCheck } from './routes/free-check';
import { analytics } from './routes/analytics';
import { geo } from './routes/geo';
import { social } from './routes/social';
import { publicRoutes } from './routes/public';
import { apiKeys } from './routes/api-keys';
import { teams } from './routes/teams';
import { reports } from './routes/reports';
import { axp } from './routes/axp';
import { directories } from './routes/directories';
import { projects } from './routes/projects';
import { getDb } from './db';
import { runMentionCheck } from './lib/ai-engine';
import type { Platform } from './lib/ai-engine';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS — allow requesting origin, support credentials
app.use(
  '*',
  cors({
    origin: (origin) => origin,
    credentials: true,
  })
);

// Request ID middleware
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID());
  await next();
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.route('/v1/auth', auth);
app.route('/v1/brands', brands);
app.route('/v1/prompts', prompts);
app.route('/v1/checks', checks);
app.route('/v1/free-check', freeCheck);
app.route('/v1/analytics', analytics);
app.route('/v1/geo', geo);
app.route('/v1/social', social);
app.route('/v1/public', publicRoutes);
app.route('/v1/api-keys', apiKeys);
app.route('/v1/teams', teams);
app.route('/v1/reports', reports);
app.route('/v1/axp', axp);
app.route('/v1/directories', directories);
app.route('/v1/projects', projects);

export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    const db = getDb(env.DB);

    const now = new Date(event.scheduledTime);

    // Process daily schedules
    const dailyProjects = await db.listScheduledProjects('daily');
    for (const project of dailyProjects) {
      const lastCheck = project.last_scheduled_check
        ? new Date(project.last_scheduled_check)
        : null;

      // Skip if checked within the last 23 hours (buffer for cron drift)
      if (lastCheck && now.getTime() - lastCheck.getTime() < 23 * 60 * 60 * 1000) {
        continue;
      }

      ctx.waitUntil(runScheduledCheck(db, project, env));
    }

    // Process weekly schedules (only on Mondays)
    if (now.getUTCDay() === 1) {
      const weeklyProjects = await db.listScheduledProjects('weekly');
      for (const project of weeklyProjects) {
        const lastCheck = project.last_scheduled_check
          ? new Date(project.last_scheduled_check)
          : null;

        // Skip if checked within the last 6 days
        if (lastCheck && now.getTime() - lastCheck.getTime() < 6 * 24 * 60 * 60 * 1000) {
          continue;
        }

        ctx.waitUntil(runScheduledCheck(db, project, env));
      }
    }
  },
};

async function runScheduledCheck(
  db: ReturnType<typeof getDb>,
  project: Record<string, any>,
  env: Bindings
) {
  try {
    const promptList = await db.listPrompts(project.id);
    if (promptList.length === 0) return;

    const platforms: Platform[] = JSON.parse(project.platforms || '[]');
    const keyMap: Record<string, string | null> = {
      openai: project.openai_api_key,
      anthropic: project.anthropic_api_key,
      google: project.google_api_key,
      perplexity: project.perplexity_api_key,
    };
    const activePlatforms = platforms.filter((p) => !!keyMap[p]);
    if (activePlatforms.length === 0) return;

    const checkId = crypto.randomUUID();
    const totalQueries = promptList.length * activePlatforms.length;

    await db.createCheck({
      id: checkId,
      project_id: project.id,
      total_queries: totalQueries,
    });

    // Build a config object matching what runMentionCheck expects
    const config = {
      openai_api_key: project.openai_api_key,
      anthropic_api_key: project.anthropic_api_key,
      google_api_key: project.google_api_key,
      perplexity_api_key: project.perplexity_api_key,
      brand_name: project.brand_name,
      brand_aliases: project.brand_aliases,
      brand_url: project.brand_url,
      competitors: project.competitors,
      platforms: project.platforms,
    };

    await runMentionCheck(db, config, promptList, checkId, project.id);
    await db.updateProjectLastCheck(project.id);
  } catch (err) {
    console.error(`Scheduled check failed for project ${project.id}:`, err);
  }
}
