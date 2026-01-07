import type {
  Transaction,
  AppNotification,
} from "@/types"
import { formatCurrency } from "@/lib/utils"

// Budget category with monthly limit
interface CategoryBudget {
  categoryId: string
  categoryName: string
  budgetLimit: number
  spent: number
  color: string
}

// Budget rule (50/30/20)
interface BudgetRule {
  essentials: { projected: number; actual: number }
  lifestyle: { projected: number; actual: number }
  investments: { projected: number; actual: number }
}

// Installment info
interface Installment {
  id: string
  description: string
  amount: number
  dueDate: Date
  currentInstallment: number
  totalInstallments: number
}

// Investment goal
interface InvestmentGoal {
  monthlyTarget: number
  currentContribution: number
}

// Alert thresholds
const BUDGET_THRESHOLDS = [70, 90, 100] as const
const RULE_IMBALANCE_THRESHOLD = 10 // 10% deviation

export interface AlertCheckResult {
  notification: Omit<AppNotification, "id" | "isRead" | "createdAt">
  shouldShow: boolean
}

/**
 * Check if a category has reached budget thresholds (70%, 90%, 100%)
 */
export function checkCategoryBudget(
  category: CategoryBudget,
  previousSpent: number
): AlertCheckResult | null {
  if (category.budgetLimit <= 0) return null

  const currentPercent = (category.spent / category.budgetLimit) * 100
  const previousPercent = (previousSpent / category.budgetLimit) * 100

  // Find which threshold was just crossed
  for (const threshold of BUDGET_THRESHOLDS) {
    if (currentPercent >= threshold && previousPercent < threshold) {
      const isOver = threshold === 100
      const isWarning = threshold === 90

      return {
        notification: {
          title: isOver
            ? `Orçamento estourado!`
            : `Alerta de orçamento`,
          message: isOver
            ? `${category.categoryName} ultrapassou o limite de ${formatCurrency(category.budgetLimit)}`
            : `${category.categoryName} atingiu ${threshold}% do orçamento (${formatCurrency(category.spent)} de ${formatCurrency(category.budgetLimit)})`,
          type: isOver ? "danger" : isWarning ? "warning" : "info",
          category: "budget_alert",
          action: {
            label: "Ver categoria",
            href: `/transacoes?categoria=${category.categoryId}`,
          },
          metadata: {
            categoryId: category.categoryId,
            threshold,
            spent: category.spent,
            limit: category.budgetLimit,
          },
        },
        shouldShow: true,
      }
    }
  }

  return null
}

/**
 * Check if 50/30/20 rule is imbalanced
 */
export function checkBudgetRule(
  rule: BudgetRule,
  totalIncome: number
): AlertCheckResult | null {
  if (totalIncome <= 0) return null

  const checks = [
    {
      name: "Essenciais (50%)",
      projected: 50,
      actual: (rule.essentials.actual / totalIncome) * 100,
      type: "essentials" as const,
    },
    {
      name: "Estilo de vida (30%)",
      projected: 30,
      actual: (rule.lifestyle.actual / totalIncome) * 100,
      type: "lifestyle" as const,
    },
    {
      name: "Investimentos (20%)",
      projected: 20,
      actual: (rule.investments.actual / totalIncome) * 100,
      type: "investments" as const,
    },
  ]

  const imbalanced = checks.filter(
    (c) => Math.abs(c.actual - c.projected) > RULE_IMBALANCE_THRESHOLD
  )

  if (imbalanced.length === 0) return null

  // Find the most problematic category
  const worst = imbalanced.reduce((a, b) =>
    Math.abs(a.actual - a.projected) > Math.abs(b.actual - b.projected) ? a : b
  )

  const isOver = worst.actual > worst.projected
  const diff = Math.abs(worst.actual - worst.projected).toFixed(0)

  return {
    notification: {
      title: "Regra 50/30/20 desbalanceada",
      message: `${worst.name} está ${diff}% ${isOver ? "acima" : "abaixo"} do ideal`,
      type: worst.type === "investments" && !isOver ? "warning" : "info",
      category: "rule_imbalance",
      action: {
        label: "Ver orçamento",
        href: "/configuracoes?tab=regra",
      },
      metadata: {
        imbalanced: imbalanced.map((i) => ({
          type: i.type,
          projected: i.projected,
          actual: i.actual.toFixed(1),
        })),
      },
    },
    shouldShow: true,
  }
}

