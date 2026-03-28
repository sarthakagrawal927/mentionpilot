import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      if (!account?.id_token) return false;

      try {
        const res = await fetch(`${API_BASE}/v1/auth/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_token: account.id_token,
            name: user.name || null,
            avatar_url: user.image || null,
          }),
        });

        if (!res.ok) return false;

        const data = await res.json();
        (user as any).apiToken = data.token;
        (user as any).apiUserId = data.user.id;
      } catch {
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.apiToken = (user as any).apiToken;
        token.apiUserId = (user as any).apiUserId;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).apiToken = token.apiToken;
      (session as any).apiUserId = token.apiUserId;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
