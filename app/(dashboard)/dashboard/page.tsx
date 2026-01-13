"use client"

import { useMemo, lazy, Suspense } from "react"
import {
  SummaryCards,
  RecentTransactions,
  GoalAlerts,
  AccountsSummary,
} from "@/components/dashboard"
import { useStore } from "@/hooks/use-store"
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
  } = useStore()

  const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  // Filter transactions for the selected period
  const periodTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === selectedPeriod.month && date.getFullYear() === selectedPeriod.year
    })
  }, [transactions, selectedPeriod])

  // Calculate summary data from real transactions
  const summaryData = useMemo(() => {
    const totalIncome = periodTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = periodTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    const totalBalance = accounts.reduce((sum, a) => {
      const balance = Number(a.balance) || 0
      // Cartões de crédito são subtraídos (débito)
      if (a.type === "credit") {
        return sum - balance
      }
      return sum + balance
    }, 0)

    // Calculate previous period (last month)
    const prevMonth = selectedPeriod.month === 0 ? 11 : selectedPeriod.month - 1
    const prevYear = selectedPeriod.month === 0 ? selectedPeriod.year - 1 : selectedPeriod.year

    const prevTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear
    })

    const previousIncome = prevTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)

    const previousExpenses = prevTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    // Calculate previous balance (estimate)
    const previousBalance = totalBalance - (totalIncome - totalExpenses)

    return {
      totalBalance,
      previousBalance: previousBalance > 0 ? previousBalance : 0,
      totalIncome,
      previousIncome,
      totalExpenses,
      previousExpenses,
      totalInvested: 0, // Would need investments data
      previousInvested: 0,
    }
  }, [periodTransactions, accounts, transactions, selectedPeriod])

  // Calculate budget rule data (50/30/20)
  const budgetData = useMemo(() => {
    const totalIncome = summaryData.totalIncome || 1 // Avoid division by zero

    let essentials = 0
    let lifestyle = 0
    let investments = 0

    periodTransactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        const category = categories.find(c => c.id === t.categoryId)
        if (category) {
          const catName = category.name.toLowerCase()
          if (['moradia', 'alimentação', 'transporte', 'saúde', 'educação'].some(e => catName.includes(e))) {
            essentials += t.amount
          } else if (['investimento', 'renda fixa', 'ações', 'fundos', 'cripto'].some(e => catName.includes(e))) {
            investments += t.amount
          } else {
            lifestyle += t.amount
          }
        } else {
          lifestyle += t.amount
        }
      })

    return {
      totalIncome,
      essentials,
      lifestyle,
      investments,
    }
  }, [periodTransactions, categories, summaryData.totalIncome])

  // Calculate weekly flow data
  const weeklyData = useMemo(() => {
    const weeks: { week: string; income: number; expense: number; balance: number }[] = []
    const daysInMonth = new Date(selectedPeriod.year, selectedPeriod.month + 1, 0).getDate()

    for (let w = 0; w < 4; w++) {
      const weekStart = w * 7 + 1
      const weekEnd = Math.min((w + 1) * 7, daysInMonth)

      const weekTransactions = periodTransactions.filter(t => {
        const date = new Date(t.date)
        const day = date.getDate()
        return day >= weekStart && day <= weekEnd
      })

      const income = weekTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0)

      const expense = weekTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)

      weeks.push({
        week: `Sem ${w + 1}`,
        income,
        expense,
        balance: income - expense,
      })
    }

    return weeks
  }, [periodTransactions, selectedPeriod])

  // Get recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    return [...periodTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [periodTransactions])

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
      const accountTransactions = periodTransactions.filter(t => t.accountId === account.id)
      return {
        ...account,
        transactions: accountTransactions,
        balanceHistory: [], // Would need historical data
      }
    })
  }, [accounts, periodTransactions])

  // Calculate projection data
  const projectionData = useMemo(() => {
    const now = new Date()
    const currentDayOfMonth = now.getDate()
    const totalDaysInMonth = new Date(selectedPeriod.year, selectedPeriod.month + 1, 0).getDate()
    const averageDailyExpense = currentDayOfMonth > 0
      ? summaryData.totalExpenses / currentDayOfMonth
      : 0

    return {
      currentDayOfMonth,
      totalDaysInMonth,
      totalIncome: summaryData.totalIncome,
      currentExpenses: summaryData.totalExpenses,
      averageDailyExpense: Math.round(averageDailyExpense),
      previousMonths: [], // Would need historical data
    }
  }, [selectedPeriod, summaryData])

  // Calculate savings data by category
  const savingsData = useMemo(() => {
    const categorySpending: Record<string, { spent: number; budget: number; name: string; color: string }> = {}

    periodTransactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        const category = categories.find(c => c.id === t.categoryId)
        if (category) {
          if (!categorySpending[category.id]) {
            categorySpending[category.id] = {
              spent: 0,
              budget: 0, // Would need budget data
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

    const categorySavings = Object.entries(categorySpending).map(([id, data]) => ({
      categoryId: id,
      categoryName: data.name,
      categoryColor: data.color,
      budgetAmount: data.budget,
      spentAmount: data.spent,
      savedAmount: data.budget - data.spent,
    }))

    return {
      categorySavings,
      totalBudget: categorySavings.reduce((sum, c) => sum + c.budgetAmount, 0),
      totalSpent: categorySavings.reduce((sum, c) => sum + c.spentAmount, 0),
    }
  }, [periodTransactions, categories])

  // Calculate monthly comparison data (last 6 months)
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

      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date)
        return date.getMonth() === month && date.getFullYear() === year
      })

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

  // Calculate top expenses
  const topExpensesData = useMemo(() => {
    const categoryTotals: Record<string, { current: number; previous: number; name: string; color: string }> = {}
    const totalExpenses = summaryData.totalExpenses || 1

    // Current period
    periodTransactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        const category = categories.find(c => c.id === t.categoryId)
        if (category) {
          if (!categoryTotals[category.id]) {
            categoryTotals[category.id] = {
              current: 0,
              previous: 0,
              name: category.name,
              color: category.color || "#8E8E93",
            }
          }
          const entry = categoryTotals[category.id]
          if (entry) {
            entry.current += t.amount
          }
        }
      })

    const expenses = Object.entries(categoryTotals)
      .map(([id, data]) => ({
        categoryId: id,
        categoryName: data.name,
        categoryColor: data.color,
        currentAmount: data.current,
        previousAmount: data.previous,
        percentage: (data.current / totalExpenses) * 100,
      }))
      .sort((a, b) => b.currentAmount - a.currentAmount)
      .slice(0, 9)

    return {
      expenses,
      totalExpenses: summaryData.totalExpenses,
    }
  }, [periodTransactions, categories, summaryData.totalExpenses])

  // Calculate couple ranking (if family members exist)
  const coupleRanking = useMemo(() => {
    const allMembers = user ? [user, ...familyMembers] : familyMembers

    const members = allMembers.slice(0, 2).map(member => {
      const memberExpenses = periodTransactions
        .filter(t => t.type === "expense" && t.userId === member.id)
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        id: member.id,
        name: member.name,
        avatar: member.avatar || "",
        savedAmount: 0, // Would need budget data
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
  }, [periodTransactions, user, familyMembers])

  // Calculate personal expenses summary
  const personalExpensesData = useMemo(() => {
    const allMembers = user ? [user, ...familyMembers] : familyMembers
    let householdExpense = 0

    const members = allMembers.slice(0, 2).map(member => {
      const memberPersonalExpense = periodTransactions
        .filter(t => t.type === "expense" && t.userId === member.id && t.ownership === "personal")
        .reduce((sum, t) => sum + t.amount, 0)

      const memberHouseholdExpense = periodTransactions
        .filter(t => t.type === "expense" && t.userId === member.id && t.ownership !== "personal")
        .reduce((sum, t) => sum + t.amount, 0)

      householdExpense += memberHouseholdExpense

      return {
        id: member.id,
        name: member.name,
        avatar: member.avatar || "",
        personalExpense: memberPersonalExpense,
      }
    })

    return {
      members,
      householdExpense,
      totalExpense: summaryData.totalExpenses,
    }
  }, [periodTransactions, user, familyMembers, summaryData.totalExpenses])

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

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Flow Chart - takes 2 columns */}
        <Suspense fallback={<ChartSkeleton className="lg:col-span-2" />}>
          <WeeklyFlowChart data={weeklyData} />
        </Suspense>

        {/* Budget Rule Chart - takes 1 column */}
        <Suspense fallback={<ChartSkeleton />}>
          <BudgetRuleChart {...budgetData} />
        </Suspense>
      </div>

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
            <EndOfMonthProjection {...projectionData} />
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
