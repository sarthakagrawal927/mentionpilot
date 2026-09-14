import { Hono } from 'hono';
import {
  auditBrandEvidence,
  clusterCompetitorPerception,
  rankCommunityOpportunities,
  type CommunityOpportunityInput,
  type FindingAction,
  type FindingRecord,
  type FindingSource,
  type FindingStatus,
  type PerceptionMention,
  type SignalInboxResponse,
  type SourceCoverageRecord,
} from '@mentionpilot/shared';
import type { Bindings, Variables } from '../types';
import { requireSession, verifyProjectOwnership } from '../middleware/auth';
import { searchHN, type HNMention } from '../lib/hn-monitor';
import { searchRedditInsights } from '../lib/reddit-insights';
import { validatePublicUrl } from '../lib/url-validator';
import { readBoundedResponseText } from '../lib/bounded-response';

const intelligence = new Hono<{ Bindings: Bindings; Variables: Variables }>();
intelligence.use('*', requireSession);

const VALID_STATUSES: FindingStatus[] = ['new', 'reviewed', 'dismissed', 'resolved'];
const VALID_SOURCES: FindingSource[] = ['hackernews', 'reddit_insights'];
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

async function fetchPublicEvidencePage(input: string) {
  let currentUrl = validatePublicUrl(input);

  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await fetch(currentUrl, {
      headers: { 'User-Agent': 'MentionPilot/1.0 (evidence-readiness audit)' },
      redirect: 'manual',
    });
    if (!REDIRECT_STATUSES.has(response.status)) {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return {
        finalUrl: currentUrl,
        html: await readBoundedResponseText(response, 2_000_000),
      };
    }

    if (redirects === 3) throw new Error('Too many redirects');
    const location = response.headers.get('location');
    if (!location) throw new Error('Redirect response did not include a location');
    currentUrl = validatePublicUrl(new URL(location, currentUrl).toString());
  }

  throw new Error('Could not resolve the public URL');
}

