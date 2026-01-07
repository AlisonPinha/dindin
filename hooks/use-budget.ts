"use client"

import { useState, useCallback, useMemo } from "react"
import { useStore } from "./use-store"

interface BudgetRule {
  essencial: { projetado: number; realizado: number; percentual: number }
  livre: { projetado: number; realizado: number; percentual: number }
  investimento: { projetado: number; realizado: number; percentual: number }
}

interface UseBudgetOptions {
  mesAno?: string // Format: "2024-01"
}

interface BudgetState {
  budget: BudgetRule | null
  receitaTotal: number
  isLoading: boolean
  error: string | null
}

export function useBudget(options: UseBudgetOptions = {}) {
  const { user } = useStore()
  const [state, setState] = useState<BudgetState>({
    budget: null,
    receitaTotal: 0,
    isLoading: false,
    error: null,
  })

  const currentMesAno = useMemo(() => {
    if (options.mesAno) return options.mesAno
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  }, [options.mesAno])

  const fetchBudget = useCallback(async () => {
    if (!user?.id) return

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Get income for the month
      const startOfMonth = new Date(currentMesAno + "-01")
      const endOfMonth = new Date(startOfMonth)
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)
      endOfMonth.setDate(0)

      const transactionsParams = new URLSearchParams({
        userId: user.id,
        tipo: "ENTRADA",
        dataInicio: startOfMonth.toISOString(),
        dataFim: endOfMonth.toISOString(),
      })

      const transactionsResponse = await fetch(
        `/api/transacoes?${transactionsParams}`
      )

      if (!transactionsResponse.ok) {
        throw new Error("Erro ao buscar transações")
      }

      const transactionsData = await transactionsResponse.json()
      const receitaTotal = transactionsData.transactions.reduce(
        (sum: number, t: { valor: number }) => sum + t.valor,
        0
      )

      // Calculate 50-30-20 budget
      const budget: BudgetRule = {
        essencial: {
          projetado: receitaTotal * 0.5,
          realizado: 0, // Would be calculated from expense transactions
          percentual: 50,
        },
        livre: {
          projetado: receitaTotal * 0.3,
          realizado: 0,
          percentual: 30,
        },
        investimento: {
          projetado: receitaTotal * 0.2,
          realizado: 0,
          percentual: 20,
        },
      }

      // Get expenses by category group
      const expensesParams = new URLSearchParams({
        userId: user.id,
        tipo: "SAIDA",
        dataInicio: startOfMonth.toISOString(),
        dataFim: endOfMonth.toISOString(),
      })

      const expensesResponse = await fetch(`/api/transacoes?${expensesParams}`)

      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json()

        // Sum expenses by category group
        expensesData.transactions.forEach(
          (t: { valor: number; category?: { grupo: string } }) => {
            const grupo = t.category?.grupo || "LIVRE"
            if (grupo === "ESSENCIAL") {
              budget.essencial.realizado += t.valor
            } else if (grupo === "INVESTIMENTO") {
              budget.investimento.realizado += t.valor
            } else {
              budget.livre.realizado += t.valor
            }
          }
        )
      }

      setState({
        budget,
        receitaTotal,
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
  }, [user?.id, currentMesAno])

  // Calculate deviations and status
  const analysis = useMemo(() => {
    if (!state.budget) return null

    const { essencial, livre, investimento } = state.budget

    return {
      essencial: {
        ...essencial,
        desvio: essencial.projetado > 0
          ? ((essencial.realizado - essencial.projetado) / essencial.projetado) * 100
          : 0,
        status: essencial.realizado <= essencial.projetado ? "ok" : "exceeded",
      },
      livre: {
        ...livre,
        desvio: livre.projetado > 0
          ? ((livre.realizado - livre.projetado) / livre.projetado) * 100
          : 0,
        status: livre.realizado <= livre.projetado ? "ok" : "exceeded",
      },
      investimento: {
        ...investimento,
        desvio: investimento.projetado > 0
          ? ((investimento.realizado - investimento.projetado) / investimento.projetado) * 100
          : 0,
        status: investimento.realizado >= investimento.projetado ? "ok" : "below",
      },
      total: {
        projetado: essencial.projetado + livre.projetado + investimento.projetado,
        realizado: essencial.realizado + livre.realizado + investimento.realizado,
      },
    }
  }, [state.budget])

  // Overall health score (0-100)
  const healthScore = useMemo(() => {
    if (!analysis) return 0

    let score = 100

    // Penalize exceeding essencial
    if (analysis.essencial.desvio > 0) {
      score -= Math.min(30, analysis.essencial.desvio)
    }

    // Penalize exceeding livre
    if (analysis.livre.desvio > 0) {
      score -= Math.min(20, analysis.livre.desvio)
    }

    // Penalize not meeting investment goal
    if (analysis.investimento.desvio < 0) {
      score -= Math.min(30, Math.abs(analysis.investimento.desvio))
    }

    return Math.max(0, score)
  }, [analysis])

  return {
    ...state,
    mesAno: currentMesAno,
    analysis,
    healthScore,
    fetchBudget,
    refetch: fetchBudget,
  }
}
