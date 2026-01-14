// ============================================
// UI ENUMS (used by existing components)
// ============================================

export type AccountType = "checking" | "savings" | "credit" | "investment"

export type CategoryType = "income" | "expense"

export type TransactionType = "income" | "expense" | "transfer"

export type InvestmentType = "stocks" | "bonds" | "crypto" | "real_estate" | "funds" | "other"

export type GoalType = "savings" | "investment" | "patrimony" | "budget"

export type GoalStatus = "active" | "completed" | "paused"

export type GoalHealthStatus = "on_track" | "attention" | "risk"

export type AlertThreshold = 70 | 80 | 90

// Ownership type for transactions
export type OwnershipType = "household" | "personal"

// Budget group for 50/30/20 rule
export type BudgetGroup = "essentials" | "lifestyle" | "investments"

// ============================================
// DATABASE ENUMS (matching Prisma schema)
// Used internally by API routes and hooks
// ============================================

export type DbAccountType = "CORRENTE" | "POUPANCA" | "CARTAO_CREDITO" | "INVESTIMENTO"
export type DbCategoryType = "RECEITA" | "DESPESA" | "INVESTIMENTO"
export type DbCategoryGroup = "ESSENCIAL" | "INVESTIMENTO" | "LIVRE"
export type DbTransactionType = "ENTRADA" | "SAIDA" | "TRANSFERENCIA" | "INVESTIMENTO"
export type DbInvestmentType = "RENDA_FIXA" | "RENDA_VARIAVEL" | "CRIPTO" | "FUNDO"
export type DbGoalType = "ECONOMIA_CATEGORIA" | "INVESTIMENTO_MENSAL" | "PATRIMONIO" | "REGRA_PERCENTUAL"

// ============================================
// UI MODELS (used by existing components)
// ============================================

export interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
  isOnboarded?: boolean
  monthlyIncome?: number | null
  createdAt: Date
  updatedAt: Date
}

// Dados do onboarding (para API)
export interface OnboardingData {
  // Step 1: Profile
  nome: string
  email: string
  avatar?: string

  // Step 2: Accounts
  accounts: {
    nome: string
    tipo: DbAccountType
    banco: string
    saldoInicial: number
    cor: string
  }[]

  // Step 3: Income
  rendaMensal: number
}

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  color?: string | null
  icon?: string | null
  bank?: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  type: CategoryType
  color: string
  icon?: string | null
  budgetGroup?: BudgetGroup
  monthlyBudget?: number | null
  userId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  description: string
  amount: number
  type: TransactionType
  date: Date
  mesFatura?: Date | null // Mês da fatura (primeiro dia do mês, ex: 2026-01-01)
  notes?: string | null
  isRecurring?: boolean
  installments?: number | null
  currentInstallment?: number | null
  tags?: string[]
  ownership?: OwnershipType  // "household" (Casa) ou "personal" (Pessoal)
  userId: string
  categoryId?: string | null
  accountId?: string | null
  category?: Category | null
  account?: Account | null
  user?: User | null
  createdAt: Date
  updatedAt: Date
}

export interface Investment {
  id: string
  name: string
  type: InvestmentType
  ticker?: string | null
  institution?: string | null
  quantity?: number
  purchasePrice: number
  currentPrice: number
  purchaseDate: Date
  maturityDate?: Date | null
  notes?: string | null
  profitability?: number
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Goal {
  id: string
  name: string
  description?: string | null
  type: GoalType
  targetAmount: number
  currentAmount: number
  deadline?: Date | null
  color?: string | null
  icon?: string | null
  status: GoalStatus
  streak?: number
  isActive?: boolean
  categoryId?: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Budget {
  id: string
  monthYear: string
  essentialsProjected: number
  lifestyleProjected: number
  investmentsProjected: number
  essentialsActual: number
  lifestyleActual: number
  investmentsActual: number
  userId: string
  createdAt: Date
  updatedAt: Date
}

// ============================================
// DASHBOARD & UI TYPES
// ============================================

export interface DashboardSummary {
  totalBalance: number
  totalIncome: number
  totalExpenses: number
  savingsRate: number
  investmentsTotal: number
  investmentsReturn: number
  goalsProgress: number
}

export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface MonthlyData {
  month: string
  income: number
  expense: number
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = "info" | "warning" | "danger" | "success"

export type NotificationCategory =
  | "budget_alert"
  | "goal_achieved"
  | "rule_imbalance"
  | "installment_due"
  | "investment_update"
  | "general"

export interface NotificationAction {
  label: string
  href?: string
  onClick?: () => void
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  isRead: boolean
  action?: NotificationAction
  metadata?: Record<string, unknown>
  createdAt: Date
}

// ============================================
// ACHIEVEMENT TYPES
// ============================================

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt?: Date | null
  category: "savings" | "budget" | "streak" | "milestone"
}

// ============================================
// ADVANCED GOAL TYPES
// ============================================

export type AdvancedGoalType = "category_limit" | "monthly_investment" | "patrimony_target" | "percentage_rule"

export interface CategoryLimitGoal {
  type: "category_limit"
  categoryId: string
  maxAmount: number
  alertThresholds: AlertThreshold[]
}

export interface MonthlyInvestmentGoal {
  type: "monthly_investment"
  minAmount: number
  investmentType?: InvestmentType
}

export interface PatrimonyTargetGoal {
  type: "patrimony_target"
  targetAmount: number
  deadline: Date
  includeAccounts: boolean
  includeInvestments: boolean
}

export interface PercentageRuleGoal {
  type: "percentage_rule"
  essentialsPercent: number
  investmentsPercent: number
  lifestylePercent: number
}

export type AdvancedGoalConfig =
  | CategoryLimitGoal
  | MonthlyInvestmentGoal
  | PatrimonyTargetGoal
  | PercentageRuleGoal

export interface AdvancedGoal {
  id: string
  name: string
  config: AdvancedGoalConfig
  isActive: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}
