export function getDb(d1: D1Database) {
  return {
    // --- Users ---
    async upsertUser(input: { id: string; email: string; name: string | null; avatar_url: string | null }) {
      await d1.prepare(
        `INSERT INTO users (id, email, name, avatar_url) VALUES (?, ?, ?, ?)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url`
      ).bind(input.id, input.email, input.name, input.avatar_url).run();
      return await d1.prepare(`SELECT * FROM users WHERE id = ?`).bind(input.id).first() as any;
    },

    async getUserById(id: string) {
      return await d1.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first() as any | null;
    },

    // --- Sessions ---
    async createSession(input: { token_hash: string; user_id: string; expires_at: string }) {
      await d1.prepare(
        `INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)`
      ).bind(input.token_hash, input.user_id, input.expires_at).run();
    },

    async getSessionByTokenHash(tokenHash: string) {
      return await d1.prepare(
        `SELECT user_id, expires_at FROM sessions WHERE token_hash = ? AND expires_at > datetime('now')`
      ).bind(tokenHash).first() as { user_id: string; expires_at: string } | null;
    },

    async deleteSession(tokenHash: string) {
      await d1.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run();
    },

    // --- Projects ---
    async createProject(input: { id: string; user_id: string; name: string; slug: string }) {
      await d1.prepare(
        `INSERT INTO projects (id, user_id, name, slug) VALUES (?, ?, ?, ?)`
      ).bind(input.id, input.user_id, input.name, input.slug).run();
      return await d1.prepare(`SELECT * FROM projects WHERE id = ?`).bind(input.id).first() as any;
    },

    async getProjectById(id: string) {
      return await d1.prepare(`SELECT * FROM projects WHERE id = ?`).bind(id).first() as any | null;
    },

    async getProjectBySlug(slug: string) {
      return await d1.prepare(`SELECT * FROM projects WHERE slug = ?`).bind(slug).first() as any | null;
    },

    async listProjectsByUser(userId: string) {
      const { results } = await d1.prepare(
        `SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC`
      ).bind(userId).all();
      return results as any[];
    },

    async deleteProject(id: string) {
      const { meta } = await d1.prepare(`DELETE FROM projects WHERE id = ?`).bind(id).run();
      return (meta.changes ?? 0) > 0;
    },

    // --- Project Schedule ---
    async updateProjectSchedule(projectId: string, schedule: string | null) {
      await d1.prepare(
        `UPDATE projects SET check_schedule = ? WHERE id = ?`
      ).bind(schedule, projectId).run();
    },

    async listScheduledProjects(schedule: string) {
      const { results } = await d1.prepare(
        `SELECT p.*, bc.brand_name, bc.brand_aliases, bc.brand_url, bc.competitors, bc.platforms,
                bc.openai_api_key, bc.anthropic_api_key, bc.google_api_key, bc.perplexity_api_key
         FROM projects p
         JOIN brand_configs bc ON bc.project_id = p.id
         WHERE p.check_schedule = ?`
      ).bind(schedule).all();
      return results as any[];
    },

    async updateProjectLastCheck(projectId: string) {
      await d1.prepare(
        `UPDATE projects SET last_scheduled_check = datetime('now') WHERE id = ?`
      ).bind(projectId).run();
    },

    // --- Brand Config ---
    async upsertBrandConfig(input: {
      id: string; project_id: string; brand_name: string;
      brand_aliases: string; brand_url: string | null;
      competitors: string; platforms: string;
      openai_api_key: string | null; anthropic_api_key: string | null;
      google_api_key: string | null; perplexity_api_key: string | null;
    }) {
      await d1.prepare(
        `INSERT INTO brand_configs (id, project_id, brand_name, brand_aliases, brand_url, competitors, platforms, openai_api_key, anthropic_api_key, google_api_key, perplexity_api_key)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (project_id) DO UPDATE SET
           brand_name = EXCLUDED.brand_name, brand_aliases = EXCLUDED.brand_aliases,
           brand_url = EXCLUDED.brand_url, competitors = EXCLUDED.competitors,
           platforms = EXCLUDED.platforms,
           openai_api_key = COALESCE(EXCLUDED.openai_api_key, brand_configs.openai_api_key),
           anthropic_api_key = COALESCE(EXCLUDED.anthropic_api_key, brand_configs.anthropic_api_key),
           google_api_key = COALESCE(EXCLUDED.google_api_key, brand_configs.google_api_key),
           perplexity_api_key = COALESCE(EXCLUDED.perplexity_api_key, brand_configs.perplexity_api_key),
           updated_at = datetime('now')`
      ).bind(
        input.id, input.project_id, input.brand_name, input.brand_aliases,
        input.brand_url, input.competitors, input.platforms,
        input.openai_api_key, input.anthropic_api_key, input.google_api_key, input.perplexity_api_key
      ).run();
      return await d1.prepare(`SELECT * FROM brand_configs WHERE project_id = ?`).bind(input.project_id).first() as any;
    },

    async getBrandConfig(projectId: string) {
      return await d1.prepare(`SELECT * FROM brand_configs WHERE project_id = ?`).bind(projectId).first() as any | null;
    },

    async updateBadgeEnabled(projectId: string, enabled: boolean) {
      await d1.prepare(
        `UPDATE brand_configs SET badge_enabled = ? WHERE project_id = ?`
      ).bind(enabled ? 1 : 0, projectId).run();
    },

    async deleteBrandConfig(projectId: string) {
      const { meta } = await d1.prepare(`DELETE FROM brand_configs WHERE project_id = ?`).bind(projectId).run();
      return (meta.changes ?? 0) > 0;
    },

    // --- Prompts ---
    async createPrompt(input: { id: string; project_id: string; prompt_text: string; category: string | null }) {
      await d1.prepare(
        `INSERT INTO prompts (id, project_id, prompt_text, category) VALUES (?, ?, ?, ?)`
      ).bind(input.id, input.project_id, input.prompt_text, input.category).run();
      return await d1.prepare(`SELECT * FROM prompts WHERE id = ?`).bind(input.id).first() as any;
    },

    async listPrompts(projectId: string) {
      const { results } = await d1.prepare(
        `SELECT * FROM prompts WHERE project_id = ? ORDER BY created_at ASC`
      ).bind(projectId).all();
      return results as any[];
    },

    async deletePrompt(id: string) {
      const { meta } = await d1.prepare(`DELETE FROM prompts WHERE id = ?`).bind(id).run();
      return (meta.changes ?? 0) > 0;
    },

    async countPrompts(projectId: string) {
      const row = await d1.prepare(
        `SELECT COUNT(*) AS total FROM prompts WHERE project_id = ?`
      ).bind(projectId).first();
      return (row?.total as number) || 0;
    },

    // --- Checks ---
    async createCheck(input: { id: string; project_id: string; total_queries: number }) {
      await d1.prepare(
        `INSERT INTO checks (id, project_id, total_queries) VALUES (?, ?, ?)`
      ).bind(input.id, input.project_id, input.total_queries).run();
      return await d1.prepare(`SELECT * FROM checks WHERE id = ?`).bind(input.id).first() as any;
    },

    async updateCheck(id: string, input: Record<string, unknown>) {
      const sets: string[] = [];
      const values: unknown[] = [];
      if (input.status !== undefined) { sets.push('status = ?'); values.push(input.status); }
      if (input.completed_queries !== undefined) { sets.push('completed_queries = ?'); values.push(input.completed_queries); }
      if (input.brand_mention_rate !== undefined) { sets.push('brand_mention_rate = ?'); values.push(input.brand_mention_rate); }
      if (input.summary !== undefined) { sets.push('summary = ?'); values.push(input.summary); }
      if (input.completed_at !== undefined) { sets.push('completed_at = ?'); values.push(input.completed_at); }
      if (sets.length === 0) return;
      values.push(id);
      await d1.prepare(`UPDATE checks SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
    },

    async listChecks(projectId: string, limit = 10) {
      const { results } = await d1.prepare(
        `SELECT * FROM checks WHERE project_id = ? ORDER BY created_at DESC LIMIT ?`
      ).bind(projectId, limit).all();
      return results as any[];
    },

    async getCheckById(id: string) {
      return await d1.prepare(`SELECT * FROM checks WHERE id = ?`).bind(id).first() as any | null;
    },

    // --- Results ---
    async createResult(input: Record<string, unknown>) {
      await d1.prepare(
        `INSERT INTO results (id, check_id, project_id, prompt_id, platform, model, response_text, brand_mentioned, brand_sentiment, brand_position, competitors_mentioned, citations, brand_cited, latency_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        input.id, input.check_id, input.project_id, input.prompt_id,
        input.platform, input.model, input.response_text,
        input.brand_mentioned ? 1 : 0, input.brand_sentiment, input.brand_position,
        input.competitors_mentioned, input.citations,
        input.brand_cited ? 1 : 0, input.latency_ms
      ).run();
      return await d1.prepare(`SELECT * FROM results WHERE id = ?`).bind(input.id as string).first() as any;
    },

    async listResults(checkId: string) {
      const { results } = await d1.prepare(
        `SELECT * FROM results WHERE check_id = ? ORDER BY created_at ASC`
      ).bind(checkId).all();
      return results as any[];
    },

    // --- Free Checks ---
    async createFreeCheck(input: { id: string; domain: string; brand_name: string | null; ip_address: string }) {
      await d1.prepare(
        `INSERT INTO free_checks (id, domain, brand_name, ip_address) VALUES (?, ?, ?, ?)`
      ).bind(input.id, input.domain, input.brand_name, input.ip_address).run();
      return await d1.prepare(`SELECT * FROM free_checks WHERE id = ?`).bind(input.id).first() as any;
    },

    async updateFreeCheck(id: string, input: { status?: string; mention_rate?: number | null; results?: string; completed_at?: string | null }) {
      const sets: string[] = [];
      const values: unknown[] = [];
      if (input.status !== undefined) { sets.push('status = ?'); values.push(input.status); }
      if (input.mention_rate !== undefined) { sets.push('mention_rate = ?'); values.push(input.mention_rate); }
      if (input.results !== undefined) { sets.push('results = ?'); values.push(input.results); }
      if (input.completed_at !== undefined) { sets.push('completed_at = ?'); values.push(input.completed_at); }
      if (sets.length === 0) return;
      values.push(id);
      await d1.prepare(`UPDATE free_checks SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
    },

    async getFreeCheck(id: string) {
      return await d1.prepare(`SELECT * FROM free_checks WHERE id = ?`).bind(id).first() as any | null;
    },

    async countRecentFreeChecks(ipAddress: string, sinceMinutes: number = 60) {
      const row = await d1.prepare(
        `SELECT COUNT(*) AS total FROM free_checks WHERE ip_address = ? AND created_at > datetime('now', '-' || ? || ' minutes')`
      ).bind(ipAddress, sinceMinutes).first();
      return (row?.total as number) || 0;
    },

    // --- AXP Pages ---
    async upsertAXPPage(input: {
      id: string; project_id: string; source_url: string; source_path: string;
      title: string | null; optimized_content: string;
      source_token_count: number; optimized_token_count: number;
    }) {
      await d1.prepare(
        `INSERT INTO axp_pages (id, project_id, source_url, source_path, title, optimized_content, source_token_count, optimized_token_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (project_id, source_path) DO UPDATE SET
           source_url = EXCLUDED.source_url, title = EXCLUDED.title,
           optimized_content = EXCLUDED.optimized_content,
           source_token_count = EXCLUDED.source_token_count,
           optimized_token_count = EXCLUDED.optimized_token_count,
           last_crawled_at = datetime('now'), last_modified_at = datetime('now')`
      ).bind(input.id, input.project_id, input.source_url, input.source_path,
        input.title, input.optimized_content, input.source_token_count, input.optimized_token_count
      ).run();
      return await d1.prepare(`SELECT * FROM axp_pages WHERE project_id = ? AND source_path = ?`)
        .bind(input.project_id, input.source_path).first() as any;
    },

    async listAXPPages(projectId: string) {
      const { results } = await d1.prepare(
        `SELECT id, project_id, source_url, source_path, title, source_token_count, optimized_token_count, status, last_crawled_at, last_modified_at FROM axp_pages WHERE project_id = ? ORDER BY source_path ASC`
      ).bind(projectId).all();
      return results as any[];
    },

    async getAXPPage(projectId: string, path: string) {
      return await d1.prepare(
        `SELECT * FROM axp_pages WHERE project_id = ? AND source_path = ? AND status = 'active'`
      ).bind(projectId, path).first() as any | null;
    },

    async getAXPPageById(id: string) {
      return await d1.prepare(`SELECT * FROM axp_pages WHERE id = ?`).bind(id).first() as any | null;
    },

    async updateAXPPageContent(id: string, content: string) {
      await d1.prepare(
        `UPDATE axp_pages SET optimized_content = ?, optimized_token_count = ?, last_modified_at = datetime('now') WHERE id = ?`
      ).bind(content, Math.ceil(content.length / 4), id).run();
    },

    async deleteAXPPage(id: string) {
      const { meta } = await d1.prepare(`DELETE FROM axp_pages WHERE id = ?`).bind(id).run();
      return (meta.changes ?? 0) > 0;
    },

    async getAXPStats(projectId: string) {
      const row = await d1.prepare(
        `SELECT COUNT(*) as page_count, SUM(source_token_count) as total_source_tokens, SUM(optimized_token_count) as total_optimized_tokens FROM axp_pages WHERE project_id = ? AND status = 'active'`
      ).bind(projectId).first();
      return {
        page_count: (row?.page_count as number) || 0,
        total_source_tokens: (row?.total_source_tokens as number) || 0,
        total_optimized_tokens: (row?.total_optimized_tokens as number) || 0,
      };
    },

    // --- AXP Bot Visits ---
    async logBotVisit(input: { id: string; project_id: string; bot_name: string; user_agent: string; path: string; served_optimized: boolean; ip_address: string | null }) {
      await d1.prepare(
        `INSERT INTO axp_bot_visits (id, project_id, bot_name, user_agent, path, served_optimized, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(input.id, input.project_id, input.bot_name, input.user_agent, input.path, input.served_optimized ? 1 : 0, input.ip_address).run();
    },

    async getAXPBotAnalytics(projectId: string, days: number = 30) {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { results: byBot } = await d1.prepare(
        `SELECT bot_name, COUNT(*) as visits, SUM(served_optimized) as optimized_served FROM axp_bot_visits WHERE project_id = ? AND created_at > ? GROUP BY bot_name ORDER BY visits DESC`
      ).bind(projectId, since).all();
      const { results: byPath } = await d1.prepare(
        `SELECT path, COUNT(*) as visits FROM axp_bot_visits WHERE project_id = ? AND created_at > ? GROUP BY path ORDER BY visits DESC LIMIT 20`
      ).bind(projectId, since).all();
      const { results: byDay } = await d1.prepare(
        `SELECT DATE(created_at) as day, COUNT(*) as visits FROM axp_bot_visits WHERE project_id = ? AND created_at > ? GROUP BY DATE(created_at) ORDER BY day ASC`
      ).bind(projectId, since).all();
      const totalRow = await d1.prepare(
        `SELECT COUNT(*) as total FROM axp_bot_visits WHERE project_id = ? AND created_at > ?`
      ).bind(projectId, since).first();
      return {
        total_visits: (totalRow?.total as number) || 0,
        by_bot: byBot as any[],
        by_path: byPath as any[],
        by_day: byDay as any[],
      };
    },

    // --- AXP Config ---
    async upsertAXPConfig(input: { id: string; project_id: string; origin_url: string; deploy_type: string; deploy_key: string }) {
      await d1.prepare(
        `INSERT INTO axp_configs (id, project_id, origin_url, deploy_type, deploy_key)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (project_id) DO UPDATE SET
           origin_url = EXCLUDED.origin_url, deploy_type = EXCLUDED.deploy_type,
           deploy_key = EXCLUDED.deploy_key, updated_at = datetime('now')`
      ).bind(input.id, input.project_id, input.origin_url, input.deploy_type, input.deploy_key).run();
      return await d1.prepare(`SELECT * FROM axp_configs WHERE project_id = ?`).bind(input.project_id).first() as any;
    },

    async getAXPConfig(projectId: string) {
      return await d1.prepare(`SELECT * FROM axp_configs WHERE project_id = ?`).bind(projectId).first() as any | null;
    },

    // --- Directory Submissions ---
    async upsertDirectorySubmission(input: { id: string; project_id: string; directory_slug: string; status: string; submitted_at: string | null; notes: string | null; listing_url: string | null }) {
      await d1.prepare(
        `INSERT INTO directory_submissions (id, project_id, directory_slug, status, submitted_at, notes, listing_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (project_id, directory_slug) DO UPDATE SET
           status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at,
           notes = EXCLUDED.notes, listing_url = EXCLUDED.listing_url`
      ).bind(input.id, input.project_id, input.directory_slug, input.status, input.submitted_at, input.notes, input.listing_url).run();
      return await d1.prepare(`SELECT * FROM directory_submissions WHERE project_id = ? AND directory_slug = ?`).bind(input.project_id, input.directory_slug).first() as any;
    },

    async listDirectorySubmissions(projectId: string) {
      const { results } = await d1.prepare(
        `SELECT * FROM directory_submissions WHERE project_id = ? ORDER BY created_at DESC`
      ).bind(projectId).all();
      return results as any[];
    },

    async getDirectorySubmissionStats(projectId: string) {
      const row = await d1.prepare(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
           SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
           SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped
         FROM directory_submissions WHERE project_id = ?`
      ).bind(projectId).first();
      return {
        total: (row?.total as number) || 0,
        submitted: (row?.submitted as number) || 0,
        approved: (row?.approved as number) || 0,
        pending: (row?.pending as number) || 0,
        skipped: (row?.skipped as number) || 0,
      };
    },

    async deleteDirectorySubmission(projectId: string, directorySlug: string) {
      const { meta } = await d1.prepare(
        `DELETE FROM directory_submissions WHERE project_id = ? AND directory_slug = ?`
      ).bind(projectId, directorySlug).run();
      return (meta.changes ?? 0) > 0;
    },
  };
}
