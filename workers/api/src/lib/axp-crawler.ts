interface CrawledPage {
  url: string;
  path: string;
  title: string;
  html: string;
  optimizedContent: string;
  sourceTokenCount: number;
  optimizedTokenCount: number;
}

// Rough token estimation (4 chars ~ 1 token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Extract readable text from HTML, removing scripts, styles, nav, footer
function extractMainContent(html: string): string {
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '');

  // Remove HTML comments
  clean = clean.replace(/<!--[\s\S]*?-->/g, '');

  return clean;
}

// Generate an AI-optimized version of a page
function optimizePage(html: string, url: string): { content: string; title: string } {
  const mainContent = extractMainContent(html);

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const title = (ogTitleMatch?.[1] || titleMatch?.[1] || '').trim();

  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const description = (ogDescMatch?.[1] || descMatch?.[1] || '').trim();

  // Extract h1
  const h1Match = mainContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';

  // Extract h2s
  const h2Matches = [...mainContent.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  const h2s = h2Matches.map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);

  // Extract h3s for structure
  const h3Matches = [...mainContent.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)];
  const _h3s = h3Matches.map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);

  // Extract list items
  const liMatches = [...mainContent.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  const listItems = liMatches
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(s => s.length > 5 && s.length < 200)
    .slice(0, 20);

  // Extract paragraphs (meaningful ones)
  const pMatches = [...mainContent.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  const paragraphs = pMatches
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(s => s.length > 30)
    .slice(0, 10);

  // Extract structured data (JSON-LD)
  const jsonLdMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const structuredData: any[] = [];
  for (const m of jsonLdMatches) {
    try { structuredData.push(JSON.parse(m[1])); } catch {}
  }

  // Extract pricing if present
  const priceMatches = [...mainContent.matchAll(/\$\d+(?:\.\d{2})?(?:\s*\/\s*(?:mo|month|year|yr))?/gi)];
  const prices = [...new Set(priceMatches.map(m => m[0]))].slice(0, 5);

  // Build optimized markdown
  let content = '';

  // Title
  content += `# ${title || h1 || 'Untitled Page'}\n\n`;

  // URL
  content += `URL: ${url}\n\n`;

  // Description
  if (description) {
    content += `> ${description}\n\n`;
  }

  // Main heading content
  if (h1 && h1 !== title) {
    content += `## ${h1}\n\n`;
  }

  // Key paragraphs (first 3)
  if (paragraphs.length > 0) {
    for (const p of paragraphs.slice(0, 3)) {
      content += `${p}\n\n`;
    }
  }

  // Sections from h2s
  if (h2s.length > 0) {
    for (const h2 of h2s.slice(0, 8)) {
      content += `## ${h2}\n\n`;
    }
  }

  // Features / list items
  if (listItems.length > 0) {
    content += `## Key Points\n\n`;
    for (const item of listItems.slice(0, 15)) {
      content += `- ${item}\n`;
    }
    content += '\n';
  }

  // Pricing
  if (prices.length > 0) {
    content += `## Pricing\n\n`;
    for (const price of prices) {
      content += `- ${price}\n`;
    }
    content += '\n';
  }

  // Structured data summary
  for (const sd of structuredData) {
    if (sd['@type'] === 'Organization' || sd['@type'] === 'WebSite') {
      if (sd.name) content += `Organization: ${sd.name}\n`;
      if (sd.description) content += `${sd.description}\n`;
      content += '\n';
    }
    if (sd['@type'] === 'FAQPage' && sd.mainEntity) {
      content += `## FAQ\n\n`;
      for (const q of sd.mainEntity.slice(0, 10)) {
        content += `**Q: ${q.name}**\n`;
        if (q.acceptedAnswer?.text) {
          content += `A: ${q.acceptedAnswer.text.slice(0, 200)}\n\n`;
        }
      }
    }
  }

  return { content: content.trim(), title };
}

// Discover pages from sitemap or internal links
async function discoverPages(baseUrl: string, maxPages: number = 20): Promise<string[]> {
  const pages = new Set<string>();
  const origin = new URL(baseUrl).origin;

  // Try sitemap.xml first
  try {
    const sitemapRes = await fetch(`${origin}/sitemap.xml`, {
      headers: { 'User-Agent': 'MentionPilot/1.0 (AXP Crawler)' },
      redirect: 'follow',
    });
    if (sitemapRes.ok) {
      const xml = await sitemapRes.text();
      const urlMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)];
      for (const m of urlMatches) {
        if (pages.size >= maxPages) break;
        const url = m[1].trim();
        if (url.startsWith(origin)) pages.add(url);
      }
    }
  } catch {}

  // If no sitemap or not enough pages, crawl homepage for internal links
  if (pages.size < maxPages) {
    try {
      const homeRes = await fetch(baseUrl, {
        headers: { 'User-Agent': 'MentionPilot/1.0 (AXP Crawler)' },
        redirect: 'follow',
      });
      if (homeRes.ok) {
        const html = await homeRes.text();
        const linkMatches = [...html.matchAll(/href=["'](\/[^"'#?]*|https?:\/\/[^"'#?]*?)["']/gi)];
        for (const m of linkMatches) {
          if (pages.size >= maxPages) break;
          let url = m[1];
          if (url.startsWith('/')) url = `${origin}${url}`;
          if (url.startsWith(origin) && !url.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i)) {
            pages.add(url);
          }
        }
      }
    } catch {}
  }

  // Always include the base URL
  pages.add(baseUrl);

  return [...pages].slice(0, maxPages);
}

// Crawl a single page and generate optimized version
async function crawlAndOptimize(url: string): Promise<CrawledPage | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MentionPilot/1.0 (AXP Crawler)' },
      redirect: 'follow',
    });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;

    const html = await res.text();
    const { content, title } = optimizePage(html, url);
    const path = new URL(url).pathname || '/';

    return {
      url,
      path,
      title,
      html,
      optimizedContent: content,
      sourceTokenCount: estimateTokens(html),
      optimizedTokenCount: estimateTokens(content),
    };
  } catch {
    return null;
  }
}

// Main export: crawl entire site and generate optimized versions
export async function crawlSiteForAXP(
  baseUrl: string,
  maxPages: number = 20
): Promise<CrawledPage[]> {
  if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;

  const urls = await discoverPages(baseUrl, maxPages);
  const results: CrawledPage[] = [];

  // Crawl in batches of 5 to avoid overwhelming the target
  for (let i = 0; i < urls.length; i += 5) {
    const batch = urls.slice(i, i + 5);
    const batchResults = await Promise.allSettled(
      batch.map(url => crawlAndOptimize(url))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    }
  }

  return results;
}

export { optimizePage, estimateTokens, discoverPages };
export type { CrawledPage };
