export interface SiteInfo {
  brand_name: string;
  description: string;
  category: string | null;
  features: string[];
  competitors_mentioned: string[];
}

export async function crawlSite(url: string): Promise<SiteInfo> {
  // Normalize URL
  if (!url.startsWith('http')) url = `https://${url}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'MentionPilot/1.0 (AI Visibility Check)' },
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);

  const html = await res.text();

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || '';

  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const description = descMatch?.[1]?.trim() || '';

  // Extract og:title as fallback
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const ogTitle = ogTitleMatch?.[1]?.trim() || '';

  // Extract og:description
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const ogDesc = ogDescMatch?.[1]?.trim() || '';

  // Extract h1 tags
  const h1Matches = [...html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)];
  const h1s = h1Matches.map(m => m[1].trim()).filter(Boolean);

  // Extract h2 tags for features
  const h2Matches = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)];
  const h2s = h2Matches.map(m => m[1].trim()).filter(Boolean);

  // Derive brand name from title or og:title
  const brandName = (ogTitle || title).split(/[-\u2013|]/)[0].trim() || new URL(url).hostname.split('.')[0];

  // Derive features from h2s (take first 5)
  const features = h2s.slice(0, 5);

  // Try to find category keywords
  const fullText = `${title} ${description} ${ogDesc} ${h1s.join(' ')} ${h2s.join(' ')}`.toLowerCase();
  const categories = ['crm', 'analytics', 'feedback', 'project management', 'email', 'marketing', 'saas', 'api', 'database', 'hosting', 'e-commerce', 'design', 'productivity', 'collaboration', 'security', 'monitoring', 'testing', 'devops', 'ai', 'automation'];
  const category = categories.find(c => fullText.includes(c)) || null;

  return {
    brand_name: brandName,
    description: ogDesc || description || h1s[0] || '',
    category,
    features,
    competitors_mentioned: [],
  };
}

export function generatePrompts(info: SiteInfo): string[] {
  const { brand_name, description, category } = info;
  const prompts: string[] = [];

  // Generic category prompts
  if (category) {
    prompts.push(`What are the best ${category} tools available right now?`);
    prompts.push(`Can you recommend a good ${category} solution for a small business?`);
  }

  // Brand-specific prompts
  if (description) {
    prompts.push(`What tools can help me with ${description.slice(0, 100).toLowerCase()}?`);
  }

  prompts.push(`Have you heard of ${brand_name}? What do you think of it?`);
  prompts.push(`What are the top alternatives to ${brand_name}?`);

  // Ensure we have exactly 5
  const defaults = [
    `What software would you recommend for a startup looking to improve their online presence?`,
    `What are the most popular SaaS tools for small teams?`,
    `Can you compare different tools for managing customer feedback?`,
  ];

  while (prompts.length < 5) {
    prompts.push(defaults[prompts.length - 2] || `What do you know about ${brand_name}?`);
  }

  return prompts.slice(0, 5);
}
