import { cache } from "react";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { hashPassword, needsRehash, verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validations/auth";

const nextAuth = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user) return null;

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        // Migrate older cost-12 (or other) hashes down to current rounds after a successful login.
        if (needsRehash(user.passwordHash)) {
          const passwordHash = await hashPassword(parsed.data.password);
          await db.user.update({
            where: { id: user.id },
            data: { passwordHash },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.username,
          username: user.username,
        };
      },
    }),
  ],
});

export const { handlers, signIn, signOut } = nextAuth;

/** Request-scoped memoization so layout/header/page share one session read. */
export const auth = cache(nextAuth.auth);
