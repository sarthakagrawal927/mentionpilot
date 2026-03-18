import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireSession } from '../middleware/auth';

const apiKeys = new Hono<{ Bindings: Bindings; Variables: Variables }>();
apiKeys.use('*', requireSession);

// GET / — list user's API keys
apiKeys.get('/', async (c) => {
  const userId = c.get('userId')!;
  return c.json({ keys: [], message: 'API key management coming soon' });
});

// POST / — create a new API key
apiKeys.post('/', async (c) => {
  return c.json({ message: 'API key management coming soon' }, 501);
});

// DELETE /:keyId — revoke an API key
apiKeys.delete('/:keyId', async (c) => {
  return c.json({ message: 'API key management coming soon' }, 501);
});

export { apiKeys };
