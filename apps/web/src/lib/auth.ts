import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

// In-memory store — intentional for the web frontend which proxies auth to the API worker.
const db: Record<string, any[]> = {};

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: memoryAdapter(db),
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || ""],
  pages: {
    signIn: "/login",
  },
});
