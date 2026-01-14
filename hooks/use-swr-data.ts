"use client"

import useSWR from "swr"
import { useEffect, useCallback, useState } from "react"
import { useStore } from "./use-store"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Transaction, Category, Account, User, Investment, Goal } from "@/types"
import type {
  DbUser,
  DbCategory,
  DbAccount,
  DbTransaction,
  DbInvestment,
  DbGoal,
} from "@/lib/supabase"

// Fast fetcher with AbortController for cleanup
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Erro ao carregar ${url}`)
  return res.json()
}

// Mappers (same as before but optimized)
const mapDbUserToUser = (dbUser: DbUser): User => ({
  id: dbUser.id,
  name: dbUser.nome,
  email: dbUser.email,
  avatar: dbUser.avatar || undefined,
  isOnboarded: dbUser.is_onboarded,
  monthlyIncome: dbUser.renda_mensal || undefined,
  createdAt: new Date(dbUser.created_at),
  updatedAt: new Date(dbUser.updated_at),
})

const mapDbCategoryToCategory = (dbCat: DbCategory): Category => {
  const typeMap: Record<string, "income" | "expense"> = {
    RECEITA: "income",
    DESPESA: "expense",
    INVESTIMENTO: "expense",
  }
  const budgetGroupMap: Record<string, "essentials" | "lifestyle" | "investments"> = {
    ESSENCIAL: "essentials",
    LIVRE: "lifestyle",
    INVESTIMENTO: "investments",
  }
  return {
    id: dbCat.id,
    name: dbCat.nome,
    type: typeMap[dbCat.tipo] || "expense",
    color: dbCat.cor,
    icon: dbCat.icone || undefined,
    budgetGroup: budgetGroupMap[dbCat.grupo] || undefined,
    monthlyBudget: dbCat.orcamento_mensal || undefined,
    userId: "",
    createdAt: new Date(dbCat.created_at),
    updatedAt: new Date(dbCat.updated_at),
  }
}

const mapDbAccountToAccount = (dbAcc: DbAccount | any): Account => {
  const typeMap: Record<string, "checking" | "credit" | "investment"> = {
    CORRENTE: "checking",
    CARTAO_CREDITO: "credit",
    INVESTIMENTO: "investment",
  }
  // API retorna saldoAtual calculado, mas se não existir, usar saldo
  // Tratar tanto saldoAtual (calculado) quanto saldo (do banco)
  const balance = (dbAcc as any).saldoAtual ?? dbAcc.saldo ?? 0
  const numBalance = typeof balance === "string" ? parseFloat(balance) : Number(balance)
  const finalBalance = Number.isFinite(numBalance) ? numBalance : 0
  
  return {
    id: dbAcc.id,
    name: dbAcc.nome,
    type: typeMap[dbAcc.tipo] || "checking",
    balance: finalBalance,
    color: dbAcc.cor || "#6366f1",
    bank: dbAcc.banco || undefined,
    userId: dbAcc.user_id,
    createdAt: new Date(dbAcc.created_at),
    updatedAt: new Date(dbAcc.updated_at),
  }
}

const mapDbTransactionToTransaction = (
  dbTx: DbTransaction,
  categories: Category[],
  accounts: Account[],
  users: User[]
): Transaction => {
  const typeMap: Record<string, "income" | "expense" | "transfer"> = {
    ENTRADA: "income",
    SAIDA: "expense",
    TRANSFERENCIA: "transfer",
    INVESTIMENTO: "expense",
  }

  return {
    id: dbTx.id,
    description: dbTx.descricao,
    amount: dbTx.valor,
    type: typeMap[dbTx.tipo] || "expense",
    date: new Date(dbTx.data),
    mesFatura: dbTx.mes_fatura ? new Date(dbTx.mes_fatura) : undefined,
    userId: dbTx.user_id,
    categoryId: dbTx.category_id,
    accountId: dbTx.account_id,
    category: categories.find((c) => c.id === dbTx.category_id) || null,
    account: accounts.find((a) => a.id === dbTx.account_id) || null,
    user: users.find((u) => u.id === dbTx.user_id) || null,
    notes: dbTx.notas || undefined,
    ownership: dbTx.ownership === "PESSOAL" ? "personal" : "household",
    isRecurring: dbTx.recorrente,
    installments: dbTx.parcelas || undefined,
    currentInstallment: dbTx.parcela_atual || undefined,
    parentTransactionId: dbTx.transacao_pai_id || undefined,
    tags: dbTx.tags || undefined,
    createdAt: new Date(dbTx.created_at),
    updatedAt: new Date(dbTx.updated_at),
  }
}

const mapDbInvestmentToInvestment = (dbInv: DbInvestment): Investment => {
  const typeMap: Record<string, "stocks" | "bonds" | "crypto" | "real_estate" | "funds" | "other"> = {
    RENDA_FIXA: "bonds",
    RENDA_VARIAVEL: "stocks",
    CRIPTO: "crypto",
    FUNDO: "funds",
  }
  return {
    id: dbInv.id,
    name: dbInv.nome,
    type: typeMap[dbInv.tipo] || "bonds",
    institution: dbInv.instituicao || "",
    purchasePrice: dbInv.preco_compra,
    currentPrice: dbInv.preco_atual,
    profitability: dbInv.rentabilidade || 0,
    purchaseDate: new Date(dbInv.data_compra),
    maturityDate: dbInv.data_vencimento ? new Date(dbInv.data_vencimento) : undefined,
    userId: dbInv.user_id,
    createdAt: new Date(dbInv.created_at),
    updatedAt: new Date(dbInv.updated_at),
  }
}

const mapDbGoalToGoal = (dbGoal: DbGoal): Goal => {
  const typeMap: Record<string, "savings" | "investment" | "patrimony" | "budget"> = {
    ECONOMIA_CATEGORIA: "savings",
    INVESTIMENTO_MENSAL: "investment",
    PATRIMONIO: "patrimony",
    REGRA_PERCENTUAL: "budget",
  }
  return {
    id: dbGoal.id,
    name: dbGoal.nome,
    description: "",
    type: typeMap[dbGoal.tipo] || "savings",
    targetAmount: dbGoal.valor_alvo,
    currentAmount: dbGoal.valor_atual || 0,
    deadline: dbGoal.prazo ? new Date(dbGoal.prazo) : undefined,
    status: dbGoal.ativo ? "active" : "completed",
    userId: dbGoal.user_id,
    createdAt: new Date(dbGoal.created_at),
    updatedAt: new Date(dbGoal.updated_at),
  }
}

// SWR configuration for optimal performance
const swrConfig = {
  revalidateOnFocus: false, // Don't refetch when window regains focus
  revalidateOnReconnect: true, // Refetch when reconnecting
  dedupingInterval: 5000, // Dedupe requests within 5 seconds
  focusThrottleInterval: 10000, // Throttle focus revalidation
  errorRetryCount: 3, // Retry failed requests 3 times
  keepPreviousData: true, // Keep showing old data while fetching new
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

  // Track authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()

    // Listen for auth state changes
    const supabase = getSupabaseBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Conditional fetching - only fetch when authenticated
  // SWR skips the request when key is null
  const shouldFetch = isAuthenticated === true

  // Parallel data fetching with SWR (conditional)
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

  // Combined loading state (include auth check)
  const isLoading = isAuthenticated === null || // Still checking auth
                    (shouldFetch && (usersLoading || categoriesLoading || accountsLoading ||
                    transactionsLoading || investmentsLoading || goalsLoading))

  // Combined error state
  const error = shouldFetch ? (usersError || categoriesError || accountsError ||
                transactionsError || investmentsError || goalsError) : null

  // Process and sync data to store when ready
  useEffect(() => {
    // Still checking auth
    if (isAuthenticated === null) {
      setIsLoading(true)
      return
    }

    // Not authenticated - don't fetch, just mark as loaded
    if (!isAuthenticated) {
      setIsLoading(false)
      setIsDataLoaded(true)
      return
    }

    // Still loading data
    if (isLoading) {
      setIsLoading(true)
      return
    }

    // Error occurred
    if (error) {
      setIsLoading(false)
      return
    }

    // Process data
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

    // Update store
    setFamilyMembers(users)
    setCategories(categories)
    setAccounts(accounts)
    setTransactions(transactions)
    setInvestments(investments)
    setGoals(goals)

    // Set current user based on auth state
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        const currentUser = users.find((u) => u.id === authUser.id)
        if (currentUser) {
          setUser(currentUser)
        } else {
          // User is authenticated but not in our users table yet
          // Create a temporary user object from auth data
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
        // No auth user but we have users in db (dev mode)
        setUser(users[0])
      }
      // If no users and no auth, user stays null - middleware will redirect to login

      setIsDataLoaded(true)
      setIsLoading(false)
    })
  }, [
    usersData, categoriesData, accountsRaw, transactionsRaw, investmentsRaw, goalsData,
    isLoading, error, isAuthenticated,
    setUser, setFamilyMembers, setTransactions, setAccounts, setCategories,
    setInvestments, setGoals, setIsLoading, setIsDataLoaded
  ])

  // Reload all data
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

  // Individual mutators for optimistic updates
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
