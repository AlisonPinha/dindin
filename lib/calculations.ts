/**
 * Financial calculations for goals, budgets, and projections
 */

import type { Transaction, Goal, Investment } from "@/types"

// ================================
// Budget Rule 50-30-20 Calculations
// ================================

export interface BudgetRuleResult {
  essentials: { ideal: number; actual: number; percentage: number; deviation: number }
  lifestyle: { ideal: number; actual: number; percentage: number; deviation: number }
  investments: { ideal: number; actual: number; percentage: number; deviation: number }
  total: number
  score: number
}

export function calculateBudgetRule(
  income: number,
  spending: { essentials: number; lifestyle: number; investments: number }
): BudgetRuleResult {
  const result: BudgetRuleResult = {
    essentials: {
      ideal: income * 0.5,
      actual: spending.essentials,
      percentage: income > 0 ? (spending.essentials / income) * 100 : 0,
      deviation: 0,
    },
    lifestyle: {
      ideal: income * 0.3,
      actual: spending.lifestyle,
      percentage: income > 0 ? (spending.lifestyle / income) * 100 : 0,
      deviation: 0,
    },
    investments: {
      ideal: income * 0.2,
      actual: spending.investments,
      percentage: income > 0 ? (spending.investments / income) * 100 : 0,
      deviation: 0,
    },
    total: income,
    score: 100,
  }

  // Calculate deviations
  result.essentials.deviation = result.essentials.percentage - 50
  result.lifestyle.deviation = result.lifestyle.percentage - 30
  result.investments.deviation = result.investments.percentage - 20

  // Calculate health score
  let score = 100

  // Penalize exceeding essentials more heavily
  if (result.essentials.deviation > 0) {
    score -= Math.min(40, result.essentials.deviation * 2)
  }

  // Penalize exceeding lifestyle
  if (result.lifestyle.deviation > 0) {
    score -= Math.min(20, result.lifestyle.deviation)
  }

  // Penalize not meeting investment goal
  if (result.investments.deviation < 0) {
    score -= Math.min(30, Math.abs(result.investments.deviation) * 1.5)
  }

  result.score = Math.max(0, Math.round(score))

  return result
}

// ================================
// Goal Progress Calculations
// ================================

export interface GoalProgress {
  percentage: number
  remaining: number
  daysRemaining: number | null
  estimatedCompletion: Date | null
  monthlyRate: number
  offTrack: boolean
}

export function calculateGoalProgress(
  goal: Goal,
  history: { date: Date; value: number }[] = []
): GoalProgress {
  const percentage = goal.targetAmount > 0
    ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
    : 0

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)

  // Calculate days remaining until deadline
  let daysRemaining: number | null = null
  if (goal.deadline) {
    const today = new Date()
    const deadline = new Date(goal.deadline)
    daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  }

  // Calculate monthly rate based on history
  let monthlyRate = 0
  if (history.length >= 2) {
    const sortedHistory = [...history].sort((a, b) => a.date.getTime() - b.date.getTime())
    const firstEntry = sortedHistory[0]
    const lastEntry = sortedHistory[sortedHistory.length - 1]

    if (firstEntry && lastEntry) {
      const monthsDiff =
        (lastEntry.date.getTime() - firstEntry.date.getTime()) / (1000 * 60 * 60 * 24 * 30)

      if (monthsDiff > 0) {
        monthlyRate = (lastEntry.value - firstEntry.value) / monthsDiff
      }
    }
  }

  // Estimate completion date
  let estimatedCompletion: Date | null = null
  if (monthlyRate > 0 && remaining > 0) {
    const monthsRemaining = remaining / monthlyRate
    estimatedCompletion = new Date()
    estimatedCompletion.setMonth(estimatedCompletion.getMonth() + Math.ceil(monthsRemaining))
  }

  // Check if on track to meet deadline
  let offTrack = false
  if (goal.deadline && daysRemaining !== null && daysRemaining > 0 && remaining > 0) {
    const requiredMonthly = remaining / (daysRemaining / 30)
    offTrack = monthlyRate < requiredMonthly
  }

  return {
    percentage,
    remaining,
    daysRemaining,
    estimatedCompletion,
    monthlyRate,
    offTrack,
  }
}

// ================================
// Investment Calculations
// ================================

export interface InvestmentSummary {
  totalValue: number
  totalInvested: number
  totalProfit: number
  totalProfitability: number
  allocation: { type: string; value: number; percentage: number }[]
}

