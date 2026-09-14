import type {
  UserRecord,
  BrandConfigRecord,
  PromptRecord,
  CheckRecord,
  ResultRecord,
  AIPlatform,
  Sentiment,
  CompetitorResult,
} from '@mentionpilot/shared';

// ─── Raw row types (D1 stores JSON as TEXT, booleans as 0/1) ──

export interface BrandConfigRow {
  id: string;
  project_id: string;
  brand_name: string;
  brand_aliases: string;      // JSON text
  brand_url: string | null;
  competitors: string;        // JSON text
  keywords: string;           // JSON text
  target_customer: string | null;
  monitoring_topics: string;  // JSON text
  reddit_communities: string; // JSON text
  platforms: string;           // JSON text
  openai_api_key: string | null;
  anthropic_api_key: string | null;
  google_api_key: string | null;
  perplexity_api_key: string | null;
  ai_endpoint_url: string | null;
  ai_api_key: string | null;
  ai_model: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResultRow {
  id: string;
  check_id: string;
  project_id: string;
  prompt_id: string;
  prompt_text: string | null;
  platform: string;
  model: string;
  provider_status: string;
  error_message: string | null;
  response_text: string;
  brand_mentioned: number;    // 0 | 1
  brand_sentiment: string | null;
  brand_position: number | null;
  competitors_mentioned: string; // JSON text
  citations: string;             // JSON text
  brand_cited: number;           // 0 | 1
  latency_ms: number | null;
  created_at: string;
}

// ─── Database Interface ─────────────────────────────────────
// Implementation lives in workers/api/src/db.ts

export interface DatabaseSchema {
  // ── Users ───────────────────────────────────────────────
  upsertUser(input: {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
  }): Promise<UserRecord>;

  getUserById(id: string): Promise<UserRecord | null>;

  // ── Sessions ────────────────────────────────────────────
  createSession(input: {
    token_hash: string;
    user_id: string;
    expires_at: string;
  }): Promise<void>;

  getSessionByTokenHash(
    tokenHash: string,
  ): Promise<{ user_id: string; expires_at: string } | null>;

  deleteSession(tokenHash: string): Promise<void>;

  // ── Brand Config ────────────────────────────────────────
  upsertBrandConfig(input: {
    id: string;
    project_id: string;
    brand_name: string;
    brand_aliases?: string[];
    brand_url?: string;
    competitors?: Array<{ name: string; url?: string }>;
    keywords?: string[];
    target_customer?: string;
    monitoring_topics?: string[];
    reddit_communities?: string[];
    platforms?: AIPlatform[];
    openai_api_key?: string;
    anthropic_api_key?: string;
    google_api_key?: string;
    perplexity_api_key?: string;
    ai_endpoint_url?: string;
    ai_api_key?: string;
    ai_model?: string;
  }): Promise<BrandConfigRecord>;

  getBrandConfig(projectId: string): Promise<BrandConfigRow | null>;

  deleteBrandConfig(projectId: string): Promise<boolean>;

  // ── Prompts ─────────────────────────────────────────────
  createPrompt(input: {
    id: string;
    project_id: string;
    prompt_text: string;
    category?: string;
  }): Promise<PromptRecord>;

  listPrompts(projectId: string): Promise<PromptRecord[]>;

  deletePrompt(id: string): Promise<boolean>;

  countPrompts(projectId: string): Promise<number>;

  // ── Checks ──────────────────────────────────────────────
  createCheck(input: {
    id: string;
    project_id: string;
    total_queries: number;
  }): Promise<CheckRecord>;

  updateCheck(
    id: string,
    input: Partial<{
      status: 'running' | 'completed' | 'failed';
      completed_queries: number;
      brand_mention_rate: number | null;
      summary: string;
      completed_at: string;
    }>,
  ): Promise<CheckRecord | null>;

  listChecks(projectId: string, limit?: number): Promise<CheckRecord[]>;

  getCheckById(id: string): Promise<CheckRecord | null>;

  // ── Results ─────────────────────────────────────────────
  createResult(input: {
    id: string;
    check_id: string;
    project_id: string;
    prompt_id: string;
    prompt_text?: string;
    platform: AIPlatform;
    model: string;
    provider_status?: 'success' | 'error';
    error_message?: string;
    response_text: string;
    brand_mentioned: boolean;
    brand_sentiment?: Sentiment;
    brand_position?: number;
    competitors_mentioned?: CompetitorResult[];
    citations?: string[];
    brand_cited?: boolean;
    latency_ms?: number;
  }): Promise<void>;

  listResults(checkId: string): Promise<ResultRecord[]>;
}

// Re-export shared types for convenience
export type {
  UserRecord,
  BrandConfigRecord,
  PromptRecord,
  CheckRecord,
  ResultRecord,
  AIPlatform,
  Sentiment,
  CompetitorResult,
} from '@mentionpilot/shared';
