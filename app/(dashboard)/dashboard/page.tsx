"use client"

import {
  SummaryCards,
  RecentTransactions,
  BudgetRuleChart,
  WeeklyFlowChart,
  GoalAlerts,
  AccountsSummary,
  EndOfMonthProjection,
  MonthlySavings,
  MonthlyComparison,
  TopExpenses,
  CoupleRanking,
} from "@/components/dashboard"
import { useStore } from "@/hooks/use-store"
import type { Transaction, Goal, Account } from "@/types"

// Mock data for summary cards
const mockSummaryData = {
  totalBalance: 25000,
  previousBalance: 22500,
  totalIncome: 12500,
  previousIncome: 11800,
  totalExpenses: 7850,
  previousExpenses: 8200,
  totalInvested: 2500,
  previousInvested: 2000,
}

// Mock data for 50/30/20 rule chart
const mockBudgetData = {
  totalIncome: 12500,
  essentials: 6000,    // 50% target = 6250
  lifestyle: 3500,     // 30% target = 3750
  investments: 2500,   // 20% target = 2500
}

// Mock data for weekly flow chart
const mockWeeklyData = [
  { week: "Sem 1", income: 3000, expense: 1800, balance: 1200 },
  { week: "Sem 2", income: 2500, expense: 2200, balance: 300 },
  { week: "Sem 3", income: 4000, expense: 1950, balance: 2050 },
  { week: "Sem 4", income: 3000, expense: 1900, balance: 1100 },
]

