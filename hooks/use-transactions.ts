"use client"

import { useState, useCallback } from "react"
import { useStore } from "./use-store"
import type { Transaction } from "@/types"

interface UseTransactionsOptions {
  categoryId?: string
  accountId?: string
  tipo?: string
  dataInicio?: Date
  dataFim?: Date
  limit?: number
}

interface TransactionsState {
  transactions: Transaction[]
  total: number
  isLoading: boolean
  error: string | null
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { user } = useStore()
  const [state, setState] = useState<TransactionsState>({
    transactions: [],
    total: 0,
    isLoading: false,
    error: null,
  })

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const params = new URLSearchParams({ userId: user.id })

      if (options.categoryId) params.set("categoryId", options.categoryId)
      if (options.accountId) params.set("accountId", options.accountId)
      if (options.tipo) params.set("tipo", options.tipo)
      if (options.dataInicio)
        params.set("dataInicio", options.dataInicio.toISOString())
      if (options.dataFim) params.set("dataFim", options.dataFim.toISOString())
      if (options.limit) params.set("limit", options.limit.toString())

      const response = await fetch(`/api/transacoes?${params}`)

      if (!response.ok) {
        throw new Error("Erro ao buscar transações")
      }

      const data = await response.json()

      setState({
        transactions: data.transactions,
        total: data.total,
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

  const createTransaction = useCallback(
    async (data: Partial<Transaction>) => {
      if (!user?.id) throw new Error("Usuário não autenticado")

      const response = await fetch("/api/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: user.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar transação")
      }

      const transaction = await response.json()
      await fetchTransactions()
      return transaction
    },
    [user?.id, fetchTransactions]
  )

  const updateTransaction = useCallback(
    async (id: string, data: Partial<Transaction>) => {
      const response = await fetch("/api/transacoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar transação")
      }

      const transaction = await response.json()
      await fetchTransactions()
      return transaction
    },
    [fetchTransactions]
  )

  const deleteTransaction = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/transacoes?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao deletar transação")
      }

      await fetchTransactions()
    },
    [fetchTransactions]
  )

  return {
    ...state,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  }
}
