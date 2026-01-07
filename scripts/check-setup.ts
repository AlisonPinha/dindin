/**
 * FamFinance - Setup Verification Script
 *
 * Verifica se o ambiente está configurado corretamente:
 * - Arquivo .env existe
 * - Variáveis de ambiente estão definidas
 * - Conexão com banco de dados
 * - Tabelas existem
 * - Dados de seed foram inseridos
 *
 * Execute: npx tsx scripts/check-setup.ts
 */

import "dotenv/config"
import * as fs from "fs"
import * as path from "path"

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
}

const PASS = `${colors.green}✓${colors.reset}`
const FAIL = `${colors.red}✗${colors.reset}`
const WARN = `${colors.yellow}⚠${colors.reset}`
const INFO = `${colors.blue}ℹ${colors.reset}`

interface CheckResult {
  name: string
  passed: boolean
  message: string
  details?: string
}

const results: CheckResult[] = []

function log(symbol: string, message: string, details?: string) {
  console.log(`  ${symbol} ${message}`)
  if (details) {
    console.log(`    ${colors.cyan}→ ${details}${colors.reset}`)
  }
}

function addResult(name: string, passed: boolean, message: string, details?: string) {
  results.push({ name, passed, message, details })
  log(passed ? PASS : FAIL, message, details)
}

// ============================================
// CHECK 1: .env file exists
// ============================================
async function checkEnvFile(): Promise<void> {
  console.log(`\n${colors.bold}1. Verificando arquivo .env${colors.reset}`)

  const envPath = path.join(process.cwd(), ".env")
  const envLocalPath = path.join(process.cwd(), ".env.local")

  const envExists = fs.existsSync(envPath)
  const envLocalExists = fs.existsSync(envLocalPath)

  if (envExists || envLocalExists) {
    const usedFile = envLocalExists ? ".env.local" : ".env"
    addResult("env-file", true, `Arquivo ${usedFile} encontrado`)
  } else {
    addResult(
      "env-file",
      false,
      "Arquivo .env não encontrado",
      "Execute: cp .env.example .env"
    )
  }
}

// ============================================
// CHECK 2: Environment variables
// ============================================
async function checkEnvVariables(): Promise<void> {
  console.log(`\n${colors.bold}2. Verificando variáveis de ambiente${colors.reset}`)

  const requiredVars = [
    { name: "DATABASE_URL", description: "URL de conexão do banco" },
    { name: "DIRECT_URL", description: "URL direta para migrations" },
  ]

  const optionalVars = [
    { name: "NEXT_PUBLIC_SUPABASE_URL", description: "URL do Supabase" },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", description: "Chave anônima do Supabase" },
    { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Chave service_role do Supabase" },
  ]

  // Check required variables
  for (const v of requiredVars) {
    const value = process.env[v.name]
    if (value && value.length > 10 && !value.includes("[")) {
      addResult(
        `env-${v.name}`,
        true,
        `${v.name} configurada`,
        v.description
      )
    } else {
      addResult(
        `env-${v.name}`,
        false,
        `${v.name} não configurada ou inválida`,
        `Configure no .env: ${v.description}`
      )
    }
  }

  // Check optional variables
  for (const v of optionalVars) {
    const value = process.env[v.name]
    if (value && value.length > 10 && !value.includes("[")) {
      log(PASS, `${v.name} configurada`)
    } else {
      log(WARN, `${v.name} não configurada (opcional)`)
    }
  }
}

// ============================================
// CHECK 3: Database connection
// ============================================
async function checkDatabaseConnection(): Promise<void> {
  console.log(`\n${colors.bold}3. Verificando conexão com banco de dados${colors.reset}`)

  try {
    const { prisma } = await import("../lib/prisma")

    await prisma.$connect()
    addResult("db-connection", true, "Conexão com banco estabelecida")

    await prisma.$disconnect()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    addResult(
      "db-connection",
      false,
      "Falha na conexão com banco",
      errorMessage.substring(0, 100)
    )
  }
}

// ============================================
// CHECK 4: Tables exist
// ============================================
async function checkTablesExist(): Promise<void> {
  console.log(`\n${colors.bold}4. Verificando tabelas do banco${colors.reset}`)

  const tables = [
    "User",
    "Account",
    "Category",
    "Transaction",
    "Investment",
    "Goal",
    "Budget",
  ]

  try {
    const { prisma } = await import("../lib/prisma")

    for (const table of tables) {
      try {
        // Try to count records in each table
        const modelName = table.charAt(0).toLowerCase() + table.slice(1)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const count = await (prisma as any)[modelName].count()

        addResult(
          `table-${table}`,
          true,
          `Tabela ${table} existe`,
          `${count} registro(s)`
        )
      } catch {
        addResult(
          `table-${table}`,
          false,
          `Tabela ${table} não existe`,
          "Execute: npm run db:push"
        )
      }
    }

    await prisma.$disconnect()
  } catch (error) {
    log(FAIL, "Não foi possível verificar tabelas")
  }
}

// ============================================
// CHECK 5: Seed data
// ============================================
async function checkSeedData(): Promise<void> {
  console.log(`\n${colors.bold}5. Verificando dados de seed${colors.reset}`)

  try {
    const { prisma } = await import("../lib/prisma")

    // Check users
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      addResult("seed-users", true, `${userCount} usuário(s) encontrado(s)`)
    } else {
      addResult(
        "seed-users",
        false,
        "Nenhum usuário encontrado",
        "Execute: npm run db:seed"
      )
    }

    // Check categories
    const categoryCount = await prisma.category.count()
    if (categoryCount > 0) {
      addResult("seed-categories", true, `${categoryCount} categoria(s) encontrada(s)`)
    } else {
      addResult(
        "seed-categories",
        false,
        "Nenhuma categoria encontrada",
        "Execute: npm run db:seed"
      )
    }

    // Check accounts
    const accountCount = await prisma.account.count()
    if (accountCount > 0) {
      log(INFO, `${accountCount} conta(s) bancária(s) encontrada(s)`)
    }

    // Check transactions
    const transactionCount = await prisma.transaction.count()
    if (transactionCount > 0) {
      log(INFO, `${transactionCount} transação(ões) encontrada(s)`)
    }

    // Check investments
    const investmentCount = await prisma.investment.count()
    if (investmentCount > 0) {
      log(INFO, `${investmentCount} investimento(s) encontrado(s)`)
    }

    // Check goals
    const goalCount = await prisma.goal.count()
    if (goalCount > 0) {
      log(INFO, `${goalCount} meta(s) encontrada(s)`)
    }

    await prisma.$disconnect()
  } catch (error) {
    log(FAIL, "Não foi possível verificar dados de seed")
  }
}

