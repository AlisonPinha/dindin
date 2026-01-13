"use client"

import { useEffect, useState, useCallback } from "react"
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

// Mapeamentos de tipos do banco (snake_case) para o frontend (camelCase)
function mapDbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    name: dbUser.nome,
    email: dbUser.email,
    avatar: dbUser.avatar || undefined,
    isOnboarded: dbUser.is_onboarded,
    monthlyIncome: dbUser.renda_mensal || undefined,
    createdAt: new Date(dbUser.created_at),
    updatedAt: new Date(dbUser.updated_at),
  }
}

function mapDbCategoryToCategory(dbCat: DbCategory): Category {
  const typeMap: Record<string, "income" | "expense"> = {
    RECEITA: "income",
    DESPESA: "expense",
    INVESTIMENTO: "expense",
  }
  return {
    id: dbCat.id,
    name: dbCat.nome,
    type: typeMap[dbCat.tipo] || "expense",
    color: dbCat.cor,
    icon: dbCat.icone || undefined,
    userId: "",
    createdAt: new Date(dbCat.created_at),
    updatedAt: new Date(dbCat.updated_at),
  }
}

function mapDbAccountToAccount(dbAcc: DbAccount): Account {
  const typeMap: Record<string, "checking" | "savings" | "credit" | "investment"> = {
    CORRENTE: "checking",
    POUPANCA: "savings",
    CARTAO_CREDITO: "credit",
    INVESTIMENTO: "investment",
  }
  // API retorna saldoAtual calculado, mas se não existir, usar saldo
  const balance = (dbAcc as any).saldoAtual ?? dbAcc.saldo ?? 0
  return {
    id: dbAcc.id,
    name: dbAcc.nome,
    type: typeMap[dbAcc.tipo] || "checking",
    balance: Number(balance) || 0,
    color: dbAcc.cor || "#6366f1",
    bank: dbAcc.banco || undefined,
    userId: dbAcc.user_id,
    createdAt: new Date(dbAcc.created_at),
    updatedAt: new Date(dbAcc.updated_at),
  }
}

function mapDbTransactionToTransaction(
  dbTx: DbTransaction,
  categories: Category[],
  accounts: Account[],
  users: User[]
): Transaction {
  const typeMap: Record<string, "income" | "expense" | "transfer"> = {
    ENTRADA: "income",
    SAIDA: "expense",
    TRANSFERENCIA: "transfer",
    INVESTIMENTO: "expense",
  }

  const category = categories.find((c) => c.id === dbTx.category_id) || null
  const account = accounts.find((a) => a.id === dbTx.account_id) || null
  const user = users.find((u) => u.id === dbTx.user_id) || null

  return {
    id: dbTx.id,
    description: dbTx.descricao,
    amount: dbTx.valor,
    type: typeMap[dbTx.tipo] || "expense",
    date: new Date(dbTx.data),
    userId: dbTx.user_id,
    categoryId: dbTx.category_id,
    accountId: dbTx.account_id,
    category,
    account,
    user,
    notes: dbTx.notas || undefined,
    ownership: dbTx.ownership === "PESSOAL" ? "personal" : "household",
    createdAt: new Date(dbTx.created_at),
    updatedAt: new Date(dbTx.updated_at),
  }
}

function mapDbInvestmentToInvestment(dbInv: DbInvestment): Investment {
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

function mapDbGoalToGoal(dbGoal: DbGoal): Goal {
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
      console.error("Erro ao carregar dados:", err)
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
