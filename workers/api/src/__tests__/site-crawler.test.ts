import { describe, it, expect } from 'vitest';
import {
  decodeHtmlEntities,
  extractSiteInfo,
  generatePrompts,
} from '../lib/site-crawler';
import {
  buildSiteIntelligencePrompt,
  calculateReliableMentionRate,
  parseSiteIntelligence,
} from '../lib/free-check-intelligence';

describe('generatePrompts', () => {
  it('generates exactly 5 prompts', () => {
    const prompts = generatePrompts({
      brand_name: 'MentionPilot',
      description: 'AI visibility monitoring',
      category: 'monitoring',
      features: ['AI tracking'],
      competitors_mentioned: [],
    });
    expect(prompts).toHaveLength(5);
  });

  it('keeps visibility prompts unbranded', () => {
    const prompts = generatePrompts({
      brand_name: 'TestBrand',
      description: 'A cool product',
      category: 'analytics',
      features: [],
      competitors_mentioned: [],
    });
    expect(prompts.every(p => !p.includes('TestBrand'))).toBe(true);
  });

  it('includes category when available', () => {
    const prompts = generatePrompts({
      brand_name: 'X',
      description: 'Test',
      category: 'crm',
      features: [],
      competitors_mentioned: [],
    });
    expect(prompts.some(p => p.toLowerCase().includes('crm'))).toBe(true);
  });

  it('works with minimal info', () => {
    const prompts = generatePrompts({
      brand_name: 'X',
      description: '',
      category: null,
      features: [],
      competitors_mentioned: [],
    });
    expect(prompts).toHaveLength(5);
    expect(prompts.every(p => typeof p === 'string' && p.length > 0)).toBe(true);
  });
});

describe('site identity extraction', () => {
  it('extracts GitHub instead of treating its title tagline as the brand', () => {
    const info = extractSiteInfo(`
      <html><head>
        <title>GitHub · Change is constant. GitHub keeps you ahead.</title>
        <meta property="og:site_name" content="GitHub">
        <meta name="description" content="Join the world&#39;s most widely adopted developer platform.">
      </head><body><h1>Build and ship software on a single platform</h1></body></html>
    `, 'https://github.com/');

    expect(info.brand_name).toBe('GitHub');
    expect(info.description).toContain("world's");
    expect(info.description).not.toContain('&#39;');
    expect(info.category).toBe('code hosting');
  });

  it('decodes named, decimal, and hexadecimal entities', () => {
    expect(decodeHtmlEntities('R&amp;D&#39;s &#x2014; roadmap')).toBe("R&D's — roadmap");
  });
});

describe('AI-assisted free-check intelligence', () => {
  const site = extractSiteInfo(`
    <title>GitHub · Change is constant. GitHub keeps you ahead.</title>
    <meta property="og:site_name" content="GitHub">
    <meta name="description" content="A developer platform for building and shipping software.">
  `, 'https://github.com/');

  it('accepts grounded identity and rejects branded or copied questions', () => {
    const intelligence = parseSiteIntelligence(JSON.stringify({
      brand_name: 'GitHub',
      category: 'developer collaboration platform',
      discovery_questions: [
        'Which platforms help distributed developer teams collaborate on source code?',
        'Is GitHub the best developer platform?',
        'What tools can help me with A developer platform for building and shipping software?',
      ],
    }), site);

    expect(intelligence.brandName).toBe('GitHub');
    expect(intelligence.prompts).toHaveLength(5);
    expect(intelligence.prompts.every((prompt) => !/github/i.test(prompt))).toBe(true);
    expect(intelligence.prompts).toContain(
      'Which platforms help distributed developer teams collaborate on source code?'
    );
  });

  it('asks the interpreter for specific buyer-intent coverage instead of generic topic prompts', () => {
    const prompt = buildSiteIntelligencePrompt(site);

    expect(prompt).toContain('product-discovery intent');
    expect(prompt).toContain('category shortlist, use-case recommendation, competitor comparison');
    expect(prompt).toContain('cannot drift into generic advice');
    expect(prompt).toContain('Avoid broad prompts about staying updated');
  });

  it('rejects an AI-hallucinated brand name', () => {
    const intelligence = parseSiteIntelligence('{"brand_name":"Unrelated Corp"}', site);
    expect(intelligence.brandName).toBe('GitHub');
  });

  it('scores only successful responses and refuses thin evidence', () => {
    expect(calculateReliableMentionRate([
      { brand_mentioned: true },
      { brand_mentioned: false },
      { brand_mentioned: true },
    ])).toBeCloseTo(2 / 3);
    expect(calculateReliableMentionRate([
      { brand_mentioned: true },
      { brand_mentioned: false },
    ])).toBeNull();
  });
});
