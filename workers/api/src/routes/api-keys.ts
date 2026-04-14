import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireSession } from '../middleware/auth';
import { getDb } from '../db';

const apiKeys = new Hono<{ Bindings: Bindings; Variables: Variables }>();
apiKeys.use('*', requireSession);

const KEY_PREFIX = 'mp_live_';
const RAW_KEY_BYTES = 32;
const ALLOWED_SCOPES = new Set(['read', 'write']);

async function sha256Hex(input: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(hashBuffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateRawKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(RAW_KEY_BYTES));
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${KEY_PREFIX}${hex}`;
}

// POST / — create a new API key. Raw key is returned exactly once.
apiKeys.post('/', async (c) => {
  const userId = c.get('userId')!;
  const body = await c.req.json().catch(() => ({} as any));
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
  if (!name) return c.json({ error: 'name required' }, 400);

  let scopes: string[] = ['read'];
  if (Array.isArray(body.scopes) && body.scopes.length > 0) {
    const filtered: string[] = body.scopes.filter(
      (s: unknown): s is string => typeof s === 'string' && ALLOWED_SCOPES.has(s)
    );
    if (filtered.length === 0) return c.json({ error: 'invalid scopes' }, 400);
    scopes = [...new Set(filtered)];
  }

  let expiresAt: string | null = null;
  if (typeof body.expires_in_days === 'number' && body.expires_in_days > 0) {
    const ms = Date.now() + body.expires_in_days * 86_400_000;
    expiresAt = new Date(ms).toISOString();
  }

  const db = getDb(c.env.DB);
  const raw = generateRawKey();
  const keyHash = await sha256Hex(raw);
  const record = await db.createApiKey({
    id: crypto.randomUUID(),
    user_id: userId,
    name,
    key_hash: keyHash,
    key_prefix: raw.slice(0, KEY_PREFIX.length + 4),
    scopes,
    expires_at: expiresAt,
  });

  return c.json({
    id: record.id,
    name: record.name,
    key: raw, // shown once, never returned again
    key_prefix: record.key_prefix,
    scopes,
    expires_at: record.expires_at,
    created_at: record.created_at,
  }, 201);
});

// GET / — list user's keys (masked).
apiKeys.get('/', async (c) => {
  const userId = c.get('userId')!;
  const db = getDb(c.env.DB);
  const rows = await db.listApiKeysByUser(userId);
  return c.json({
    keys: rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      key_prefix: r.key_prefix,
      scopes: JSON.parse(r.scopes || '[]'),
      last_used_at: r.last_used_at,
      expires_at: r.expires_at,
      revoked_at: r.revoked_at,
      created_at: r.created_at,
    })),
  });
});

// DELETE /:keyId — revoke a key.
apiKeys.delete('/:keyId', async (c) => {
  const userId = c.get('userId')!;
  const keyId = c.req.param('keyId');
  const db = getDb(c.env.DB);
  const ok = await db.revokeApiKey(keyId, userId);
  if (!ok) return c.json({ error: 'not found or already revoked' }, 404);
  return c.json({ success: true });
});

export { apiKeys };
