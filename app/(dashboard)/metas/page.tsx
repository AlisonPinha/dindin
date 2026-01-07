"use client"

import { useState, useMemo } from "react"
import { Plus, ChevronDown, Target, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  GoalCardEnhanced,
  BudgetRuleCard,
  AchievementsSection,
  GoalModal,
  AdvancedGoalModal,
} from "@/components/metas"
import { useToast } from "@/hooks/use-toast"
import { generateId } from "@/lib/utils"
import type { Goal, GoalType, GoalStatus, Achievement, AdvancedGoal, Category } from "@/types"

// Mock goals data
const mockGoals: Goal[] = [
  {
    id: "1",
    name: "Reserva de Emergência",
    description: "6 meses de despesas guardados",
    type: "savings",
    targetAmount: 30000,
    currentAmount: 18500,
    deadline: new Date("2026-06-01"),
    color: "#22c55e",
    status: "active",
    streak: 5,
    userId: "1",
    createdAt: new Date("2025-06-01"),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Viagem Europa",
    description: "Lua de mel em Portugal e Espanha",
    type: "savings",
    targetAmount: 25000,
    currentAmount: 8200,
    deadline: new Date("2026-12-01"),
    color: "#3b82f6",
    status: "active",
    streak: 3,
    userId: "1",
    createdAt: new Date("2025-09-01"),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Carteira de Investimentos",
    description: "Atingir R$ 100k em investimentos",
    type: "investment",
    targetAmount: 100000,
    currentAmount: 45000,
    deadline: new Date("2027-01-01"),
    color: "#8b5cf6",
    status: "active",
    streak: 8,
    userId: "1",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date(),
  },
  {
    id: "4",
    name: "Entrada do Apartamento",
    description: "20% do valor do imóvel",
    type: "patrimony",
    targetAmount: 80000,
    currentAmount: 32000,
    deadline: new Date("2028-01-01"),
    color: "#d946ef",
    status: "active",
    userId: "1",
    createdAt: new Date("2025-03-01"),
    updatedAt: new Date(),
  },
  {
    id: "5",
    name: "Curso de Inglês",
    description: "Intercâmbio de 3 meses",
    type: "savings",
    targetAmount: 15000,
    currentAmount: 15000,
    deadline: new Date("2025-12-01"),
    status: "completed",
    userId: "1",
    createdAt: new Date("2024-06-01"),
    updatedAt: new Date(),
  },
  {
    id: "6",
    name: "Fundo de Férias",
    description: "Viagem anual da família",
    type: "savings",
    targetAmount: 8000,
    currentAmount: 2500,
    status: "paused",
    userId: "1",
    createdAt: new Date("2025-08-01"),
    updatedAt: new Date(),
  },
]

// Mock budget data for 50/30/20 rule
const mockBudgetData = {
  totalIncome: 14000,
  essentialsSpent: 7700, // 55%
  lifestyleSpent: 3500, // 25%
  investmentsSpent: 2800, // 20%
}

// Mock categories for advanced goal modal
const mockCategories: Category[] = [
  { id: "1", name: "Alimentação", type: "expense", color: "#f97316", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "2", name: "Moradia", type: "expense", color: "#ef4444", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "3", name: "Transporte", type: "expense", color: "#eab308", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "4", name: "Lazer", type: "expense", color: "#a855f7", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "5", name: "Saúde", type: "expense", color: "#ec4899", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "6", name: "Educação", type: "expense", color: "#06b6d4", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "7", name: "Compras", type: "expense", color: "#f43f5e", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "8", name: "Assinaturas", type: "expense", color: "#64748b", userId: "1", createdAt: new Date(), updatedAt: new Date() },
]

// Mock achievements
const mockAchievements: Achievement[] = [
  {
    id: "1",
    title: "Primeiro Passo",
    description: "Criou sua primeira meta financeira",
    icon: "target",
    category: "milestone",
    unlockedAt: new Date("2025-06-01"),
  },
  {
    id: "2",
    title: "Economista",
    description: "Economizou R$ 10.000 no total",
    icon: "piggy",
    category: "savings",
    unlockedAt: new Date("2025-09-15"),
  },
  {
    id: "3",
    title: "Focado",
    description: "3 meses consecutivos batendo a meta de economia",
    icon: "flame",
    category: "streak",
    unlockedAt: new Date("2025-10-01"),
  },
  {
    id: "4",
    title: "Investidor Iniciante",
    description: "Primeiro investimento registrado",
    icon: "medal",
    category: "milestone",
    unlockedAt: new Date("2025-07-20"),
  },
  {
    id: "5",
    title: "Sem Delivery",
    description: "3 meses sem estourar o orçamento de delivery",
    icon: "trophy",
    category: "budget",
    unlockedAt: new Date("2026-01-05"),
  },
  {
    id: "6",
    title: "Meta Batida!",
    description: "Completou uma meta financeira",
    icon: "star",
    category: "milestone",
    unlockedAt: new Date("2025-12-01"),
  },
  {
    id: "7",
    title: "Super Economizador",
    description: "Economizou R$ 50.000 no total",
    icon: "crown",
    category: "savings",
    unlockedAt: null,
  },
  {
    id: "8",
    title: "Maratonista",
    description: "12 meses consecutivos batendo metas",
    icon: "zap",
    category: "streak",
    unlockedAt: null,
  },
  {
    id: "9",
    title: "Regra de Ouro",
    description: "Seguiu a regra 50/30/20 por 6 meses",
    icon: "award",
    category: "budget",
    unlockedAt: null,
  },
]

