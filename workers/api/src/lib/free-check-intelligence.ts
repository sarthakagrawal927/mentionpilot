import {
  decodeHtmlEntities,
  generatePrompts,
  type SiteInfo,
} from './site-crawler';

export interface FreeCheckIntelligence {
  brandName: string;
  brandAliases: string[];
  category: string | null;
  prompts: string[];
}

export function calculateReliableMentionRate(
  results: Array<{ brand_mentioned: boolean }>,
  minimumResponses = 3,
): number | null {
  if (results.length < minimumResponses) return null;
  return results.filter((result) => result.brand_mentioned).length / results.length;
}

export function buildSiteIntelligencePrompt(site: SiteInfo): string {
  return [
    'You are preparing an unbiased AI-discovery visibility test from observed homepage evidence.',
    'Return only a JSON object with keys: brand_name, category, product_summary, discovery_questions.',
    'Rules:',
    '- brand_name must be the exact organization or product name supported by the supplied evidence.',
    '- category must be a concise two-to-five word product category.',
    '- discovery_questions must contain exactly five natural buyer questions.',
    '- Questions must be unbranded: never include the brand name, hostname, or a copied slogan.',
    '- Every question must represent product-discovery intent: it should help a buyer shortlist, compare, evaluate, or choose a product or service.',
    '- Infer the concrete buyer, job-to-be-done, and category from the evidence before writing the questions.',
    '- Include this mix exactly once each: category shortlist, use-case recommendation, competitor comparison, buying-criteria question, and problem-to-solution question.',
    '- Name the inferred category or a concrete job-to-be-done in every question so it cannot drift into generic advice.',
    '- Avoid broad prompts about staying updated, general news sources, trends, or generic AI/software unless that is the product being sold.',
    '- Questions should be specific enough that this product and its real alternatives could organically appear in the answer.',
    '- Do not copy a full description into a question.',
    '',
    `Hostname: ${site.hostname ?? ''}`,
    `Extracted brand candidate: ${site.brand_name}`,
    `Page title: ${site.homepage_title ?? ''}`,
    `Meta description: ${site.description}`,
    `Headings: ${(site.headings ?? site.features).join(' | ')}`,
  ].join('\n').slice(0, 12_000);
}

function jsonObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function clean(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return decodeHtmlEntities(value).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizedTerm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function sourceSupportsBrand(candidate: string, site: SiteInfo): boolean {
  const normalized = normalizedTerm(candidate);
  if (!normalized || candidate.length > 80 || candidate.split(/\s+/).length > 7) return false;
  const evidence = normalizedTerm([
    site.brand_name,
    site.homepage_title,
    site.description,
    site.hostname,
    ...(site.headings ?? []),
  ].filter(Boolean).join(' '));
  return evidence.includes(normalized);
}

function containsBrand(question: string, terms: string[]): boolean {
  const normalized = normalizedTerm(question);
  return terms.some((term) => {
    const candidate = normalizedTerm(term);
    return candidate.length > 1 && normalized.includes(candidate);
  });
}

export function parseSiteIntelligence(text: string, site: SiteInfo): FreeCheckIntelligence {
  const parsed = jsonObject(text);
  const proposedBrand = clean(parsed?.brand_name, 80);
  const brandName = sourceSupportsBrand(proposedBrand, site) ? proposedBrand : site.brand_name;
  const category = clean(parsed?.category, 60) || site.category;
  const brandAliases = [...new Set([
    ...(site.brand_aliases ?? []),
    site.brand_name,
  ])].filter((alias) => normalizedTerm(alias) !== normalizedTerm(brandName));
  const blockedTerms = [brandName, ...brandAliases, site.hostname ?? ''].filter(Boolean);
  const proposedQuestions = Array.isArray(parsed?.discovery_questions)
    ? parsed.discovery_questions
      .map((question) => clean(question, 180))
      .filter((question) => question.length >= 20 && !containsBrand(question, blockedTerms))
      .map((question) => question.endsWith('?') ? question : `${question}?`)
    : [];
  const fallback = generatePrompts({ ...site, category }).filter(
    (question) => !containsBrand(question, blockedTerms)
  );
  const prompts = [...new Set([...proposedQuestions, ...fallback])].slice(0, 5);

  return { brandName, brandAliases, category, prompts };
}
