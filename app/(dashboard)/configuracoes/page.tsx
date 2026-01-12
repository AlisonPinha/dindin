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
import { useToast } from "@/hooks/use-toast"
import { useSWRData } from "@/hooks/use-swr-data"
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
  const { toast } = useToast()
  const { mutators } = useSWRData()
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
  const handleExport = async (format: "csv" | "pdf", dataType: string) => {
    try {
      if (format === "csv" && dataType === "transactions") {
        if (transactions.length === 0) {
          toast({
            title: "Nenhuma transação",
            description: "Não há transações para exportar.",
            variant: "destructive",
          })
          return
        }

        // Export transactions as CSV
        const csvHeaders = "Data,Descrição,Valor,Tipo,Categoria,Conta,Tags\n"
        const csvRows = transactions.map(t => {
          const date = new Date(t.date).toLocaleDateString("pt-BR")
          const value = t.amount.toFixed(2)
          const type = t.type === "income" ? "Receita" : t.type === "expense" ? "Despesa" : "Transferência"
          const category = categories.find(c => c.id === t.categoryId)?.name || ""
          const account = accounts.find(a => a.id === t.accountId)?.name || ""
          const tags = (t.tags || []).join("; ")
          return `${date},"${t.description}",${value},${type},"${category}","${account}","${tags}"`
        }).join("\n")

        const csvContent = csvHeaders + csvRows
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `transacoes-${new Date().toISOString().split("T")[0]}.csv`
        link.click()
        URL.revokeObjectURL(url)

        toast({
          title: "Exportação concluída",
          description: `${transactions.length} transações exportadas com sucesso.`,
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    }
  }

  const handleImport = async (file: File): Promise<{ success: number; errors: number }> => {
    try {
      const text = await file.text()
      const lines = text.split("\n").filter(line => line.trim())
      
      if (lines.length < 2 || !lines[0]) {
        throw new Error("Arquivo CSV vazio ou inválido")
      }

      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, "").toLowerCase())
      
      let success = 0
      let errors = 0

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        try {
          const line = lines[i]
          if (!line) continue
          
          const values = line.split(",").map(v => v.trim().replace(/"/g, ""))
          const date = values[headers.indexOf("data")] ?? values[0] ?? ""
          const description = values[headers.indexOf("descrição")] ?? values[headers.indexOf("descricao")] ?? values[1] ?? ""
          const valueStr = values[headers.indexOf("valor")] ?? values[2] ?? ""
          const value = parseFloat(valueStr)
          const typeStr = values[headers.indexOf("tipo")] ?? values[3] ?? ""
          const categoryName = values[headers.indexOf("categoria")] ?? values[4] ?? ""

          if (!date || !description || isNaN(value)) {
            errors++
            continue
          }

          const type = typeStr.toLowerCase().includes("receita") || typeStr.toLowerCase().includes("income")
            ? "ENTRADA"
            : typeStr.toLowerCase().includes("despesa") || typeStr.toLowerCase().includes("expense")
            ? "SAIDA"
            : "TRANSFERENCIA"

          const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
          const account = accounts[0] // Use first account as default

          if (!account) {
            errors++
            continue
          }

          const response = await fetch("/api/transacoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              descricao: description,
              valor: value,
              tipo: type,
              data: new Date(date).toISOString(),
              categoryId: category?.id || null,
              accountId: account.id,
            }),
          })

          if (response.ok) {
            success++
          } else {
            errors++
          }
        } catch {
          errors++
        }
      }

      // Reload data
      mutators.transactions()
      mutators.accounts()

      if (success > 0) {
        toast({
          title: "Importação concluída",
          description: `${success} transações importadas${errors > 0 ? `, ${errors} erros` : ""}.`,
        })
      } else {
        toast({
          title: "Importação falhou",
          description: `Nenhuma transação foi importada. ${errors > 0 ? `${errors} erros encontrados.` : ""}`,
          variant: "destructive",
        })
      }

      return { success, errors }
    } catch (error) {
      toast({
        title: "Erro ao importar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleBackup = async () => {
    try {
      // Create backup object with all user data
      const backup = {
        version: "1.0",
        createdAt: new Date().toISOString(),
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          monthlyIncome: user.monthlyIncome,
        } : null,
        familyMembers: familyMembers.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          avatar: m.avatar,
        })),
        accounts: accounts.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: a.balance,
          color: a.color,
          icon: a.icon,
          bank: a.bank,
          isActive: a.isActive,
        })),
        categories: categories.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          color: c.color,
          icon: c.icon,
        })),
        transactions: transactions.map(t => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          type: t.type,
          date: t.date,
          categoryId: t.categoryId,
          accountId: t.accountId,
          tags: t.tags,
          notes: t.notes,
          ownership: t.ownership,
          isRecurring: t.isRecurring,
        })),
        investments: [],
        goals: goals.map(g => ({
          id: g.id,
          name: g.name,
          type: g.type,
          targetValue: g.targetValue,
          currentValue: g.currentValue,
          deadline: g.deadline,
          isActive: g.isActive,
        })),
      }

      // Download as JSON file
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `backup-famfinance-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)

      toast({
        title: "Backup criado",
        description: "Seus dados foram exportados com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao criar backup",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    }
  }

  const handleRestore = async (file: File) => {
    try {
      const text = await file.text()
      const backup = JSON.parse(text)

      if (!backup.version || !backup.createdAt) {
        throw new Error("Arquivo de backup inválido")
      }

      // Restore data via API
      // Note: This is a simplified version - in production, you'd want to create an API endpoint
      // that handles bulk restore operations
      
      // For now, we'll restore transactions one by one
      let restored = 0
      let errors = 0

      // Restore transactions
      for (const tx of backup.transactions || []) {
        try {
          const response = await fetch("/api/transacoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              descricao: tx.description,
              valor: tx.amount,
              tipo: tx.type === "income" ? "ENTRADA" : tx.type === "expense" ? "SAIDA" : "TRANSFERENCIA",
              data: new Date(tx.date).toISOString(),
              categoryId: tx.categoryId,
              accountId: tx.accountId,
              tags: tx.tags || [],
              notas: tx.notes || null,
              ownership: tx.ownership || "CASA",
            }),
          })

          if (response.ok) {
            restored++
          } else {
            errors++
          }
        } catch {
          errors++
        }
      }

      // Reload data
      mutators.transactions()
      mutators.accounts()

      if (restored > 0) {
        toast({
          title: "Backup restaurado",
          description: `${restored} transações restauradas${errors > 0 ? `, ${errors} erros` : ""}.`,
        })
      } else {
        toast({
          title: "Restauração falhou",
          description: `Nenhuma transação foi restaurada. ${errors > 0 ? `${errors} erros encontrados.` : ""}`,
          variant: "destructive",
        })
      }

      return { restored, errors }
    } catch (error) {
      toast({
        title: "Erro ao restaurar backup",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
      throw error
    }
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
