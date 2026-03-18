const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}
