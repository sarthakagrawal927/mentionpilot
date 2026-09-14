// AI query engine for MentionPilot
// Uses a single OpenAI-compatible endpoint configured by the user.

import type { AIPlatform } from '@mentionpilot/shared';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface AiEndpointConfig {
  endpointUrl: string;
  apiKey: string;
  model: string;
}

export interface QueryEndpointOptions {
  json?: boolean;
  maxTokens?: number;
  projectId?: string;
}

export const DEFAULT_WORKERS_AI_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';

export interface PlatformResponse {
  responseText: string;
  model: string;
  latencyMs: number;
}

export interface CompetitorMention {
  name: string;
  mentioned: boolean;
  position: number | null;
}

export interface AnalysisResult {
  brand_mentioned: boolean;
  brand_sentiment: Sentiment | null;
  brand_position: number | null;
  competitors_mentioned: CompetitorMention[];
  citations: string[];
  brand_cited: boolean;
}

export function detectAIPlatform(endpointUrl: string): AIPlatform {
  try {
    const hostname = new URL(endpointUrl).hostname.toLowerCase();
    if (hostname === 'api.openai.com') return 'openai';
    if (hostname === 'api.anthropic.com') return 'anthropic';
    if (hostname === 'generativelanguage.googleapis.com') return 'google';
    if (hostname === 'api.perplexity.ai') return 'perplexity';
  } catch {
    // Treat malformed or unrecognized endpoint URLs as custom evidence sources.
  }
  return 'custom';
}

// ---------------------------------------------------------------------------
// Query an OpenAI-compatible endpoint
// ---------------------------------------------------------------------------

export async function queryEndpoint(
  config: AiEndpointConfig,
  prompt: string,
  options: QueryEndpointOptions = {},
): Promise<PlatformResponse> {
  const start = Date.now();
  const res = await fetch(config.endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens ?? 1024,
      stream: false,
      ...(options.json ? { response_format: { type: 'json_object' } } : {}),
      ...(options.projectId ? { project_id: options.projectId } : {}),
    }),
    redirect: 'manual',
    signal: AbortSignal.timeout(30_000),
  });
  const latencyMs = Date.now() - start;

  if (res.status >= 300 && res.status < 400) {
    throw new Error(`AI endpoint refused redirect (${res.status})`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI endpoint error (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    model?: string;
  };

  const responseText =
    (json.choices?.[0]?.message?.content || '').slice(0, 4000);

  return {
    responseText,
    model: json.model || config.model,
    latencyMs,
  };
}

export async function queryWorkersAi(
  ai: Ai,
  promptText: string,
  model = DEFAULT_WORKERS_AI_MODEL,
): Promise<PlatformResponse> {
  const start = Date.now();
  const result = await ai.run(model, {
    messages: [{ role: 'user', content: promptText }],
    max_tokens: 512,
  });
  const responseText = typeof result.response === 'string' ? result.response : '';

  if (!responseText) {
    throw new Error('Workers AI returned an empty response');
  }

  return {
    responseText,
    model,
    latencyMs: Date.now() - start,
  };
}

// ---------------------------------------------------------------------------
// Analyze a response for brand mentions, sentiment, position, etc.
// ---------------------------------------------------------------------------

export function analyzeResponse(
  text: string,
  brandName: string,
  brandAliases: string[],
  brandUrl: string | null,
  competitors: { name: string }[]
): AnalysisResult {
  const allBrandTerms = [brandName, ...brandAliases];

  // -- Mention detection --
  const brand_mentioned = allBrandTerms.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
  });

  // -- Position detection (numbered lists) --
  let brand_position: number | null = null;
  const listItemRegex = /^\s*(\d+)[.)]\s*\**\s*([^\n]+)/gm;
  let match;
  while ((match = listItemRegex.exec(text)) !== null) {
    const itemText = match[2];
    if (
      allBrandTerms.some((term) =>
        new RegExp(
          `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
          'i'
        ).test(itemText)
      )
    ) {
      brand_position = parseInt(match[1], 10);
      break;
    }
  }

  // -- Sentiment analysis (keyword scan in brand-containing sentences) --
  let brand_sentiment: Sentiment | null = null;
  if (brand_mentioned) {
    const positiveWords = [
      'best', 'great', 'excellent', 'top', 'leading', 'popular', 'powerful',
      'recommended', 'outstanding', 'innovative', 'reliable', 'favorite', 'preferred',
    ];
    const negativeWords = [
      'worst', 'bad', 'poor', 'lacking', 'limited', 'expensive', 'outdated',
      'difficult', 'slow', 'unreliable', 'disappointing',
    ];

    const sentences = text.split(/[.!?]+/);
    const brandSentences = sentences.filter((s) =>
      allBrandTerms.some((term) =>
        new RegExp(
          `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
          'i'
        ).test(s)
      )
    );
    const context = brandSentences.join(' ').toLowerCase();

    const posCount = positiveWords.filter((w) => context.includes(w)).length;
    const negCount = negativeWords.filter((w) => context.includes(w)).length;

    if (posCount > negCount) brand_sentiment = 'positive';
    else if (negCount > posCount) brand_sentiment = 'negative';
    else brand_sentiment = 'neutral';
  }

  // -- Competitor detection --
  const competitors_mentioned: CompetitorMention[] = competitors.map((comp) => {
    const escaped = comp.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mentioned = new RegExp(`\\b${escaped}\\b`, 'i').test(text);
    let position: number | null = null;
    if (mentioned) {
      const listMatch = text.match(
        new RegExp(`^\\s*(\\d+)[.)]\\s*\\**\\s*[^\\n]*\\b${escaped}\\b`, 'im')
      );
      if (listMatch) position = parseInt(listMatch[1], 10);
    }
    return { name: comp.name, mentioned, position };
  });

  // -- Citation extraction --
  const urlRegex = /https?:\/\/[^\s)>\]"',]+/g;
  const citations = [...new Set(text.match(urlRegex) || [])];
  const brand_cited = brandUrl
    ? citations.some((url) =>
        url
          .toLowerCase()
          .includes(
            brandUrl
              .toLowerCase()
              .replace(/^https?:\/\//, '')
              .replace(/\/$/, '')
          )
      )
    : false;

  return {
    brand_mentioned,
    brand_sentiment,
    brand_position,
    competitors_mentioned,
    citations,
    brand_cited,
  };
}

