import { describe, it, expect } from 'vitest';
import { analyzeResponse } from '../lib/ai-engine';

describe('analyzeResponse', () => {
  it('detects brand mention', () => {
    const r = analyzeResponse('I recommend MentionPilot for tracking.', 'MentionPilot', [], null, []);
    expect(r.brand_mentioned).toBe(true);
  });

  it('returns false when brand not mentioned', () => {
    const r = analyzeResponse('Many great tools exist for analytics.', 'MentionPilot', [], null, []);
    expect(r.brand_mentioned).toBe(false);
  });

  it('detects brand aliases', () => {
    const r = analyzeResponse('You should try MP for monitoring.', 'MentionPilot', ['MP'], null, []);
    expect(r.brand_mentioned).toBe(true);
  });

  it('is case-insensitive', () => {
    const r = analyzeResponse('MENTIONPILOT is great.', 'MentionPilot', [], null, []);
    expect(r.brand_mentioned).toBe(true);
  });

  it('detects position in numbered list', () => {
    const text = '1. CompetitorA\n2. MentionPilot\n3. CompetitorB';
    const r = analyzeResponse(text, 'MentionPilot', [], null, []);
    expect(r.brand_position).toBe(2);
  });

  it('detects positive sentiment', () => {
    const r = analyzeResponse('MentionPilot is an excellent and powerful tool.', 'MentionPilot', [], null, []);
    expect(r.brand_sentiment).toBe('positive');
  });

  it('detects negative sentiment', () => {
    const r = analyzeResponse('MentionPilot is expensive and unreliable.', 'MentionPilot', [], null, []);
    expect(r.brand_sentiment).toBe('negative');
  });

  it('detects neutral sentiment', () => {
    const r = analyzeResponse('MentionPilot is a tool for monitoring.', 'MentionPilot', [], null, []);
    expect(r.brand_sentiment).toBe('neutral');
  });

  it('detects competitor mentions', () => {
    const r = analyzeResponse(
      'MentionPilot and Otterly are both good. Gauge too.',
      'MentionPilot', [], null,
      [{ name: 'Otterly' }, { name: 'Gauge' }, { name: 'Profound' }]
    );
    expect(r.competitors_mentioned[0]).toEqual({ name: 'Otterly', mentioned: true, position: null });
    expect(r.competitors_mentioned[1]).toEqual({ name: 'Gauge', mentioned: true, position: null });
    expect(r.competitors_mentioned[2]).toEqual({ name: 'Profound', mentioned: false, position: null });
  });

  it('detects competitor position in numbered list', () => {
    const text = '1. Otterly\n2. MentionPilot\n3. Gauge';
    const r = analyzeResponse(text, 'MentionPilot', [], null, [{ name: 'Otterly' }, { name: 'Gauge' }]);
    expect(r.brand_position).toBe(2);
    expect(r.competitors_mentioned[0]).toEqual({ name: 'Otterly', mentioned: true, position: 1 });
    expect(r.competitors_mentioned[1]).toEqual({ name: 'Gauge', mentioned: true, position: 3 });
  });

  it('extracts citations', () => {
    const r = analyzeResponse(
      'Visit https://mentionpilot.com and https://example.com',
      'MentionPilot', [], 'mentionpilot.com', []
    );
    expect(r.citations).toContain('https://mentionpilot.com');
    expect(r.citations).toContain('https://example.com');
    expect(r.brand_cited).toBe(true);
  });

  it('brand_cited false when URL not in citations', () => {
    const r = analyzeResponse('See https://example.com', 'MentionPilot', [], 'mentionpilot.com', []);
    expect(r.brand_cited).toBe(false);
  });

  it('handles empty text', () => {
    const r = analyzeResponse('', 'MentionPilot', [], null, []);
    expect(r.brand_mentioned).toBe(false);
    expect(r.brand_sentiment).toBe(null);
    expect(r.brand_position).toBe(null);
    expect(r.citations).toEqual([]);
  });
});
