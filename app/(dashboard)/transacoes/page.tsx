"use client"

import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  TransactionFiltersComponent,
  TransactionTable,
  TransactionSummary,
  TransactionModal,
} from "@/components/transacoes"
import type { TransactionFilters } from "@/components/transacoes"
import { useToast } from "@/hooks/use-toast"
import { generateId } from "@/lib/utils"
import type { Transaction, TransactionType, Category, Account, User } from "@/types"

// Extended transaction type for installments and attachments
interface TransactionWithExtras extends Transaction {
  installment?: {
    current: number
    total: number
    totalAmount: number
  }
  attachment?: string
}

// Mock categories
const mockCategories: Category[] = [
  { id: "1", name: "Salário", type: "income", color: "#10b981", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "2", name: "Freelance", type: "income", color: "#8b5cf6", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "3", name: "Rendimentos", type: "income", color: "#0ea5e9", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "4", name: "Outros", type: "income", color: "#64748b", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "5", name: "Moradia", type: "expense", color: "#ef4444", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "6", name: "Alimentação", type: "expense", color: "#f97316", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "7", name: "Transporte", type: "expense", color: "#eab308", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "8", name: "Saúde", type: "expense", color: "#ec4899", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "9", name: "Educação", type: "expense", color: "#06b6d4", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "10", name: "Lazer", type: "expense", color: "#a855f7", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "11", name: "Compras", type: "expense", color: "#f43f5e", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "12", name: "Assinaturas", type: "expense", color: "#64748b", userId: "1", createdAt: new Date(), updatedAt: new Date() },
]

// Mock accounts
const mockAccounts: Account[] = [
  { id: "1", name: "Nubank", type: "checking", balance: 8500, color: "#8b5cf6", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "2", name: "Itaú", type: "checking", balance: 12350, color: "#f97316", userId: "2", createdAt: new Date(), updatedAt: new Date() },
  { id: "3", name: "Cartão Nubank", type: "credit", balance: 2850, color: "#f43f5e", userId: "1", createdAt: new Date(), updatedAt: new Date() },
  { id: "4", name: "Poupança", type: "savings", balance: 15000, color: "#10b981", userId: "1", createdAt: new Date(), updatedAt: new Date() },
]

// Mock members
const mockMembers: User[] = [
  { id: "1", name: "Alison", email: "alison@familia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alison", createdAt: new Date(), updatedAt: new Date() },
  { id: "2", name: "Esposa", email: "esposa@familia.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria", createdAt: new Date(), updatedAt: new Date() },
]

