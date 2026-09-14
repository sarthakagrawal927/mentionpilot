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
        `SELECT user_id, expires_at FROM sessions
         WHERE token_hash = ? AND julianday(expires_at) > julianday('now')`
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
                bc.openai_api_key, bc.anthropic_api_key, bc.google_api_key, bc.perplexity_api_key,
                bc.ai_endpoint_url, bc.ai_api_key, bc.ai_model
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
      competitors: string; keywords: string; target_customer: string | null;
      monitoring_topics: string; reddit_communities: string; platforms: string;
      openai_api_key: string | null; anthropic_api_key: string | null;
      google_api_key: string | null; perplexity_api_key: string | null;
      ai_endpoint_url: string | null; ai_api_key: string | null; ai_model: string | null;
    }) {
      await d1.prepare(
        `INSERT INTO brand_configs (id, project_id, brand_name, brand_aliases, brand_url, competitors, keywords, target_customer, monitoring_topics, reddit_communities, platforms, openai_api_key, anthropic_api_key, google_api_key, perplexity_api_key, ai_endpoint_url, ai_api_key, ai_model)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (project_id) DO UPDATE SET
           brand_name = EXCLUDED.brand_name, brand_aliases = EXCLUDED.brand_aliases,
           brand_url = EXCLUDED.brand_url, competitors = EXCLUDED.competitors,
           keywords = EXCLUDED.keywords, target_customer = EXCLUDED.target_customer,
           monitoring_topics = EXCLUDED.monitoring_topics,
           reddit_communities = EXCLUDED.reddit_communities,
           platforms = EXCLUDED.platforms,
           openai_api_key = COALESCE(EXCLUDED.openai_api_key, brand_configs.openai_api_key),
           anthropic_api_key = COALESCE(EXCLUDED.anthropic_api_key, brand_configs.anthropic_api_key),
           google_api_key = COALESCE(EXCLUDED.google_api_key, brand_configs.google_api_key),
           perplexity_api_key = COALESCE(EXCLUDED.perplexity_api_key, brand_configs.perplexity_api_key),
           ai_endpoint_url = COALESCE(EXCLUDED.ai_endpoint_url, brand_configs.ai_endpoint_url),
           ai_api_key = COALESCE(EXCLUDED.ai_api_key, brand_configs.ai_api_key),
           ai_model = COALESCE(EXCLUDED.ai_model, brand_configs.ai_model),
           updated_at = datetime('now')`
      ).bind(
        input.id, input.project_id, input.brand_name, input.brand_aliases,
        input.brand_url, input.competitors, input.keywords, input.target_customer,
        input.monitoring_topics, input.reddit_communities, input.platforms,
        input.openai_api_key, input.anthropic_api_key, input.google_api_key, input.perplexity_api_key,
        input.ai_endpoint_url, input.ai_api_key, input.ai_model
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
        `INSERT INTO results (id, check_id, project_id, prompt_id, prompt_text, platform, model, provider_status, error_message, response_text, brand_mentioned, brand_sentiment, brand_position, competitors_mentioned, citations, brand_cited, latency_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        input.id, input.check_id, input.project_id, input.prompt_id,
        input.prompt_text ?? null, input.platform, input.model,
        input.provider_status ?? 'success', input.error_message ?? null, input.response_text,
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

    // --- Brand Intelligence Findings ---
    async upsertFinding(input: {
      id: string; project_id: string; source: string; source_record_id: string;
      source_name: string; title: string; content: string | null; url: string;
      author: string | null; published_at: string | null;
      engagement_score: number | null; comment_count: number | null;
      relevance_score: number; intent: string; matched_keywords: string;
    }) {
      const { meta } = await d1.prepare(
        `INSERT OR IGNORE INTO findings
          (id, project_id, source, source_record_id, source_name, title, content, url,
           author, published_at, engagement_score, comment_count, relevance_score,
           intent, matched_keywords)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        input.id, input.project_id, input.source, input.source_record_id,
        input.source_name, input.title, input.content, input.url, input.author,
        input.published_at, input.engagement_score, input.comment_count,
        input.relevance_score, input.intent, input.matched_keywords
      ).run();

      const inserted = (meta.changes ?? 0) > 0;
      if (!inserted) {
        await d1.prepare(
          `UPDATE findings SET
             source_name = ?, title = ?, content = ?, url = ?, author = ?,
             published_at = ?, engagement_score = ?, comment_count = ?,
             relevance_score = ?, intent = ?, matched_keywords = ?,
             last_seen_at = datetime('now')
           WHERE project_id = ? AND source = ? AND source_record_id = ?`
        ).bind(
          input.source_name, input.title, input.content, input.url, input.author,
          input.published_at, input.engagement_score, input.comment_count,
          input.relevance_score, input.intent, input.matched_keywords,
          input.project_id, input.source, input.source_record_id
        ).run();
      } else {
        await d1.prepare(
          `INSERT INTO finding_history (id, finding_id, project_id, action)
           VALUES (?, ?, ?, 'created')`
        ).bind(crypto.randomUUID(), input.id, input.project_id).run();
      }

      return await d1.prepare(
        `SELECT * FROM findings WHERE project_id = ? AND source = ? AND source_record_id = ?`
      ).bind(input.project_id, input.source, input.source_record_id).first() as any;
    },

    async listFindings(
      projectId: string,
      filters: { status?: string; source?: string; limit?: number } = {}
    ) {
      const clauses = ['project_id = ?'];
      const values: unknown[] = [projectId];
      if (filters.status) { clauses.push('status = ?'); values.push(filters.status); }
      if (filters.source) { clauses.push('source = ?'); values.push(filters.source); }
      values.push(Math.min(Math.max(filters.limit ?? 100, 1), 200));
      const { results } = await d1.prepare(
        `SELECT * FROM findings WHERE ${clauses.join(' AND ')}
         ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'reviewed' THEN 1 ELSE 2 END,
                  relevance_score DESC, published_at DESC
         LIMIT ?`
      ).bind(...values).all();
      return results as any[];
    },

    async getFindingSummary(projectId: string) {
      const row = await d1.prepare(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS new_count,
                SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) AS reviewed_count,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_count,
                SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) AS dismissed_count
         FROM findings WHERE project_id = ?`
      ).bind(projectId).first();
      return {
        total: Number(row?.total ?? 0),
        new: Number(row?.new_count ?? 0),
        reviewed: Number(row?.reviewed_count ?? 0),
        resolved: Number(row?.resolved_count ?? 0),
        dismissed: Number(row?.dismissed_count ?? 0),
      };
    },

    async getFinding(projectId: string, id: string) {
      return await d1.prepare(
        `SELECT * FROM findings WHERE project_id = ? AND id = ?`
      ).bind(projectId, id).first() as any | null;
    },

    async updateFindingStatus(input: {
      id: string; project_id: string; status: string; action: string; note?: string | null;
    }) {
      const existing = await d1.prepare(
        `SELECT * FROM findings WHERE id = ? AND project_id = ?`
      ).bind(input.id, input.project_id).first() as any | null;
      if (!existing) return null;
      if (existing.status === input.status) return existing;

      await d1.prepare(
        `UPDATE findings SET status = ? WHERE id = ? AND project_id = ?`
      ).bind(input.status, input.id, input.project_id).run();
      await d1.prepare(
        `INSERT INTO finding_history (id, finding_id, project_id, action, note)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(), input.id, input.project_id, input.action, input.note ?? null
      ).run();
      return await d1.prepare(`SELECT * FROM findings WHERE id = ?`).bind(input.id).first() as any;
    },

    async listFindingHistory(projectId: string, limit = 50) {
      const { results } = await d1.prepare(
        `SELECT h.*, f.title AS finding_title, f.source AS finding_source
         FROM finding_history h
         JOIN findings f ON f.id = h.finding_id
         WHERE h.project_id = ? ORDER BY h.created_at DESC LIMIT ?`
      ).bind(projectId, Math.min(Math.max(limit, 1), 100)).all();
      return results as any[];
    },

    async createFindingTask(input: {
      id: string; finding_id: string; project_id: string; title: string;
    }) {
      const finding = await d1.prepare(
        `SELECT id FROM findings WHERE id = ? AND project_id = ?`
      ).bind(input.finding_id, input.project_id).first();
      if (!finding) return null;
      await d1.prepare(
        `INSERT INTO finding_tasks (id, finding_id, project_id, title) VALUES (?, ?, ?, ?)`
      ).bind(input.id, input.finding_id, input.project_id, input.title).run();
      await d1.prepare(
        `INSERT INTO finding_history (id, finding_id, project_id, action, note)
         VALUES (?, ?, ?, 'task_created', ?)`
      ).bind(crypto.randomUUID(), input.finding_id, input.project_id, input.title).run();
      return await d1.prepare(`SELECT * FROM finding_tasks WHERE id = ?`).bind(input.id).first() as any;
    },

    async listFindingTasks(projectId: string, limit = 50) {
      const { results } = await d1.prepare(
        `SELECT t.*, f.title AS finding_title, f.source AS finding_source
         FROM finding_tasks t
         JOIN findings f ON f.id = t.finding_id
         WHERE t.project_id = ?
         ORDER BY CASE t.status WHEN 'open' THEN 0 ELSE 1 END, t.created_at DESC
         LIMIT ?`
      ).bind(projectId, Math.min(Math.max(limit, 1), 100)).all();
      return results as any[];
    },

    async updateFindingTaskStatus(input: {
      id: string; project_id: string; status: 'open' | 'completed';
    }) {
      const existing = await d1.prepare(
        `SELECT * FROM finding_tasks WHERE id = ? AND project_id = ?`
      ).bind(input.id, input.project_id).first() as any | null;
      if (!existing) return null;
      if (existing.status === input.status) return existing;
      await d1.prepare(
        `UPDATE finding_tasks SET status = ?,
           completed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE NULL END
         WHERE id = ? AND project_id = ?`
      ).bind(input.status, input.status, input.id, input.project_id).run();
      await d1.prepare(
        `INSERT INTO finding_history (id, finding_id, project_id, action, note)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(), existing.finding_id, input.project_id,
        input.status === 'completed' ? 'task_completed' : 'task_reopened', existing.title
      ).run();
      return await d1.prepare(`SELECT * FROM finding_tasks WHERE id = ?`).bind(input.id).first() as any;
    },

    async recordSourceSync(input: {
      id: string; refresh_id: string; project_id: string; source: string; status: string;
      records_seen: number; records_matched: number;
      source_updated_at: string | null; message: string;
    }) {
      await d1.prepare(
        `INSERT INTO source_syncs
          (id, refresh_id, project_id, source, status, records_seen, records_matched, source_updated_at, message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        input.id, input.refresh_id, input.project_id, input.source, input.status,
        input.records_seen, input.records_matched, input.source_updated_at, input.message
      ).run();
    },

    async listLatestSourceSyncs(projectId: string) {
      const { results } = await d1.prepare(
        `SELECT s.* FROM source_syncs s
         WHERE s.project_id = ?
           AND s.id = (
             SELECT latest.id FROM source_syncs latest
             WHERE latest.project_id = s.project_id AND latest.source = s.source
             ORDER BY latest.created_at DESC, latest.rowid DESC LIMIT 1
           )
         ORDER BY s.source ASC`
      ).bind(projectId).all();
      return results as any[];
    },

    async getSignalRefreshCount(projectId: string) {
      const row = await d1.prepare(
        `SELECT COUNT(*) AS total FROM signal_refreshes WHERE project_id = ?`
      ).bind(projectId).first();
      return Number(row?.total ?? 0);
    },

    async countRecentSignalRefreshes(projectId: string, sinceMinutes: number) {
      const row = await d1.prepare(
        `SELECT COUNT(*) AS total FROM signal_refreshes
         WHERE project_id = ? AND created_at > datetime('now', '-' || ? || ' minutes')`
      ).bind(projectId, sinceMinutes).first();
      return Number(row?.total ?? 0);
    },

    async beginSignalRefresh(id: string, projectId: string) {
      await d1.prepare(
        `INSERT INTO signal_refreshes (id, project_id) VALUES (?, ?)`
      ).bind(id, projectId).run();
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
        `SELECT COUNT(*) AS total FROM free_checks
         WHERE ip_address = ?
           AND status IN ('running', 'completed')
           AND created_at > datetime('now', '-' || ? || ' minutes')`
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

    // --- API Keys ---
    async createApiKey(input: {
      id: string;
      user_id: string;
      name: string;
      key_hash: string;
      key_prefix: string;
      scopes: string[];
      expires_at: string | null;
    }) {
      await d1.prepare(
        `INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, scopes, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        input.id, input.user_id, input.name, input.key_hash,
        input.key_prefix, JSON.stringify(input.scopes), input.expires_at
      ).run();
      return await d1.prepare(`SELECT * FROM api_keys WHERE id = ?`).bind(input.id).first() as any;
    },

    async getApiKeyByHash(keyHash: string) {
      return await d1.prepare(
        `SELECT * FROM api_keys
         WHERE key_hash = ?
           AND revoked_at IS NULL
           AND (expires_at IS NULL OR expires_at > datetime('now'))`
      ).bind(keyHash).first() as { id: string; user_id: string; scopes: string } | null;
    },

    async listApiKeysByUser(userId: string) {
      const { results } = await d1.prepare(
        `SELECT id, name, key_prefix, scopes, last_used_at, expires_at, revoked_at, created_at
         FROM api_keys WHERE user_id = ? ORDER BY created_at DESC`
      ).bind(userId).all();
      return results as any[];
    },

    async touchApiKeyUsed(id: string) {
      await d1.prepare(
        `UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?`
      ).bind(id).run();
    },

    async revokeApiKey(id: string, userId: string) {
      const { meta } = await d1.prepare(
        `UPDATE api_keys SET revoked_at = datetime('now')
         WHERE id = ? AND user_id = ? AND revoked_at IS NULL`
      ).bind(id, userId).run();
      return (meta.changes ?? 0) > 0;
    },
  };
}
