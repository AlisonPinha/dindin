"use client"

import { useState, useCallback } from "react"
import { useStore } from "./use-store"
import type { Investment } from "@/types"

interface InvestmentTotals {
  totalInvested: number
  totalValue: number
  profitability: number
  profit: number
}

interface UseInvestmentsOptions {
  type?: string
}

interface InvestmentsState {
  investments: Investment[]
  totals: InvestmentTotals
  isLoading: boolean
  error: string | null
}

export function useInvestments(options: UseInvestmentsOptions = {}) {
  const { user } = useStore()
  const [state, setState] = useState<InvestmentsState>({
    investments: [],
    totals: {
      totalInvested: 0,
      totalValue: 0,
      profitability: 0,
      profit: 0,
    },
    isLoading: false,
    error: null,
  })

  const fetchInvestments = useCallback(async () => {
    if (!user?.id) return

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const params = new URLSearchParams({ userId: user.id })

      if (options.type) params.set("tipo", options.type)

      const response = await fetch(`/api/investimentos?${params}`)

      if (!response.ok) {
        throw new Error("Erro ao buscar investimentos")
      }

      const data = await response.json()

      setState({
        investments: data.investments,
        totals: data.totals,
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

  const createInvestment = useCallback(
    async (data: Partial<Investment>) => {
      if (!user?.id) throw new Error("Usuário não autenticado")

      const response = await fetch("/api/investimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: user.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar investimento")
      }

      const investment = await response.json()
      await fetchInvestments()
      return investment
    },
    [user?.id, fetchInvestments]
  )

  const updateInvestment = useCallback(
    async (id: string, data: Partial<Investment>) => {
      const response = await fetch("/api/investimentos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar investimento")
      }

      const investment = await response.json()
      await fetchInvestments()
      return investment
    },
    [fetchInvestments]
  )

  const deleteInvestment = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/investimentos?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao deletar investimento")
      }

      await fetchInvestments()
    },
    [fetchInvestments]
  )

  // Group investments by type
  const investmentsByType = state.investments.reduce(
    (acc, inv) => {
      if (!acc[inv.type]) {
        acc[inv.type] = []
      }
      acc[inv.type].push(inv)
      return acc
    },
    {} as Record<string, Investment[]>
  )

  // Calculate allocation percentages
  const allocation = Object.entries(investmentsByType).map(([type, investments]) => {
    const total = investments.reduce((sum, inv) => sum + inv.currentPrice, 0)
    return {
      type,
      value: total,
      percentage: state.totals.totalValue > 0
        ? (total / state.totals.totalValue) * 100
        : 0,
    }
  })

  return {
    ...state,
    investmentsByType,
    allocation,
    fetchInvestments,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    refetch: fetchInvestments,
  }
}
