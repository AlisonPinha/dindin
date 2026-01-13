"use client"

import { useState, useMemo, useEffect } from "react"
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
import { useStore } from "@/hooks/use-store"
import type { Account, Category, User } from "@/types"

// Types for configuration components (matching component expectations)
interface FamilyMemberConfig {
  id: string
  name: string
  email: string
  avatar?: string | null
  isAdmin: boolean
}

interface AccountConfig {
  id: string
  name: string
  type: "checking" | "savings" | "credit" | "investment"
  balance: number
  color: string
  icon?: string
  bank?: string
  isActive: boolean
}

interface CategoryConfig {
  id: string
  name: string
  type: "income" | "expense"
  color: string
  icon?: string
  budgetGroup?: "essentials" | "lifestyle" | "investments"
  isDefault: boolean
  order: number
}

interface BudgetConfig {
  essentialsPercent: number
  lifestylePercent: number
  investmentsPercent: number
}

interface NotificationSettings {
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

interface DataStats {
  totalTransactions: number
  totalCategories: number
  totalAccounts: number
  totalGoals: number
  lastBackup?: Date
}

export default function ConfiguracoesPage() {
  const {
    user,
    familyMembers,
    accounts,
    categories,
    transactions,
    goals,
    setFamilyMembers,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useStore()

  // Convert store data to configuration format
  const familyMembersConfig: FamilyMemberConfig[] = useMemo(() => {
    const allMembers = user ? [user, ...familyMembers.filter(m => m.id !== user.id)] : familyMembers
    return allMembers.map((m, index) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      avatar: m.avatar,
      isAdmin: index === 0, // First member is admin
    }))
  }, [user, familyMembers])

  const [localFamilyMembers, setLocalFamilyMembers] = useState<FamilyMemberConfig[]>(familyMembersConfig)

  // Sync local state with store
  useEffect(() => {
    setLocalFamilyMembers(familyMembersConfig)
  }, [familyMembersConfig])

