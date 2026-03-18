import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { requireSession } from '../middleware/auth';

const teams = new Hono<{ Bindings: Bindings; Variables: Variables }>();
teams.use('*', requireSession);

// GET /:projectId/members — list team members
teams.get('/:projectId/members', async (c) => {
  return c.json({ members: [], message: 'Team management coming soon' }, 501);
});

// POST /:projectId/invite — invite a team member
teams.post('/:projectId/invite', async (c) => {
  return c.json({ message: 'Team management coming soon' }, 501);
});

// DELETE /:projectId/members/:userId — remove a team member
teams.delete('/:projectId/members/:userId', async (c) => {
  return c.json({ message: 'Team management coming soon' }, 501);
});

export { teams };
