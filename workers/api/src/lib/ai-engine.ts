// AI query engine for MentionPilot
// Uses a single OpenAI-compatible endpoint configured by the user.

import { fetchChatCompletion } from '@saas-maker/ai';
import type { AIConfig } from '@saas-maker/ai';

export type Sentiment = 'positive' | 'neutral' | 'negative';

/** @deprecated Use AIConfig from @saas-maker/ai */
export type AiEndpointConfig = AIConfig;

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

// ---------------------------------------------------------------------------
// Query an OpenAI-compatible endpoint
// ---------------------------------------------------------------------------

export async function queryEndpoint(
  config: AIConfig,
  prompt: string
): Promise<PlatformResponse> {
  const start = Date.now();
  const res = await fetchChatCompletion({
    config,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 1024,
    stream: false,
  });
  const latencyMs = Date.now() - start;

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

  let completedQueries = 0;
  let mentionCount = 0;
  let totalQueries = 0;

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
          platform: 'custom',
          model: response.model,
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
        totalQueries++;
      } catch (err) {
        await db.createResult({
          id: crypto.randomUUID(),
          check_id: checkId,
          project_id: projectId,
          prompt_id: prompt.id,
          platform: 'custom',
          model: endpointConfig.model,
          response_text: `Error: ${(err as Error).message}`,
          brand_mentioned: false,
          brand_sentiment: null,
          brand_position: null,
          competitors_mentioned: '[]',
          citations: '[]',
          brand_cited: false,
          latency_ms: null,
        });
        totalQueries++;
      }

      completedQueries++;
      await db.updateCheck(checkId, { completed_queries: completedQueries });
    }

    const mentionRate = totalQueries > 0 ? mentionCount / totalQueries : 0;
    await db.updateCheck(checkId, {
      status: 'completed',
      brand_mention_rate: mentionRate,
      summary: `Brand mentioned in ${mentionCount}/${totalQueries} queries (${Math.round(mentionRate * 100)}%)`,
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
