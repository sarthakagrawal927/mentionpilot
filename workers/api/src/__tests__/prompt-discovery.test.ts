import { describe, it, expect } from 'vitest';
import { discoverPrompts } from '../lib/prompt-discovery';

describe('discoverPrompts', () => {
  it('generates prompts with competitors', async () => {
    const prompts = await discoverPrompts('MentionPilot', null, [{ name: 'Otterly' }, { name: 'Gauge' }]);
    expect(prompts.length).toBeGreaterThan(5);
    expect(prompts.some(p => p.text.includes('MentionPilot'))).toBe(true);
    expect(prompts.some(p => p.text.includes('Otterly'))).toBe(true);
    expect(prompts.some(p => p.category === 'comparison')).toBe(true);
    expect(prompts.some(p => p.category === 'brand')).toBe(true);
  });

  it('generates prompts without competitors', async () => {
    const prompts = await discoverPrompts('TestProduct', null, []);
    expect(prompts.length).toBeGreaterThan(3);
    expect(prompts.some(p => p.text.includes('TestProduct'))).toBe(true);
  });

  it('every prompt has text, category, and reason', async () => {
    const prompts = await discoverPrompts('Test', null, []);
    for (const p of prompts) {
      expect(p.text).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(p.reason).toBeTruthy();
    }
  });

  it('returns no duplicates', async () => {
    const prompts = await discoverPrompts('TestProduct', null, [{ name: 'Comp1' }]);
    const texts = prompts.map(p => p.text.toLowerCase());
    expect(new Set(texts).size).toBe(texts.length);
  });
});
