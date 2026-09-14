import { readBoundedResponseText } from './bounded-response';
import { validatePublicUrl } from './url-validator';

const MAX_HOMEPAGE_BYTES = 1_000_000;

export interface SiteInfo {
  brand_name: string;
  description: string;
  category: string | null;
  features: string[];
  competitors_mentioned: string[];
  brand_aliases?: string[];
  brand_confidence?: 'high' | 'medium' | 'low';
  homepage_title?: string;
  hostname?: string;
  headings?: string[];
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  hellip: '…',
  ldquo: '“',
  lsquo: '‘',
  lt: '<',
  middot: '·',
  nbsp: ' ',
  quot: '"',
  rdquo: '”',
  rsquo: '’',
};

export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === '#') {
      const radix = code[1]?.toLowerCase() === 'x' ? 16 : 10;
      const digits = radix === 16 ? code.slice(2) : code.slice(1);
      const point = Number.parseInt(digits, radix);
      return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
  });
}

function normalizeText(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function readAttribute(tag: string, name: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`\\b${escapedName}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  return normalizeText(match?.[2] ?? '');
}

function readMeta(html: string, attribute: 'name' | 'property', key: string): string {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (readAttribute(match[0], attribute).toLowerCase() === key.toLowerCase()) {
      return readAttribute(match[0], 'content');
    }
  }
  return '';
}

function readTagTexts(html: string, tag: 'h1' | 'h2'): string[] {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))]
    .map((match) => normalizeText(match[1]))
    .filter(Boolean);
}

function titleBrandCandidate(value: string): string {
  return normalizeText(value)
    .split(/\s+(?:[|·•]|[-–—])\s+/)[0]
    .replace(/\s+(?:home|homepage)$/i, '')
    .trim();
}

function hostnameLabel(hostname: string): string {
  const labels = hostname.replace(/^www\./, '').split('.');
  const label = labels.length > 2 ? labels[labels.length - 3] : labels[0];
  return label.replace(/[-_]+/g, ' ').trim();
}

function isPlausibleBrand(value: string): boolean {
  if (!value || value.length > 80) return false;
  const words = value.split(/\s+/);
  return words.length <= 7 && !/[.!?]$/.test(value);
}

function deriveBrandName(input: {
  hostname: string;
  siteName: string;
  ogTitle: string;
  title: string;
  h1: string;
}): { name: string; confidence: 'high' | 'medium' | 'low'; aliases: string[] } {
  const domainName = hostnameLabel(input.hostname);
  const candidates = [input.siteName, input.ogTitle, input.title, input.h1]
    .map(titleBrandCandidate)
    .filter(isPlausibleBrand);
  const sourceName = candidates[0];
  const name = sourceName || domainName;
  const aliases = [domainName]
    .filter((alias) => alias && alias.toLowerCase() !== name.toLowerCase());

  return {
    name,
    confidence: input.siteName ? 'high' : sourceName ? 'medium' : 'low',
    aliases,
  };
}

const CATEGORY_PATTERNS: Array<[string, RegExp]> = [
  ['customer relationship management', /\b(?:crm|customer relationship management)\b/i],
  ['project management', /\bproject management\b/i],
  ['code hosting', /\b(?:code hosting|source code|software development|developer platform)\b/i],
  ['AI visibility', /\b(?:ai visibility|answer engine optimization|generative engine optimization)\b/i],
  ['analytics', /\banalytics\b/i],
  ['customer feedback', /\bcustomer feedback\b/i],
  ['email marketing', /\bemail marketing\b/i],
  ['automation', /\bautomation\b/i],
  ['database', /\bdatabase\b/i],
  ['design', /\bdesign\b/i],
  ['e-commerce', /\be-?commerce\b/i],
  ['hosting', /\bhosting\b/i],
  ['monitoring', /\bmonitoring\b/i],
  ['productivity', /\bproductivity\b/i],
  ['security', /\bsecurity\b/i],
  ['testing', /\btesting\b/i],
];

function inferCategory(text: string): string | null {
  return CATEGORY_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}

export function extractSiteInfo(html: string, url: string): SiteInfo {
  const parsedUrl = new URL(url);
  const title = normalizeText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const description = readMeta(html, 'name', 'description');
  const ogTitle = readMeta(html, 'property', 'og:title');
  const ogDescription = readMeta(html, 'property', 'og:description');
  const siteName = readMeta(html, 'property', 'og:site_name');
  const h1s = readTagTexts(html, 'h1');
  const h2s = readTagTexts(html, 'h2');
  const brand = deriveBrandName({
    hostname: parsedUrl.hostname,
    siteName,
    ogTitle,
    title,
    h1: h1s[0] ?? '',
  });
  const fullText = [title, description, ogDescription, ...h1s, ...h2s].join(' ');

  return {
    brand_name: brand.name,
    description: ogDescription || description || h1s[0] || '',
    category: inferCategory(fullText),
    features: h2s.slice(0, 8),
    competitors_mentioned: [],
    brand_aliases: brand.aliases,
    brand_confidence: brand.confidence,
    homepage_title: title,
    hostname: parsedUrl.hostname,
    headings: [...h1s, ...h2s].slice(0, 12),
  };
}

export async function crawlSite(url: string): Promise<SiteInfo> {
  const validatedUrl = validatePublicUrl(url);
  const res = await fetch(validatedUrl, {
    headers: { 'User-Agent': 'MentionPilot/1.0 (AI Visibility Check)' },
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`Failed to fetch ${validatedUrl}: ${res.status}`);
  const contentType = res.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType && !contentType.includes('text/html')) {
    throw new Error('Homepage did not return HTML');
  }

  const html = await readBoundedResponseText(res, MAX_HOMEPAGE_BYTES);
  return extractSiteInfo(html, validatedUrl);
}

export function generatePrompts(info: SiteInfo): string[] {
  const subject = info.category || 'software';
  return [
    `What are the best ${subject} tools for a growing team?`,
    `Which ${subject} platforms are easiest to adopt for a small business?`,
    `Can you compare the leading ${subject} products available today?`,
    `What should a buyer look for when choosing ${subject} software?`,
    `Which ${subject} solution offers the best balance of capability and usability?`,
  ];
}
