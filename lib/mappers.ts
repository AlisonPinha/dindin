/**
 * Funções de mapeamento entre tipos do banco de dados (snake_case) e frontend (camelCase)
 * Arquivo centralizado para evitar duplicação de código
 */

import type { Transaction, Category, Account, User, Investment, Goal } from "@/types"
import type {
  DbUser,
  DbCategory,
  DbAccount,
  DbTransaction,
  DbInvestment,
  DbGoal,
} from "@/lib/supabase"

// ============================================
// TYPE MAPPINGS (DB → UI)
// ============================================

const categoryTypeMap: Record<string, "income" | "expense"> = {
  RECEITA: "income",
  DESPESA: "expense",
  INVESTIMENTO: "expense",
}

const budgetGroupMap: Record<string, "essentials" | "lifestyle" | "investments"> = {
  ESSENCIAL: "essentials",
  LIVRE: "lifestyle",
  INVESTIMENTO: "investments",
}

const accountTypeMap: Record<string, "checking" | "credit" | "investment"> = {
  CORRENTE: "checking",
  CARTAO_CREDITO: "credit",
  INVESTIMENTO: "investment",
}

const transactionTypeMap: Record<string, "income" | "expense" | "transfer"> = {
  ENTRADA: "income",
  SAIDA: "expense",
  TRANSFERENCIA: "transfer",
  INVESTIMENTO: "expense",
}

const investmentTypeMap: Record<string, "stocks" | "bonds" | "crypto" | "real_estate" | "funds" | "other"> = {
  RENDA_FIXA: "bonds",
  RENDA_VARIAVEL: "stocks",
  CRIPTO: "crypto",
  FUNDO: "funds",
}

const goalTypeMap: Record<string, "savings" | "investment" | "patrimony" | "budget"> = {
  ECONOMIA_CATEGORIA: "savings",
  INVESTIMENTO_MENSAL: "investment",
  PATRIMONIO: "patrimony",
  REGRA_PERCENTUAL: "budget",
}

// ============================================
// OWNERSHIP MAPPING
// ============================================

/**
 * Mapeia ownership do banco (CASA/PESSOAL) para o frontend (household/personal)
 */
export function mapOwnershipToUI(dbOwnership: string | null | undefined): "household" | "personal" {
  return dbOwnership === "PESSOAL" ? "personal" : "household"
}

/**
 * Mapeia ownership do frontend (household/personal) para o banco (CASA/PESSOAL)
 */
export function mapOwnershipToDB(uiOwnership: "household" | "personal" | undefined): "CASA" | "PESSOAL" {
  return uiOwnership === "personal" ? "PESSOAL" : "CASA"
}

// ============================================
// MAPPERS
// ============================================

export function mapDbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    name: dbUser.nome,
    email: dbUser.email,
    avatar: dbUser.avatar || undefined,
    isOnboarded: dbUser.is_onboarded,
    monthlyIncome: dbUser.renda_mensal || undefined,
    createdAt: new Date(dbUser.created_at),
    updatedAt: new Date(dbUser.updated_at),
  }
}

export function mapDbCategoryToCategory(dbCat: DbCategory): Category {
  return {
    id: dbCat.id,
    name: dbCat.nome,
    type: categoryTypeMap[dbCat.tipo] || "expense",
    color: dbCat.cor,
    icon: dbCat.icone || undefined,
    budgetGroup: budgetGroupMap[dbCat.grupo] || undefined,
    monthlyBudget: dbCat.orcamento_mensal || undefined,
    userId: "",
    createdAt: new Date(dbCat.created_at),
    updatedAt: new Date(dbCat.updated_at),
  }
}

/**
 * Tipo estendido para contas que podem vir com saldoAtual calculado pela API
 */
type DbAccountWithBalance = DbAccount & { saldoAtual?: number }

