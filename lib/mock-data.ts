/**
 * Mock data for development and demonstration purposes.
 * TODO: Replace with actual API calls when backend is ready.
 */

import type { Investment, InvestmentType } from "@/components/investimentos"

// ============================================
// INVESTMENTS MOCK DATA
// ============================================

export const mockInvestments: Investment[] = [
  {
    id: "1",
    name: "Petrobras",
    ticker: "PETR4",
    type: "stocks",
    institution: "XP Investimentos",
    purchasePrice: 28.50,
    currentPrice: 36.80,
    quantity: 100,
    purchaseDate: new Date("2025-03-15"),
  },
  {
    id: "2",
    name: "Vale",
    ticker: "VALE3",
    type: "stocks",
    institution: "XP Investimentos",
    purchasePrice: 62.30,
    currentPrice: 58.45,
    quantity: 50,
    purchaseDate: new Date("2025-05-20"),
  },
  {
    id: "3",
    name: "Itaú Unibanco",
    ticker: "ITUB4",
    type: "stocks",
    institution: "Clear",
    purchasePrice: 24.80,
    currentPrice: 28.90,
    quantity: 200,
    purchaseDate: new Date("2024-11-10"),
  },
  {
    id: "4",
    name: "CDB Nubank 120% CDI",
    type: "bonds",
    institution: "Nubank",
    purchasePrice: 10000,
    currentPrice: 11250,
    quantity: 1,
    purchaseDate: new Date("2024-06-01"),
    maturityDate: new Date("2027-06-01"),
  },
  {
    id: "5",
    name: "Tesouro Selic 2029",
    type: "bonds",
    institution: "Rico",
    purchasePrice: 15000,
    currentPrice: 16800,
    quantity: 1,
    purchaseDate: new Date("2024-03-15"),
    maturityDate: new Date("2029-03-01"),
  },
  {
    id: "6",
    name: "LCI Banco Inter",
    type: "bonds",
    institution: "Inter",
    purchasePrice: 8000,
    currentPrice: 8650,
    quantity: 1,
    purchaseDate: new Date("2025-01-10"),
    maturityDate: new Date("2026-07-10"),
  },
  {
    id: "7",
    name: "Bitcoin",
    ticker: "BTC",
    type: "crypto",
    institution: "Binance",
    purchasePrice: 180000,
    currentPrice: 520000,
    quantity: 0.05,
    purchaseDate: new Date("2023-12-01"),
  },
  {
    id: "8",
    name: "Ethereum",
    ticker: "ETH",
    type: "crypto",
    institution: "Mercado Bitcoin",
    purchasePrice: 8500,
    currentPrice: 18200,
    quantity: 0.5,
    purchaseDate: new Date("2024-02-15"),
  },
  {
    id: "9",
    name: "CSHG Logística",
    ticker: "HGLG11",
    type: "real_estate",
    institution: "XP Investimentos",
    purchasePrice: 156.80,
    currentPrice: 162.50,
    quantity: 30,
    purchaseDate: new Date("2024-08-20"),
  },
  {
    id: "10",
    name: "XP Malls",
    ticker: "XPML11",
    type: "real_estate",
    institution: "XP Investimentos",
    purchasePrice: 95.20,
    currentPrice: 98.80,
    quantity: 50,
    purchaseDate: new Date("2025-02-10"),
  },
  {
    id: "11",
    name: "Fundo Alaska Black",
    type: "funds",
    institution: "BTG Pactual",
    purchasePrice: 12000,
    currentPrice: 14500,
    quantity: 1,
    purchaseDate: new Date("2024-04-01"),
  },
]

