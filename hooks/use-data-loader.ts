"use client"

import { useEffect, useState, useCallback } from "react"
import { useStore } from "./use-store"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import {
  mapDbUserToUser,
  mapDbCategoryToCategory,
  mapDbAccountToAccount,
  mapDbTransactionToTransaction,
  mapDbInvestmentToInvestment,
  mapDbGoalToGoal,
} from "@/lib/mappers"
import type {
  DbUser,
  DbCategory,
  DbAccount,
  DbTransaction,
  DbInvestment,
  DbGoal,
} from "@/lib/supabase"

export function useDataLoader() {
  const {
    setUser,
    setFamilyMembers,
    setTransactions,
    setAccounts,
    setCategories,
    setInvestments,
    setGoals,
    setIsLoading,
    setIsDataLoaded,
    isDataLoaded,
    user,
  } = useStore()

  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (force = false) => {
    if (isDataLoaded && !force) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      const [usersRes, categoriesRes, accountsRes, transactionsRes, investmentsRes, goalsRes] =
        await Promise.all([
          fetch("/api/usuarios"),
          fetch("/api/categorias"),
          fetch("/api/contas"),
          fetch("/api/transacoes"),
          fetch("/api/investimentos"),
          fetch("/api/metas"),
        ])

      if (!usersRes.ok) throw new Error("Erro ao carregar usuários")
      if (!categoriesRes.ok) throw new Error("Erro ao carregar categorias")
      if (!accountsRes.ok) throw new Error("Erro ao carregar contas")
      if (!transactionsRes.ok) throw new Error("Erro ao carregar transações")
      if (!investmentsRes.ok) throw new Error("Erro ao carregar investimentos")
      if (!goalsRes.ok) throw new Error("Erro ao carregar metas")

      const dbUsers: DbUser[] = await usersRes.json()
      const dbCategories: DbCategory[] = await categoriesRes.json()
      const accountsData = await accountsRes.json()
      const dbAccounts: DbAccount[] = accountsData.accounts || accountsData
      const transactionsData = await transactionsRes.json()
      const dbTransactions: DbTransaction[] = transactionsData.transactions || transactionsData
      const investmentsData = await investmentsRes.json()
      const dbInvestments: DbInvestment[] = investmentsData.investments || investmentsData
      const dbGoals: DbGoal[] = await goalsRes.json()

      const users = dbUsers.map(mapDbUserToUser)
      const categories = dbCategories.map(mapDbCategoryToCategory)
      const accounts = dbAccounts.map(mapDbAccountToAccount)
      const transactions = dbTransactions.map((tx) =>
        mapDbTransactionToTransaction(tx, categories, accounts, users)
      )
      const investments = dbInvestments.map(mapDbInvestmentToInvestment)
      const goals = dbGoals.map(mapDbGoalToGoal)

      setFamilyMembers(users)

      if (authUser) {
        const currentUser = users.find((u) => u.id === authUser.id)
        if (currentUser) {
          setUser(currentUser)
        } else if (users[0]) {
          setUser(users[0])
        }
      } else if (!user && users[0]) {
        setUser(users[0])
      }

      setCategories(categories)
      setAccounts(accounts)
      setTransactions(transactions)
      setInvestments(investments)
      setGoals(goals)

      setIsDataLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }, [setUser, setFamilyMembers, setTransactions, setAccounts, setCategories, setInvestments, setGoals, setIsLoading, setIsDataLoaded, isDataLoaded, user])

  useEffect(() => {
    if (!isDataLoaded) {
      loadData()
    }
  }, [isDataLoaded, loadData])

  return {
    isLoaded: isDataLoaded,
    error,
    reload: () => loadData(true),
  }
}