export function calculateInvestmentSummary(investments: Investment[]): InvestmentSummary {
  const totalValue = investments.reduce((sum, inv) => sum + inv.currentPrice, 0)
  const totalInvested = investments.reduce((sum, inv) => sum + inv.purchasePrice, 0)
  const totalProfit = totalValue - totalInvested
  const totalProfitability = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0

  // Group by type
  const byType = investments.reduce((acc, inv) => {
    if (!acc[inv.type]) {
      acc[inv.type] = 0
    }
    const current = acc[inv.type] ?? 0
    acc[inv.type] = current + inv.currentPrice
    return acc
  }, {} as Record<string, number>)

  const allocation = Object.entries(byType).map(([type, value]) => ({
    type,
    value,
    percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
  }))

  return {
    totalValue,
    totalInvested,
    totalProfit,
    totalProfitability,
    allocation,
  }
}

// ================================
// Monthly Projections
// ================================

export interface MonthlyProjection {
  estimatedIncome: number
  estimatedExpenses: number
  estimatedBalance: number
  daysRemaining: number
  dailyAverage: number
  dailyLimit: number
}

export function calculateMonthlyProjection(
  transactions: Transaction[],
  totalIncome: number
): MonthlyProjection {
  const today = new Date()
  const currentDay = today.getDate()
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysRemaining = lastDay - currentDay

  // Sum expenses so far
  const currentExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  // Calculate daily average
  const dailyAverage = currentDay > 0 ? currentExpenses / currentDay : 0

  // Project total expenses
  const estimatedExpenses = currentExpenses + dailyAverage * daysRemaining

  // Calculate available budget per day
  const remainingBudget = totalIncome - currentExpenses
  const dailyLimit = daysRemaining > 0 ? remainingBudget / daysRemaining : 0

  return {
    estimatedIncome: totalIncome,
    estimatedExpenses,
    estimatedBalance: totalIncome - estimatedExpenses,
    daysRemaining,
    dailyAverage,
    dailyLimit,
  }
}

// ================================
// Category Analysis
// ================================

export interface CategoryAnalysis {
  categoryId: string
  categoryName: string
  amountSpent: number
  budget: number | null
  percentUsed: number
  percentOfTotal: number
  trend: "up" | "down" | "stable"
  monthlyAverage: number
}

export function analyzeCategorySpending(
  currentMonth: Transaction[],
  previousMonth: Transaction[]
): CategoryAnalysis[] {
  // Group current month by category
  const byCategory = currentMonth.reduce((acc, t) => {
    if (!t.category) return acc

    if (!acc[t.category.id]) {
      acc[t.category.id] = {
        name: t.category.name,
        budget: t.category.monthlyBudget,
        amount: 0,
      }
    }
    const entry = acc[t.category.id]
    if (entry) {
      entry.amount += t.amount
    }
    return acc
  }, {} as Record<string, { name: string; budget: number | null | undefined; amount: number }>)

  // Calculate totals
  const totalSpent = Object.values(byCategory).reduce((sum, c) => sum + c.amount, 0)

  // Group previous month for comparison
  const prevByCategory = previousMonth.reduce((acc, t) => {
    if (!t.category) return acc

    if (!acc[t.category.id]) {
      acc[t.category.id] = 0
    }
    const current = acc[t.category.id] ?? 0
    acc[t.category.id] = current + t.amount
    return acc
  }, {} as Record<string, number>)

  // Build analysis
  return Object.entries(byCategory).map(([id, data]) => {
    const prevAmount = prevByCategory[id] || 0
    const diff = data.amount - prevAmount

    let trend: "up" | "down" | "stable" = "stable"
    if (diff > prevAmount * 0.1) trend = "up"
    if (diff < -prevAmount * 0.1) trend = "down"

    return {
      categoryId: id,
      categoryName: data.name,
      amountSpent: data.amount,
      budget: data.budget ?? null,
      percentUsed: data.budget
        ? (data.amount / data.budget) * 100
        : 0,
      percentOfTotal: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
      trend,
      monthlyAverage: (data.amount + prevAmount) / 2,
    }
  }).sort((a, b) => b.amountSpent - a.amountSpent)
}

// ================================
// Savings Rate
// ================================

export function calculateSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0
  const savings = income - expenses
  return Math.max(0, (savings / income) * 100)
}

// ================================
// Compound Interest
// ================================

export function calculateCompoundInterest(
  principal: number,
  monthlyRate: number,
  months: number,
  monthlyDeposit = 0
): number {
  let total = principal
  const rate = monthlyRate / 100

  for (let i = 0; i < months; i++) {
    total = total * (1 + rate) + monthlyDeposit
  }

  return total
}

