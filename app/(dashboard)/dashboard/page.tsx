"use client"

import { useMemo, lazy, Suspense } from "react"
import {
  SummaryCards,
  RecentTransactions,
  GoalAlerts,
  AccountsSummary,
} from "@/components/dashboard"
import { useStore } from "@/hooks/use-store"
import { useTransacoesDoMes } from "@/hooks"
import { safePercentage, getTransacoesDoMes } from "@/lib/calculations"
import type { Transaction, Account } from "@/types"
import { Skeleton } from "@/components/animations/skeleton"

// Lazy load heavy chart components
const BudgetRuleChart = lazy(() => import("@/components/dashboard/budget-rule-chart").then(m => ({ default: m.BudgetRuleChart })))
const WeeklyFlowChart = lazy(() => import("@/components/dashboard/weekly-flow-chart").then(m => ({ default: m.WeeklyFlowChart })))
const EndOfMonthProjection = lazy(() => import("@/components/dashboard/end-of-month-projection").then(m => ({ default: m.EndOfMonthProjection })))
const MonthlySavings = lazy(() => import("@/components/dashboard/monthly-savings").then(m => ({ default: m.MonthlySavings })))
const MonthlyComparison = lazy(() => import("@/components/dashboard/monthly-comparison").then(m => ({ default: m.MonthlyComparison })))
const TopExpenses = lazy(() => import("@/components/dashboard/top-expenses").then(m => ({ default: m.TopExpenses })))
const CoupleRanking = lazy(() => import("@/components/dashboard/couple-ranking").then(m => ({ default: m.CoupleRanking })))
const PersonalExpensesSummary = lazy(() => import("@/components/dashboard/personal-expenses-summary").then(m => ({ default: m.PersonalExpensesSummary })))
const FinancialHealthScore = lazy(() => import("@/components/dashboard/financial-health-score").then(m => ({ default: m.FinancialHealthScore })))