export const mockPortfolioEvolutionData = [
  { date: "Jul/25", total: 85000, stocks: 18000, bonds: 28000, crypto: 15000, realEstate: 12000, funds: 12000 },
  { date: "Ago/25", total: 92000, stocks: 20000, bonds: 29500, crypto: 18000, realEstate: 12500, funds: 12000 },
  { date: "Set/25", total: 98000, stocks: 22000, bonds: 31000, crypto: 19500, realEstate: 13000, funds: 12500 },
  { date: "Out/25", total: 105000, stocks: 25000, bonds: 32500, crypto: 21000, realEstate: 13500, funds: 13000 },
  { date: "Nov/25", total: 112000, stocks: 27000, bonds: 34000, crypto: 23000, realEstate: 14500, funds: 13500 },
  { date: "Dez/25", total: 118000, stocks: 28500, bonds: 35500, crypto: 25000, realEstate: 15000, funds: 14000 },
  { date: "Jan/26", total: 125450, stocks: 30000, bonds: 36700, crypto: 35100, realEstate: 9355, funds: 14500 },
]

export const allocationTargets: Record<InvestmentType, number> = {
  stocks: 30,
  bonds: 35,
  crypto: 10,
  real_estate: 15,
  funds: 10,
  other: 0,
}

// ============================================
// GOALS MOCK DATA
// ============================================

export interface Goal {
  id: string
  name: string
  description?: string
  targetAmount: number
  currentAmount: number
  deadline: Date
  category: "emergency" | "travel" | "purchase" | "education" | "retirement" | "other"
  priority: "high" | "medium" | "low"
  status: "active" | "completed" | "paused"
  color: string
  icon: string
  monthlyContribution?: number
  createdAt: Date
}

export const mockGoals: Goal[] = [
  {
    id: "1",
    name: "Reserva de Emergência",
    description: "6 meses de despesas fixas",
    targetAmount: 30000,
    currentAmount: 18500,
    deadline: new Date("2026-06-01"),
    category: "emergency",
    priority: "high",
    status: "active",
    color: "#22c55e",
    icon: "Shield",
    monthlyContribution: 1500,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    name: "Viagem Europa",
    description: "Férias em família para Portugal e Espanha",
    targetAmount: 25000,
    currentAmount: 8000,
    deadline: new Date("2026-12-01"),
    category: "travel",
    priority: "medium",
    status: "active",
    color: "#3b82f6",
    icon: "Plane",
    monthlyContribution: 800,
    createdAt: new Date("2024-03-15"),
  },
  {
    id: "3",
    name: "Troca de Carro",
    description: "Entrada para um carro novo",
    targetAmount: 40000,
    currentAmount: 12000,
    deadline: new Date("2027-06-01"),
    category: "purchase",
    priority: "medium",
    status: "active",
    color: "#f97316",
    icon: "Car",
    monthlyContribution: 1000,
    createdAt: new Date("2024-06-01"),
  },
  {
    id: "4",
    name: "Curso de Especialização",
    description: "MBA em Gestão Financeira",
    targetAmount: 15000,
    currentAmount: 15000,
    deadline: new Date("2025-12-01"),
    category: "education",
    priority: "high",
    status: "completed",
    color: "#8b5cf6",
    icon: "GraduationCap",
    createdAt: new Date("2023-06-01"),
  },
  {
    id: "5",
    name: "Aposentadoria",
    description: "Fundo de previdência privada",
    targetAmount: 500000,
    currentAmount: 45000,
    deadline: new Date("2045-01-01"),
    category: "retirement",
    priority: "high",
    status: "active",
    color: "#06b6d4",
    icon: "Landmark",
    monthlyContribution: 2000,
    createdAt: new Date("2020-01-01"),
  },
]

// ============================================
// CONFIGURATION MOCK DATA
// ============================================

export interface FamilyMember {
  id: string
  name: string
  email: string
  avatar: string
  role: "admin" | "member"
}

export interface Account {
  id: string
  name: string
  type: "checking" | "savings" | "credit" | "investment"
  balance: number
  institution: string
  color: string
}

export interface CategoryConfig {
  id: string
  name: string
  icon: string
  color: string
  type: "income" | "expense"
  budgetGroup?: "essentials" | "lifestyle" | "investments"
}