export default function MetasPage() {
  const { toast } = useToast()
  const [goals, setGoals] = useState<Goal[]>(mockGoals)
  const [activeTab, setActiveTab] = useState("all")

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  // Advanced Modal state
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [advancedGoals, setAdvancedGoals] = useState<AdvancedGoal[]>([])

  // Filter goals by tab
  const filteredGoals = useMemo(() => {
    let filtered = goals

    // Filter by type
    if (activeTab === "savings") {
      filtered = goals.filter((g) => g.type === "savings")
    } else if (activeTab === "investment") {
      filtered = goals.filter((g) => g.type === "investment")
    } else if (activeTab === "patrimony") {
      filtered = goals.filter((g) => g.type === "patrimony")
    } else if (activeTab === "budget") {
      filtered = goals.filter((g) => g.type === "budget")
    }

    return filtered
  }, [goals, activeTab])

  // Separate by status
  const activeGoals = filteredGoals.filter((g) => g.status === "active")
  const completedGoals = filteredGoals.filter((g) => g.status === "completed")
  const pausedGoals = filteredGoals.filter((g) => g.status === "paused")

  // Count by type for tabs
  const countByType = useMemo(() => {
    return {
      all: goals.length,
      savings: goals.filter((g) => g.type === "savings").length,
      investment: goals.filter((g) => g.type === "investment").length,
      patrimony: goals.filter((g) => g.type === "patrimony").length,
      budget: goals.filter((g) => g.type === "budget").length,
    }
  }, [goals])

  // Open modal for new goal
  const handleOpenCreateModal = () => {
    setEditingGoal(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  // Open modal for editing
  const handleOpenEditModal = (goal: Goal) => {
    setEditingGoal(goal)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  // Handle modal submit
  const handleModalSubmit = (data: {
    id?: string
    name: string
    description: string
    type: GoalType
    targetAmount: number
    currentAmount: number
    deadline?: Date
    color?: string
  }) => {
    if (modalMode === "create") {
      const newGoal: Goal = {
        id: generateId(),
        name: data.name,
        description: data.description || null,
        type: data.type,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount,
        deadline: data.deadline || null,
        color: data.color || null,
        icon: null,
        status: "active",
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setGoals((prev) => [newGoal, ...prev])
      toast({
        title: "Meta criada",
        description: "Sua nova meta foi criada com sucesso!",
      })
    } else if (editingGoal) {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === editingGoal.id
            ? {
                ...g,
                name: data.name,
                description: data.description || null,
                type: data.type,
                targetAmount: data.targetAmount,
                currentAmount: data.currentAmount,
                deadline: data.deadline || null,
                color: data.color || null,
                updatedAt: new Date(),
              }
            : g
        )
      )
      toast({
        title: "Meta atualizada",
        description: "Sua meta foi atualizada com sucesso!",
      })
    }
  }

  const handleStatusChange = (id: string, status: GoalStatus) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, status, updatedAt: new Date() } : g
      )
    )
    toast({
      title: "Meta atualizada",
      description: `A meta foi ${
        status === "completed"
          ? "concluída"
          : status === "paused"
          ? "pausada"
          : "reativada"
      }.`,
    })
  }

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id))
    toast({
      title: "Meta excluída",
      description: "A meta foi excluída com sucesso.",
    })
  }

  // Handle advanced modal submit
  const handleAdvancedGoalSubmit = (data: Omit<AdvancedGoal, "id" | "userId" | "createdAt" | "updatedAt">) => {
    const newAdvancedGoal: AdvancedGoal = {
      id: generateId(),
      name: data.name,
      config: data.config,
      isActive: data.isActive,
      userId: "1",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setAdvancedGoals((prev) => [newAdvancedGoal, ...prev])

    const typeLabels: Record<string, string> = {
      category_limit: "Limite de Categoria",
      monthly_investment: "Investimento Mensal",
      patrimony_target: "Meta de Patrimônio",
      percentage_rule: "Regra Percentual",
    }

    toast({
      title: "Meta avançada criada",
      description: `${typeLabels[data.config.type]} "${data.name}" foi criada com sucesso!`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Metas</h1>
          <p className="text-muted-foreground">
            Defina e acompanhe suas metas financeiras
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" className="gap-2 shadow-lg">
              <Plus className="h-5 w-5" />
              Nova Meta
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleOpenCreateModal} className="gap-2">
              <Target className="h-4 w-4" />
              Meta Simples
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsAdvancedModalOpen(true)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Meta Avançada
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="all">
            Todas ({countByType.all})
          </TabsTrigger>
          <TabsTrigger value="savings">
            Economia ({countByType.savings})
          </TabsTrigger>
          <TabsTrigger value="investment">
            Investimento ({countByType.investment})
          </TabsTrigger>
          <TabsTrigger value="patrimony">
            Patrimônio ({countByType.patrimony})
          </TabsTrigger>
          <TabsTrigger value="budget">
            50/30/20
          </TabsTrigger>
        </TabsList>

        {/* All tabs content */}
        <TabsContent value="all" className="mt-6 space-y-8">
          {/* Budget Rule Card - Featured */}
          <BudgetRuleCard
            totalIncome={mockBudgetData.totalIncome}
            essentialsSpent={mockBudgetData.essentialsSpent}
            lifestyleSpent={mockBudgetData.lifestyleSpent}
            investmentsSpent={mockBudgetData.investmentsSpent}
            className="lg:col-span-2"
          />

          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Metas Ativas ({activeGoals.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeGoals.map((goal) => (
                  <GoalCardEnhanced
                    key={goal.id}
                    goal={goal}
                    onEdit={handleOpenEditModal}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteGoal}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          <AchievementsSection achievements={mockAchievements} />

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Metas Concluídas ({completedGoals.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedGoals.map((goal) => (
                  <GoalCardEnhanced
                    key={goal.id}
                    goal={goal}
                    onEdit={handleOpenEditModal}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteGoal}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Paused Goals */}
          {pausedGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Metas Pausadas ({pausedGoals.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pausedGoals.map((goal) => (
                  <GoalCardEnhanced
                    key={goal.id}
                    goal={goal}
                    onEdit={handleOpenEditModal}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteGoal}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Savings tab */}
        <TabsContent value="savings" className="mt-6 space-y-6">
          {activeGoals.length === 0 && completedGoals.length === 0 && pausedGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                Nenhuma meta de economia
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie metas para reservas, viagens e projetos
              </p>
              <Button onClick={handleOpenCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Meta de Economia
              </Button>
            </div>
          ) : (
            <>
              {activeGoals.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeGoals.map((goal) => (
                    <GoalCardEnhanced
                      key={goal.id}
                      goal={goal}
                      onEdit={handleOpenEditModal}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDeleteGoal}
                    />
                  ))}
                </div>
              )}
              {completedGoals.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Concluídas</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {completedGoals.map((goal) => (
                      <GoalCardEnhanced
                        key={goal.id}
                        goal={goal}
                        onEdit={handleOpenEditModal}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDeleteGoal}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Investment tab */}
        <TabsContent value="investment" className="mt-6 space-y-6">
          {activeGoals.length === 0 && completedGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                Nenhuma meta de investimento
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Defina metas para sua carteira e aportes
              </p>
              <Button onClick={handleOpenCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Meta de Investimento
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...activeGoals, ...completedGoals].map((goal) => (
                <GoalCardEnhanced
                  key={goal.id}
                  goal={goal}
                  onEdit={handleOpenEditModal}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteGoal}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Patrimony tab */}
        <TabsContent value="patrimony" className="mt-6 space-y-6">
          {activeGoals.length === 0 && completedGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                Nenhuma meta de patrimônio
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Planeje a compra de bens de alto valor
              </p>
              <Button onClick={handleOpenCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Meta de Patrimônio
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...activeGoals, ...completedGoals].map((goal) => (
                <GoalCardEnhanced
                  key={goal.id}
                  goal={goal}
                  onEdit={handleOpenEditModal}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteGoal}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Budget 50/30/20 tab */}
        <TabsContent value="budget" className="mt-6 space-y-6">
          <BudgetRuleCard
            totalIncome={mockBudgetData.totalIncome}
            essentialsSpent={mockBudgetData.essentialsSpent}
            lifestyleSpent={mockBudgetData.lifestyleSpent}
            investmentsSpent={mockBudgetData.investmentsSpent}
          />

          <AchievementsSection
            achievements={mockAchievements.filter(
              (a) => a.category === "budget" || a.category === "streak"
            )}
          />
        </TabsContent>
      </Tabs>

      {/* Goal Modal */}
      <GoalModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        initialData={
          editingGoal
            ? {
                id: editingGoal.id,
                name: editingGoal.name,
                description: editingGoal.description || "",
                type: editingGoal.type,
                targetAmount: editingGoal.targetAmount,
                currentAmount: editingGoal.currentAmount,
                deadline: editingGoal.deadline ? new Date(editingGoal.deadline) : undefined,
                color: editingGoal.color || undefined,
              }
            : undefined
        }
        onSubmit={handleModalSubmit}
      />

      {/* Advanced Goal Modal */}
      <AdvancedGoalModal
        open={isAdvancedModalOpen}
        onOpenChange={setIsAdvancedModalOpen}
        mode="create"
        categories={mockCategories}
        onSubmit={handleAdvancedGoalSubmit}
      />
    </div>
  )
}
