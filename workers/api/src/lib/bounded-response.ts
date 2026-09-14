export async function readBoundedStream(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel('Response exceeds the supported size');
        throw new Error('Response exceeds the supported size');
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
  return bytes;
}

export async function readBoundedResponseBytes(
  response: Response,
  maxBytes: number
): Promise<Uint8Array> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    await response.body?.cancel('Response exceeds the supported size');
    throw new Error('Response exceeds the supported size');
  }
  if (!response.body) return new Uint8Array();
  return readBoundedStream(response.body, maxBytes);
}

export async function readBoundedResponseText(response: Response, maxBytes: number) {
  return new TextDecoder().decode(await readBoundedResponseBytes(response, maxBytes));
}
