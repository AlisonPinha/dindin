"use client"

import { useState, useMemo, useCallback } from "react"
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
import { useStore } from "@/hooks/use-store"
import { useSWRData } from "@/hooks/use-swr-data"
import { getTransacoesDoMes } from "@/lib/calculations"
import type { Transaction, TransactionType } from "@/types"

// Extended transaction type for installments and attachments
interface TransactionWithExtras extends Transaction {
  installment?: {
    current: number
    total: number
    totalAmount: number
  }
  attachment?: string
}

// Helper to map UI type to DB type
function mapTransactionType(type: TransactionType): "ENTRADA" | "SAIDA" | "TRANSFERENCIA" {
  switch (type) {
    case "income":
      return "ENTRADA"
    case "expense":
      return "SAIDA"
    case "transfer":
      return "TRANSFERENCIA"
    default:
      return "SAIDA"
  }
}

export default function TransacoesPage() {
  const { toast } = useToast()
  const {
    transactions: storeTransactions,
    categories,
    accounts,
    familyMembers,
    user,
    selectedPeriod,
    addTransaction,
    updateTransaction,
    deleteTransaction: deleteTransactionStore,
  } = useStore()

  // SWR para recarregar dados após mudanças
  const { mutators } = useSWRData()

  // State for loading during API calls
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [filters, setFilters] = useState<TransactionFilters>({
    type: "all",
    categories: [],
    ownership: "all",
    tags: [],
  })

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithExtras | null>(null)

  // Use centralized function for period filtering, then apply additional UI filters
  const filteredTransactions = useMemo(() => {
    // First: filter by selected period using centralized function
    const periodFiltered = getTransacoesDoMes(
      storeTransactions,
      selectedPeriod.month,
      selectedPeriod.year
    )

    // Second: apply additional UI filters
    return periodFiltered.filter((transaction) => {
      const transactionDate = new Date(transaction.date)

      // Additional date filters (if user specified custom range)
      if (filters.dateStart && transactionDate < filters.dateStart) {
        return false
      }
      if (filters.dateEnd && transactionDate > filters.dateEnd) {
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

      // Ownership filter
      if (filters.ownership && filters.ownership !== "all" && transaction.ownership !== filters.ownership) {
        return false
      }

      return true
    }).map((transaction) => {
      // Add installment display info for UI
      if (transaction.calculatedInstallment && transaction.installments) {
        return {
          ...transaction,
          installment: {
            current: transaction.calculatedInstallment,
            total: transaction.installments,
            totalAmount: transaction.amount * transaction.installments,
          },
        } as TransactionWithExtras
      }
      return transaction as TransactionWithExtras
    })
  }, [storeTransactions, filters, selectedPeriod])

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

  // Handle modal submit - SINCRONIZA COM API
  const handleModalSubmit = useCallback(async (
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
    setIsSubmitting(true)
    const category = categories.find((c) => c.id === data.categoryId)
    const account = accounts.find((a) => a.id === data.accountId)
    const member = familyMembers.find((m) => m.id === data.memberId) || user

    try {
      if (modalMode === "create") {
        // Chamar API para criar transação
        const response = await fetch("/api/transacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            descricao: data.description,
            valor: data.amount,
            tipo: mapTransactionType(data.type),
            data: data.date.toISOString(),
            categoryId: data.categoryId || null,
            accountId: data.accountId || null,
            notas: data.notes || null,
            tags: data.tags || [],
            recorrente: data.isRecurring,
            parcelas: data.isInstallment ? data.installmentCount : null,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Erro ao criar transação")
        }

        const created = await response.json()

        // Atualizar store local com dados da API
        const newTransaction: TransactionWithExtras = {
          id: created.id,
          description: created.descricao,
          amount: created.valor,
          type: data.type,
          date: new Date(created.data),
          categoryId: created.category_id,
          accountId: created.account_id,
          category: category || null,
          account: account || null,
          user: member || null,
          userId: created.user_id,
          notes: created.notas || undefined,
          ownership: created.ownership === "PESSOAL" ? "personal" : "household",
          createdAt: new Date(created.created_at),
          updatedAt: new Date(created.updated_at),
        }

        addTransaction(newTransaction)

        toast({
          title: "Transação adicionada",
          description: "A transação foi salva com sucesso.",
        })
      } else if (editingTransaction) {
        // Chamar API para atualizar transação
        const response = await fetch("/api/transacoes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingTransaction.id,
            descricao: data.description,
            valor: data.amount,
            tipo: mapTransactionType(data.type),
            data: data.date.toISOString(),
            categoryId: data.categoryId || null,
            accountId: data.accountId || null,
            notas: data.notes || null,
            tags: data.tags || [],
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Erro ao atualizar transação")
        }

        const updated = await response.json()

        updateTransaction(editingTransaction.id, {
          description: updated.descricao,
          amount: updated.valor,
          type: data.type,
          date: new Date(updated.data),
          categoryId: updated.category_id,
          accountId: updated.account_id,
          category: category || null,
          account: account || null,
          user: member || null,
          userId: updated.user_id,
          notes: updated.notas || undefined,
          updatedAt: new Date(updated.updated_at),
        })

        toast({
          title: "Transação atualizada",
          description: "A transação foi atualizada com sucesso.",
        })
      }

      // Recarregar dados via SWR
      mutators.transactions()
      mutators.accounts() // Saldo das contas pode ter mudado

      if (!addAnother) {
        setIsModalOpen(false)
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar transação",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [modalMode, editingTransaction, categories, accounts, familyMembers, user, addTransaction, updateTransaction, mutators, toast])

  const handleEditTransaction = (transaction: TransactionWithExtras) => {
    handleOpenEditModal(transaction)
  }

  const handleDuplicateTransaction = useCallback(async (transaction: TransactionWithExtras) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: `${transaction.description} (cópia)`,
          valor: transaction.amount,
          tipo: mapTransactionType(transaction.type),
          data: new Date().toISOString(),
          categoryId: transaction.categoryId || null,
          accountId: transaction.accountId || null,
          notas: transaction.notes || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao duplicar transação")
      }

      const created = await response.json()

      const duplicated: TransactionWithExtras = {
        ...transaction,
        id: created.id,
        description: created.descricao,
        date: new Date(created.data),
        createdAt: new Date(created.created_at),
        updatedAt: new Date(created.updated_at),
      }

      addTransaction(duplicated)
      mutators.transactions()

      toast({
        title: "Transação duplicada",
        description: "A transação foi duplicada com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao duplicar transação",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [addTransaction, mutators, toast])

  const handleDeleteTransaction = useCallback(async (id: string) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/transacoes?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir transação")
      }

      deleteTransactionStore(id)
      mutators.transactions()
      mutators.accounts() // Saldo das contas pode ter mudado

      toast({
        title: "Transação excluída",
        description: "A transação foi excluída com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir transação",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [deleteTransactionStore, mutators, toast])

  const handleViewAttachment = (url: string) => {
    window.open(url, "_blank")
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
        <Button size="lg" className="gap-2" onClick={handleOpenCreateModal} disabled={isSubmitting}>
          <Plus className="h-5 w-5" />
          Nova Transação
        </Button>
      </div>

      {/* Filters */}
      <TransactionFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        accounts={accounts}
        members={familyMembers}
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
        categories={categories}
        accounts={accounts}
        members={familyMembers}
        onSubmit={handleModalSubmit}
      />
    </div>
  )
}