export interface BudgetConfig {
  method: "50-30-20" | "zero-based" | "envelope" | "custom"
  essentialsPercent: number
  lifestylePercent: number
  investmentsPercent: number
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  budgetAlerts: boolean
  goalReminders: boolean
  billReminders: boolean
  weeklyReport: boolean
}

export const mockFamilyMembers: FamilyMember[] = [
  {
    id: "1",
    name: "Alison",
    email: "alison@familia.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alison",
    role: "admin",
  },
  {
    id: "2",
    name: "Esposa",
    email: "esposa@familia.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    role: "member",
  },
]

export const mockAccounts: Account[] = [
  { id: "1", name: "Conta Corrente", type: "checking", balance: 5420.50, institution: "Nubank", color: "#8b5cf6" },
  { id: "2", name: "Poupança", type: "savings", balance: 15000, institution: "Nubank", color: "#22c55e" },
  { id: "3", name: "Cartão de Crédito", type: "credit", balance: -2350.80, institution: "Nubank", color: "#ef4444" },
  { id: "4", name: "Investimentos", type: "investment", balance: 125450, institution: "XP", color: "#3b82f6" },
]

export const mockCategories: CategoryConfig[] = [
  { id: "1", name: "Salário", icon: "Briefcase", color: "#22c55e", type: "income" },
  { id: "2", name: "Freelance", icon: "Laptop", color: "#10b981", type: "income" },
  { id: "3", name: "Alimentação", icon: "UtensilsCrossed", color: "#f97316", type: "expense", budgetGroup: "essentials" },
  { id: "4", name: "Transporte", icon: "Car", color: "#eab308", type: "expense", budgetGroup: "essentials" },
  { id: "5", name: "Moradia", icon: "Home", color: "#ef4444", type: "expense", budgetGroup: "essentials" },
  { id: "6", name: "Lazer", icon: "Gamepad2", color: "#06b6d4", type: "expense", budgetGroup: "lifestyle" },
  { id: "7", name: "Compras", icon: "ShoppingBag", color: "#d946ef", type: "expense", budgetGroup: "lifestyle" },
  { id: "8", name: "Investimentos", icon: "TrendingUp", color: "#3b82f6", type: "expense", budgetGroup: "investments" },
]

export const mockBudgetConfig: BudgetConfig = {
  method: "50-30-20",
  essentialsPercent: 50,
  lifestylePercent: 30,
  investmentsPercent: 20,
}

export const mockNotificationSettings: NotificationSettings = {
  email: true,
  push: true,
  budgetAlerts: true,
  goalReminders: true,
  billReminders: true,
  weeklyReport: false,
}

// ============================================
// CONFIGURATION PAGE SPECIFIC MOCK DATA
// ============================================

export type BudgetGroup = "essentials" | "lifestyle" | "investments"

export interface ConfigFamilyMember {
  id: string
  name: string
  email: string
  avatar?: string | null
  isAdmin: boolean
}

export interface ConfigAccount {
  id: string
  name: string
  type: "checking" | "savings" | "credit" | "investment"
  balance: number
  color: string
  icon?: string
  isActive: boolean
}

export interface ConfigCategory {
  id: string
  name: string
  type: "income" | "expense"
  color: string
  budgetGroup?: BudgetGroup
  isDefault: boolean
  order: number
}

export interface ConfigNotificationSettings {
  categoryLimitEnabled: boolean
  categoryLimitThreshold: number
  weeklyEmailEnabled: boolean
  weeklyEmailDay: string
  transactionReminderEnabled: boolean
  transactionReminderTime: string
  goalProgressEnabled: boolean
  budgetAlertEnabled: boolean
  budgetAlertThreshold: number
}

export interface DataStats {
  totalTransactions: number
  totalCategories: number
  totalAccounts: number
  totalGoals: number
  lastBackup: Date
}

