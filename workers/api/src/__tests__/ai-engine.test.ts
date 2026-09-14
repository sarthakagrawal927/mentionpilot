import { afterEach, describe, it, expect, vi } from 'vitest';
import { analyzeResponse, detectAIPlatform, queryEndpoint, queryWorkersAi } from '../lib/ai-engine';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('detectAIPlatform', () => {
  it('attributes direct provider endpoints and leaves aggregators custom', () => {
    expect(detectAIPlatform('https://api.openai.com/v1/chat/completions')).toBe('openai');
    expect(detectAIPlatform('https://api.perplexity.ai/chat/completions')).toBe('perplexity');
    expect(detectAIPlatform('https://openrouter.ai/api/v1/chat/completions')).toBe('custom');
  });
});

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

describe('queryEndpoint', () => {
  it('uses the configured OpenAI-compatible endpoint and returns its response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      model: 'example-model',
      choices: [{ message: { content: 'Example response' } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await queryEndpoint({
      endpointUrl: 'https://provider.example/v1/chat/completions',
      apiKey: 'test-key',
      model: 'example-model',
    }, 'Example prompt');

    expect(result.responseText).toBe('Example response');
    expect(result.model).toBe('example-model');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.redirect).toBe('manual');
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: 'example-model',
      messages: [{ role: 'user', content: 'Example prompt' }],
      max_tokens: 1024,
      stream: false,
    });
  });

  it('requests bounded JSON output for site interpretation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: '{"brand_name":"Example"}' } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    await queryEndpoint({
      endpointUrl: 'https://provider.example/v1/chat/completions',
      apiKey: 'test-key',
      model: 'auto',
    }, 'Interpret this site', { json: true, maxTokens: 800, projectId: 'mentionpilot' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      max_tokens: 800,
      project_id: 'mentionpilot',
      response_format: { type: 'json_object' },
    });
  });

  it('rejects endpoint redirects instead of following them', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, {
      status: 302,
      headers: { Location: 'https://unexpected.example' },
    })));

    await expect(queryEndpoint({
      endpointUrl: 'https://provider.example/v1/chat/completions',
      apiKey: 'test-key',
      model: 'auto',
    }, 'Example prompt')).rejects.toThrow('AI endpoint refused redirect (302)');
  });
});

describe('queryWorkersAi', () => {
  it('queries the bound model and normalizes its response', async () => {
    const run = vi.fn().mockResolvedValue({ response: 'Cloudflare response' });
    const result = await queryWorkersAi({ run } as unknown as Ai, 'Example prompt');

    expect(result.responseText).toBe('Cloudflare response');
    expect(result.model).toBe('@cf/meta/llama-3.1-8b-instruct-fast');
    expect(run).toHaveBeenCalledWith('@cf/meta/llama-3.1-8b-instruct-fast', {
      messages: [{ role: 'user', content: 'Example prompt' }],
      max_tokens: 512,
    });
  });
});
