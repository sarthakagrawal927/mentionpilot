import type { Context, Next } from 'hono';
import type { Bindings, Variables } from '../types';
import { getDb } from '../db';

export async function requireSession(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  const tokenHash = [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');

  const db = getDb(c.env.DB);
  const session = await db.getSessionByTokenHash(tokenHash);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('userId', session.user_id);
  await next();
}

export async function verifyProjectOwnership(c: Context<{ Bindings: Bindings; Variables: Variables }>, projectId: string) {
  const db = getDb(c.env.DB);
  const userId = c.get('userId');
  const project = await db.getProjectById(projectId);
  if (!project || project.user_id !== userId) return null;
  return { db, project };
}
