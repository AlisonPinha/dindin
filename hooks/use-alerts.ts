"use client"

import { useCallback, useEffect } from "react"
import { useNotifications } from "./use-notifications"
import { useStore } from "./use-store"
import type { Transaction, Category } from "@/types"

interface AlertConfig {
  budgetThresholds: number[] // e.g., [70, 90, 100]
  ruleDeviation: number // e.g., 10 (10% deviation)
  installmentDaysBefore: number // e.g., 3
}

const defaultConfig: AlertConfig = {
  budgetThresholds: [70, 90, 100],
  ruleDeviation: 10,
  installmentDaysBefore: 3,
}

export function useAlerts(config: Partial<AlertConfig> = {}) {
  const { addNotification } = useNotifications()
  const { user } = useStore()

  const alertConfig = { ...defaultConfig, ...config }

  // Check category budget
  const checkCategoryBudget = useCallback(
    (category: Category, spent: number) => {
      if (!category.monthlyBudget) return

      const percentUsed = (spent / category.monthlyBudget) * 100

      for (const threshold of alertConfig.budgetThresholds) {
        if (percentUsed >= threshold) {
          const type = threshold >= 100 ? "danger" : threshold >= 90 ? "warning" : "info"

          addNotification({
            title:
              threshold >= 100
                ? `Orçamento estourado: ${category.name}`
                : `Alerta de orçamento: ${category.name}`,
            message:
              threshold >= 100
                ? `Você gastou ${percentUsed.toFixed(0)}% do orçamento de ${category.name}.`
                : `Você já usou ${percentUsed.toFixed(0)}% do orçamento de ${category.name}.`,
            type,
            category: "budget_alert",
            metadata: {
              categoryId: category.id,
              percentUsed,
              threshold,
            },
          })

          break // Only send one alert per category
        }
      }
    },
    [addNotification, alertConfig.budgetThresholds]
  )

  // Check 50-30-20 rule balance
  const checkBudgetRule = useCallback(
    (rule: { essentials: number; lifestyle: number; investments: number }) => {
      const total = rule.essentials + rule.lifestyle + rule.investments
      if (total === 0) return

      const deviations = {
        essentials: Math.abs((rule.essentials / total) * 100 - 50),
        lifestyle: Math.abs((rule.lifestyle / total) * 100 - 30),
        investments: Math.abs((rule.investments / total) * 100 - 20),
      }

      if (deviations.essentials > alertConfig.ruleDeviation) {
        addNotification({
          title: "Desequilíbrio na regra 50-30-20",
          message: `Seus gastos essenciais estão ${deviations.essentials.toFixed(0)}% fora da meta.`,
          type: "warning",
          category: "rule_imbalance",
        })
      }

      if (deviations.investments > alertConfig.ruleDeviation) {
        addNotification({
          title: "Meta de investimento",
          message: `Seus investimentos estão ${deviations.investments.toFixed(0)}% fora da meta de 20%.`,
          type: "info",
          category: "rule_imbalance",
        })
      }
    },
    [addNotification, alertConfig.ruleDeviation]
  )

  // Check upcoming installments
  const checkInstallments = useCallback(
    (transactions: Transaction[]) => {
      const today = new Date()
      const futureDate = new Date()
      futureDate.setDate(today.getDate() + alertConfig.installmentDaysBefore)

      const upcomingInstallments = transactions.filter((t) => {
        if (!t.installments || !t.currentInstallment) return false
        const transactionDate = new Date(t.date)
        return transactionDate >= today && transactionDate <= futureDate
      })

      if (upcomingInstallments.length > 0) {
        const totalValue = upcomingInstallments.reduce((sum, t) => sum + t.amount, 0)

        addNotification({
          title: "Parcelas próximas",
          message: `Você tem ${upcomingInstallments.length} parcela(s) vencendo nos próximos ${alertConfig.installmentDaysBefore} dias, totalizando R$ ${totalValue.toFixed(2)}.`,
          type: "info",
          category: "installment_due",
          action: {
            label: "Ver detalhes",
            onClick: () => {
              // Navigate to transactions filtered by installments
              window.location.href = "/transacoes?filter=parcelas"
            },
          },
        })
      }
    },
    [addNotification, alertConfig.installmentDaysBefore]
  )

  // Check if investment goal is met
  const checkInvestmentGoal = useCallback(
    (goalValue: number, currentValue: number, goalName: string) => {
      if (currentValue >= goalValue) {
        addNotification({
          title: "Meta atingida!",
          message: `Parabéns! Você atingiu a meta "${goalName}".`,
          type: "success",
          category: "goal_achieved",
        })
      }
    },
    [addNotification]
  )

  // Analyze a new transaction
  const analyzeTransaction = useCallback(
    async (transaction: Transaction) => {
      if (!transaction.category) return

      // Get all transactions for this category this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const params = new URLSearchParams({
        userId: transaction.userId,
        categoryId: transaction.categoryId || "",
        dataInicio: startOfMonth.toISOString(),
        dataFim: new Date().toISOString(),
      })

      try {
        const response = await fetch(`/api/transacoes?${params}`)
        if (response.ok) {
          const data = await response.json()
          const totalSpent = data.transactions.reduce(
            (sum: number, t: Transaction) => sum + t.amount,
            0
          )

          checkCategoryBudget(transaction.category as Category, totalSpent)
        }
      } catch (error) {
        console.error("Error analyzing transaction:", error)
      }
    },
    [checkCategoryBudget]
  )

  // Run daily checks
  const runDailyChecks = useCallback(async () => {
    if (!user?.id) return

    try {
      // Check installments
      const params = new URLSearchParams({
        userId: user.id,
        limit: "100",
      })

      const response = await fetch(`/api/transacoes?${params}`)
      if (response.ok) {
        const data = await response.json()
        checkInstallments(data.transactions)
      }
    } catch (error) {
      console.error("Error running daily checks:", error)
    }
  }, [user?.id, checkInstallments])

  // Run checks on mount
  useEffect(() => {
    runDailyChecks()
  }, [runDailyChecks])

  return {
    checkCategoryBudget,
    checkBudgetRule,
    checkInstallments,
    checkInvestmentGoal,
    analyzeTransaction,
    runDailyChecks,
  }
}
