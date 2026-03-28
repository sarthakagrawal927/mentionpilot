/**
 * Validates a user-supplied URL to prevent SSRF attacks.
 * Blocks private IPs, localhost, and non-http(s) schemes.
 */

const PRIVATE_IP_PATTERNS = [
  /^127\./,                          // loopback
  /^10\./,                           // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./,     // 172.16.0.0/12
  /^192\.168\./,                     // 192.168.0.0/16
  /^169\.254\./,                     // link-local
  /^0\./,                            // 0.0.0.0/8
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // CGNAT
  /^198\.51\.100\./,                 // TEST-NET-2
  /^203\.0\.113\./,                  // TEST-NET-3
  /^(22[4-9]|23\d)\./,              // multicast
  /^fc|^fd/i,                        // IPv6 ULA
  /^fe80/i,                          // IPv6 link-local
  /^::1$/,                           // IPv6 loopback
];

const BLOCKED_HOSTNAMES = ['localhost', '0.0.0.0', '[::1]', 'metadata.google.internal'];

export function validatePublicUrl(input: string): string {
  let url: URL;
  try {
    const normalized = input.startsWith('http') ? input : `https://${input}`;
    url = new URL(normalized);
  } catch {
    throw new Error('Invalid URL');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only http and https URLs are allowed');
  }

  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new Error('URL points to a blocked host');
  }

  // Check if hostname is an IP address
  const ipv4Match = hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/);
  if (ipv4Match) {
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        throw new Error('URL points to a private IP address');
      }
    }
  }

  // Block IPv6 literals in brackets
  if (hostname.startsWith('[')) {
    throw new Error('IPv6 literal addresses are not allowed');
  }

  // Block common cloud metadata endpoints
  if (hostname === '169.254.169.254' || hostname.endsWith('.internal')) {
    throw new Error('URL points to a blocked host');
  }

  return url.toString();
}
