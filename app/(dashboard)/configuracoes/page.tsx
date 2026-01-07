"use client"

import { useState } from "react"
import {
  Users,
  CreditCard,
  Tag,
  PieChart,
  Bell,
  Database,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FamilyMembersTab,
  AccountsTab,
  CategoriesTab,
  BudgetRuleTab,
  NotificationsTab,
  DataTab,
} from "@/components/configuracoes"

// Types
type BudgetGroup = "essentials" | "lifestyle" | "investments"

interface FamilyMember {
  id: string
  name: string
  email: string
  avatar?: string | null
  isAdmin: boolean
}

interface Account {
  id: string
  name: string
  type: "checking" | "savings" | "credit" | "investment"
  balance: number
  color: string
  icon?: string
  isActive: boolean
}

interface Category {
  id: string
  name: string
  type: "income" | "expense"
  color: string
  budgetGroup?: BudgetGroup
  isDefault: boolean
  order: number
}

// Mock family members
const mockFamilyMembers: FamilyMember[] = [
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

// Mock accounts
const mockAccounts: Account[] = [
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

// Mock categories
const mockCategories: Category[] = [
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

// Mock budget rule config
const mockBudgetConfig = {
  essentialsPercent: 50,
  lifestylePercent: 30,
  investmentsPercent: 20,
}

// Mock notification settings
const mockNotificationSettings = {
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

// Mock data stats
const mockDataStats = {
  totalTransactions: 247,
  totalCategories: 14,
  totalAccounts: 5,
  totalGoals: 6,
  lastBackup: new Date("2026-01-05T14:30:00"),
}

export default function ConfiguracoesPage() {
  const [familyMembers, setFamilyMembers] = useState(mockFamilyMembers)
  const [accounts, setAccounts] = useState(mockAccounts)
  const [categories, setCategories] = useState(mockCategories)
  const [budgetConfig, setBudgetConfig] = useState(mockBudgetConfig)
  const [notificationSettings, setNotificationSettings] = useState(mockNotificationSettings)

  // Handlers for data tab
  const handleExport = async (format: "csv" | "pdf", dataType: string) => {
    // Simulate export delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log(`Exporting ${dataType} as ${format}`)
  }

  const handleImport = async (file: File) => {
    // Simulate import delay
    await new Promise((resolve) => setTimeout(resolve, 2000))
    console.log(`Importing ${file.name}`)
    return { success: 45, errors: 3 }
  }

  const handleBackup = async () => {
    // Simulate backup delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("Creating backup")
  }

  const handleRestore = async (file: File) => {
    // Simulate restore delay
    await new Promise((resolve) => setTimeout(resolve, 2000))
    console.log(`Restoring from ${file.name}`)
  }

  const handleCategoryGroupChange = (categoryId: string, group: "essentials" | "lifestyle" | "investments") => {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, budgetGroup: group } : c))
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações do aplicativo
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger
            value="profile"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Users className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger
            value="accounts"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <CreditCard className="h-4 w-4" />
            Contas
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Tag className="h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger
            value="budget"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <PieChart className="h-4 w-4" />
            50/30/20
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Database className="h-4 w-4" />
            Dados
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <FamilyMembersTab
            members={familyMembers}
            onMembersChange={setFamilyMembers}
          />
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts">
          <AccountsTab
            accounts={accounts}
            onAccountsChange={setAccounts}
          />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <CategoriesTab
            categories={categories}
            onCategoriesChange={setCategories}
          />
        </TabsContent>

        {/* Budget Rule Tab */}
        <TabsContent value="budget">
          <BudgetRuleTab
            config={budgetConfig}
            categories={categories.filter((c) => c.type === "expense")}
            monthlyIncome={14000}
            onConfigChange={setBudgetConfig}
            onCategoryGroupChange={handleCategoryGroupChange}
          />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <NotificationsTab
            settings={notificationSettings}
            onSettingsChange={setNotificationSettings}
          />
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data">
          <DataTab
            stats={mockDataStats}
            onExport={handleExport}
            onImport={handleImport}
            onBackup={handleBackup}
            onRestore={handleRestore}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
