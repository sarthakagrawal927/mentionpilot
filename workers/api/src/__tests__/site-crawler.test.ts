import { describe, it, expect } from 'vitest';
import { generatePrompts } from '../lib/site-crawler';

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

  it('includes brand name', () => {
    const prompts = generatePrompts({
      brand_name: 'TestBrand',
      description: 'A cool product',
      category: 'analytics',
      features: [],
      competitors_mentioned: [],
    });
    expect(prompts.some(p => p.includes('TestBrand'))).toBe(true);
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
