/**
 * Simple in-memory sliding-window rate limiter for Cloudflare Workers.
 * Each worker isolate maintains its own window — good enough for
 * per-instance limiting on a single-region deployment.
 */

const windows = new Map<string, number[]>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  let timestamps = windows.get(key);
  if (!timestamps) {
    timestamps = [];
    windows.set(key, timestamps);
  }

  // Evict expired entries
  while (timestamps.length > 0 && timestamps[0] < cutoff) {
    timestamps.shift();
  }

  if (timestamps.length >= maxRequests) {
    return false; // rate limited
  }

  timestamps.push(now);
  return true; // allowed
}
