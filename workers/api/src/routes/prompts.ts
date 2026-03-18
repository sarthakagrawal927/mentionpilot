import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireSession, verifyProjectOwnership } from '../middleware/auth';

const prompts = new Hono<{ Bindings: Bindings; Variables: Variables }>();
prompts.use('*', requireSession);

const MAX_PROMPTS = 20;

// GET /:projectId
prompts.get('/:projectId', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const list = await result.db.listPrompts(result.project.id);
  return c.json(list);
});

// POST /:projectId
prompts.post('/:projectId', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json();
  if (!body.prompt_text?.trim()) return c.json({ error: 'prompt_text is required' }, 400);

  const count = await result.db.countPrompts(result.project.id);
  if (count >= MAX_PROMPTS) return c.json({ error: `Max ${MAX_PROMPTS} prompts per project` }, 400);

  const prompt = await result.db.createPrompt({
    id: crypto.randomUUID(),
    project_id: result.project.id,
    prompt_text: body.prompt_text.trim(),
    category: body.category || null,
  });

  return c.json(prompt, 201);
});

// DELETE /:projectId/:id
prompts.delete('/:projectId/:id', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const deleted = await result.db.deletePrompt(c.req.param('id'));
  if (!deleted) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

export { prompts };