/**
 * Check if monthly investment goal was achieved
 */
export function checkInvestmentGoal(
  goal: InvestmentGoal
): AlertCheckResult | null {
  if (goal.monthlyTarget <= 0) return null

  const percent = (goal.currentContribution / goal.monthlyTarget) * 100

  if (percent >= 100) {
    return {
      notification: {
        title: "Meta de investimento batida!",
        message: `Você atingiu sua meta de ${formatCurrency(goal.monthlyTarget)} este mês`,
        type: "success",
        category: "goal_achieved",
        action: {
          label: "Ver investimentos",
          href: "/investimentos",
        },
        metadata: {
          target: goal.monthlyTarget,
          contributed: goal.currentContribution,
        },
      },
      shouldShow: true,
    }
  }

  return null
}

/**
 * Check for installments due in the next N days
 */
export function checkInstallmentsDue(
  installments: Installment[],
  daysAhead: number = 3
): AlertCheckResult[] {
  const results: AlertCheckResult[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + daysAhead)

  for (const installment of installments) {
    const dueDate = new Date(installment.dueDate)
    dueDate.setHours(0, 0, 0, 0)

    // Check if due date is within range
    if (dueDate >= today && dueDate <= futureDate) {
      const daysUntil = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      const isToday = daysUntil === 0
      const isTomorrow = daysUntil === 1

      results.push({
        notification: {
          title: isToday
            ? "Parcela vence hoje!"
            : isTomorrow
            ? "Parcela vence amanhã"
            : `Parcela vence em ${daysUntil} dias`,
          message: `${installment.description} - Parcela ${installment.currentInstallment}/${installment.totalInstallments}: ${formatCurrency(installment.amount)}`,
          type: isToday ? "danger" : isTomorrow ? "warning" : "info",
          category: "installment_due",
          action: {
            label: "Ver transação",
            href: `/transacoes?id=${installment.id}`,
          },
          metadata: {
            installmentId: installment.id,
            dueDate: installment.dueDate,
            amount: installment.amount,
          },
        },
        shouldShow: true,
      })
    }
  }

  return results
}

/**
 * Analyze a transaction and generate relevant alerts
 */
export function analyzeTransaction(
  transaction: Transaction,
  context: {
    categoryBudgets: CategoryBudget[]
    budgetRule: BudgetRule
    totalIncome: number
    investmentGoal: InvestmentGoal
    previousCategorySpent: Record<string, number>
  }
): AlertCheckResult[] {
  const results: AlertCheckResult[] = []

  // Only analyze expenses
  if (transaction.type !== "expense" && transaction.type !== "transfer") {
    // Check investment goal for income/investment transactions
    const investmentCheck = checkInvestmentGoal(context.investmentGoal)
    if (investmentCheck) {
      results.push(investmentCheck)
    }
    return results
  }

  // Check category budget
  if (transaction.categoryId) {
    const categoryBudget = context.categoryBudgets.find(
      (c) => c.categoryId === transaction.categoryId
    )
    const previousSpent =
      context.previousCategorySpent[transaction.categoryId] || 0

    if (categoryBudget) {
      const budgetCheck = checkCategoryBudget(categoryBudget, previousSpent)
      if (budgetCheck) {
        results.push(budgetCheck)
      }
    }
  }

  // Check 50/30/20 rule
  const ruleCheck = checkBudgetRule(context.budgetRule, context.totalIncome)
  if (ruleCheck) {
    results.push(ruleCheck)
  }

  return results
}

/**
 * Run daily checks (installments, etc.)
 */
export function runDailyChecks(context: {
  installments: Installment[]
}): AlertCheckResult[] {
  const results: AlertCheckResult[] = []

  // Check installments due
  const installmentChecks = checkInstallmentsDue(context.installments, 3)
  results.push(...installmentChecks)

  return results
}
