import { describe, it, expect } from 'vitest';
import { optimizePage, estimateTokens } from '../lib/axp-crawler';

describe('estimateTokens', () => {
  it('estimates roughly 1 token per 4 chars', () => {
    expect(estimateTokens('hello world')).toBe(3); // 11/4 = 2.75 → 3
  });

  it('handles empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });
});

describe('optimizePage', () => {
  it('extracts title', () => {
    const html = '<html><head><title>My Product - Best Tool</title></head><body><h1>Welcome</h1></body></html>';
    const { title, content } = optimizePage(html, 'https://example.com');
    expect(title).toContain('My Product');
    expect(content).toContain('My Product');
  });

  it('strips scripts and styles', () => {
    const html = '<html><head><style>body{color:red}</style></head><body><script>alert("x")</script><p>Real content here with enough words to pass the length filter threshold.</p></body></html>';
    const { content } = optimizePage(html, 'https://example.com');
    expect(content).not.toContain('alert');
    expect(content).not.toContain('color:red');
  });

  it('includes URL in output', () => {
    const { content } = optimizePage('<html><body></body></html>', 'https://test.com/page');
    expect(content).toContain('https://test.com/page');
  });

  it('reduces token count vs source', () => {
    const html = '<html><head><style>.x{color:red}.y{font-size:12px}.z{margin:0}</style><script>var x=1;function foo(){return x;}</script></head><body><nav>Home About Contact Products Pricing Blog</nav><main><h1>Product</h1><p>This is a great product that helps you do things efficiently and effectively every day.</p></main><footer>Copyright 2025 All Rights Reserved Terms Privacy</footer></body></html>';
    const sourceTokens = estimateTokens(html);
    const { content } = optimizePage(html, 'https://example.com');
    const optimizedTokens = estimateTokens(content);
    expect(optimizedTokens).toBeLessThan(sourceTokens);
  });

  it('extracts pricing', () => {
    const html = '<html><body><p>Plans start at $29/mo and go up to $99/month for enterprise features.</p></body></html>';
    const { content } = optimizePage(html, 'https://example.com');
    expect(content).toContain('$29/mo');
  });

  it('extracts list items', () => {
    const html = '<html><body><ul><li>Feature A is really great</li><li>Feature B is also awesome</li></ul></body></html>';
    const { content } = optimizePage(html, 'https://example.com');
    expect(content).toContain('Feature A');
    expect(content).toContain('Feature B');
  });
});
