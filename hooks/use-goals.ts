"use client"

import { useState, useCallback } from "react"
import { useStore } from "./use-store"
import type { Goal } from "@/types"

interface GoalWithProgress extends Goal {
  progress: number
  remaining: number
  completed: boolean
}

interface UseGoalsOptions {
  active?: boolean
  type?: string
}

interface GoalsState {
  goals: GoalWithProgress[]
  isLoading: boolean
  error: string | null
}

export function useGoals(options: UseGoalsOptions = {}) {
  const { user } = useStore()
  const [state, setState] = useState<GoalsState>({
    goals: [],
    isLoading: false,
    error: null,
  })

  const fetchGoals = useCallback(async () => {
    if (!user?.id) return

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const params = new URLSearchParams({ userId: user.id })

      if (options.active !== undefined)
        params.set("ativo", options.active.toString())
      if (options.type) params.set("tipo", options.type)

      const response = await fetch(`/api/metas?${params}`)

      if (!response.ok) {
        throw new Error("Erro ao buscar metas")
      }

      const data = await response.json()

      setState({
        goals: data,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }))
    }
  }, [user?.id, options])

  const createGoal = useCallback(
    async (data: Partial<Goal>) => {
      if (!user?.id) throw new Error("Usuário não autenticado")

      const response = await fetch("/api/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: user.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar meta")
      }

      const goal = await response.json()
      await fetchGoals()
      return goal
    },
    [user?.id, fetchGoals]
  )

  const updateGoal = useCallback(
    async (id: string, data: Partial<Goal>) => {
      const response = await fetch("/api/metas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar meta")
      }

      const goal = await response.json()
      await fetchGoals()
      return goal
    },
    [fetchGoals]
  )

  const updateProgress = useCallback(
    async (id: string, currentAmount?: number, increment?: number) => {
      const response = await fetch("/api/metas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, valorAtual: currentAmount, incremento: increment }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar progresso")
      }

      const goal = await response.json()
      await fetchGoals()
      return goal
    },
    [fetchGoals]
  )

  const deleteGoal = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/metas?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao deletar meta")
      }

      await fetchGoals()
    },
    [fetchGoals]
  )

  // Computed values
  const activeGoals = state.goals.filter((g) => g.isActive !== false && g.status === "active")
  const completedGoals = state.goals.filter((g) => g.completed || g.status === "completed")
  const totalProgress =
    state.goals.length > 0
      ? state.goals.reduce((sum, g) => sum + g.progress, 0) / state.goals.length
      : 0

  return {
    ...state,
    activeGoals,
    completedGoals,
    totalProgress,
    fetchGoals,
    createGoal,
    updateGoal,
    updateProgress,
    deleteGoal,
    refetch: fetchGoals,
  }
}
