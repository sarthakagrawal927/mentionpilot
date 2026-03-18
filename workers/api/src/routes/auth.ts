import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { getDb } from '../db';
import { requireSession } from '../middleware/auth';

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST /callback — called by frontend after Google OAuth, creates session
auth.post('/callback', async (c) => {
  const body = await c.req.json() as { email: string; name: string | null; avatar_url: string | null };
  if (!body.email) return c.json({ error: 'email is required' }, 400);

  const db = getDb(c.env.DB);

  const userId = crypto.randomUUID();
  const user = await db.upsertUser({
    id: userId,
    email: body.email,
    name: body.name || null,
    avatar_url: body.avatar_url || null,
  });

  const token = crypto.randomUUID();
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  const tokenHash = [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await db.createSession({ token_hash: tokenHash, user_id: user.id, expires_at: expiresAt });

  return c.json({ token, user });
});

// GET /me — return current user
auth.get('/me', requireSession, async (c) => {
  const db = getDb(c.env.DB);
  const user = await db.getUserById(c.get('userId')!);
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(user);
});

// POST /logout — destroy session
auth.post('/logout', requireSession, async (c) => {
  const authHeader = c.req.header('Authorization')!;
  const token = authHeader.slice(7);
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  const tokenHash = [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');

  const db = getDb(c.env.DB);
  await db.deleteSession(tokenHash);
  return c.json({ ok: true });
});

export { auth };
