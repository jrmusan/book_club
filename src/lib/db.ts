import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Neon’s pooler already multiplexes connections. Keep Prisma’s own pool small
 * on serverless (Vercel) so we don’t open more sockets than needed.
 */
function withPoolLimits(url: string) {
  if (/[?&]connection_limit=/.test(url)) return url;
  const limit = process.env.VERCEL ? "1" : "5";
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connection_limit=${limit}&pool_timeout=20&connect_timeout=15`;
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(url
      ? {
          datasources: {
            db: { url: withPoolLimits(url) },
          },
        }
      : {}),
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
