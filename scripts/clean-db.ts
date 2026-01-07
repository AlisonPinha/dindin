import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function cleanDatabase() {
  console.log("🗑️  Limpando dados de teste do banco...")

  // Delete in order (respecting foreign keys)
  await prisma.budget.deleteMany()
  console.log("  ✓ Budgets removidos")

  await prisma.goal.deleteMany()
  console.log("  ✓ Metas removidas")

  await prisma.investment.deleteMany()
  console.log("  ✓ Investimentos removidos")

  await prisma.transaction.deleteMany()
  console.log("  ✓ Transações removidas")

  await prisma.account.deleteMany()
  console.log("  ✓ Contas removidas")

  await prisma.category.deleteMany()
  console.log("  ✓ Categorias removidas")

  await prisma.user.deleteMany()
  console.log("  ✓ Usuários removidos")

  console.log("")
  console.log("✅ Banco de dados limpo!")
}

cleanDatabase()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
