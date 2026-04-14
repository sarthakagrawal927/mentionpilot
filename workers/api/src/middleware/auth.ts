import type { Context, Next } from 'hono';
import type { Bindings, Variables } from '../types';
import { getDb } from '../db';

const API_KEY_PREFIX = 'mp_live_';

async function sha256Hex(input: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(hashBuffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function requireSession(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const db = getDb(c.env.DB);

  // API key path — programmatic access.
  if (token.startsWith(API_KEY_PREFIX)) {
    const keyHash = await sha256Hex(token);
    const apiKey = await db.getApiKeyByHash(keyHash);
    if (!apiKey) return c.json({ error: 'Unauthorized' }, 401);

    const scopes: string[] = JSON.parse(apiKey.scopes || '["read"]');
    const method = c.req.method;
    const isMutating = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
    if (isMutating && !scopes.includes('write')) {
      return c.json({ error: 'API key missing write scope' }, 403);
    }

    c.set('userId', apiKey.user_id);
    c.set('authMethod', 'api_key');
    c.executionCtx.waitUntil(db.touchApiKeyUsed(apiKey.id));
    await next();
    return;
  }

  // Session token path — dashboard.
  const tokenHash = await sha256Hex(token);
  const session = await db.getSessionByTokenHash(tokenHash);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('userId', session.user_id);
  c.set('authMethod', 'session');
  await next();
}

export async function verifyProjectOwnership(c: Context<{ Bindings: Bindings; Variables: Variables }>, projectId: string) {
  const db = getDb(c.env.DB);
  const userId = c.get('userId');
  const project = await db.getProjectById(projectId);
  if (!project || project.user_id !== userId) return null;
  return { db, project };
}
