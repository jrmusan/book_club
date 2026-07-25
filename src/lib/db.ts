import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Cap the Prisma connection pool for small/free Postgres plans.
 * Render free Postgres has limited connections and no managed pooler.
 */
function datasourceUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  if (/[?&]connection_limit=/.test(url)) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connection_limit=5&pool_timeout=10`;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: { url: datasourceUrl() },
    },
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