export function mapDbAccountToAccount(dbAcc: DbAccountWithBalance): Account {
  // API retorna saldoAtual calculado, mas se não existir, usar saldo
  const balance = dbAcc.saldoAtual ?? dbAcc.saldo ?? 0
  const numBalance = typeof balance === "string" ? parseFloat(balance) : Number(balance)
  const finalBalance = Number.isFinite(numBalance) ? numBalance : 0

  return {
    id: dbAcc.id,
    name: dbAcc.nome,
    type: accountTypeMap[dbAcc.tipo] || "checking",
    balance: finalBalance,
    color: dbAcc.cor || "#6366f1",
    bank: dbAcc.banco || undefined,
    userId: dbAcc.user_id,
    createdAt: new Date(dbAcc.created_at),
    updatedAt: new Date(dbAcc.updated_at),
  }
}

/**
 * Parse date string as local date (avoid timezone issues)
 * "2026-01-01" → Date at midnight local time, not UTC
 */
function parseLocalDate(dateStr: string): Date {
  // Se a string já contém timezone info (T ou Z), usar diretamente
  if (dateStr.includes("T") || dateStr.includes("Z")) {
    return new Date(dateStr)
  }
  // Para strings YYYY-MM-DD, adicionar T00:00:00 para forçar interpretação local
  return new Date(dateStr + "T00:00:00")
}

export function mapDbTransactionToTransaction(
  dbTx: DbTransaction,
  categories: Category[],
  accounts: Account[],
  users: User[]
): Transaction {
  return {
    id: dbTx.id,
    description: dbTx.descricao,
    amount: dbTx.valor,
    type: transactionTypeMap[dbTx.tipo] || "expense",
    date: parseLocalDate(dbTx.data),
    mesFatura: dbTx.mes_fatura ? parseLocalDate(dbTx.mes_fatura) : undefined,
    userId: dbTx.user_id,
    categoryId: dbTx.category_id,
    accountId: dbTx.account_id,
    category: categories.find((c) => c.id === dbTx.category_id) || null,
    account: accounts.find((a) => a.id === dbTx.account_id) || null,
    user: users.find((u) => u.id === dbTx.user_id) || null,
    notes: dbTx.notas || undefined,
    ownership: mapOwnershipToUI(dbTx.ownership),
    isRecurring: dbTx.recorrente,
    installments: dbTx.parcelas || undefined,
    currentInstallment: dbTx.parcela_atual || undefined,
    parentTransactionId: dbTx.transacao_pai_id || undefined,
    tags: dbTx.tags || undefined,
    createdAt: new Date(dbTx.created_at),
    updatedAt: new Date(dbTx.updated_at),
  }
}

export function mapDbInvestmentToInvestment(dbInv: DbInvestment): Investment {
  return {
    id: dbInv.id,
    name: dbInv.nome,
    type: investmentTypeMap[dbInv.tipo] || "bonds",
    institution: dbInv.instituicao || "",
    purchasePrice: dbInv.preco_compra,
    currentPrice: dbInv.preco_atual,
    profitability: dbInv.rentabilidade || 0,
    purchaseDate: new Date(dbInv.data_compra),
    maturityDate: dbInv.data_vencimento ? new Date(dbInv.data_vencimento) : undefined,
    userId: dbInv.user_id,
    createdAt: new Date(dbInv.created_at),
    updatedAt: new Date(dbInv.updated_at),
  }
}

export function mapDbGoalToGoal(dbGoal: DbGoal): Goal {
  return {
    id: dbGoal.id,
    name: dbGoal.nome,
    description: "",
    type: goalTypeMap[dbGoal.tipo] || "savings",
    targetAmount: dbGoal.valor_alvo,
    currentAmount: dbGoal.valor_atual || 0,
    deadline: dbGoal.prazo ? new Date(dbGoal.prazo) : undefined,
    status: dbGoal.ativo ? "active" : "completed",
    userId: dbGoal.user_id,
    createdAt: new Date(dbGoal.created_at),
    updatedAt: new Date(dbGoal.updated_at),
  }
}
