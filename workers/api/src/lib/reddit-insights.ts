import {
  rankCommunityOpportunities,
  type CommunityOpportunity,
  type CommunityOpportunityInput,
} from '@mentionpilot/shared';
import { readBoundedResponseBytes, readBoundedStream } from './bounded-response';

const REDDIT_INSIGHTS_ORIGIN = 'https://reddit-insights.highsignal.app';
const DISPLAY_SCHEMA = 'reddit-insights.display.v1';
const MAX_COMMUNITIES = 5;
const MAX_COMPRESSED_CHUNK_BYTES = 1_500_000;
const MAX_DECOMPRESSED_CHUNK_BYTES = 8_000_000;

export interface RedditInsightsIndexRow {
  subreddit: string;
  records: number;
  grade: 'strong' | 'limited' | 'sparse';
  bytes: number;
  chunk: string;
}

export interface RedditInsightsIndex {
  schema: string;
  communities: number;
  records: number;
  rows: RedditInsightsIndexRow[];
}

interface RedditInsightsPost {
  id: string;
  permalink: string;
  title: string;
  selftext?: string;
  score?: number;
  num_comments?: number;
  created_utc: number;
}

interface RedditInsightsChunk {
  schema: string;
  subreddit: string;
  generatedFrom: string | null;
  coverage: {
    grade: 'strong' | 'limited' | 'sparse';
    summary: string;
    totalRecords: number;
  };
  posts: RedditInsightsPost[];
}

export interface RedditInsightsFinding extends CommunityOpportunity {
  subreddit: string;
  scoreCount: number | null;
  commentCount: number | null;
}

export interface RedditInsightsSearchResult {
  findings: RedditInsightsFinding[];
  recordsSeen: number;
  communities: Array<{ subreddit: string; grade: string; generatedFrom: string | null }>;
  missingCommunities: string[];
  failedCommunities: string[];
  sourceUpdatedAt: string | null;
}

export function selectRedditInsightsCommunities(
  index: RedditInsightsIndex,
  requested: string[]
) {
  const byName = new Map<string, RedditInsightsIndexRow>(
    index.rows.map((row): [string, RedditInsightsIndexRow] => [row.subreddit.toLowerCase(), row])
  );
  const selected: RedditInsightsIndexRow[] = [];
  const missing: string[] = [];

  for (const name of [...new Set(requested.map((item) => item.trim()).filter(Boolean))].slice(0, MAX_COMMUNITIES)) {
    const row = byName.get(name.toLowerCase());
    if (row) selected.push(row);
    else missing.push(name);
  }

  return { selected, missing };
}

function toOpportunityInput(post: RedditInsightsPost, subreddit: string): CommunityOpportunityInput {
  return {
    id: post.id,
    source: 'reddit_insights',
    url: `https://www.reddit.com${post.permalink}`,
    title: post.title || 'Untitled Reddit post',
    body: post.selftext || null,
    publishedAt: Number.isFinite(post.created_utc)
      ? new Date(post.created_utc * 1000).toISOString()
      : null,
  };
}

export function rankRedditInsightsPosts(
  chunk: RedditInsightsChunk,
  keywords: string[],
  since: Date
): RedditInsightsFinding[] {
  const candidates = chunk.posts
    .filter((post) => Number.isFinite(post.created_utc) && post.created_utc * 1000 >= since.getTime())
    .map((post) => ({ post, input: toOpportunityInput(post, chunk.subreddit) }));
  const postById = new Map<string, RedditInsightsPost>(
    candidates.map(({ post }): [string, RedditInsightsPost] => [post.id, post])
  );

  return rankCommunityOpportunities(
    candidates.map(({ input }) => input),
    keywords,
    { minimumScore: 20 }
  ).map((opportunity) => {
    const post = postById.get(opportunity.id);
    return {
      ...opportunity,
      subreddit: chunk.subreddit,
      scoreCount: post?.score ?? null,
      commentCount: post?.num_comments ?? null,
    };
  });
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const bytes = await readBoundedResponseBytes(response, MAX_COMPRESSED_CHUNK_BYTES);

  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const decompressed = await readBoundedStream(stream, MAX_DECOMPRESSED_CHUNK_BYTES);
    return JSON.parse(new TextDecoder().decode(decompressed)) as T;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

async function fetchJson<T>(url: string, fetcher: typeof fetch): Promise<T> {
  const response = await fetcher(url, {
    headers: { 'User-Agent': 'MentionPilot/1.0 (Reddit Insights consumer)' },
  });
  if (!response.ok) throw new Error(`Reddit Insights returned HTTP ${response.status}`);
  return readJsonResponse<T>(response);
}

export async function searchRedditInsights(
  input: { communities: string[]; keywords: string[]; since: Date },
  fetcher: typeof fetch = fetch
): Promise<RedditInsightsSearchResult> {
  const index = await fetchJson<RedditInsightsIndex>(
    `${REDDIT_INSIGHTS_ORIGIN}/data/index.json`,
    fetcher
  );
  if (index.schema !== DISPLAY_SCHEMA || !Array.isArray(index.rows)) {
    throw new Error('Unsupported Reddit Insights index schema');
  }

  const { selected, missing } = selectRedditInsightsCommunities(index, input.communities);
  const settled = await Promise.allSettled(
    selected.map(async (row) => {
      if (row.bytes > MAX_COMPRESSED_CHUNK_BYTES) {
        throw new Error(`${row.subreddit} chunk exceeds the supported size`);
      }
      const chunk = await fetchJson<RedditInsightsChunk>(
        new URL(row.chunk, REDDIT_INSIGHTS_ORIGIN).toString(),
        fetcher
      );
      if (chunk.schema !== DISPLAY_SCHEMA || chunk.subreddit !== row.subreddit) {
        throw new Error(`Unexpected Reddit Insights chunk for ${row.subreddit}`);
      }
      return { row, chunk };
    })
  );

  const findings: RedditInsightsFinding[] = [];
  const communities: RedditInsightsSearchResult['communities'] = [];
  const failedCommunities: string[] = [];
  let recordsSeen = 0;

  settled.forEach((result, indexPosition) => {
    if (result.status === 'rejected') {
      failedCommunities.push(selected[indexPosition].subreddit);
      return;
    }
    const { row, chunk } = result.value;
    recordsSeen += row.records;
    communities.push({
      subreddit: row.subreddit,
      grade: chunk.coverage.grade,
      generatedFrom: chunk.generatedFrom,
    });
    findings.push(...rankRedditInsightsPosts(chunk, input.keywords, input.since));
  });

  const sourceDates = communities
    .map((community) => community.generatedFrom)
    .filter((date): date is string => Boolean(date))
    .sort();

  return {
    findings: findings.sort((left, right) => right.score - left.score).slice(0, 100),
    recordsSeen,
    communities,
    missingCommunities: missing,
    failedCommunities,
    sourceUpdatedAt: sourceDates.at(-1) ?? null,
  };
}