export function calculateTimeToGoal(
  currentValue: number,
  targetValue: number,
  monthlyDeposit: number,
  monthlyRate: number
): number {
  if (monthlyDeposit <= 0 && monthlyRate <= 0) return Infinity

  const rate = monthlyRate / 100
  let months = 0
  let value = currentValue

  while (value < targetValue && months < 1200) {
    value = value * (1 + rate) + monthlyDeposit
    months++
  }

  return months
}

// ================================
// Installment Calculations
// ================================

/**
 * Calculates the month difference between two dates
 * FÓRMULA: diferenca_em_meses = (ano_destino - ano_origem) * 12 + (mes_destino - mes_origem)
 *
 * @param fromYear - Ano de origem
 * @param fromMonth - Mês de origem (0-11)
 * @param toYear - Ano de destino
 * @param toMonth - Mês de destino (0-11)
 * @returns Diferença em meses (pode ser negativo)
 */
export function calculateMonthDifference(
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number
): number {
  return (toYear - fromYear) * 12 + (toMonth - fromMonth)
}

export interface InstallmentCalculation {
  calculatedInstallment: number
  totalInstallments: number
  isVisible: boolean
  displayText: string
}

/**
 * Calculates the dynamic installment number based on the viewed month
 *
 * FÓRMULA:
 * diferenca_em_meses = (ano_visualizado - ano_transacao) * 12 + (mes_visualizado - mes_transacao)
 * parcela_atual = parcela_inicial + diferenca_em_meses
 *
 * REGRAS:
 * - Se parcela_atual > total_parcelas: não exibir (parcelas finalizadas)
 * - Se parcela_atual < 1: não exibir (ainda não começou)
 *
 * @param transactionDate - Data original da compra/transação
 * @param initialInstallment - Número da parcela salvo no banco (parcela_atual)
 * @param totalInstallments - Total de parcelas (parcelas)
 * @param viewedMonth - Mês sendo visualizado (0-11)
 * @param viewedYear - Ano sendo visualizado
 */
export function calculateDynamicInstallment(
  transactionDate: Date,
  initialInstallment: number,
  totalInstallments: number,
  viewedMonth: number,
  viewedYear: number
): InstallmentCalculation {
  const purchaseMonth = transactionDate.getMonth()
  const purchaseYear = transactionDate.getFullYear()

  // FÓRMULA: diferenca_em_meses = (ano_visualizado - ano_transacao) * 12 + (mes_visualizado - mes_transacao)
  const monthDiff = calculateMonthDifference(purchaseYear, purchaseMonth, viewedYear, viewedMonth)

  // FÓRMULA: parcela_atual = parcela_inicial + diferenca_em_meses
  const calculatedInstallment = initialInstallment + monthDiff

  // REGRA: Pertence ao mês se parcela_calculada >= 1 E parcela_calculada <= total_parcelas
  const isVisible = calculatedInstallment >= 1 && calculatedInstallment <= totalInstallments

  // Format display text
  const displayText = isVisible
    ? `${calculatedInstallment}/${totalInstallments}`
    : ""

  return {
    calculatedInstallment,
    totalInstallments,
    isVisible,
    displayText,
  }
}

// ================================
// Centralized Month Filter
// ================================

/**
 * Transaction with calculated installment info for the viewed period
 */
export interface TransactionWithInstallment extends Transaction {
  calculatedInstallment?: number
  installmentDisplay?: string
}

/**
 * Centralized function to filter transactions for a specific month
 * This function should be used throughout the entire app to ensure consistency
 *
 * RULES:
 * 1. Single transactions (no installments): include if transaction month/year matches viewed month/year
 * 2. Installment transactions: include if calculated installment is between 1 and total installments
 *
 * @param transactions - All transactions to filter
 * @param viewedMonth - Month being viewed (0-11)
 * @param viewedYear - Year being viewed
 * @returns Filtered transactions with calculated installment info
 */
/**
 * Checks if a transaction is an installment transaction
 * An installment transaction has: parcela_inicial >= 1 AND total_parcelas >= 2
 */
function isInstallmentTransaction(t: Transaction): boolean {
  return (
    t.installments !== null &&
    t.installments !== undefined &&
    t.installments >= 2 &&
    t.currentInstallment !== null &&
    t.currentInstallment !== undefined &&
    t.currentInstallment >= 1
  )
}

