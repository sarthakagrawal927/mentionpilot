import { describe, expect, it } from 'vitest';
import {
  auditBrandEvidence,
  clusterCompetitorPerception,
  competitorPromptSet,
  rankCommunityOpportunities,
} from '@mentionpilot/shared';
import {
  rankRedditInsightsPosts,
  selectRedditInsightsCommunities,
  type RedditInsightsIndex,
} from '../lib/reddit-insights';
import { readBoundedResponseText } from '../lib/bounded-response';

describe('brand intelligence primitives', () => {
  it('labels evidence gaps and returns prioritized remediation tasks', () => {
    const audit = auditBrandEvidence({
      brandName: 'Acme',
      brandUrl: 'https://acme.example',
      buyerMission: 'help product teams monitor AI visibility',
      evidenceText: 'A product platform for teams. Contact us to learn more.',
    });

    expect(audit.overallScore).toBeGreaterThanOrEqual(0);
    expect(audit.overallScore).toBeLessThanOrEqual(100);
    expect(audit.scores).toHaveLength(8);
    expect(audit.tasks.some((task) => task.area === 'pricing')).toBe(true);
  });

  it('creates reusable competitor prompts without synthetic answers', () => {
    const prompts = competitorPromptSet({
      brand: 'Acme',
      competitor: 'Rival',
      mission: 'monitor AI visibility',
    });

    expect(prompts.length).toBeGreaterThan(5);
    expect(prompts.every((prompt) => prompt.prompt.includes('Acme') || prompt.key === 'category')).toBe(true);
    expect(prompts.some((prompt) => prompt.prompt.includes('Rival'))).toBe(true);
  });

  it('ranks keyword-matched purchase and complaint opportunities', () => {
    const ranked = rankCommunityOpportunities([
      {
        id: '1', source: 'test', url: 'https://example.com/1',
        title: 'Looking for an Acme alternative', body: 'We have budget to switch.',
        publishedAt: '2026-09-13T00:00:00.000Z',
      },
      {
        id: '2', source: 'test', url: 'https://example.com/2',
        title: 'Unrelated launch', body: 'Nothing relevant here.',
        publishedAt: '2026-09-13T00:00:00.000Z',
      },
    ], ['Acme'], { now: new Date('2026-09-13T12:00:00.000Z') });

    expect(ranked).toHaveLength(1);
    expect(ranked[0].intent).toBe('purchase_intent');
  });

  it('clusters attributable brand and competitor text deterministically', () => {
    const result = clusterCompetitorPerception([
      { id: '1', brand: 'Acme', isCompetitor: false, source: 'hn', url: 'https://example.com/1', text: 'Acme is easy and useful.' },
      { id: '2', brand: 'Rival', isCompetitor: true, source: 'reddit', url: 'https://example.com/2', text: 'Rival pricing is confusing.' },
    ]);

    expect(result.ownedMentions).toBe(1);
    expect(result.competitorMentions).toBe(1);
    expect(result.clusters.some((cluster) => cluster.bucket === 'pricing')).toBe(true);
  });
});

describe('Reddit Insights adapter', () => {
  const index: RedditInsightsIndex = {
    schema: 'reddit-insights.display.v1',
    communities: 2,
    records: 20,
    rows: [
      { subreddit: 'SaaS', records: 10, grade: 'strong', bytes: 100, chunk: '/data/SaaS.json.gz' },
      { subreddit: 'marketing', records: 10, grade: 'limited', bytes: 100, chunk: '/data/marketing.json.gz' },
    ],
  };

  it('matches configured communities case-insensitively and reports missing names', () => {
    const selected = selectRedditInsightsCommunities(index, ['saas', 'unknown']);
    expect(selected.selected.map((row) => row.subreddit)).toEqual(['SaaS']);
    expect(selected.missing).toEqual(['unknown']);
  });

  it('retains source URLs and excludes records outside the requested window', () => {
    const findings = rankRedditInsightsPosts({
      schema: 'reddit-insights.display.v1',
      subreddit: 'SaaS',
      generatedFrom: '2026-09-13T00:00:00.000Z',
      coverage: { grade: 'strong', summary: 'Sampled archive', totalRecords: 2 },
      posts: [
        {
          id: 'recent', permalink: '/r/SaaS/comments/recent/item/',
          title: 'Need an Acme alternative', selftext: 'Looking to buy this week.',
          score: 4, num_comments: 2, created_utc: 1789257600,
        },
        {
          id: 'old', permalink: '/r/SaaS/comments/old/item/',
          title: 'Acme history', selftext: '', score: 1, num_comments: 0,
          created_utc: 1704067200,
        },
      ],
    }, ['Acme'], new Date('2026-09-01T00:00:00.000Z'));

    expect(findings).toHaveLength(1);
    expect(findings[0].url).toBe('https://www.reddit.com/r/SaaS/comments/recent/item/');
    expect(findings[0].subreddit).toBe('SaaS');
  });
});

describe('bounded response reads', () => {
  it('returns responses within the configured limit', async () => {
    await expect(readBoundedResponseText(new Response('small'), 10)).resolves.toBe('small');
  });

  it('rejects responses that exceed the configured limit', async () => {
    await expect(readBoundedResponseText(new Response('too large'), 4)).rejects.toThrow(
      'Response exceeds the supported size'
    );
  });
});