// Mock transactions with user data
const mockTransactions: Transaction[] = [
  {
    id: "1",
    description: "Salário",
    amount: 8000,
    type: "income",
    date: new Date("2026-01-05"),
    userId: "1",
    categoryId: "1",
    category: { id: "1", name: "Salário", type: "income", color: "#34C759", userId: "1", createdAt: new Date(), updatedAt: new Date() },
    user: { id: "1", name: "Alison", email: "alison@familia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alison", createdAt: new Date(), updatedAt: new Date() },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    description: "Aluguel",
    amount: 2500,
    type: "expense",
    date: new Date("2026-01-03"),
    userId: "1",
    categoryId: "5",
    category: { id: "5", name: "Moradia", type: "expense", color: "#FF3B30", userId: "1", createdAt: new Date(), updatedAt: new Date() },
    user: { id: "1", name: "Alison", email: "alison@familia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alison", createdAt: new Date(), updatedAt: new Date() },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    description: "Supermercado",
    amount: 650,
    type: "expense",
    date: new Date("2026-01-02"),
    userId: "2",
    categoryId: "6",
    category: { id: "6", name: "Alimentação", type: "expense", color: "#FF9500", userId: "2", createdAt: new Date(), updatedAt: new Date() },
    user: { id: "2", name: "Esposa", email: "esposa@familia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria", createdAt: new Date(), updatedAt: new Date() },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    description: "Freelance projeto",
    amount: 2500,
    type: "income",
    date: new Date("2026-01-01"),
    userId: "1",
    categoryId: "2",
    category: { id: "2", name: "Freelance", type: "income", color: "#5856D6", userId: "1", createdAt: new Date(), updatedAt: new Date() },
    user: { id: "1", name: "Alison", email: "alison@familia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alison", createdAt: new Date(), updatedAt: new Date() },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    description: "Netflix + Spotify",
    amount: 85,
    type: "expense",
    date: new Date("2025-12-28"),
    userId: "2",
    categoryId: "11",
    category: { id: "11", name: "Assinaturas", type: "expense", color: "#8E8E93", userId: "2", createdAt: new Date(), updatedAt: new Date() },
    user: { id: "2", name: "Esposa", email: "esposa@familia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria", createdAt: new Date(), updatedAt: new Date() },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Mock goals with alerts
const mockGoals: Goal[] = [
  {
    id: "1",
    name: "Reserva de Emergência",
    description: "6 meses de despesas",
    type: "savings",
    targetAmount: 50000,
    currentAmount: 45000,
    deadline: new Date("2026-02-15"),
    status: "active",
    userId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Viagem de Férias",
    description: "Viagem para Europa",
    type: "savings",
    targetAmount: 20000,
    currentAmount: 12000,
    deadline: new Date("2026-01-10"),
    status: "active",
    userId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Troca do Carro",
    description: "Entrada do carro novo",
    type: "patrimony",
    targetAmount: 30000,
    currentAmount: 8500,
    deadline: new Date("2026-06-01"),
    status: "active",
    userId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Mock accounts with transactions and balance history
const mockAccounts: (Account & {
  transactions?: Transaction[]
  balanceHistory?: { date: string; balance: number }[]
})[] = [
  {
    id: "1",
    name: "Nubank",
    type: "checking",
    balance: 8500,
    color: "#5856D6",
    userId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [
      { id: "t1", description: "Salário", amount: 8000, type: "income", date: new Date("2026-01-05"), userId: "1", createdAt: new Date(), updatedAt: new Date() },
      { id: "t2", description: "Aluguel", amount: 2500, type: "expense", date: new Date("2026-01-03"), userId: "1", createdAt: new Date(), updatedAt: new Date() },
      { id: "t3", description: "Supermercado", amount: 450, type: "expense", date: new Date("2026-01-02"), userId: "1", createdAt: new Date(), updatedAt: new Date() },
    ],
    balanceHistory: [
      { date: "01/01", balance: 3500 },
      { date: "05/01", balance: 11500 },
      { date: "10/01", balance: 9000 },
      { date: "15/01", balance: 8500 },
      { date: "20/01", balance: 8200 },
      { date: "25/01", balance: 8500 },
    ],
  },
  {
    id: "2",
    name: "Itaú",
    type: "checking",
    balance: 12350,
    color: "#FF9500",
    userId: "2",
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [
      { id: "t4", description: "Salário", amount: 6000, type: "income", date: new Date("2026-01-05"), userId: "2", createdAt: new Date(), updatedAt: new Date() },
      { id: "t5", description: "Conta de Luz", amount: 280, type: "expense", date: new Date("2026-01-08"), userId: "2", createdAt: new Date(), updatedAt: new Date() },
    ],
    balanceHistory: [
      { date: "01/01", balance: 6500 },
      { date: "05/01", balance: 12500 },
      { date: "10/01", balance: 12200 },
      { date: "15/01", balance: 12350 },
    ],
  },
  {
    id: "3",
    name: "Cartão Nubank",
    type: "credit",
    balance: 2850,
    color: "#FF2D55",
    userId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [
      { id: "t6", description: "Amazon", amount: 350, type: "expense", date: new Date("2026-01-06"), userId: "1", createdAt: new Date(), updatedAt: new Date() },
      { id: "t7", description: "iFood", amount: 120, type: "expense", date: new Date("2026-01-04"), userId: "1", createdAt: new Date(), updatedAt: new Date() },
    ],
    balanceHistory: [
      { date: "01/01", balance: 1500 },
      { date: "05/01", balance: 2000 },
      { date: "10/01", balance: 2500 },
      { date: "15/01", balance: 2850 },
    ],
  },
  {
    id: "4",
    name: "Poupança",
    type: "savings",
    balance: 15000,
    color: "#34C759",
    userId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    balanceHistory: [
      { date: "01/01", balance: 14500 },
      { date: "05/01", balance: 14600 },
      { date: "10/01", balance: 14800 },
      { date: "15/01", balance: 15000 },
    ],
  },
]

// Mock data for End of Month Projection
const mockProjectionData = {
  currentDayOfMonth: 7,
  totalDaysInMonth: 31,
  totalIncome: 12500,
  currentExpenses: 4250,
  averageDailyExpense: 607, // ~4250/7
  previousMonths: [
    { month: "Dezembro", projected: 3200, actual: 3850 },
    { month: "Novembro", projected: 2800, actual: 2650 },
    { month: "Outubro", projected: 3500, actual: 3100 },
  ],
}

// Mock data for Monthly Savings
const mockSavingsData = {
  categorySavings: [
    { categoryId: "1", categoryName: "Delivery", categoryColor: "#FF9500", budgetAmount: 600, spentAmount: 180, savedAmount: 420 },
    { categoryId: "2", categoryName: "Lazer", categoryColor: "#5856D6", budgetAmount: 800, spentAmount: 520, savedAmount: 280 },
    { categoryId: "3", categoryName: "Compras", categoryColor: "#FF2D55", budgetAmount: 500, spentAmount: 350, savedAmount: 150 },
    { categoryId: "4", categoryName: "Assinaturas", categoryColor: "#8E8E93", budgetAmount: 200, spentAmount: 185, savedAmount: 15 },
    { categoryId: "5", categoryName: "Transporte", categoryColor: "#FFCC00", budgetAmount: 400, spentAmount: 520, savedAmount: -120 },
  ],
  totalBudget: 2500,
  totalSpent: 1755,
}

// Mock data for Monthly Comparison
const mockComparisonData = [
  { month: "Ago", income: 11000, expenses: 8200, investments: 1800, balance: 1000 },
  { month: "Set", income: 11500, expenses: 7800, investments: 2000, balance: 1700 },
  { month: "Out", income: 12000, expenses: 8500, investments: 2200, balance: 1300 },
  { month: "Nov", income: 11800, expenses: 7600, investments: 2100, balance: 2100 },
  { month: "Dez", income: 13500, expenses: 9200, investments: 2400, balance: 1900 },
  { month: "Jan", income: 12500, expenses: 7850, investments: 2500, balance: 2150 },
]

// Mock data for Top Expenses
const mockTopExpenses = {
  expenses: [
    { categoryId: "1", categoryName: "Moradia", categoryColor: "#FF3B30", currentAmount: 2500, previousAmount: 2500, percentage: 31.8 },
    { categoryId: "2", categoryName: "Alimentação", categoryColor: "#FF9500", currentAmount: 1800, previousAmount: 1650, percentage: 22.9 },
    { categoryId: "3", categoryName: "Transporte", categoryColor: "#FFCC00", currentAmount: 850, previousAmount: 920, percentage: 10.8 },
    { categoryId: "4", categoryName: "Lazer", categoryColor: "#5856D6", currentAmount: 720, previousAmount: 580, percentage: 9.2 },
    { categoryId: "5", categoryName: "Saúde", categoryColor: "#FF2D55", currentAmount: 650, previousAmount: 450, percentage: 8.3 },
    { categoryId: "6", categoryName: "Educação", categoryColor: "#5AC8FA", currentAmount: 450, previousAmount: 450, percentage: 5.7 },
    { categoryId: "7", categoryName: "Assinaturas", categoryColor: "#8E8E93", currentAmount: 280, previousAmount: 280, percentage: 3.6 },
    { categoryId: "8", categoryName: "Compras", categoryColor: "#FF2D55", currentAmount: 350, previousAmount: 520, percentage: 4.5 },
    { categoryId: "9", categoryName: "Outros", categoryColor: "#8E8E93", currentAmount: 250, previousAmount: 350, percentage: 3.2 },
  ],
  totalExpenses: 7850,
}

// Mock data for Couple Ranking
const mockCoupleRanking = {
  members: [
    {
      id: "1",
      name: "Alison",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alison",
      savedAmount: 380,
      unnecessarySpent: 220,
      streak: 3,
      isWinner: true,
    },
    {
      id: "2",
      name: "Esposa",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
      savedAmount: 165,
      unnecessarySpent: 435,
      streak: 1,
      isWinner: false,
    },
  ],
  categoryName: "Delivery",
}

export default function DashboardPage() {
  const { user, selectedPeriod } = useStore()

  const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  return (
    <div className="space-y-8 page-transition">
      {/* Header */}
      <div>
        <h1 className="text-display">
          Olá, {user?.name || "Alison"}
        </h1>
        <p className="text-callout text-secondary mt-1">
          Aqui está o resumo das suas finanças em {MONTHS[selectedPeriod.month]} de {selectedPeriod.year}
        </p>
      </div>

      {/* Summary Cards */}
      <SummaryCards {...mockSummaryData} />

      {/* Accounts Summary */}
      <AccountsSummary accounts={mockAccounts} />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Flow Chart - takes 2 columns */}
        <WeeklyFlowChart data={mockWeeklyData} />

        {/* Budget Rule Chart - takes 1 column */}
        <BudgetRuleChart {...mockBudgetData} />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <RecentTransactions transactions={mockTransactions} />

        {/* Goal Alerts */}
        <GoalAlerts goals={mockGoals} />
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
          {/* End of Month Projection */}
          <EndOfMonthProjection {...mockProjectionData} />

          {/* Monthly Savings */}
          <MonthlySavings {...mockSavingsData} />
        </div>

        {/* Insights Row 2 - Monthly Comparison (full width) */}
        <MonthlyComparison data={mockComparisonData} />

        {/* Insights Row 3 - Top Expenses and Couple Ranking */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Expenses */}
          <TopExpenses {...mockTopExpenses} />

          {/* Couple Ranking */}
          <CoupleRanking {...mockCoupleRanking} />
        </div>
      </div>
    </div>
  )
}
