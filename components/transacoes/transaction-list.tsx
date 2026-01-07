"use client"

import { MoreHorizontal, Pencil, Trash2, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Transaction } from "@/types"

interface TransactionListProps {
  transactions: Transaction[]
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
}

export function TransactionList({
  transactions,
  onEdit,
  onDelete,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          Nenhuma transação encontrada
        </p>
        <p className="text-sm text-muted-foreground">
          Adicione sua primeira transação para começar
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                transaction.type === "income"
                  ? "bg-green-500/10 text-green-500"
                  : transaction.type === "expense"
                  ? "bg-red-500/10 text-red-500"
                  : "bg-blue-500/10 text-blue-500"
              }`}
            >
              {transaction.type === "income" ? (
                <ArrowDownLeft className="h-5 w-5" />
              ) : (
                <ArrowUpRight className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="font-medium">{transaction.description}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {transaction.category && (
                  <>
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: transaction.category.color }}
                    />
                    <span>{transaction.category.name}</span>
                    <span>•</span>
                  </>
                )}
                <span>{formatDate(transaction.date)}</span>
                {transaction.account && (
                  <>
                    <span>•</span>
                    <span>{transaction.account.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`text-lg font-semibold ${
                transaction.type === "income"
                  ? "text-green-500"
                  : transaction.type === "expense"
                  ? "text-red-500"
                  : "text-blue-500"
              }`}
            >
              {transaction.type === "income" ? "+" : "-"}
              {formatCurrency(transaction.amount)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Ações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(transaction)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete?.(transaction.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  )
}