// Mock transactions
const mockTransactions: TransactionWithExtras[] = [
  {
    id: "1",
    description: "Salário",
    amount: 8000,
    type: "income",
    date: new Date("2026-01-05"),
    userId: "1",
    categoryId: "1",
    accountId: "1",
    category: mockCategories[0],
    account: mockAccounts[0],
    user: mockMembers[0],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    description: "Aluguel",
    amount: 2500,
    type: "expense",
    date: new Date("2026-01-03"),
    userId: "1",
    categoryId: "5",
    accountId: "1",
    category: mockCategories[4],
    account: mockAccounts[0],
    user: mockMembers[0],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    description: "Supermercado",
    amount: 650,
    type: "expense",
    date: new Date("2026-01-02"),
    userId: "2",
    categoryId: "6",
    accountId: "2",
    category: mockCategories[5],
    account: mockAccounts[1],
    user: mockMembers[1],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    description: "Freelance projeto",
    amount: 2500,
    type: "income",
    date: new Date("2026-01-01"),
    userId: "1",
    categoryId: "2",
    accountId: "1",
    category: mockCategories[1],
    account: mockAccounts[0],
    user: mockMembers[0],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    description: "Netflix + Spotify",
    amount: 85,
    type: "expense",
    date: new Date("2025-12-28"),
    userId: "2",
    categoryId: "12",
    accountId: "3",
    category: mockCategories[11],
    account: mockAccounts[2],
    user: mockMembers[1],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "6",
    description: "iPhone 15",
    amount: 500,
    type: "expense",
    date: new Date("2026-01-06"),
    notes: "Parcela do iPhone 15 Pro Max",
    userId: "1",
    categoryId: "11",
    accountId: "3",
    category: mockCategories[10],
    account: mockAccounts[2],
    user: mockMembers[0],
    installment: { current: 3, total: 12, totalAmount: 6000 },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "7",
    description: "Combustível",
    amount: 280,
    type: "expense",
    date: new Date("2026-01-04"),
    userId: "1",
    categoryId: "7",
    accountId: "1",
    category: mockCategories[6],
    account: mockAccounts[0],
    user: mockMembers[0],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "8",
    description: "Salário Esposa",
    amount: 6000,
    type: "income",
    date: new Date("2026-01-05"),
    userId: "2",
    categoryId: "1",
    accountId: "2",
    category: mockCategories[0],
    account: mockAccounts[1],
    user: mockMembers[1],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "9",
    description: "Conta de Luz",
    amount: 280,
    type: "expense",
    date: new Date("2026-01-08"),
    userId: "2",
    categoryId: "5",
    accountId: "2",
    category: mockCategories[4],
    account: mockAccounts[1],
    user: mockMembers[1],
    attachment: "/attachments/conta-luz.pdf",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "10",
    description: "Academia",
    amount: 150,
    type: "expense",
    date: new Date("2026-01-02"),
    userId: "1",
    categoryId: "8",
    accountId: "1",
    category: mockCategories[7],
    account: mockAccounts[0],
    user: mockMembers[0],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default function TransacoesPage() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<TransactionWithExtras[]>(mockTransactions)
  const [filters, setFilters] = useState<TransactionFilters>({
    type: "all",
    categories: [],
    tags: [],
  })

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithExtras | null>(null)

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Date filter
      if (filters.dateStart && new Date(transaction.date) < filters.dateStart) {
        return false
      }
      if (filters.dateEnd && new Date(transaction.date) > filters.dateEnd) {
        return false
      }

      // Type filter
      if (filters.type !== "all" && transaction.type !== filters.type) {
        return false
      }

      // Category filter
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(transaction.categoryId || "")
      ) {
        return false
      }

      // Account filter
      if (filters.accountId && transaction.accountId !== filters.accountId) {
        return false
      }

      // Member filter
      if (filters.memberId && transaction.userId !== filters.memberId) {
        return false
      }

      return true
    })
  }, [transactions, filters])

  // Calculate totals
  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "income") {
          acc.income += transaction.amount
        } else if (transaction.type === "expense") {
          acc.expense += transaction.amount
        }
        return acc
      },
      { income: 0, expense: 0 }
    )
  }, [filteredTransactions])

  // Open modal for new transaction
  const handleOpenCreateModal = () => {
    setEditingTransaction(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  // Open modal for editing
  const handleOpenEditModal = (transaction: TransactionWithExtras) => {
    setEditingTransaction(transaction)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  // Handle modal submit
  const handleModalSubmit = (
    data: {
      id?: string
      type: TransactionType
      amount: number
      description: string
      date: Date
      categoryId?: string
      accountId?: string
      memberId?: string
      isInstallment: boolean
      installmentCount: number
      isRecurring: boolean
      recurrenceFrequency: "weekly" | "monthly" | "yearly"
      recurrenceEndDate?: Date
      tags: string[]
      notes: string
      attachment?: File | string
    },
    addAnother?: boolean
  ) => {
    const category = mockCategories.find((c) => c.id === data.categoryId)
    const account = mockAccounts.find((a) => a.id === data.accountId)
    const member = mockMembers.find((m) => m.id === data.memberId) || mockMembers[0]

    if (modalMode === "create") {
      const newTransaction: TransactionWithExtras = {
        id: generateId(),
        description: data.description,
        amount: data.amount,
        type: data.type,
        date: data.date,
        categoryId: data.categoryId || null,
        accountId: data.accountId || null,
        category: category || null,
        account: account || null,
        user: member,
        userId: member.id,
        notes: data.notes || undefined,
        installment: data.isInstallment
          ? {
              current: 1,
              total: data.installmentCount,
              totalAmount: data.amount,
            }
          : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setTransactions((prev) => [newTransaction, ...prev])
      toast({
        title: "Transação adicionada",
        description: "A transação foi adicionada com sucesso.",
      })
    } else if (editingTransaction) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingTransaction.id
            ? {
                ...t,
                description: data.description,
                amount: data.amount,
                type: data.type,
                date: data.date,
                categoryId: data.categoryId || null,
                accountId: data.accountId || null,
                category: category || null,
                account: account || null,
                user: member,
                userId: member.id,
                notes: data.notes || undefined,
                updatedAt: new Date(),
              }
            : t
        )
      )
      toast({
        title: "Transação atualizada",
        description: "A transação foi atualizada com sucesso.",
      })
    }

    if (!addAnother) {
      setIsModalOpen(false)
    }
  }

  const handleEditTransaction = (transaction: TransactionWithExtras) => {
    handleOpenEditModal(transaction)
  }

  const handleDuplicateTransaction = (transaction: TransactionWithExtras) => {
    const duplicated: TransactionWithExtras = {
      ...transaction,
      id: generateId(),
      description: `${transaction.description} (cópia)`,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setTransactions((prev) => [duplicated, ...prev])
    toast({
      title: "Transação duplicada",
      description: "A transação foi duplicada com sucesso.",
    })
  }

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    toast({
      title: "Transação excluída",
      description: "A transação foi excluída com sucesso.",
    })
  }

  const handleViewAttachment = (url: string) => {
    toast({
      title: "Visualizar anexo",
      description: `Abrindo: ${url}`,
    })
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-display">Transações</h1>
          <p className="text-callout text-secondary mt-1">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={handleOpenCreateModal}>
          <Plus className="h-5 w-5" />
          Nova Transação
        </Button>
      </div>

      {/* Filters */}
      <TransactionFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        categories={mockCategories}
        accounts={mockAccounts}
        members={mockMembers}
        tags={["urgente", "recorrente", "pessoal", "trabalho"]}
      />

      {/* Results count */}
      <div className="text-sm text-callout text-secondary mt-1">
        {filteredTransactions.length} transação
        {filteredTransactions.length !== 1 ? "ões" : ""} encontrada
        {filteredTransactions.length !== 1 ? "s" : ""}
      </div>

      {/* Table */}
      <TransactionTable
        transactions={filteredTransactions}
        onEdit={handleEditTransaction}
        onDuplicate={handleDuplicateTransaction}
        onDelete={handleDeleteTransaction}
        onViewAttachment={handleViewAttachment}
      />

      {/* Fixed Summary Footer */}
      <TransactionSummary
        totalIncome={totals.income}
        totalExpense={totals.expense}
      />

      {/* Transaction Modal */}
      <TransactionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        initialData={
          editingTransaction
            ? {
                id: editingTransaction.id,
                type: editingTransaction.type,
                amount: editingTransaction.amount,
                description: editingTransaction.description,
                date: new Date(editingTransaction.date),
                categoryId: editingTransaction.categoryId || undefined,
                accountId: editingTransaction.accountId || undefined,
                memberId: editingTransaction.userId,
                isInstallment: !!editingTransaction.installment,
                installmentCount: editingTransaction.installment?.total || 2,
                isRecurring: false,
                recurrenceFrequency: "monthly",
                tags: [],
                notes: editingTransaction.notes || "",
                attachment: editingTransaction.attachment,
              }
            : undefined
        }
        categories={mockCategories}
        accounts={mockAccounts}
        members={mockMembers}
        onSubmit={handleModalSubmit}
      />
    </div>
  )
}
