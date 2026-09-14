const MAX_MODELS_RESPONSE_BYTES = 1_000_000;
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  'metadata.google.internal',
  '169.254.169.254',
]);

function assertPublicHttpsUrl(input: string) {
  const url = new URL(input);
  if (url.protocol !== 'https:') throw new Error('The AI endpoint must use HTTPS');

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.internal')) {
    throw new Error('The AI endpoint host is not allowed');
  }
  if (hostname.startsWith('[')) throw new Error('IPv6 literal endpoints are not allowed');
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(hostname)) {
    throw new Error('Private network endpoints are not allowed');
  }
  const private172 = hostname.match(/^172\.(\d{1,3})\./);
  if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) {
    throw new Error('Private network endpoints are not allowed');
  }
  return url;
}

export function modelsUrlForEndpoint(endpointUrl: string) {
  const url = assertPublicHttpsUrl(endpointUrl);
  url.search = '';
  url.hash = '';

  if (/\/(?:chat\/completions|responses)\/?$/.test(url.pathname)) {
    url.pathname = url.pathname.replace(/\/(?:chat\/completions|responses)\/?$/, '/models');
  } else if (!/\/models\/?$/.test(url.pathname)) {
    url.pathname = `${url.pathname.replace(/\/$/, '')}/models`;
  }
  return url.toString();
}

async function readBoundedText(response: Response) {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_MODELS_RESPONSE_BYTES) {
    await response.body?.cancel('Models response is too large');
    throw new Error('Models response is too large');
  }
  if (!response.body) return '';

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_MODELS_RESPONSE_BYTES) {
        await reader.cancel('Models response is too large');
        throw new Error('Models response is too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function discoverAvailableModels(input: {
  endpointUrl: string;
  apiKey: string;
  fetcher?: typeof fetch;
}) {
  const fetcher = input.fetcher ?? fetch;
  const response = await fetcher(modelsUrlForEndpoint(input.endpointUrl), {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${input.apiKey}`,
    },
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Model discovery failed with HTTP ${response.status}`);

  const payload = JSON.parse(await readBoundedText(response)) as {
    data?: Array<{ id?: unknown }>;
    models?: Array<string | { id?: unknown }>;
  };
  const candidates = payload.data ?? payload.models ?? [];
  const models = [...new Set(candidates.map((item) =>
    typeof item === 'string' ? item : typeof item?.id === 'string' ? item.id : ''
  ).filter(Boolean))].sort();
  if (!models.length) throw new Error('The endpoint returned no model identifiers');
  return models;
}
