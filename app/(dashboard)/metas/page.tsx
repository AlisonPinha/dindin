"use client"

import { useState, useMemo } from "react"
import { Plus, ChevronDown, Target, Sparkles, Flame } from "lucide-react"
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
import { useStore } from "@/hooks/use-store"
import { useDesafios } from "@/hooks/use-desafios"
import { generateId } from "@/lib/utils"
import { ChallengeCard } from "@/components/desafios/challenge-card"
import { ChallengeModal } from "@/components/desafios/challenge-modal"
import type { Goal, GoalType, GoalStatus, Achievement, AdvancedGoal } from "@/types"

export default function MetasPage() {
  const { toast } = useToast()
  const {
    goals: storeGoals,
    categories,
    transactions,
    user,
    addGoal,
    updateGoal,
    deleteGoal: deleteGoalStore,
  } = useStore()

  const [activeTab, setActiveTab] = useState("all")

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  // Advanced Modal state
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false)
  const [_advancedGoals, _setAdvancedGoals] = useState<AdvancedGoal[]>([])

  // Challenge state
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false)
  const { challenges, active: activeChallenges, completed: completedChallenges, createChallenge, updateChallenge, deleteChallenge } = useDesafios()

  // Convert store goals to component format
  const goals: Goal[] = useMemo(() => {
    return storeGoals.map(goal => ({
      id: goal.id,
      name: goal.name,
      description: goal.description,
      type: goal.type,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline,
      color: goal.color,
      icon: goal.icon,
      status: goal.status,
      streak: goal.streak,
      userId: goal.userId,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    }))
  }, [storeGoals])

  // Calculate budget data from transactions (50/30/20 rule)
  const budgetData = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    // Usar renda mensal do usuário como base, ou calcular a partir de transações
    const incomeFromTransactions = monthTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)
    
    // Se não houver transações de receita, usar a renda mensal do usuário
    const totalIncome = incomeFromTransactions > 0 
      ? incomeFromTransactions 
      : (user?.monthlyIncome || 0)

    // Categorize expenses based on category group
    let essentialsSpent = 0
    let lifestyleSpent = 0
    let investmentsSpent = 0

    monthTransactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        const category = categories.find(c => c.id === t.categoryId)
        if (category) {
          // Simple heuristic based on category name
          const catName = category.name.toLowerCase()
          if (['moradia', 'alimentação', 'transporte', 'saúde', 'educação'].some(e => catName.includes(e))) {
            essentialsSpent += t.amount
          } else {
            lifestyleSpent += t.amount
          }
        } else {
          lifestyleSpent += t.amount
        }
      })

    // Count investments from investment transactions
    investmentsSpent = monthTransactions
      .filter(t => t.type === "expense")
      .filter(t => {
        const category = categories.find(c => c.id === t.categoryId)
        return category?.name.toLowerCase().includes('investimento')
      })
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      totalIncome: totalIncome || 0,
      essentialsSpent,
      lifestyleSpent,
      investmentsSpent,
    }
  }, [transactions, categories, user])

  // Generate achievements based on actual data
  const achievements: Achievement[] = useMemo(() => {
    const result: Achievement[] = []

    // First Step - created first goal
    if (goals.length > 0) {
      result.push({
        id: "1",
        title: "Primeiro Passo",
        description: "Criou sua primeira meta financeira",
        icon: "target",
        category: "milestone",
        unlockedAt: goals[goals.length - 1]?.createdAt || new Date(),
      })
    }

    // Completed goals
    const completedGoalsCount = goals.filter(g => g.status === "completed").length
    if (completedGoalsCount > 0) {
      result.push({
        id: "6",
        title: "Meta Batida!",
        description: "Completou uma meta financeira",
        icon: "star",
        category: "milestone",
        unlockedAt: new Date(),
      })
    }

    // Calculate total saved
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0)
    if (totalSaved >= 10000) {
      result.push({
        id: "2",
        title: "Economista",
        description: "Economizou R$ 10.000 no total",
        icon: "piggy",
        category: "savings",
        unlockedAt: new Date(),
      })
    }

    if (totalSaved >= 50000) {
      result.push({
        id: "7",
        title: "Super Economizador",
        description: "Economizou R$ 50.000 no total",
        icon: "crown",
        category: "savings",
        unlockedAt: new Date(),
      })
    }

    // Locked achievements (not yet unlocked)
    if (totalSaved < 50000) {
      result.push({
        id: "7-locked",
        title: "Super Economizador",
        description: "Economizou R$ 50.000 no total",
        icon: "crown",
        category: "savings",
        unlockedAt: null,
      })
    }

    result.push({
      id: "8",
      title: "Maratonista",
      description: "12 meses consecutivos batendo metas",
      icon: "zap",
      category: "streak",
      unlockedAt: null,
    })

    result.push({
      id: "9",
      title: "Regra de Ouro",
      description: "Seguiu a regra 50/30/20 por 6 meses",
      icon: "award",
      category: "budget",
      unlockedAt: null,
    })

    // Challenge achievements
    const completedChallengesCount = completedChallenges.length
    if (completedChallengesCount > 0) {
      result.push({
        id: "10",
        title: "Primeiro Desafio",
        description: "Completou um desafio juntos",
        icon: "flame",
        category: "streak",
        unlockedAt: completedChallenges[0]?.updatedAt || new Date(),
      })
    } else {
      result.push({
        id: "10-locked",
        title: "Primeiro Desafio",
        description: "Complete um desafio juntos",
        icon: "flame",
        category: "streak",
        unlockedAt: null,
      })
    }

    const hasLongStreak = challenges.some(c => c.streakCount >= 4)
    if (hasLongStreak) {
      result.push({
        id: "11",
        title: "Streak de Fogo",
        description: "4+ semanas de streak conjunto",
        icon: "zap",
        category: "streak",
        unlockedAt: new Date(),
      })
    } else {
      result.push({
        id: "11-locked",
        title: "Streak de Fogo",
        description: "4+ semanas de streak conjunto",
        icon: "zap",
        category: "streak",
        unlockedAt: null,
      })
    }

    if (completedChallengesCount >= 3) {
      result.push({
        id: "12",
        title: "Parceiros Financeiros",
        description: "3+ desafios completos juntos",
        icon: "trophy",
        category: "milestone",
        unlockedAt: new Date(),
      })
    } else {
      result.push({
        id: "12-locked",
        title: "Parceiros Financeiros",
        description: "Complete 3+ desafios juntos",
        icon: "trophy",
        category: "milestone",
        unlockedAt: null,
      })
    }

    return result
  }, [goals, challenges, completedChallenges])

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
        userId: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      addGoal(newGoal)
      toast({
        title: "Meta criada",
        description: "Sua nova meta foi criada com sucesso!",
      })
    } else if (editingGoal) {
      updateGoal(editingGoal.id, {
        name: data.name,
        description: data.description || null,
        type: data.type,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount,
        deadline: data.deadline || null,
        color: data.color || null,
        updatedAt: new Date(),
      })
      toast({
        title: "Meta atualizada",
        description: "Sua meta foi atualizada com sucesso!",
      })
    }
  }

  const handleStatusChange = (id: string, status: GoalStatus) => {
    updateGoal(id, { status, updatedAt: new Date() })
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
    deleteGoalStore(id)
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
      userId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    _setAdvancedGoals((prev) => [newAdvancedGoal, ...prev])

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

  // Convert categories for modal (expense type only)
  const expenseCategories = useMemo(() => {
    return categories.filter(c => c.type === "expense")
  }, [categories])

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-display">Metas</h1>
          <p className="text-callout text-secondary mt-1">
            Defina e acompanhe suas metas financeiras
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" className="gap-2">
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
        <div className="relative">
          {/* Indicador de scroll (fade direita) */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 lg:hidden" />

          {/* Container scroll */}
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
            <TabsList className="inline-flex min-w-max gap-1 lg:grid lg:w-auto lg:grid-cols-6">
              <TabsTrigger value="all" className="whitespace-nowrap px-4">
                Todas ({countByType.all})
              </TabsTrigger>
              <TabsTrigger value="savings" className="whitespace-nowrap px-4">
                Economia ({countByType.savings})
              </TabsTrigger>
              <TabsTrigger value="investment" className="whitespace-nowrap px-4">
                Investimento ({countByType.investment})
              </TabsTrigger>
              <TabsTrigger value="patrimony" className="whitespace-nowrap px-4">
                Patrimônio ({countByType.patrimony})
              </TabsTrigger>
              <TabsTrigger value="budget" className="whitespace-nowrap px-4">
                50/30/20
              </TabsTrigger>
              <TabsTrigger value="challenges" className="whitespace-nowrap px-4">
                <Flame className="h-3 w-3 mr-1" />
                Desafios ({challenges.length})
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* All tabs content */}
        <TabsContent value="all" className="mt-6 space-y-8">
          {/* Budget Rule Card - Featured */}
          <BudgetRuleCard
            totalIncome={budgetData.totalIncome}
            essentialsSpent={budgetData.essentialsSpent}
            lifestyleSpent={budgetData.lifestyleSpent}
            investmentsSpent={budgetData.investmentsSpent}
            className="lg:col-span-2"
          />

          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div>
              <h2 className="text-title mb-4">
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
          <AchievementsSection achievements={achievements} />

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-title mb-4">
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
              <h2 className="text-title mb-4">
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

          {/* Empty state */}
          {goals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhuma meta criada</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie sua primeira meta para começar a acompanhar seu progresso
              </p>
              <Button onClick={handleOpenCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Meta
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Savings tab */}
        <TabsContent value="savings" className="mt-6 space-y-6">
          {activeGoals.length === 0 && completedGoals.length === 0 && pausedGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-callout text-secondary mt-1">
                Nenhuma meta de economia
              </p>
              <p className="text-sm text-callout text-secondary mt-1 mb-4">
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
                  <h3 className="text-sm font-medium text-callout text-secondary mt-1 mb-3">Concluídas</h3>
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
              <p className="text-lg font-medium text-callout text-secondary mt-1">
                Nenhuma meta de investimento
              </p>
              <p className="text-sm text-callout text-secondary mt-1 mb-4">
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
              <p className="text-lg font-medium text-callout text-secondary mt-1">
                Nenhuma meta de patrimônio
              </p>
              <p className="text-sm text-callout text-secondary mt-1 mb-4">
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
            totalIncome={budgetData.totalIncome}
            essentialsSpent={budgetData.essentialsSpent}
            lifestyleSpent={budgetData.lifestyleSpent}
            investmentsSpent={budgetData.investmentsSpent}
          />

          <AchievementsSection
            achievements={achievements.filter(
              (a) => a.category === "budget" || a.category === "streak"
            )}
          />
        </TabsContent>

        {/* Challenges tab */}
        <TabsContent value="challenges" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-title">Desafios</h2>
            <Button size="sm" onClick={() => setIsChallengeModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Desafio
            </Button>
          </div>

          {activeChallenges.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Ativos ({activeChallenges.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeChallenges.map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onComplete={(id) => {
                      updateChallenge(id, { status: "COMPLETO" })
                      toast({ title: "Desafio completado!", description: "Parabéns pelo desafio!" })
                    }}
                    onDelete={(id) => {
                      deleteChallenge(id)
                      toast({ title: "Desafio excluído" })
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {completedChallenges.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Completados ({completedChallenges.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedChallenges.map(challenge => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            </div>
          )}

          {challenges.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Flame className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum desafio criado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie desafios para motivar vocês a economizar juntos
              </p>
              <Button onClick={() => setIsChallengeModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Desafio
              </Button>
            </div>
          )}

          <AchievementsSection
            achievements={achievements.filter(a => a.category === "streak" || a.id.startsWith("10") || a.id.startsWith("11") || a.id.startsWith("12"))}
          />
        </TabsContent>
      </Tabs>

      {/* Challenge Modal */}
      <ChallengeModal
        open={isChallengeModalOpen}
        onOpenChange={setIsChallengeModalOpen}
        onSubmit={async (data) => {
          await createChallenge(data)
          toast({ title: "Desafio criado!", description: `"${data.nome}" foi criado com sucesso.` })
        }}
      />

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
        categories={expenseCategories}
        onSubmit={handleAdvancedGoalSubmit}
      />
    </div>
  )
}
