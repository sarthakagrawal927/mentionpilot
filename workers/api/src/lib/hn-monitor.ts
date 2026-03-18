// Hacker News Monitoring — uses the free, public HN Algolia API
// https://hn.algolia.com/api

const HN_API = 'https://hn.algolia.com/api/v1';

export interface HNMention {
  id: string;
  title: string | null;
  url: string | null;
  author: string;
  text: string | null;
  story_title: string | null;
  story_url: string | null;
  points: number | null;
  num_comments: number | null;
  type: 'story' | 'comment';
  created_at: string;
  hn_url: string;
}

export async function searchHN(
  query: string,
  tags?: string,
  numericFilters?: string,
  page = 0
): Promise<{ hits: HNMention[]; total: number }> {
  const params = new URLSearchParams({
    query,
    hitsPerPage: '20',
    page: String(page),
  });
  if (tags) params.set('tags', tags);
  if (numericFilters) params.set('numericFilters', numericFilters);

  const res = await fetch(`${HN_API}/search?${params}`);
  if (!res.ok) throw new Error(`HN API error: ${res.status}`);

  const data = (await res.json()) as {
    hits: Array<{
      objectID: string;
      title: string | null;
      url: string | null;
      author: string;
      comment_text: string | null;
      story_title: string | null;
      story_url: string | null;
      points: number | null;
      num_comments: number | null;
      _tags: string[];
      created_at: string;
    }>;
    nbHits: number;
  };

  const hits: HNMention[] = data.hits.map((h) => ({
    id: h.objectID,
    title: h.title,
    url: h.url,
    author: h.author,
    text: h.comment_text,
    story_title: h.story_title,
    story_url: h.story_url,
    points: h.points,
    num_comments: h.num_comments,
    type: h._tags?.includes('comment') ? 'comment' : 'story',
    created_at: h.created_at,
    hn_url: h._tags?.includes('comment')
      ? `https://news.ycombinator.com/item?id=${h.objectID}`
      : `https://news.ycombinator.com/item?id=${h.objectID}`,
  }));

  return { hits, total: data.nbHits };
}

export async function searchBrandMentions(
  brandName: string,
  aliases: string[] = [],
  days = 30
): Promise<HNMention[]> {
  const allTerms = [brandName, ...aliases];
  const allMentions: HNMention[] = [];
  const seen = new Set<string>();

  const sinceTimestamp = Math.floor((Date.now() - days * 86400000) / 1000);

  for (const term of allTerms) {
    try {
      const { hits } = await searchHN(
        `"${term}"`,
        undefined,
        `created_at_i>${sinceTimestamp}`
      );
      for (const hit of hits) {
        if (!seen.has(hit.id)) {
          seen.add(hit.id);
          allMentions.push(hit);
        }
      }
    } catch {
      // Skip failed searches
    }
  }

  return allMentions.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
