import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

/**
 * Prisma Client Singleton Pattern for Prisma 7+
 *
 * In development, the hot-reloading creates multiple instances of PrismaClient.
 * This pattern ensures we reuse the same instance across hot-reloads.
 *
 * Prisma 7 requires an adapter for database connections.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  // Store pool for cleanup if needed
  globalForPrisma.pool = pool

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export default prisma
