import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Cap the Prisma connection pool for small/free Postgres plans.
 * Render free Postgres has limited connections and no managed pooler.
 * Only rewrite the URL when DATABASE_URL is present — Docker builds have no DB env.
 */
function withPoolLimits(url: string) {
  if (/[?&]connection_limit=/.test(url)) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connection_limit=5&pool_timeout=10`;
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
