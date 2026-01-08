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
import {
  mockConfigFamilyMembers,
  mockConfigAccounts,
  mockConfigCategories,
  mockConfigBudgetConfig,
  mockConfigNotificationSettings,
  mockDataStats,
} from "@/lib/mock-data"

export default function ConfiguracoesPage() {
  const [familyMembers, setFamilyMembers] = useState(mockConfigFamilyMembers)
  const [accounts, setAccounts] = useState(mockConfigAccounts)
  const [categories, setCategories] = useState(mockConfigCategories)
  const [budgetConfig, setBudgetConfig] = useState(mockConfigBudgetConfig)
  const [notificationSettings, setNotificationSettings] = useState(mockConfigNotificationSettings)

  // Handlers for data tab
  const handleExport = async (_format: "csv" | "pdf", _dataType: string) => {
    // Simulate export delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    // TODO: Implement actual export logic
  }

  const handleImport = async (_file: File) => {
    // Simulate import delay
    await new Promise((resolve) => setTimeout(resolve, 2000))
    // TODO: Implement actual import logic
    return { success: 45, errors: 3 }
  }

  const handleBackup = async () => {
    // Simulate backup delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // TODO: Implement actual backup logic
  }

  const handleRestore = async (_file: File) => {
    // Simulate restore delay
    await new Promise((resolve) => setTimeout(resolve, 2000))
    // TODO: Implement actual restore logic
  }

  const handleCategoryGroupChange = (categoryId: string, group: "essentials" | "lifestyle" | "investments") => {
    setCategories((prev) =>
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