/**
 * Filtra transações para o mês visualizado.
 *
 * LÓGICA SIMPLIFICADA:
 * - Compara mes_fatura com o mês/ano visualizado
 * - Funciona para qualquer tipo de conta
 * - Parcelas já têm seu próprio mes_fatura (definido no backend)
 *
 * @param transactions - Lista de transações
 * @param viewedMonth - Mês visualizado (0-11, onde 0 = Janeiro)
 * @param viewedYear - Ano visualizado
 */
export function getTransacoesDoMes(
  transactions: Transaction[],
  viewedMonth: number,
  viewedYear: number
): TransactionWithInstallment[] {
  // Validação de entrada
  if (!Array.isArray(transactions)) {
    console.error("getTransacoesDoMes: transactions deve ser um array")
    return []
  }

  return transactions
    .filter((t) => {
      // LÓGICA PRINCIPAL: Usar mes_fatura para filtrar
      // mes_fatura é calculado no backend baseado no tipo de conta
      if (t.mesFatura) {
        const mesFatura = new Date(t.mesFatura)
        return mesFatura.getMonth() === viewedMonth && mesFatura.getFullYear() === viewedYear
      }

      // FALLBACK (transações antigas sem mes_fatura): usar data da transação
      const transactionDate = new Date(t.date)
      return transactionDate.getMonth() === viewedMonth && transactionDate.getFullYear() === viewedYear
    })
    .map((t) => {
      // Adicionar texto de parcela para exibição
      if (isInstallmentTransaction(t)) {
        return {
          ...t,
          calculatedInstallment: t.currentInstallment!,
          installmentDisplay: `${t.currentInstallment}/${t.installments}`,
        }
      }
      return t
    })
}

/**
 * Get income transactions for a specific month
 */
export function getReceitasDoMes(
  transactions: Transaction[],
  viewedMonth: number,
  viewedYear: number
): TransactionWithInstallment[] {
  return getTransacoesDoMes(transactions, viewedMonth, viewedYear)
    .filter((t) => t.type === "income")
}

/**
 * Get expense transactions for a specific month
 */
export function getDespesasDoMes(
  transactions: Transaction[],
  viewedMonth: number,
  viewedYear: number
): TransactionWithInstallment[] {
  return getTransacoesDoMes(transactions, viewedMonth, viewedYear)
    .filter((t) => t.type === "expense")
}

/**
 * Calculate totals for a specific month
 */
export interface MonthTotals {
  totalIncome: number
  totalExpenses: number
  balance: number
  transactionCount: number
}

export function calcularTotaisDoMes(
  transactions: Transaction[],
  viewedMonth: number,
  viewedYear: number
): MonthTotals {
  const filtered = getTransacoesDoMes(transactions, viewedMonth, viewedYear)

  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filtered
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    transactionCount: filtered.length,
  }
}

// ================================
// Safe Percentage Calculations
// ================================

/**
 * Safely calculates a percentage, returning 0 if division would be invalid
 * @param numerator - The value to be divided
 * @param denominator - The value to divide by
 * @param decimalPlaces - Number of decimal places (default: 1)
 * @returns The percentage value, or 0 if invalid
 */
export function safePercentage(
  numerator: number,
  denominator: number,
  decimalPlaces = 1
): number {
  if (denominator === 0 || !Number.isFinite(denominator) || !Number.isFinite(numerator)) {
    return 0
  }
  const result = (numerator / denominator) * 100
  if (!Number.isFinite(result)) {
    return 0
  }
  const multiplier = Math.pow(10, decimalPlaces)
  return Math.round(result * multiplier) / multiplier
}

/**
 * Formats a percentage for display, returning "—" for invalid values
 * @param value - The percentage value
 * @param decimalPlaces - Number of decimal places (default: 1)
 * @returns Formatted string like "25.5%" or "—"
 */
export function formatPercentage(
  value: number | null | undefined,
  decimalPlaces = 1
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—"
  }
  return `${value.toFixed(decimalPlaces)}%`
}

/**
 * Safely calculates variation between two values
 * @param current - Current value
 * @param previous - Previous value
 * @returns Variation as percentage, or null if invalid
 */
export function safeVariation(
  current: number,
  previous: number
): number | null {
  if (previous === 0) {
    // If previous is 0 but current is not, return null (can't calculate percentage)
    return current === 0 ? 0 : null
  }
  const variation = ((current - previous) / previous) * 100
  if (!Number.isFinite(variation)) {
    return null
  }
  return Math.round(variation * 10) / 10
}
