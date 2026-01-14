"use client"

import useSWR from "swr"
import { useEffect, useCallback, useState } from "react"
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

// Fast fetcher with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Erro ao carregar ${url}`)
  return res.json()
}

// SWR configuration for optimal performance
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  focusThrottleInterval: 10000,
  errorRetryCount: 3,
  keepPreviousData: true,
}

export function useSWRData() {
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
  } = useStore()

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
      } catch {
        setIsAuthenticated(false)
      }
    }
    checkAuth()

    const supabase = getSupabaseBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  const shouldFetch = isAuthenticated === true

  // Parallel data fetching with SWR
  const { data: usersData, error: usersError, isLoading: usersLoading, mutate: mutateUsers } =
    useSWR<DbUser[]>(shouldFetch ? "/api/usuarios" : null, fetcher, swrConfig)

  const { data: categoriesData, error: categoriesError, isLoading: categoriesLoading, mutate: mutateCategories } =
    useSWR<DbCategory[]>(shouldFetch ? "/api/categorias" : null, fetcher, swrConfig)

  const { data: accountsRaw, error: accountsError, isLoading: accountsLoading, mutate: mutateAccounts } =
    useSWR(shouldFetch ? "/api/contas" : null, fetcher, swrConfig)

  const { data: transactionsRaw, error: transactionsError, isLoading: transactionsLoading, mutate: mutateTransactions } =
    useSWR(shouldFetch ? "/api/transacoes" : null, fetcher, swrConfig)

  const { data: investmentsRaw, error: investmentsError, isLoading: investmentsLoading, mutate: mutateInvestments } =
    useSWR(shouldFetch ? "/api/investimentos" : null, fetcher, swrConfig)

  const { data: goalsData, error: goalsError, isLoading: goalsLoading, mutate: mutateGoals } =
    useSWR<DbGoal[]>(shouldFetch ? "/api/metas" : null, fetcher, swrConfig)

  const isLoading = isAuthenticated === null ||
                    (shouldFetch && (usersLoading || categoriesLoading || accountsLoading ||
                    transactionsLoading || investmentsLoading || goalsLoading))

  const error = shouldFetch ? (usersError || categoriesError || accountsError ||
                transactionsError || investmentsError || goalsError) : null

  // Process and sync data to store
  useEffect(() => {
    if (isAuthenticated === null) {
      setIsLoading(true)
      return
    }

    if (!isAuthenticated) {
      setIsLoading(false)
      setIsDataLoaded(true)
      return
    }

    if (isLoading) {
      setIsLoading(true)
      return
    }

    if (error) {
      setIsLoading(false)
      return
    }

    const accountsData: DbAccount[] = accountsRaw?.accounts || accountsRaw || []
    const transactionsData: DbTransaction[] = transactionsRaw?.transactions || transactionsRaw || []
    const investmentsData: DbInvestment[] = investmentsRaw?.investments || investmentsRaw || []

    const users = (usersData || []).map(mapDbUserToUser)
    const categories = (categoriesData || []).map(mapDbCategoryToCategory)
    const accounts = accountsData.map(mapDbAccountToAccount)
    const transactions = transactionsData.map((tx) =>
      mapDbTransactionToTransaction(tx, categories, accounts, users)
    )
    const investments = investmentsData.map(mapDbInvestmentToInvestment)
    const goals = (goalsData || []).map(mapDbGoalToGoal)

    setFamilyMembers(users)
    setCategories(categories)
    setAccounts(accounts)
    setTransactions(transactions)
    setInvestments(investments)
    setGoals(goals)

    // Set current user based on auth state
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser()
      .then(({ data: { user: authUser } }) => {
        if (authUser) {
          const currentUser = users.find((u) => u.id === authUser.id)
          if (currentUser) {
            setUser(currentUser)
          } else {
            setUser({
              id: authUser.id,
              name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Usuário",
              email: authUser.email || "",
              avatar: authUser.user_metadata?.avatar_url,
              isOnboarded: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          }
        } else if (users[0]) {
          setUser(users[0])
        }

        setIsDataLoaded(true)
        setIsLoading(false)
      })
      .catch(() => {
        // Error getting user - still mark as loaded
        setIsDataLoaded(true)
        setIsLoading(false)
      })
  }, [
    usersData, categoriesData, accountsRaw, transactionsRaw, investmentsRaw, goalsData,
    isLoading, error, isAuthenticated,
    setUser, setFamilyMembers, setTransactions, setAccounts, setCategories,
    setInvestments, setGoals, setIsLoading, setIsDataLoaded
  ])

  const reload = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([
      mutateUsers(),
      mutateCategories(),
      mutateAccounts(),
      mutateTransactions(),
      mutateInvestments(),
      mutateGoals(),
    ])
  }, [mutateUsers, mutateCategories, mutateAccounts, mutateTransactions, mutateInvestments, mutateGoals, setIsLoading])

  const mutators = {
    users: mutateUsers,
    categories: mutateCategories,
    accounts: mutateAccounts,
    transactions: mutateTransactions,
    investments: mutateInvestments,
    goals: mutateGoals,
  }

  return {
    isLoaded: isDataLoaded && !isLoading,
    isLoading,
    isAuthenticated,
    error: error?.message || null,
    reload,
    mutators,
  }
}
