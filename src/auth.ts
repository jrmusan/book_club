import { cache } from "react";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { MAGIC_LINK_MAX_AGE_SECONDS, sendResendSignInEmail } from "@/lib/resend-auth";

const nextAuth = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL,
      maxAge: MAGIC_LINK_MAX_AGE_SECONDS,
      async sendVerificationRequest({ identifier, url, provider }) {
        await sendResendSignInEmail({
          identifier,
          url,
          expiresInSeconds: provider.maxAge,
          provider,
        });
      },
    }),
  ],
});

export const { handlers, signIn, signOut } = nextAuth;

/** Request-scoped memoization so layout/header/page share one session read. */
export const auth = cache(nextAuth.auth);