// ---------------------------------------------------------------------------
// Orchestrator — run a full mention check
// ---------------------------------------------------------------------------

interface ConfigRow {
  ai_endpoint_url: string | null;
  ai_api_key: string | null;
  ai_model: string | null;
  brand_name: string;
  brand_aliases: string; // JSON stringified string[]
  brand_url: string | null;
  competitors: string; // JSON stringified { name: string }[]
}

interface PromptRow {
  id: string;
  prompt_text: string;
}

interface DbHandle {
  createResult(input: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateCheck(id: string, updates: Record<string, unknown>): Promise<void>;
}

export async function runMentionCheck(
  db: DbHandle,
  config: ConfigRow,
  prompts: PromptRow[],
  checkId: string,
  projectId: string
): Promise<void> {
  const brandAliases: string[] = JSON.parse(config.brand_aliases);
  const competitors: { name: string }[] = JSON.parse(config.competitors);

  if (!config.ai_endpoint_url || !config.ai_api_key || !config.ai_model) {
    await db.updateCheck(checkId, {
      status: 'failed',
      summary: 'AI endpoint not configured. Set endpoint URL, API key, and model in settings.',
      completed_at: new Date().toISOString(),
    });
    return;
  }

  const endpointConfig: AiEndpointConfig = {
    endpointUrl: config.ai_endpoint_url,
    apiKey: config.ai_api_key,
    model: config.ai_model,
  };
  const platform = detectAIPlatform(config.ai_endpoint_url);

  let completedQueries = 0;
  let mentionCount = 0;
  let successfulQueries = 0;
  let failedQueries = 0;

  try {
    for (const prompt of prompts) {
      try {
        const response = await queryEndpoint(endpointConfig, prompt.prompt_text);
        const analysis = analyzeResponse(
          response.responseText,
          config.brand_name,
          brandAliases,
          config.brand_url,
          competitors
        );

        await db.createResult({
          id: crypto.randomUUID(),
          check_id: checkId,
          project_id: projectId,
          prompt_id: prompt.id,
          prompt_text: prompt.prompt_text,
          platform,
          model: response.model,
          provider_status: 'success',
          error_message: null,
          response_text: response.responseText,
          brand_mentioned: analysis.brand_mentioned,
          brand_sentiment: analysis.brand_sentiment,
          brand_position: analysis.brand_position,
          competitors_mentioned: JSON.stringify(analysis.competitors_mentioned),
          citations: JSON.stringify(analysis.citations),
          brand_cited: analysis.brand_cited,
          latency_ms: response.latencyMs,
        });

        if (analysis.brand_mentioned) mentionCount++;
        successfulQueries++;
      } catch (err) {
        const errorMessage = (err as Error).message.slice(0, 500);
        await db.createResult({
          id: crypto.randomUUID(),
          check_id: checkId,
          project_id: projectId,
          prompt_id: prompt.id,
          prompt_text: prompt.prompt_text,
          platform,
          model: endpointConfig.model,
          provider_status: 'error',
          error_message: errorMessage,
          response_text: '',
          brand_mentioned: false,
          brand_sentiment: null,
          brand_position: null,
          competitors_mentioned: '[]',
          citations: '[]',
          brand_cited: false,
          latency_ms: null,
        });
        failedQueries++;
      }

      completedQueries++;
      await db.updateCheck(checkId, { completed_queries: completedQueries });
    }

    const mentionRate = successfulQueries > 0 ? mentionCount / successfulQueries : null;
    await db.updateCheck(checkId, {
      status: successfulQueries > 0 ? 'completed' : 'failed',
      brand_mention_rate: mentionRate,
      summary: successfulQueries > 0
        ? `Brand mentioned in ${mentionCount}/${successfulQueries} available responses (${Math.round((mentionRate ?? 0) * 100)}%); ${failedQueries} provider ${failedQueries === 1 ? 'request was' : 'requests were'} unavailable.`
        : `Provider unavailable for all ${failedQueries} attempted queries.`,
      completed_at: new Date().toISOString(),
    });
  } catch (err) {
    await db.updateCheck(checkId, {
      status: 'failed',
      summary: `Check failed: ${(err as Error).message}`,
      completed_at: new Date().toISOString(),
    });
  }
}
