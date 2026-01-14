"use client"

import { useMemo, useState } from "react"
import { Plus, Wallet, Building2, CreditCard, TrendingUp, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatCurrency } from "@/lib/utils"
import { useStore } from "@/hooks/use-store"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const accountTypeConfig = {
  checking: { label: "Conta Corrente", icon: Wallet, color: "text-blue-500" },
  credit: { label: "Cartão de Crédito", icon: CreditCard, color: "text-red-500" },
  investment: { label: "Investimentos", icon: TrendingUp, color: "text-purple-500" },
}

export default function ContasPage() {
  const { accounts, deleteAccount } = useStore()
  const { toast } = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const accountToDelete = accounts.find(a => a.id === deleteId)

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      if (acc.type === "credit") {
        return sum - acc.balance
      }
      return sum + acc.balance
    }, 0)
  }, [accounts])

  const totalAssets = useMemo(() => {
    return accounts
      .filter((acc) => acc.type !== "credit")
      .reduce((sum, acc) => sum + acc.balance, 0)
  }, [accounts])

  const totalDebts = useMemo(() => {
    return accounts
      .filter((acc) => acc.type === "credit")
      .reduce((sum, acc) => sum + acc.balance, 0)
  }, [accounts])

  const handleConfirmDelete = async () => {
    if (!deleteId) return

    const account = accounts.find(a => a.id === deleteId)
    try {
      await fetch(`/api/contas?id=${deleteId}`, { method: "DELETE" })
      deleteAccount(deleteId)
      toast({
        title: "Conta excluída",
        description: `${account?.name} foi removida com sucesso.`,
      })
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conta.",
        variant: "destructive",
      })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-display">Minhas Contas</h1>
          <p className="text-callout text-secondary mt-1">
            Gerencie suas contas bancárias e cartões
          </p>
        </div>
        <Link href="/configuracoes?tab=accounts">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Nova Conta
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-secondary">
              Patrimônio Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${totalBalance >= 0 ? "text-income" : "text-expense"}`}>
              {formatCurrency(totalBalance)}
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-secondary">
              Total em Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-income">
              {formatCurrency(totalAssets)}
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-secondary">
              Total em Dívidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-expense">
              {formatCurrency(totalDebts)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts by Type */}
      {Object.entries(accountTypeConfig).map(([type, config]) => {
        const typeAccounts = accounts.filter((acc) => acc.type === type)
        if (typeAccounts.length === 0) return null

        const TypeIcon = config.icon
        const typeTotal = typeAccounts.reduce((sum, acc) => sum + acc.balance, 0)

        return (
          <div key={type} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TypeIcon className={`h-5 w-5 ${config.color}`} />
                <h2 className="text-title">{config.label}</h2>
                <span className="text-sm text-secondary">
                  ({typeAccounts.length})
                </span>
              </div>
              <p className={`text-lg font-semibold ${type === "credit" ? "text-expense" : ""}`}>
                {type === "credit" ? "-" : ""}{formatCurrency(typeTotal)}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {typeAccounts.map((account) => {
                const Icon = config.icon
                return (
                  <Card key={account.id} variant="elevated" className="relative group">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${account.color || "#6366f1"}20` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: account.color || "#6366f1" }} />
                          </div>
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <p className="text-sm text-secondary">{config.label}</p>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href="/configuracoes?tab=accounts">
                              <DropdownMenuItem className="gap-2">
                                <Pencil className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              className="gap-2 text-destructive"
                              onClick={() => setDeleteId(account.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-4">
                        <p className={`text-2xl font-semibold ${type === "credit" ? "text-expense" : ""}`}>
                          {type === "credit" ? "-" : ""}{formatCurrency(account.balance)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-12 w-12 text-secondary mb-4" />
          <p className="text-lg font-medium">Nenhuma conta cadastrada</p>
          <p className="text-sm text-secondary mt-1 mb-4">
            Adicione suas contas bancárias e cartões
          </p>
          <Link href="/configuracoes?tab=accounts">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Conta
            </Button>
          </Link>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conta &quot;{accountToDelete?.name}&quot;?
              Esta ação não pode ser desfeita e todas as transações associadas
              serão mantidas sem conta vinculada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
