import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Transaction, Account, Category, Investment, Goal } from "@/types"

type ViewMode = "consolidated" | "individual"

interface Notification {
  id: string
  title: string
  message: string
  type: "warning" | "info" | "success"
}

interface AppState {
  // Users & View
  user: User | null
  familyMembers: User[]
  viewMode: ViewMode
  selectedPeriod: { month: number; year: number }

  // Data
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  investments: Investment[]
  goals: Goal[]
  isLoading: boolean
  isSidebarOpen: boolean
  isAddTransactionOpen: boolean
  addTransactionType: "expense" | "income" | "transfer"
  notifications: Notification[]

  // User actions
  setUser: (user: User | null) => void
  setFamilyMembers: (members: User[]) => void
  setViewMode: (mode: ViewMode) => void
  setSelectedPeriod: (period: { month: number; year: number }) => void
  setSidebarOpen: (open: boolean) => void
  setAddTransactionOpen: (open: boolean) => void
  setAddTransactionType: (type: "expense" | "income" | "transfer") => void
  openAddTransaction: (type: "expense" | "income" | "transfer") => void
  addNotification: (notification: Omit<Notification, "id">) => void
  removeNotification: (id: string) => void

  // Transaction actions
  setTransactions: (transactions: Transaction[]) => void
  addTransaction: (transaction: Transaction) => void
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void

  // Account actions
  setAccounts: (accounts: Account[]) => void
  addAccount: (account: Account) => void
  updateAccount: (id: string, account: Partial<Account>) => void
  deleteAccount: (id: string) => void

  // Category actions
  setCategories: (categories: Category[]) => void
  addCategory: (category: Category) => void
  updateCategory: (id: string, category: Partial<Category>) => void
  deleteCategory: (id: string) => void

  // Investment actions
  setInvestments: (investments: Investment[]) => void
  addInvestment: (investment: Investment) => void
  updateInvestment: (id: string, investment: Partial<Investment>) => void
  deleteInvestment: (id: string) => void

  // Goal actions
  setGoals: (goals: Goal[]) => void
  addGoal: (goal: Goal) => void
  updateGoal: (id: string, goal: Partial<Goal>) => void
  deleteGoal: (id: string) => void

  // Loading
  setIsLoading: (isLoading: boolean) => void
}

const currentDate = new Date()

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      familyMembers: [],
      viewMode: "consolidated",
      selectedPeriod: { month: currentDate.getMonth(), year: currentDate.getFullYear() },
      transactions: [],
      accounts: [],
      categories: [],
      investments: [],
      goals: [],
      isLoading: false,
      isSidebarOpen: false,
      isAddTransactionOpen: false,
      addTransactionType: "expense",
      notifications: [],

      // User actions
      setUser: (user) => set({ user }),
      setFamilyMembers: (familyMembers) => set({ familyMembers }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSelectedPeriod: (selectedPeriod) => set({ selectedPeriod }),
      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      setAddTransactionOpen: (isAddTransactionOpen) => set({ isAddTransactionOpen }),
      setAddTransactionType: (addTransactionType) => set({ addTransactionType }),
      openAddTransaction: (type) => set({ addTransactionType: type, isAddTransactionOpen: true }),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id: crypto.randomUUID() },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      // Transaction actions
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (transaction) =>
        set((state) => ({ transactions: [transaction, ...state.transactions] })),
      updateTransaction: (id, transaction) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...transaction } : t
          ),
        })),
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      // Account actions
      setAccounts: (accounts) => set({ accounts }),
      addAccount: (account) =>
        set((state) => ({ accounts: [...state.accounts, account] })),
      updateAccount: (id, account) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, ...account } : a
          ),
        })),
      deleteAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        })),

      // Category actions
      setCategories: (categories) => set({ categories }),
      addCategory: (category) =>
        set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (id, category) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...category } : c
          ),
        })),
      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      // Investment actions
      setInvestments: (investments) => set({ investments }),
      addInvestment: (investment) =>
        set((state) => ({ investments: [...state.investments, investment] })),
      updateInvestment: (id, investment) =>
        set((state) => ({
          investments: state.investments.map((i) =>
            i.id === id ? { ...i, ...investment } : i
          ),
        })),
      deleteInvestment: (id) =>
        set((state) => ({
          investments: state.investments.filter((i) => i.id !== id),
        })),

      // Goal actions
      setGoals: (goals) => set({ goals }),
      addGoal: (goal) =>
        set((state) => ({ goals: [...state.goals, goal] })),
      updateGoal: (id, goal) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...goal } : g
          ),
        })),
      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      // Loading
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "financeiro-familia-storage",
      partialize: (state) => ({
        user: state.user,
        familyMembers: state.familyMembers,
        viewMode: state.viewMode,
        selectedPeriod: state.selectedPeriod,
        transactions: state.transactions,
        accounts: state.accounts,
        categories: state.categories,
        investments: state.investments,
        goals: state.goals,
      }),
    }
  )
)
