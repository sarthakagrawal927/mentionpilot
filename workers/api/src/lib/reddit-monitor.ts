// Reddit Monitoring — uses Reddit's public JSON endpoints (no auth needed)
// Append .json to any Reddit URL for JSON response

const REDDIT_BASE = 'https://www.reddit.com';

export interface RedditMention {
  id: string;
  title: string | null;
  selftext: string | null;
  author: string;
  subreddit: string;
  score: number;
  num_comments: number;
  url: string;
  permalink: string;
  type: 'post' | 'comment';
  body: string | null; // for comments
  created_at: string;
}

export async function searchReddit(
  query: string,
  sort: 'relevance' | 'new' = 'new',
  timeFilter: 'day' | 'week' | 'month' | 'year' | 'all' = 'month',
  limit: number = 25
): Promise<{ mentions: RedditMention[]; total: number }> {
  const params = new URLSearchParams({
    q: query,
    sort,
    t: timeFilter,
    limit: String(limit),
    restrict_sr: '',
    type: 'link,comment',
  });

  const res = await fetch(`${REDDIT_BASE}/search.json?${params}`, {
    headers: { 'User-Agent': 'MentionPilot/1.0 (AI Visibility Monitor)' },
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error('Reddit rate limit. Try again in a minute.');
    throw new Error(`Reddit API error: ${res.status}`);
  }

  const data = (await res.json()) as any;
  const children = data?.data?.children || [];

  const mentions: RedditMention[] = children.map((child: any) => {
    const d = child.data;
    const isComment = child.kind === 't1';
    return {
      id: d.id,
      title: isComment ? null : d.title,
      selftext: isComment ? null : (d.selftext || '').slice(0, 500),
      author: d.author,
      subreddit: d.subreddit,
      score: d.score || 0,
      num_comments: d.num_comments || 0,
      url: isComment ? `https://reddit.com${d.permalink}` : (d.url || ''),
      permalink: `https://reddit.com${d.permalink}`,
      type: isComment ? 'comment' : 'post',
      body: isComment ? (d.body || '').slice(0, 500) : null,
      created_at: new Date((d.created_utc || 0) * 1000).toISOString(),
    };
  });

  return { mentions, total: data?.data?.dist || mentions.length };
}

export async function searchBrandOnReddit(
  brandName: string,
  aliases: string[] = [],
  timeFilter: 'week' | 'month' | 'year' = 'month'
): Promise<RedditMention[]> {
  const allTerms = [brandName, ...aliases];
  const allMentions: RedditMention[] = [];
  const seen = new Set<string>();

  for (const term of allTerms) {
    try {
      // Add small delay between requests to respect rate limits
      if (allTerms.indexOf(term) > 0) {
        await new Promise((r) => setTimeout(r, 1000));
      }
      const { mentions } = await searchReddit(`"${term}"`, 'new', timeFilter, 25);
      for (const m of mentions) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          allMentions.push(m);
        }
      }
    } catch {
      // Skip failed searches (rate limited etc)
    }
  }

  return allMentions.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