// Loading skeleton for charts
function ChartSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg border bg-card p-6 ${className}`}>
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

export default function DashboardPage() {
  const {
    user,
    selectedPeriod,
    transactions,
    accounts,
    goals,
    categories,
    familyMembers,
    investments,
  } = useStore()

  // ========================================
  // FONTE ÚNICA DE VERDADE - useTransacoesDoMes
  // ========================================
  const {
    transacoes,
    totais,
    totaisAnteriores,
    mesVis,
    anoVis,
    mesAnterior,
    anoAnterior,
    despesasPorCategoria,
    despesasPorMembro,
    despesasPorContexto,
  } = useTransacoesDoMes()

  const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  // Calculate summary data using CENTRALIZED hook data
  const summaryData = useMemo(() => {
    const totalBalance = accounts.reduce((sum, a) => {
      const balance = Number(a.balance) || 0
      if (a.type === "credit") {
        return sum - balance
      }
      return sum + balance
    }, 0)

    // Calculate previous balance (estimate)
    const previousBalance = totalBalance - totais.saldo

    // Calcular investimentos do período atual (compras feitas no mês)
    const periodInvestments = investments.filter(inv => {
      const purchaseDate = new Date(inv.purchaseDate)
      return purchaseDate.getMonth() === mesVis &&
             purchaseDate.getFullYear() === anoVis
    })
    const totalInvested = periodInvestments.reduce((sum, inv) => sum + inv.purchasePrice, 0)

    // Investimentos do mês anterior
    const prevInvestments = investments.filter(inv => {
      const purchaseDate = new Date(inv.purchaseDate)
      return purchaseDate.getMonth() === mesAnterior && purchaseDate.getFullYear() === anoAnterior
    })
    const previousInvested = prevInvestments.reduce((sum, inv) => sum + inv.purchasePrice, 0)

    // Valor total atual de todos os investimentos (para referência)
    const totalInvestmentValue = investments.reduce((sum, inv) => sum + inv.currentPrice, 0)

    return {
      totalBalance,
      previousBalance: previousBalance > 0 ? previousBalance : 0,
      totalIncome: totais.receitas,
      previousIncome: totaisAnteriores.receitas,
      totalExpenses: totais.despesas,
      previousExpenses: totaisAnteriores.despesas,
      totalInvested,
      previousInvested,
      totalInvestmentValue,
    }
  }, [totais, totaisAnteriores, accounts, mesVis, anoVis, mesAnterior, anoAnterior, investments])

  // Get recent transactions (last 5) from centralized hook
  const recentTransactions = useMemo(() => {
    return [...transacoes]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [transacoes])

  // Get active goals with alerts
  const goalAlerts = useMemo(() => {
    return goals.filter(g => g.status === "active")
  }, [goals])

  // Accounts with extended data for summary
  const accountsWithHistory: (Account & {
    transactions?: Transaction[]
    balanceHistory?: { date: string; balance: number }[]
  })[] = useMemo(() => {
    return accounts.map(account => {
      const accountTransactions = transacoes.filter(t => t.accountId === account.id)
      return {
        ...account,
        transactions: accountTransactions,
        balanceHistory: [], // Would need historical data
      }
    })
  }, [accounts, transacoes])

  // Projection data is now calculated directly in EndOfMonthProjection component
  // using the useTransacoesDoMes hook

  // Calculate savings data by category (usando orçamento mensal real das categorias)
  const savingsData = useMemo(() => {
    const categorySpending: Record<string, { spent: number; budget: number; name: string; color: string }> = {}

    // Primeiro, inicializar todas as categorias de despesa com seus orçamentos
    categories
      .filter(c => c.type === "expense" && c.monthlyBudget && c.monthlyBudget > 0)
      .forEach(category => {
        categorySpending[category.id] = {
          spent: 0,
          budget: category.monthlyBudget || 0,
          name: category.name,
          color: category.color || "#8E8E93",
        }
      })

    // Depois, adicionar os gastos do período usando dados do hook centralizado
    transacoes
      .filter(t => t.type === "expense")
      .forEach(t => {
        const category = categories.find(c => c.id === t.categoryId)
        if (category) {
          if (!categorySpending[category.id]) {
            categorySpending[category.id] = {
              spent: 0,
              budget: category.monthlyBudget || 0,
              name: category.name,
              color: category.color || "#8E8E93",
            }
          }
          const catEntry = categorySpending[category.id]
          if (catEntry) {
            catEntry.spent += t.amount
          }
        }
      })

    // Filtrar apenas categorias que têm orçamento definido ou gastos no período
    const categorySavings = Object.entries(categorySpending)
      .filter(([, data]) => data.budget > 0 || data.spent > 0)
      .map(([id, data]) => ({
        categoryId: id,
        categoryName: data.name,
        categoryColor: data.color,
        budgetAmount: data.budget,
        spentAmount: data.spent,
        savedAmount: data.budget - data.spent,
      }))
      .sort((a, b) => b.spentAmount - a.spentAmount)

    return {
      categorySavings,
      totalBudget: categorySavings.reduce((sum, c) => sum + c.budgetAmount, 0),
      totalSpent: categorySavings.reduce((sum, c) => sum + c.spentAmount, 0),
    }
  }, [transacoes, categories])

  // Calculate monthly comparison data (last 6 months) using CENTRALIZED function
  const comparisonData = useMemo(() => {
    const data: { month: string; income: number; expenses: number; investments: number; balance: number }[] = []
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

    for (let i = 5; i >= 0; i--) {
      let month = selectedPeriod.month - i
      let year = selectedPeriod.year

      while (month < 0) {
        month += 12
        year -= 1
      }

      // Use centralized function for consistent filtering
      const monthTransactions = getTransacoesDoMes(transactions, month, year)

      const income = monthTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0)

      const expenses = monthTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)

      data.push({
        month: monthNames[month] ?? "???",
        income,
        expenses,
        investments: 0,
        balance: income - expenses,
      })
    }

    return data
  }, [transactions, selectedPeriod])

  // Calculate top expenses using despesasPorCategoria from hook
  const topExpensesData = useMemo(() => {
    const expenses = Object.entries(despesasPorCategoria)
      .map(([id, data]) => ({
        categoryId: id,
        categoryName: data.nome,
        categoryColor: data.cor,
        currentAmount: data.valor,
        previousAmount: 0,
        percentage: data.percentual,
      }))
      .sort((a, b) => b.currentAmount - a.currentAmount)
      .slice(0, 9)

    return {
      expenses,
      totalExpenses: totais.despesas,
    }
  }, [despesasPorCategoria, totais.despesas])

  // Calculate couple ranking using despesasPorMembro from hook
  const coupleRanking = useMemo(() => {
    const allMembers = user ? [user, ...familyMembers] : familyMembers

    const members = allMembers.slice(0, 2).map(member => {
      const memberData = despesasPorMembro[member.id]
      const memberExpenses = memberData?.total || 0

      return {
        id: member.id,
        name: member.name,
        avatar: member.avatar || "",
        savedAmount: 0,
        unnecessarySpent: memberExpenses,
        streak: 0,
        isWinner: false,
      }
    })

    // Mark winner (lowest unnecessary spending)
    const member0 = members[0]
    const member1 = members[1]
    if (member0 && member1) {
      const winnerIndex = member0.unnecessarySpent <= member1.unnecessarySpent ? 0 : 1
      const winner = members[winnerIndex]
      if (winner) {
        winner.isWinner = true
      }
    }

    return {
      members,
      categoryName: "Gastos",
    }
  }, [despesasPorMembro, user, familyMembers])

  // Calculate personal expenses summary using despesasPorContexto from hook
  const personalExpensesData = useMemo(() => {
    const allMembers = user ? [user, ...familyMembers] : familyMembers

    const members = allMembers.slice(0, 2).map(member => {
      // Calculate personal expense for each member from transacoes
      const memberPersonalExpense = transacoes
        .filter(t => t.type === "expense" && t.userId === member.id && t.ownership === "personal")
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        id: member.id,
        name: member.name,
        avatar: member.avatar || "",
        personalExpense: memberPersonalExpense,
      }
    })

    return {
      members,
      householdExpense: despesasPorContexto.casa,
      totalExpense: totais.despesas,
    }
  }, [transacoes, despesasPorContexto, totais.despesas, user, familyMembers])

  // Calculate Financial Health Score using SAFE calculations
  const healthScoreData = useMemo(() => {
    // Taxa de poupança usando safePercentage
    const savingsRate = safePercentage(
      summaryData.totalIncome - summaryData.totalExpenses,
      summaryData.totalIncome
    )

    // Aderência ao orçamento (quanto % ficou dentro do orçamento)
    const totalBudget = savingsData.totalBudget
    const totalSpent = savingsData.totalSpent
    const budgetAdherence = totalBudget > 0
      ? Math.max(0, 100 - safePercentage(Math.max(0, totalSpent - totalBudget), totalBudget))
      : 100 // Se não há orçamento definido, considera 100%

    // Reserva de emergência (meses de despesas cobertos pelo saldo)
    const emergencyFundMonths = summaryData.totalExpenses > 0 && summaryData.totalBalance > 0
      ? summaryData.totalBalance / summaryData.totalExpenses
      : 0

    // Calcular score geral (0-100)
    let score = 100

    // Taxa de poupança (peso 40%)
    if (savingsRate < 0) {
      score -= 40 // Gastando mais do que ganha
    } else if (savingsRate < 10) {
      score -= 30
    } else if (savingsRate < 20) {
      score -= 15
    }

    // Aderência ao orçamento (peso 30%)
    if (budgetAdherence < 80) {
      score -= 30
    } else if (budgetAdherence < 90) {
      score -= 20
    } else if (budgetAdherence < 100) {
      score -= 10
    }

    // Reserva de emergência (peso 30%)
    if (emergencyFundMonths < 1) {
      score -= 30
    } else if (emergencyFundMonths < 3) {
      score -= 20
    } else if (emergencyFundMonths < 6) {
      score -= 10
    }

    return {
      score: Math.max(0, Math.round(score)),
      savingsRate: Math.max(-100, savingsRate),
      budgetAdherence,
      emergencyFundMonths: Math.max(0, emergencyFundMonths),
    }
  }, [summaryData, savingsData])

  return (
    <div className="space-y-8 page-transition">
      {/* Header */}
      <div>
        <h1 className="text-display">
          Olá, {user?.name || "Usuário"}
        </h1>
        <p className="text-callout text-secondary mt-1">
          Aqui está o resumo das suas finanças em {MONTHS[selectedPeriod.month]} de {selectedPeriod.year}
        </p>
      </div>

      {/* Summary Cards */}
      <SummaryCards {...summaryData} />

      {/* Accounts Summary */}
      <AccountsSummary accounts={accountsWithHistory} />

      {/* Health Score + Budget Rule Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Financial Health Score - takes 1 column */}
        <Suspense fallback={<ChartSkeleton />}>
          <FinancialHealthScore {...healthScoreData} />
        </Suspense>

        {/* Weekly Flow Chart - takes 2 columns */}
        <Suspense fallback={<ChartSkeleton className="lg:col-span-2" />}>
          <WeeklyFlowChart className="lg:col-span-2" />
        </Suspense>
      </div>

      {/* Budget Rule Chart (full width for more visibility) */}
      <Suspense fallback={<ChartSkeleton />}>
        <BudgetRuleChart />
      </Suspense>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <RecentTransactions transactions={recentTransactions} />

        {/* Goal Alerts */}
        <GoalAlerts goals={goalAlerts} />
      </div>

      {/* Insights Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-headline">Insights</h2>
          <p className="text-callout text-secondary mt-1">
            Análises e projeções do seu mês
          </p>
        </div>

        {/* Insights Row 1 - Projection and Savings */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<ChartSkeleton />}>
            <EndOfMonthProjection />
          </Suspense>

          <Suspense fallback={<ChartSkeleton />}>
            <MonthlySavings {...savingsData} />
          </Suspense>
        </div>

        {/* Insights Row 2 - Monthly Comparison (full width) */}
        <Suspense fallback={<ChartSkeleton />}>
          <MonthlyComparison data={comparisonData} />
        </Suspense>

        {/* Insights Row 3 - Top Expenses and Personal Expenses */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<ChartSkeleton />}>
            <TopExpenses {...topExpensesData} />
          </Suspense>

          <Suspense fallback={<ChartSkeleton />}>
            <PersonalExpensesSummary {...personalExpensesData} />
          </Suspense>
        </div>

        {/* Insights Row 4 - Couple Ranking */}
        <Suspense fallback={<ChartSkeleton />}>
          <CoupleRanking {...coupleRanking} />
        </Suspense>
      </div>
    </div>
  )
}
