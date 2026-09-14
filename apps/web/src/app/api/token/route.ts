import { getAuth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

async function sessionApiToken(sessionId: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(sessionId));
  return `mp_session_${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function sha256Hex(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function GET() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });

  const { env } = await getCloudflareContext({ async: true });
  const db = (env as { AUTH_DB?: D1Database }).AUTH_DB;
  if (!db) return NextResponse.json({ error: "AUTH_DB D1 binding not found" }, { status: 503 });

  const user = session.user;
  await db.prepare(
    `INSERT INTO users (id, email, name, avatar_url)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET
       name = excluded.name,
       avatar_url = excluded.avatar_url`
  ).bind(user.id, user.email, user.name || null, user.image || null).run();
  const apiUser = await db.prepare(`SELECT id FROM users WHERE email = ?`)
    .bind(user.email).first<{ id: string }>();
  if (!apiUser) return NextResponse.json({ error: "Could not establish API identity" }, { status: 500 });

  const token = await sessionApiToken(session.session.id, secret);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(session.session.expiresAt).toISOString();
  await db.prepare(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
     VALUES (?, ?, ?)
     ON CONFLICT(token_hash) DO UPDATE SET
       user_id = excluded.user_id,
       expires_at = excluded.expires_at`
  ).bind(tokenHash, apiUser.id, expiresAt).run();

  return NextResponse.json({ token });
}
