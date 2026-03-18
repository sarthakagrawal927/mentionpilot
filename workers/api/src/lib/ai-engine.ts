// AI query engine for MentionPilot
// Queries multiple AI platforms, detects brand mentions, and analyzes responses.

export type Platform = 'openai' | 'anthropic' | 'google' | 'perplexity';
export type Sentiment = 'positive' | 'neutral' | 'negative';

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

interface PlatformConfig {
  url: string;
  model: string;
  buildRequest: (apiKey: string, prompt: string) => { url: string; init: RequestInit };
  parseResponse: (json: Record<string, unknown>) => string;
}

// ---------------------------------------------------------------------------
// Platform configurations
// ---------------------------------------------------------------------------

const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    buildRequest: (apiKey, prompt) => ({
      url: 'https://api.openai.com/v1/chat/completions',
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
        }),
      },
    }),
    parseResponse: (json: Record<string, unknown>) => {
      const choices = json.choices as Array<{ message?: { content?: string } }> | undefined;
      return choices?.[0]?.message?.content || '';
    },
  },

  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-haiku-4-5-20251001',
    buildRequest: (apiKey, prompt) => ({
      url: 'https://api.anthropic.com/v1/messages',
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      },
    }),
    parseResponse: (json: Record<string, unknown>) => {
      const content = json.content as Array<{ text?: string }> | undefined;
      return content?.[0]?.text || '';
    },
  },

  google: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    model: 'gemini-2.0-flash',
    buildRequest: (apiKey, prompt) => ({
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024 },
        }),
      },
    }),
    parseResponse: (json: Record<string, unknown>) => {
      const candidates = json.candidates as Array<{
        content?: { parts?: Array<{ text?: string }> };
      }> | undefined;
      return candidates?.[0]?.content?.parts?.[0]?.text || '';
    },
  },

  perplexity: {
    url: 'https://api.perplexity.ai/chat/completions',
    model: 'sonar',
    buildRequest: (apiKey, prompt) => ({
      url: 'https://api.perplexity.ai/chat/completions',
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
        }),
      },
    }),
    parseResponse: (json: Record<string, unknown>) => {
      const choices = json.choices as Array<{ message?: { content?: string } }> | undefined;
      return choices?.[0]?.message?.content || '';
    },
  },
};

// ---------------------------------------------------------------------------
// Query a single platform
// ---------------------------------------------------------------------------

export async function queryPlatform(
  platform: Platform,
  apiKey: string,
  prompt: string
): Promise<PlatformResponse> {
  const config = PLATFORM_CONFIGS[platform];
  const { url, init } = config.buildRequest(apiKey, prompt);

  const start = Date.now();
  const res = await fetch(url, init);
  const latencyMs = Date.now() - start;

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${platform} API error (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as Record<string, unknown>;
  const responseText = config.parseResponse(json).slice(0, 4000);

  return { responseText, model: config.model, latencyMs };
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
// Orchestrator — run a full mention check across all platforms and prompts
// ---------------------------------------------------------------------------

interface ConfigRow {
  openai_api_key: string | null;
  anthropic_api_key: string | null;
  google_api_key: string | null;
  perplexity_api_key: string | null;
  brand_name: string;
  brand_aliases: string; // JSON stringified string[]
  brand_url: string | null;
  competitors: string; // JSON stringified { name: string }[]
  platforms: string; // JSON stringified Platform[]
}

interface PromptRow {
  id: string;
  prompt_text: string;
}

function getApiKey(config: ConfigRow, platform: Platform): string | null {
  const keyMap: Record<Platform, string | null> = {
    openai: config.openai_api_key,
    anthropic: config.anthropic_api_key,
    google: config.google_api_key,
    perplexity: config.perplexity_api_key,
  };
  return keyMap[platform];
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
  const platforms: Platform[] = JSON.parse(config.platforms);
  const brandAliases: string[] = JSON.parse(config.brand_aliases);
  const competitors: { name: string }[] = JSON.parse(config.competitors);

  const activePlatforms = platforms.filter((p) => getApiKey(config, p));
  let completedQueries = 0;
  let mentionCount = 0;
  let totalQueries = 0;

  try {
    for (const prompt of prompts) {
      const platformPromises = activePlatforms.map(async (platform) => {
        const apiKey = getApiKey(config, platform)!;
        try {
          const response = await queryPlatform(platform, apiKey, prompt.prompt_text);
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
            platform,
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
            platform,
            model: PLATFORM_CONFIGS[platform].model,
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
      });

      const results = await Promise.allSettled(platformPromises);
      completedQueries += results.length;

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
