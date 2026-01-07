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

    const monthsDiff =
      (lastEntry.date.getTime() - firstEntry.date.getTime()) / (1000 * 60 * 60 * 24 * 30)

    if (monthsDiff > 0) {
      monthlyRate = (lastEntry.value - firstEntry.value) / monthsDiff
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
    acc[inv.type] += inv.currentPrice
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
    acc[t.category.id].amount += t.amount
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
    acc[t.category.id] += t.amount
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
