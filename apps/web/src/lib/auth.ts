import { betterAuth } from "better-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function createAuth(d1: D1Database) {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    database: {
      provider: "sqlite",
      url: ":memory:", // unused — overridden by dialect
      dialect: {
        createDriver: () => ({
          init: async () => {},
          acquireConnection: async () => ({
            executeQuery: async (query: { sql: string; parameters: unknown[] }) => {
              const stmt = d1.prepare(query.sql);
              const bound = query.parameters.length ? stmt.bind(...query.parameters) : stmt;
              // SELECT vs mutation
              if (query.sql.trimStart().toUpperCase().startsWith("SELECT") || query.sql.trimStart().toUpperCase().startsWith("PRAGMA")) {
                const res = await bound.all();
                return { rows: res.results ?? [] };
              }
              const res = await bound.run();
              return { rows: [], insertId: res.meta?.last_row_id, numAffectedRows: res.meta?.changes };
            },
            releaseConnection: async () => {},
          }),
          destroy: async () => {},
        }),
        createAdapter: undefined,
        createIntrospector: undefined,
        createQueryCompiler: undefined,
      },
    },
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
}

/** Lazy auth — resolves D1 from Cloudflare context at call time, never at module level. */
export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });
  const d1 = (env as { AUTH_DB?: D1Database }).AUTH_DB;
  if (!d1) throw new Error("AUTH_DB D1 binding not found in env");
  return createAuth(d1);
}
