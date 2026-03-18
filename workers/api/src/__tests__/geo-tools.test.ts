import { describe, it, expect } from 'vitest';
import { analyzeGEOScore, analyzeSchema, generateLlmsTxt } from '../lib/geo-tools';

describe('analyzeGEOScore', () => {
  it('scores a well-structured page higher', () => {
    const html = `<html><head>
      <meta name="description" content="A great product">
      <meta property="og:title" content="Product">
      <link rel="canonical" href="https://example.com">
      <script type="application/ld+json">{"@type":"Organization","name":"Test"}</script>
    </head><body><main><article>
      <h1>Product Name</h1>
      <p>Used by over 10,000 companies with 95% satisfaction rate. This is a longer paragraph to pass length check.</p>
      <p>Another meaningful paragraph with enough content to be counted by the analyzer.</p>
      <p>Third paragraph here with additional details about the product offering.</p>
      <p>Fourth paragraph providing even more context about product capabilities.</p>
      <p>Fifth paragraph with final thoughts and concluding remarks for readers.</p>
      <h2>Features</h2><h2>Pricing</h2><h2>FAQ - Frequently Asked Questions</h2>
      <ul><li>Feature one</li><li>Feature two</li></ul>
      <blockquote>"Great product" - Expert</blockquote>
      <p>Written by John Doe in 2025</p>
      <a href="https://a.com">a</a><a href="https://b.com">b</a><a href="https://c.com">c</a>
      <a href="https://d.com">d</a><a href="https://e.com">e</a>
      <img src="t.jpg" alt="Test"><a href="/about">About</a><a href="/p">P</a><a href="/d">D</a>
    </article></main></body></html>`;
    const score = analyzeGEOScore(html, 'https://example.com');
    expect(score.overall).toBeGreaterThan(40);
    expect(score.authority).toBeGreaterThan(0);
    expect(score.readability).toBeGreaterThan(0);
    expect(score.structure).toBeGreaterThan(0);
  });

  it('scores an empty page low', () => {
    const score = analyzeGEOScore('<html><head></head><body></body></html>', 'https://example.com');
    expect(score.overall).toBeLessThan(30);
    expect(score.recommendations.length).toBeGreaterThan(0);
  });

  it('generates recommendations for bare page', () => {
    const score = analyzeGEOScore('<html><head></head><body><p>Hello</p></body></html>', 'https://example.com');
    expect(score.recommendations.length).toBeGreaterThan(3);
  });
});

describe('analyzeSchema', () => {
  it('detects JSON-LD schemas', () => {
    const html = `<html><head><script type="application/ld+json">{"@type":"Organization","name":"Test"}</script></head><body></body></html>`;
    const a = analyzeSchema(html);
    expect(a.found).toEqual([{ type: 'Organization', count: 1 }]);
    expect(a.total_schemas).toBe(1);
  });

  it('identifies missing schemas', () => {
    const a = analyzeSchema('<html><head></head><body></body></html>');
    expect(a.found).toEqual([]);
    expect(a.missing.some(m => m.type === 'FAQPage')).toBe(true);
    expect(a.missing.some(m => m.type === 'Organization')).toBe(true);
  });

  it('detects microdata', () => {
    const html = `<html><body><div itemtype="https://schema.org/Product">Test</div></body></html>`;
    const a = analyzeSchema(html);
    expect(a.found.some(f => f.type === 'Product')).toBe(true);
  });
});

describe('generateLlmsTxt', () => {
  it('generates content with brand name', () => {
    const r = generateLlmsTxt({
      brand_name: 'TestProduct',
      url: 'https://test.com',
      description: 'A cool product',
      features: ['Fast', 'Reliable'],
      h1s: [],
      h2s: [],
    });
    expect(r.content).toContain('TestProduct');
    expect(r.content).toContain('https://test.com');
    expect(r.content).toContain('Fast');
    expect(r.sections.length).toBeGreaterThan(0);
  });
});