  const accountsConfig: AccountConfig[] = useMemo(() => {
    return accounts.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      balance: a.balance,
      color: a.color || "#3b82f6",
      icon: undefined,
      bank: a.bank || undefined,
      isActive: true,
    }))
  }, [accounts])

  const [localAccounts, setLocalAccounts] = useState<AccountConfig[]>(accountsConfig)

  useEffect(() => {
    setLocalAccounts(accountsConfig)
  }, [accountsConfig])

  const categoriesConfig: CategoryConfig[] = useMemo(() => {
    return categories.map((c, index) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      color: c.color || "#6366f1",
      icon: c.icon || undefined,
      budgetGroup: c.budgetGroup || "lifestyle",
      isDefault: true,
      order: index + 1,
    }))
  }, [categories])

  const [localCategories, setLocalCategories] = useState<CategoryConfig[]>(categoriesConfig)

  useEffect(() => {
    setLocalCategories(categoriesConfig)
  }, [categoriesConfig])

  // Budget configuration
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>({
    essentialsPercent: 50,
    lifestylePercent: 30,
    investmentsPercent: 20,
  })

  // Monthly income from user
  const monthlyIncome = user?.monthlyIncome || 0

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    categoryLimitEnabled: true,
    categoryLimitThreshold: 80,
    weeklyEmailEnabled: true,
    weeklyEmailDay: "sunday",
    transactionReminderEnabled: true,
    transactionReminderTime: "evening",
    goalProgressEnabled: true,
    budgetAlertEnabled: true,
    budgetAlertThreshold: 90,
  })

  // Data stats
  const dataStats: DataStats = useMemo(() => ({
    totalTransactions: transactions.length,
    totalCategories: categories.length,
    totalAccounts: accounts.length,
    totalGoals: goals.length,
    lastBackup: undefined,
  }), [transactions, categories, accounts, goals])

  // Handler for family members change
  const handleFamilyMembersChange = (members: FamilyMemberConfig[]) => {
    setLocalFamilyMembers(members)
    // Convert back to User format and update store
    const users: User[] = members.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      avatar: m.avatar,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
    setFamilyMembers(users)
  }

  // Type mappings for API
  const accountTypeToDb: Record<string, string> = {
    checking: "CORRENTE",
    savings: "POUPANCA",
    credit: "CARTAO_CREDITO",
    investment: "INVESTIMENTO",
  }

  // Handler for accounts change
  const handleAccountsChange = async (newAccounts: AccountConfig[]) => {
    setLocalAccounts(newAccounts)

    // Find additions, updates, and deletions
    const currentIds = accounts.map(a => a.id)
    const newIds = newAccounts.map(a => a.id)

    // Add new accounts
    for (const acc of newAccounts) {
      if (!currentIds.includes(acc.id)) {
        try {
          // Call API to persist
          const response = await fetch("/api/contas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nome: acc.name,
              tipo: accountTypeToDb[acc.type] || "CORRENTE",
              banco: acc.bank,
              saldoInicial: acc.balance,
              cor: acc.color,
              userId: user?.id,
            }),
          })

          if (response.ok) {
            const created = await response.json()
            // Update store with real ID from database
            const newAccount: Account = {
              id: created.id,
              name: acc.name,
              type: acc.type,
              balance: acc.balance,
              color: acc.color,
              bank: acc.bank,
              userId: user?.id || "",
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            addAccount(newAccount)
          }
        } catch (error) {
          console.error("Error creating account:", error)
        }
      }
    }

    // Update existing accounts
    for (const acc of newAccounts) {
      if (currentIds.includes(acc.id)) {
        try {
          await fetch("/api/contas", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: acc.id,
              nome: acc.name,
              tipo: accountTypeToDb[acc.type] || "CORRENTE",
              banco: acc.bank,
              saldoInicial: acc.balance,
              cor: acc.color,
              ativo: acc.isActive,
            }),
          })

          updateAccount(acc.id, {
            name: acc.name,
            type: acc.type,
            balance: acc.balance,
            color: acc.color,
            bank: acc.bank,
            updatedAt: new Date(),
          })
        } catch (error) {
          console.error("Error updating account:", error)
        }
      }
    }

    // Delete removed accounts
    for (const id of currentIds) {
      if (!newIds.includes(id)) {
        try {
          await fetch(`/api/contas?id=${id}`, {
            method: "DELETE",
          })
          deleteAccount(id)
        } catch (error) {
          console.error("Error deleting account:", error)
        }
      }
    }
  }

  // Handler for categories change
  const handleCategoriesChange = (newCategories: CategoryConfig[]) => {
    setLocalCategories(newCategories)

    const currentIds = categories.map(c => c.id)
    const newIds = newCategories.map(c => c.id)

    // Add new categories
    newCategories.forEach(cat => {
      if (!currentIds.includes(cat.id)) {
        const newCategory: Category = {
          id: cat.id,
          name: cat.name,
          type: cat.type,
          color: cat.color,
          icon: cat.icon,
          userId: user?.id || "",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        addCategory(newCategory)
      }
    })

    // Update existing categories
    newCategories.forEach(cat => {
      if (currentIds.includes(cat.id)) {
        updateCategory(cat.id, {
          name: cat.name,
          type: cat.type,
          color: cat.color,
          icon: cat.icon,
          updatedAt: new Date(),
        })
      }
    })

    // Delete removed categories
    currentIds.forEach(id => {
      if (!newIds.includes(id)) {
        deleteCategory(id)
      }
    })
  }

  // Handlers for data tab
  const handleExport = async (_format: "csv" | "pdf", _dataType: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    // TODO: Implement actual export logic
  }

  const handleImport = async (_file: File) => {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    // TODO: Implement actual import logic
    return { success: 45, errors: 3 }
  }

  const handleBackup = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // TODO: Implement actual backup logic
  }

  const handleRestore = async (_file: File) => {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    // TODO: Implement actual restore logic
  }

  const handleCategoryGroupChange = (categoryId: string, group: "essentials" | "lifestyle" | "investments") => {
    setLocalCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, budgetGroup: group } : c))
    )
  }

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-display">Configurações</h1>
        <p className="text-callout text-secondary mt-1">
          Gerencie suas preferências e configurações do aplicativo
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6 page-transition">
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
            members={localFamilyMembers}
            onMembersChange={handleFamilyMembersChange}
          />
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts">
          <AccountsTab
            accounts={localAccounts}
            onAccountsChange={handleAccountsChange}
          />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <CategoriesTab
            categories={localCategories}
            onCategoriesChange={handleCategoriesChange}
          />
        </TabsContent>

        {/* Budget Rule Tab */}
        <TabsContent value="budget">
          <BudgetRuleTab
            config={budgetConfig}
            categories={localCategories.filter((c) => c.type === "expense")}
            monthlyIncome={monthlyIncome}
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
            stats={dataStats}
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
