import { API_BASE } from "@/lib/api-base";

export async function getToken(): Promise<string> {
  const res = await fetch("/api/token");
  if (!res.ok) throw new Error("Not authenticated");
  const data = (await res.json()) as { token: string };
  return data.token;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getToken();
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
