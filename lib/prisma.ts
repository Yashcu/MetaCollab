// Prisma 7 breaking change: PrismaClient now requires a driver adapter.
// `new PrismaClient()` with no arguments throws a runtime error in Prisma 7.
//
// The import path from "@prisma/client" still works when schema.prisma uses
// `provider = "prisma-client-js"` (no custom output) — keep it as-is so
// Turbopack (Next.js 15) doesn't break.
//
// Install the adapter once, then re-run `npx prisma generate`:
//   npm install @prisma/adapter-pg pg
//   npm install --save-dev @types/pg

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  pool: Pool;
};

function makePool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local");
  }
  return new Pool({ connectionString: url });
}

function makePrismaClient(): PrismaClient {
  // Reuse the pg Pool across hot-reloads so we don't exhaust connections
  const pool = globalForPrisma.pool ?? makePool();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaPg(pool);

  if (process.env.NODE_ENV === "development") {
    const client = new PrismaClient({
      adapter,
      log: [{ emit: "event", level: "query" }],
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any).$on("query", (e: { query: string; duration: number }) => {
      if (e.duration > 500) {
        console.warn(`[SLOW QUERY ⚠️  ${e.duration}ms]\n${e.query}`);
      }
    });
    return client;
  }

  return new PrismaClient({ adapter, log: ["error"] });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}