function parseJsonList<T>(value: unknown): T[] {
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function containsTerm(text: string, term: string) {
  const escaped = term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped ? new RegExp(`(^|\\W)${escaped}(?=$|\\W)`, 'i').test(text) : false;
}

function toFindingRecord(row: any): FindingRecord {
  return {
    ...row,
    engagement_score: row.engagement_score == null ? null : Number(row.engagement_score),
    comment_count: row.comment_count == null ? null : Number(row.comment_count),
    relevance_score: Number(row.relevance_score ?? 0),
    matched_keywords: parseJsonList<string>(row.matched_keywords),
  };
}

function sourceLabel(source: string) {
  return source === 'hackernews' ? 'Hacker News' : 'Reddit Insights';
}

function toCoverage(row: any): SourceCoverageRecord {
  return {
    source: row.source,
    label: sourceLabel(row.source),
    status: row.status,
    records_seen: Number(row.records_seen ?? 0),
    records_matched: Number(row.records_matched ?? 0),
    source_updated_at: row.source_updated_at || null,
    checked_at: row.created_at || null,
    message: row.message,
  };
}

function plannedCoverage(): SourceCoverageRecord[] {
  return [
    {
      source: 'f5bot',
      label: 'F5Bot',
      status: 'planned',
      records_seen: 0,
      records_matched: 0,
      source_updated_at: null,
      checked_at: null,
      message: 'Planned input. No validated ingestion contract is configured.',
    },
    {
      source: 'google_trends',
      label: 'Google Trends',
      status: 'planned',
      records_seen: 0,
      records_matched: 0,
      source_updated_at: null,
      checked_at: null,
      message: 'Planned input. No validated ingestion contract is configured.',
    },
  ];
}

async function buildInbox(
  result: NonNullable<Awaited<ReturnType<typeof verifyProjectOwnership>>>,
  filters: { status?: FindingStatus; source?: FindingSource; limit?: number }
): Promise<SignalInboxResponse> {
  const [rows, allRows, summary, syncRows, history, tasks, refreshCount] = await Promise.all([
    result.db.listFindings(result.project.id, filters),
    result.db.listFindings(result.project.id, { limit: 200 }),
    result.db.getFindingSummary(result.project.id),
    result.db.listLatestSourceSyncs(result.project.id),
    result.db.listFindingHistory(result.project.id, 30),
    result.db.listFindingTasks(result.project.id, 30),
    result.db.getSignalRefreshCount(result.project.id),
  ]);
  const config = await result.db.getBrandConfig(result.project.id);
  const competitors: Array<{ name: string }> = parseJsonList(config?.competitors);
  const brandName = config?.brand_name || 'Your brand';
  const brandTerms = [brandName, ...parseJsonList<string>(config?.brand_aliases)];
  const perception = clusterCompetitorPerception(
    allRows.flatMap((row: any) => {
      const text = `${row.title}\n${row.content ?? ''}`;
      const mentions: PerceptionMention[] = [];
      if (brandTerms.some((term) => containsTerm(text, term))) {
        mentions.push({
          id: `${row.id}:brand`, brand: brandName, isCompetitor: false,
          source: row.source, url: row.url, text,
        });
      }
      competitors.forEach((competitor) => {
        if (containsTerm(text, competitor.name)) {
          mentions.push({
            id: `${row.id}:competitor:${competitor.name}`,
            brand: competitor.name, isCompetitor: true,
            source: row.source, url: row.url, text,
          });
        }
      });
      return mentions;
    })
  );

  const coverageBySource = new Map<string, SourceCoverageRecord>(
    syncRows.map((row: any): [string, SourceCoverageRecord] => [row.source, toCoverage(row)])
  );
  const configuredCommunities = parseJsonList<string>(config?.reddit_communities);
  const coverage: SourceCoverageRecord[] = [
    coverageBySource.get('hackernews') ?? {
      source: 'hackernews',
      label: 'Hacker News',
      status: 'unavailable',
      records_seen: 0,
      records_matched: 0,
      source_updated_at: null,
      checked_at: null,
      message: 'Not checked yet. Refresh the inbox to search the live HN index.',
    },
    coverageBySource.get('reddit_insights') ?? {
      source: 'reddit_insights',
      label: 'Reddit Insights',
      status: 'unavailable',
      records_seen: 0,
      records_matched: 0,
      source_updated_at: null,
      checked_at: null,
      message: configuredCommunities.length
        ? 'Not checked yet. Refresh the inbox to search the configured communities.'
        : 'Add up to five Reddit communities to the brand profile before refreshing.',
    },
    ...plannedCoverage(),
  ];
  const decidedFindings = summary.reviewed + summary.resolved + summary.dismissed;
  const resolvedFindings = summary.reviewed + summary.resolved;

  return {
    findings: rows.map(toFindingRecord),
    summary,
    coverage,
    history,
    tasks,
    metrics: {
      useful_finding_rate: decidedFindings > 0
        ? (summary.reviewed + summary.resolved) / decidedFindings
        : null,
      actionable_findings: summary.new + summary.reviewed,
      resolution_rate: resolvedFindings > 0 ? summary.resolved / resolvedFindings : null,
      refresh_count: refreshCount,
    },
    perception,
  };
}

async function searchHackerNews(terms: string[], since: Date) {
  const sinceTimestamp = Math.floor(since.getTime() / 1000);
  const searches = await Promise.allSettled(
    terms.slice(0, 8).map((term) =>
      searchHN(`"${term}"`, undefined, `created_at_i>${sinceTimestamp}`)
    )
  );
  const mentions = new Map<string, HNMention>();
  let recordsSeen = 0;
  let failedSearches = 0;
  for (const search of searches) {
    if (search.status === 'rejected') {
      failedSearches += 1;
      continue;
    }
    recordsSeen += search.value.hits.length;
    search.value.hits.forEach((mention) => mentions.set(mention.id, mention));
  }
  return { mentions: [...mentions.values()], recordsSeen, failedSearches, searches: searches.length };
}

async function storeHackerNewsFindings(
  result: NonNullable<Awaited<ReturnType<typeof verifyProjectOwnership>>>,
  mentions: HNMention[],
  keywords: string[]
) {
  const inputs: CommunityOpportunityInput[] = mentions.map((mention) => ({
    id: mention.id,
    source: 'hackernews',
    url: mention.hn_url,
    title: mention.title || mention.story_title || 'Hacker News comment',
    body: mention.text || null,
    publishedAt: mention.created_at,
  }));
  const ranked = rankCommunityOpportunities(inputs, keywords, { minimumScore: 20 }).slice(0, 100);
  const mentionById = new Map<string, HNMention>(
    mentions.map((mention): [string, HNMention] => [mention.id, mention])
  );
  for (const finding of ranked) {
    const mention = mentionById.get(finding.id);
    await result.db.upsertFinding({
      id: crypto.randomUUID(),
      project_id: result.project.id,
      source: 'hackernews',
      source_record_id: finding.id,
      source_name: 'Hacker News',
      title: finding.title,
      content: finding.body || null,
      url: finding.url,
      author: mention?.author || null,
      published_at: finding.publishedAt || null,
      engagement_score: mention?.points ?? null,
      comment_count: mention?.num_comments ?? null,
      relevance_score: finding.score,
      intent: finding.intent,
      matched_keywords: JSON.stringify(finding.matchedKeywords),
    });
  }
  return ranked.length;
}

intelligence.get('/:projectId/inbox', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);

  const rawStatus = c.req.query('status');
  const rawSource = c.req.query('source');
  if (rawStatus && !VALID_STATUSES.includes(rawStatus as FindingStatus)) {
    return c.json({ error: 'Invalid finding status' }, 400);
  }
  if (rawSource && !VALID_SOURCES.includes(rawSource as FindingSource)) {
    return c.json({ error: 'Invalid finding source' }, 400);
  }

  return c.json(await buildInbox(result, {
    status: rawStatus as FindingStatus | undefined,
    source: rawSource as FindingSource | undefined,
    limit: Number(c.req.query('limit') || 100),
  }));
});