export const mockConfigFamilyMembers: ConfigFamilyMember[] = [
  {
    id: "1",
    name: "Alison",
    email: "alison@familia.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alison",
    isAdmin: true,
  },
  {
    id: "2",
    name: "Esposa",
    email: "esposa@familia.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    isAdmin: false,
  },
]

export const mockConfigAccounts: ConfigAccount[] = [
  {
    id: "1",
    name: "Nubank",
    type: "checking",
    balance: 8500,
    color: "#8b5cf6",
    icon: "wallet",
    isActive: true,
  },
  {
    id: "2",
    name: "Itaú",
    type: "checking",
    balance: 12350,
    color: "#f97316",
    icon: "building",
    isActive: true,
  },
  {
    id: "3",
    name: "Cartão Nubank",
    type: "credit",
    balance: 2850,
    color: "#f43f5e",
    icon: "credit-card",
    isActive: true,
  },
  {
    id: "4",
    name: "Poupança",
    type: "savings",
    balance: 15000,
    color: "#10b981",
    icon: "piggy-bank",
    isActive: true,
  },
  {
    id: "5",
    name: "XP Investimentos",
    type: "investment",
    balance: 45000,
    color: "#0ea5e9",
    icon: "trending-up",
    isActive: true,
  },
]

export const mockConfigCategories: ConfigCategory[] = [
  // Income
  { id: "1", name: "Salário", type: "income", color: "#10b981", isDefault: true, order: 1 },
  { id: "2", name: "Freelance", type: "income", color: "#8b5cf6", isDefault: true, order: 2 },
  { id: "3", name: "Rendimentos", type: "income", color: "#0ea5e9", isDefault: true, order: 3 },
  { id: "4", name: "Outros", type: "income", color: "#64748b", isDefault: true, order: 4 },
  // Expenses
  { id: "5", name: "Moradia", type: "expense", color: "#ef4444", budgetGroup: "essentials", isDefault: true, order: 1 },
  { id: "6", name: "Alimentação", type: "expense", color: "#f97316", budgetGroup: "essentials", isDefault: true, order: 2 },
  { id: "7", name: "Transporte", type: "expense", color: "#eab308", budgetGroup: "essentials", isDefault: true, order: 3 },
  { id: "8", name: "Saúde", type: "expense", color: "#ec4899", budgetGroup: "essentials", isDefault: true, order: 4 },
  { id: "9", name: "Educação", type: "expense", color: "#06b6d4", budgetGroup: "essentials", isDefault: true, order: 5 },
  { id: "10", name: "Lazer", type: "expense", color: "#a855f7", budgetGroup: "lifestyle", isDefault: true, order: 6 },
  { id: "11", name: "Compras", type: "expense", color: "#f43f5e", budgetGroup: "lifestyle", isDefault: true, order: 7 },
  { id: "12", name: "Assinaturas", type: "expense", color: "#64748b", budgetGroup: "lifestyle", isDefault: true, order: 8 },
  { id: "13", name: "Delivery", type: "expense", color: "#fb923c", budgetGroup: "lifestyle", isDefault: false, order: 9 },
  { id: "14", name: "Investimentos", type: "expense", color: "#22c55e", budgetGroup: "investments", isDefault: true, order: 10 },
]

export const mockConfigBudgetConfig = {
  essentialsPercent: 50,
  lifestylePercent: 30,
  investmentsPercent: 20,
}

export const mockConfigNotificationSettings: ConfigNotificationSettings = {
  categoryLimitEnabled: true,
  categoryLimitThreshold: 80,
  weeklyEmailEnabled: true,
  weeklyEmailDay: "sunday",
  transactionReminderEnabled: true,
  transactionReminderTime: "evening",
  goalProgressEnabled: true,
  budgetAlertEnabled: true,
  budgetAlertThreshold: 90,
}

export const mockDataStats: DataStats = {
  totalTransactions: 247,
  totalCategories: 14,
  totalAccounts: 5,
  totalGoals: 6,
  lastBackup: new Date("2026-01-05T14:30:00"),
}
