import type { NextAuthConfig } from "next-auth";

/** Cookie lifetime. Invalid or missing AUTH_SESSION_MAX_AGE falls back to 30 days. */
export function sessionMaxAgeSeconds() {
  const raw = process.env.AUTH_SESSION_MAX_AGE;
  if (!raw) return 60 * 60 * 24 * 30;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 60) return 60 * 60 * 24 * 30;
  return Math.floor(parsed);
}

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
    error: "/login",
  },
  // JWT cookie: httpOnly, SameSite=Lax, Path=/.
  // Secure (and the __Secure- name prefix) when AUTH_URL is https.
  session: {
    strategy: "jwt",
    maxAge: sessionMaxAgeSeconds(),
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/clubs") ||
        nextUrl.pathname.startsWith("/notifications");

      if (isProtected) {
        if (isLoggedIn) return true;
        return false;
      }

      if (nextUrl.pathname === "/login" && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