// ============================================
// CHECK 6: Node modules
// ============================================
async function checkNodeModules(): Promise<void> {
  console.log(`\n${colors.bold}6. Verificando dependências${colors.reset}`)

  const nodeModulesPath = path.join(process.cwd(), "node_modules")

  if (fs.existsSync(nodeModulesPath)) {
    addResult("node-modules", true, "node_modules existe")

    // Check critical packages
    const criticalPackages = [
      "@prisma/client",
      "next",
      "react",
      "@supabase/supabase-js",
    ]

    for (const pkg of criticalPackages) {
      const pkgPath = path.join(nodeModulesPath, pkg)
      if (fs.existsSync(pkgPath)) {
        log(PASS, `${pkg} instalado`)
      } else {
        log(WARN, `${pkg} não encontrado`)
      }
    }
  } else {
    addResult(
      "node-modules",
      false,
      "node_modules não existe",
      "Execute: npm install"
    )
  }
}

// ============================================
// CHECK 7: Prisma Client
// ============================================
async function checkPrismaClient(): Promise<void> {
  console.log(`\n${colors.bold}7. Verificando Prisma Client${colors.reset}`)

  try {
    const { PrismaClient } = await import("@prisma/client")
    addResult("prisma-client", true, "Prisma Client gerado")
  } catch {
    addResult(
      "prisma-client",
      false,
      "Prisma Client não gerado",
      "Execute: npm run db:generate"
    )
  }
}

// ============================================
// SUMMARY
// ============================================
function printSummary(): void {
  console.log(`\n${colors.bold}${"=".repeat(50)}${colors.reset}`)
  console.log(`${colors.bold}RESUMO${colors.reset}`)
  console.log(`${"=".repeat(50)}`)

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const total = results.length

  console.log(`\n  Total de verificações: ${total}`)
  console.log(`  ${colors.green}Passou: ${passed}${colors.reset}`)
  console.log(`  ${colors.red}Falhou: ${failed}${colors.reset}`)

  if (failed === 0) {
    console.log(`\n${colors.green}${colors.bold}✓ Setup completo! O projeto está pronto.${colors.reset}`)
    console.log(`\n  Execute: ${colors.cyan}npm run dev${colors.reset}`)
    console.log(`  Acesse:  ${colors.cyan}http://localhost:3000${colors.reset}\n`)
  } else {
    console.log(`\n${colors.red}${colors.bold}✗ Setup incompleto. Corrija os erros acima.${colors.reset}`)

    console.log(`\n${colors.bold}Passos sugeridos:${colors.reset}`)

    if (results.find((r) => r.name === "env-file" && !r.passed)) {
      console.log(`  1. ${colors.cyan}cp .env.example .env${colors.reset}`)
    }
    if (results.find((r) => r.name.startsWith("env-") && !r.passed)) {
      console.log(`  2. Configure as variáveis no arquivo .env`)
    }
    if (results.find((r) => r.name === "node-modules" && !r.passed)) {
      console.log(`  3. ${colors.cyan}npm install${colors.reset}`)
    }
    if (results.find((r) => r.name === "prisma-client" && !r.passed)) {
      console.log(`  4. ${colors.cyan}npm run db:generate${colors.reset}`)
    }
    if (results.find((r) => r.name.startsWith("table-") && !r.passed)) {
      console.log(`  5. ${colors.cyan}npm run db:push${colors.reset}`)
    }
    if (results.find((r) => r.name.startsWith("seed-") && !r.passed)) {
      console.log(`  6. ${colors.cyan}npm run db:seed${colors.reset}`)
    }
    console.log("")
  }
}

// ============================================
// MAIN
// ============================================
async function main(): Promise<void> {
  console.log(`\n${colors.bold}${colors.cyan}`)
  console.log("╔════════════════════════════════════════════════╗")
  console.log("║        FamFinance - Verificação de Setup       ║")
  console.log("╚════════════════════════════════════════════════╝")
  console.log(`${colors.reset}`)

  await checkEnvFile()
  await checkEnvVariables()
  await checkNodeModules()
  await checkPrismaClient()
  await checkDatabaseConnection()
  await checkTablesExist()
  await checkSeedData()

  printSummary()
}

main().catch(console.error)
