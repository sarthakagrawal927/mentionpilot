import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { getDb } from '../db';
import { requireSession } from '../middleware/auth';

const projects = new Hono<{ Bindings: Bindings; Variables: Variables }>();
projects.use('*', requireSession);

// GET / — list user's projects, auto-create default if none exist
projects.get('/', async (c) => {
  const db = getDb(c.env.DB);
  const userId = c.get('userId')!;

  let list = await db.listProjectsByUser(userId);

  if (list.length === 0) {
    const id = crypto.randomUUID();
    const slug = `project-${id.slice(0, 8)}`;
    await db.createProject({ id, user_id: userId, name: 'My Project', slug });
    list = await db.listProjectsByUser(userId);
  }

  return c.json({ projects: list });
});

export { projects };