intelligence.post('/:projectId/refresh', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);
  if (await result.db.countRecentSignalRefreshes(result.project.id, 1) >= 3) {
    return c.json({ error: 'Refresh limit exceeded. Try again in a minute.' }, 429);
  }
  const config = await result.db.getBrandConfig(result.project.id);
  if (!config) return c.json({ error: 'Configure the brand profile first' }, 400);

  const body = await c.req.json().catch(() => ({})) as { days?: number };
  const days = [7, 30, 90].includes(Number(body.days)) ? Number(body.days) : 90;
  const since = new Date(Date.now() - days * 86_400_000);
  const aliases = parseJsonList<string>(config.brand_aliases);
  const keywords = parseJsonList<string>(config.keywords);
  const topics = parseJsonList<string>(config.monitoring_topics);
  const communities = parseJsonList<string>(config.reddit_communities);
  const competitors = parseJsonList<{ name: string }>(config.competitors);
  const searchTerms = [...new Set([
    config.brand_name,
    ...aliases,
    ...keywords,
    ...topics,
    ...competitors.map((competitor) => competitor.name),
  ].map((term) => term.trim()).filter(Boolean))].slice(0, 20);
  const refreshId = crypto.randomUUID();
  await result.db.beginSignalRefresh(refreshId, result.project.id);

  const [hnResult, redditResult] = await Promise.allSettled([
    searchHackerNews(searchTerms, since),
    communities.length
      ? searchRedditInsights({ communities, keywords: searchTerms, since })
      : Promise.resolve(null),
  ]);

  if (hnResult.status === 'fulfilled') {
    const matched = await storeHackerNewsFindings(result, hnResult.value.mentions, searchTerms);
    const status = hnResult.value.failedSearches === 0
      ? 'ok'
      : hnResult.value.failedSearches === hnResult.value.searches ? 'failed' : 'partial';
    await result.db.recordSourceSync({
      id: crypto.randomUUID(),
      refresh_id: refreshId,
      project_id: result.project.id,
      source: 'hackernews',
      status,
      records_seen: hnResult.value.recordsSeen,
      records_matched: matched,
      source_updated_at: status === 'failed' ? null : new Date().toISOString(),
      message: `${hnResult.value.searches - hnResult.value.failedSearches}/${hnResult.value.searches} bounded term searches completed against the live HN Algolia index (${searchTerms.length} configured; maximum 8 per refresh).`,
    });
  } else {
    await result.db.recordSourceSync({
      id: crypto.randomUUID(), project_id: result.project.id, source: 'hackernews',
      refresh_id: refreshId,
      status: 'failed', records_seen: 0, records_matched: 0, source_updated_at: null,
      message: `Hacker News refresh failed: ${hnResult.reason instanceof Error ? hnResult.reason.message : 'unknown error'}`,
    });
  }

  if (redditResult.status === 'fulfilled' && redditResult.value) {
    for (const finding of redditResult.value.findings) {
      await result.db.upsertFinding({
        id: crypto.randomUUID(),
        project_id: result.project.id,
        source: 'reddit_insights',
        source_record_id: finding.id,
        source_name: `Reddit Insights · r/${finding.subreddit}`,
        title: finding.title,
        content: finding.body || null,
        url: finding.url,
        author: null,
        published_at: finding.publishedAt || null,
        engagement_score: finding.scoreCount,
        comment_count: finding.commentCount,
        relevance_score: finding.score,
        intent: finding.intent,
        matched_keywords: JSON.stringify(finding.matchedKeywords),
      });
    }
    const unavailable = [
      ...redditResult.value.missingCommunities,
      ...redditResult.value.failedCommunities,
    ];
    const redditStatus = redditResult.value.communities.length === 0
      ? 'unavailable'
      : unavailable.length ? 'partial' : 'ok';
    await result.db.recordSourceSync({
      id: crypto.randomUUID(),
      refresh_id: refreshId,
      project_id: result.project.id,
      source: 'reddit_insights',
      status: redditStatus,
      records_seen: redditResult.value.recordsSeen,
      records_matched: redditResult.value.findings.length,
      source_updated_at: redditResult.value.sourceUpdatedAt,
      message: `Searched ${redditResult.value.communities.length}/${communities.length} configured static community archives. Coverage is sampled and incomplete${unavailable.length ? `; unavailable: ${unavailable.join(', ')}` : ''}.`,
    });
  } else if (redditResult.status === 'fulfilled') {
    await result.db.recordSourceSync({
      id: crypto.randomUUID(), project_id: result.project.id, source: 'reddit_insights',
      refresh_id: refreshId,
      status: 'unavailable', records_seen: 0, records_matched: 0, source_updated_at: null,
      message: 'No Reddit communities are configured. Add subreddit names to the brand profile.',
    });
  } else {
    await result.db.recordSourceSync({
      id: crypto.randomUUID(), project_id: result.project.id, source: 'reddit_insights',
      refresh_id: refreshId,
      status: 'failed', records_seen: 0, records_matched: 0, source_updated_at: null,
      message: `Reddit Insights refresh failed: ${redditResult.reason instanceof Error ? redditResult.reason.message : 'unknown error'}`,
    });
  }

  return c.json(await buildInbox(result, { limit: 100 }));
});

