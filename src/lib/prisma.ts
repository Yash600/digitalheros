import { PrismaClient } from "@prisma/client";

// Standard Next.js pattern: reuse the Prisma client across hot reloads in dev
// so we don't exhaust the Postgres connection pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    // Neon (and other serverless Postgres) can have cold-start latency that
    // exceeds Prisma's default 2s/5s transaction wait/timeout. Widening this
    // avoids spurious "unable to start a transaction" errors without masking
    // real deadlocks (still bounded, just more forgiving).
    transactionOptions: {
      maxWait: 10000,
      timeout: 20000
    }
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
