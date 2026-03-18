// Product Hunt Monitoring — MVP approach via HN Algolia API
// Searches for PH-related stories and "Show HN" posts mentioning the brand.
// PH launches frequently get crossposted to HN, making this a reliable signal.

const HN_API = 'https://hn.algolia.com/api/v1';

export interface PHMention {
  id: string;
  title: string;
  tagline: string | null;
  url: string;
  votes: number | null;
  created_at: string;
  source: 'hn_crosspost' | 'direct';
}

export async function searchProductHunt(brandName: string): Promise<PHMention[]> {
  try {
    const res = await fetch(
      `${HN_API}/search?query="${encodeURIComponent(brandName)}"&tags=story&hitsPerPage=20`
    );
    if (!res.ok) return [];

    const data = (await res.json()) as {
      hits: Array<{
        objectID: string;
        title: string | null;
        url: string | null;
        points: number | null;
        created_at: string;
      }>;
    };

    const hits = data.hits || [];

    // Filter to only Product Hunt related stories or Show HN posts
    const phHits = hits.filter(
      (h) =>
        (h.url && h.url.includes('producthunt.com')) ||
        (h.title && h.title.toLowerCase().includes('product hunt')) ||
        (h.title && h.title.toLowerCase().includes('show hn'))
    );

    return phHits.map((h) => ({
      id: h.objectID,
      title: h.title || '',
      tagline: null,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      votes: h.points,
      created_at: h.created_at,
      source: h.url?.includes('producthunt.com')
        ? ('direct' as const)
        : ('hn_crosspost' as const),
    }));
  } catch {
    return [];
  }
}