intelligence.patch('/:projectId/findings/:findingId', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);
  const body = await c.req.json() as { status?: FindingStatus; note?: string };
  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return c.json({ error: 'Valid status is required' }, 400);
  }
  const action: FindingAction = body.status === 'new' ? 'reopened' : body.status;
  const finding = await result.db.updateFindingStatus({
    id: c.req.param('findingId'),
    project_id: result.project.id,
    status: body.status,
    action,
    note: body.note?.trim().slice(0, 500) || null,
  });
  if (!finding) return c.json({ error: 'Finding not found' }, 404);
  return c.json(toFindingRecord(finding));
});

intelligence.post('/:projectId/findings/:findingId/tasks', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);
  const body = await c.req.json().catch(() => ({})) as { title?: string };
  const matchedFinding = await result.db.getFinding(
    result.project.id, c.req.param('findingId')
  );
  if (!matchedFinding) return c.json({ error: 'Finding not found' }, 404);
  const title = body.title?.trim().slice(0, 200) || `Follow up: ${matchedFinding.title}`.slice(0, 200);
  const task = await result.db.createFindingTask({
    id: crypto.randomUUID(),
    finding_id: matchedFinding.id,
    project_id: result.project.id,
    title,
  });
  if (!task) return c.json({ error: 'Finding not found' }, 404);
  return c.json(task, 201);
});

intelligence.patch('/:projectId/tasks/:taskId', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);
  const body = await c.req.json() as { status?: 'open' | 'completed' };
  if (body.status !== 'open' && body.status !== 'completed') {
    return c.json({ error: 'Task status must be open or completed' }, 400);
  }
  const task = await result.db.updateFindingTaskStatus({
    id: c.req.param('taskId'), project_id: result.project.id, status: body.status,
  });
  if (!task) return c.json({ error: 'Task not found' }, 404);
  return c.json(task);
});

intelligence.post('/:projectId/evidence-audit', async (c) => {
  const result = await verifyProjectOwnership(c, c.req.param('projectId'));
  if (!result) return c.json({ error: 'Forbidden' }, 403);
  const config = await result.db.getBrandConfig(result.project.id);
  if (!config?.brand_url) return c.json({ error: 'Add a public brand URL first' }, 400);

  let url: string;
  try {
    url = validatePublicUrl(config.brand_url);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }

  try {
    const { finalUrl, html } = await fetchPublicEvidencePage(url);
    const evidenceText = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 100_000);
    const topics = parseJsonList<string>(config.monitoring_topics);
    const targetCustomer = config.target_customer || 'prospective buyers';
    const audit = auditBrandEvidence({
      brandName: config.brand_name,
      brandUrl: url,
      buyerMission: topics.length
        ? `help ${targetCustomer} with ${topics.join(', ')}`
        : `help ${targetCustomer} evaluate ${config.brand_name}`,
      targetSegment: config.target_customer || null,
      competitors: parseJsonList(config.competitors),
      evidenceText,
      evidenceUrls: [finalUrl],
    });
    return c.json({
      audit,
      audited_url: finalUrl,
      checked_at: new Date().toISOString(),
      limitation: 'Heuristic homepage audit. Scores describe visible evidence patterns, not provider coverage or factual verification.',
    });
  } catch (error) {
    return c.json({ error: `Could not audit ${url}: ${(error as Error).message}` }, 400);
  }
});

export { intelligence };
