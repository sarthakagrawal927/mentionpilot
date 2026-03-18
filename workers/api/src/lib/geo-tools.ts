// GEO (Generative Engine Optimization) analysis tools
// Analyzes websites for AI visibility: scoring, crawlability, schema, and llms.txt generation.

// ---------------------------------------------------------------------------
// GEO Score Checker
// ---------------------------------------------------------------------------

export interface GEOScore {
  overall: number; // 0-100
  authority: number; // citations, stats, expert quotes
  readability: number; // headings, summaries, FAQ format
  structure: number; // schema markup, modular content, semantic HTML
  recommendations: string[];
}

export function analyzeGEOScore(html: string, url: string): GEOScore {
  let authority = 0;
  let readability = 0;
  let structure = 0;
  const recommendations: string[] = [];

  // AUTHORITY (0-100)
  const hasExternalLinks = (html.match(/href=["']https?:\/\//gi) || []).length;
  if (hasExternalLinks >= 5) authority += 20;
  else if (hasExternalLinks >= 2) authority += 10;
  else recommendations.push('Add external references and citations to boost authority');

  const hasStats = (html.match(/\d+[%+]|\d{1,3}(,\d{3})+|\$\d+/g) || []).length;
  if (hasStats >= 3) authority += 20;
  else if (hasStats >= 1) authority += 10;
  else recommendations.push('Include statistics and data points');

  const hasQuotes = /<blockquote/i.test(html) || /["\u201C\u201D].*?["\u201C\u201D]/g.test(html);
  if (hasQuotes) authority += 20;
  else recommendations.push('Add expert quotes or testimonials');

  const hasAuthor = /author|byline|written\s+by/i.test(html);
  if (hasAuthor) authority += 20;
  else recommendations.push('Add author attribution for credibility');

  const hasDates = /\b20(2[3-9]|[3-9]\d)\b/.test(html) || /<time/i.test(html);
  if (hasDates) authority += 20;
  else recommendations.push('Include publication/update dates');

  // READABILITY (0-100)
  const h1Count = (html.match(/<h1/gi) || []).length;
  const h2Count = (html.match(/<h2/gi) || []).length;
  const h3Count = (html.match(/<h3/gi) || []).length;
  if (h1Count === 1) readability += 15;
  else recommendations.push('Use exactly one H1 tag');
  if (h2Count >= 3) readability += 20;
  else if (h2Count >= 1) readability += 10;
  else recommendations.push('Add H2 headings to structure your content');
  if (h3Count >= 2) readability += 10;

  const hasLists = (html.match(/<[uo]l/gi) || []).length;
  if (hasLists >= 2) readability += 15;
  else if (hasLists >= 1) readability += 8;
  else recommendations.push('Use bullet/numbered lists for scannable content');

  const hasFAQ = /faq|frequently\s+asked|questions/i.test(html);
  if (hasFAQ) readability += 15;
  else recommendations.push('Add an FAQ section — AI assistants love Q&A format');

  const hasSummary = /summary|tl;?dr|key\s+takeaway|overview/i.test(html);
  if (hasSummary) readability += 15;
  else recommendations.push('Add a summary or TL;DR section at the top');

  const paragraphs = html.match(/<p[^>]*>[^<]+<\/p>/gi) || [];
  if (paragraphs.length >= 5) readability += 10;

  // STRUCTURE (0-100)
  const hasJsonLd = /<script[^>]*type=["']application\/ld\+json["']/i.test(html);
  const hasMicrodata = /itemtype=["']https?:\/\/schema\.org/i.test(html);
  if (hasJsonLd || hasMicrodata) structure += 25;
  else recommendations.push('Add Schema.org structured data (JSON-LD) — 71% of ChatGPT-cited pages use it');

  const hasMetaDesc = /<meta[^>]*name=["']description["']/i.test(html);
  const hasOGTags = /<meta[^>]*property=["']og:/i.test(html);
  if (hasMetaDesc) structure += 15;
  else recommendations.push('Add a meta description');
  if (hasOGTags) structure += 10;
  else recommendations.push('Add Open Graph meta tags');

  const hasSemanticTags = /<(article|section|nav|aside|main|header|footer)/i.test(html);
  if (hasSemanticTags) structure += 15;
  else recommendations.push('Use semantic HTML tags (article, section, main)');

  const imgCount = (html.match(/<img/gi) || []).length;
  const imgAltCount = (html.match(/<img[^>]*alt=["'][^"']+["']/gi) || []).length;
  if (imgCount > 0 && imgAltCount === imgCount) structure += 15;
  else if (imgCount > 0 && imgAltCount < imgCount) recommendations.push('Add alt text to all images');

  const internalLinks = (html.match(/href=["']\/[^"']+["']/gi) || []).length;
  if (internalLinks >= 3) structure += 10;
  else recommendations.push('Add more internal links between pages');

  const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html);
  if (hasCanonical) structure += 10;
  else recommendations.push('Add a canonical URL tag');

  const overall = Math.round((authority + readability + structure) / 3);

  return {
    overall,
    authority: Math.min(authority, 100),
    readability: Math.min(readability, 100),
    structure: Math.min(structure, 100),
    recommendations: recommendations.slice(0, 8),
  };
}

// ---------------------------------------------------------------------------
// AI Crawlability Checker
// ---------------------------------------------------------------------------

export interface CrawlabilityResult {
  overall_accessible: boolean;
  bots: {
    name: string;
    user_agent: string;
    allowed: boolean;
    blocked_by: string | null;
  }[];
  robots_txt_found: boolean;
  robots_txt_content: string | null;
  llms_txt_found: boolean;
  recommendations: string[];
}

const AI_BOTS = [
  { name: 'GPTBot (OpenAI)', user_agent: 'GPTBot' },
  { name: 'ChatGPT-User', user_agent: 'ChatGPT-User' },
  { name: 'ClaudeBot (Anthropic)', user_agent: 'ClaudeBot' },
  { name: 'Google-Extended', user_agent: 'Google-Extended' },
  { name: 'PerplexityBot', user_agent: 'PerplexityBot' },
  { name: 'Cohere-ai', user_agent: 'cohere-ai' },
];

function parseRobotsTxt(robotsTxt: string, userAgent: string): boolean {
  const lines = robotsTxt.split('\n').map((l) => l.trim());
  let currentAgent = '';
  let globalDisallowed = false;
  let specificAllowed: boolean | null = null;

  for (const line of lines) {
    if (line.startsWith('#') || !line) continue;

    const uaMatch = line.match(/^User-agent:\s*(.+)/i);
    if (uaMatch) {
      currentAgent = uaMatch[1].trim();
      continue;
    }

    const disallowMatch = line.match(/^Disallow:\s*(.*)/i);
    if (disallowMatch) {
      const path = disallowMatch[1].trim();
      if (currentAgent === '*') globalDisallowed = path === '/';
      if (currentAgent.toLowerCase() === userAgent.toLowerCase()) {
        specificAllowed = path !== '/';
      }
    }

    const allowMatch = line.match(/^Allow:\s*(.*)/i);
    if (allowMatch) {
      if (currentAgent.toLowerCase() === userAgent.toLowerCase()) {
        specificAllowed = true;
      }
    }
  }

  if (specificAllowed !== null) return specificAllowed;
  return !globalDisallowed;
}

export async function checkCrawlability(url: string): Promise<CrawlabilityResult> {
  if (!url.startsWith('http')) url = `https://${url}`;
  const origin = new URL(url).origin;
  const recommendations: string[] = [];

  // Fetch robots.txt
  let robotsTxt: string | null = null;
  let robotsFound = false;
  try {
    const res = await fetch(`${origin}/robots.txt`, { redirect: 'follow' });
    if (res.ok) {
      robotsTxt = await res.text();
      robotsFound = true;
    }
  } catch {
    /* not found */
  }

  // Check llms.txt
  let llmsFound = false;
  try {
    const res = await fetch(`${origin}/llms.txt`, { redirect: 'follow' });
    llmsFound = res.ok;
  } catch {
    /* not found */
  }

  if (!llmsFound) {
    recommendations.push('Add an llms.txt file to help AI crawlers understand your site');
  }

  // Check each bot
  const bots = AI_BOTS.map((bot) => {
    let allowed = true;
    let blocked_by: string | null = null;

    if (robotsTxt) {
      allowed = parseRobotsTxt(robotsTxt, bot.user_agent);
      if (!allowed) blocked_by = 'robots.txt';
    }

    if (!allowed) {
      recommendations.push(`${bot.name} is blocked by robots.txt — consider allowing it`);
    }

    return { name: bot.name, user_agent: bot.user_agent, allowed, blocked_by };
  });

  const overall_accessible = bots.some((b) => b.allowed);

  if (!robotsFound) {
    recommendations.push('No robots.txt found — add one to explicitly allow AI crawlers');
  }

  return {
    overall_accessible,
    bots,
    robots_txt_found: robotsFound,
    robots_txt_content: robotsTxt,
    llms_txt_found: llmsFound,
    recommendations: [...new Set(recommendations)].slice(0, 8),
  };
}

// ---------------------------------------------------------------------------
// Schema Markup Analyzer
// ---------------------------------------------------------------------------

export interface SchemaAnalysis {
  found: { type: string; count: number }[];
  missing: { type: string; importance: string; description: string }[];
  total_schemas: number;
  recommendations: string[];
}

export function analyzeSchema(html: string): SchemaAnalysis {
  const recommendations: string[] = [];
  const found: { type: string; count: number }[] = [];

  // Extract JSON-LD schemas
  const jsonLdMatches = [
    ...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];
  const foundTypes = new Set<string>();

  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      const type = data['@type'] || (Array.isArray(data) ? data[0]?.['@type'] : null);
      if (type) foundTypes.add(type);
    } catch {
      /* invalid JSON-LD */
    }
  }

  // Check microdata
  const microdataMatches = [...html.matchAll(/itemtype=["']https?:\/\/schema\.org\/(\w+)["']/gi)];
  for (const m of microdataMatches) {
    foundTypes.add(m[1]);
  }

  for (const type of foundTypes) {
    found.push({ type, count: 1 });
  }

  // Check for important missing schemas
  const importantSchemas = [
    { type: 'Organization', importance: 'high', description: 'Defines your company/brand for AI knowledge graphs' },
    { type: 'WebSite', importance: 'high', description: 'Tells AI crawlers about your site structure' },
    { type: 'FAQPage', importance: 'high', description: 'FAQ format is the #1 most cited content type by AI' },
    { type: 'Product', importance: 'medium', description: 'Describes your product for comparison queries' },
    {
      type: 'SoftwareApplication',
      importance: 'medium',
      description: 'For SaaS products — helps AI categorize your tool',
    },
    { type: 'HowTo', importance: 'medium', description: 'Step-by-step guides get cited frequently by AI' },
    { type: 'Article', importance: 'medium', description: 'Marks content as authoritative articles' },
    { type: 'BreadcrumbList', importance: 'low', description: 'Helps AI understand your site hierarchy' },
  ];

  const missing = importantSchemas.filter((s) => !foundTypes.has(s.type));

  if (missing.length > 0) {
    const highPriority = missing.filter((m) => m.importance === 'high');
    if (highPriority.length > 0) {
      recommendations.push(`Add high-priority schemas: ${highPriority.map((m) => m.type).join(', ')}`);
    }
  }

  if (found.length === 0) {
    recommendations.push('No schema markup found — 71% of pages cited by ChatGPT use structured data');
  }

  return {
    found,
    missing,
    total_schemas: found.length,
    recommendations,
  };
}

// ---------------------------------------------------------------------------
// llms.txt Generator
// ---------------------------------------------------------------------------

export interface LlmsTxtResult {
  content: string;
  sections: string[];
}

export function generateLlmsTxt(info: {
  brand_name: string;
  url: string;
  description: string;
  features: string[];
  h1s: string[];
  h2s: string[];
}): LlmsTxtResult {
  const sections: string[] = [];
  let content = `# ${info.brand_name}\n\n`;
  sections.push('header');

  if (info.description) {
    content += `> ${info.description}\n\n`;
    sections.push('description');
  }

  content += `## About\n`;
  content += `${info.brand_name} is available at ${info.url}\n\n`;
  sections.push('about');

  if (info.features.length > 0) {
    content += `## Features\n`;
    for (const f of info.features) {
      content += `- ${f}\n`;
    }
    content += '\n';
    sections.push('features');
  }

  content += `## Links\n`;
  content += `- Website: ${info.url}\n`;
  content += `- Documentation: ${info.url}/docs\n`;
  sections.push('links');

  return { content, sections };
}
