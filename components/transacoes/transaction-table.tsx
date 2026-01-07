"use client"

import { useState } from "react"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Paperclip,
} from "lucide-react"
import { getCategoryIcon } from "@/lib/category-icons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import type { Transaction } from "@/types"

interface TransactionWithExtras extends Transaction {
  installment?: {
    current: number
    total: number
    totalAmount: number
  }
  attachment?: string
}

interface TransactionTableProps {
  transactions: TransactionWithExtras[]
  onEdit?: (transaction: TransactionWithExtras) => void
  onDuplicate?: (transaction: TransactionWithExtras) => void
  onDelete?: (id: string) => void
  onViewAttachment?: (url: string) => void
}

type SortField = "date" | "description" | "category" | "amount" | "account" | "user"
type SortDirection = "asc" | "desc"

export function TransactionTable({
  transactions,
  onEdit,
  onDuplicate,
  onDelete,
  onViewAttachment,
}: TransactionTableProps) {
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
        break
      case "description":
        comparison = a.description.localeCompare(b.description)
        break
      case "category":
        comparison = (a.category?.name || "").localeCompare(b.category?.name || "")
        break
      case "amount":
        comparison = a.amount - b.amount
        break
      case "account":
        comparison = (a.account?.name || "").localeCompare(b.account?.name || "")
        break
      case "user":
        comparison = (a.user?.name || "").localeCompare(b.user?.name || "")
        break
    }

    return sortDirection === "asc" ? comparison : -comparison
  })

  const SortableHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField
    children: React.ReactNode
    className?: string
  }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-transparent gap-1"
        onClick={() => handleSort(field)}
      >
        {children}
        {sortField === field ? (
          sortDirection === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </Button>
    </TableHead>
  )

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete?.(deleteId)
      setDeleteId(null)
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
        <p className="text-lg font-medium text-muted-foreground">
          Nenhuma transação encontrada
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Tente ajustar os filtros ou adicione uma nova transação
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <caption className="sr-only">
            Lista de transações financeiras com {transactions.length} registro{transactions.length !== 1 ? 's' : ''}.
            Clique nos cabeçalhos para ordenar.
          </caption>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <SortableHeader field="date" className="w-[100px]">
                Data
              </SortableHeader>
              <SortableHeader field="description">Descrição</SortableHeader>
              <SortableHeader field="category" className="w-[150px]">
                Categoria
              </SortableHeader>
              <SortableHeader field="amount" className="w-[130px] text-right">
                Valor
              </SortableHeader>
              <SortableHeader field="account" className="w-[130px]">
                Conta
              </SortableHeader>
              <SortableHeader field="user" className="w-[100px]">
                Membro
              </SortableHeader>
              <TableHead className="w-[80px]">Parcela</TableHead>
              <TableHead className="w-[60px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                className="group hover:bg-muted/30"
              >
                {/* Date */}
                <TableCell className="font-medium text-sm">
                  {formatDate(transaction.date)}
                </TableCell>

                {/* Description */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{transaction.description}</span>
                    {transaction.attachment && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onViewAttachment?.(transaction.attachment!)}
                          >
                            <Paperclip className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver anexo</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {transaction.notes && (
                    <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                      {transaction.notes}
                    </p>
                  )}
                </TableCell>

                {/* Category */}
                <TableCell>
                  {transaction.category ? (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const CategoryIcon = getCategoryIcon(transaction.category.name)
                        return (
                          <div
                            className="flex items-center justify-center h-6 w-6 rounded shrink-0"
                            style={{ backgroundColor: `${transaction.category.color}20` }}
                          >
                            <CategoryIcon
                              className="h-3.5 w-3.5"
                              style={{ color: transaction.category.color }}
                              aria-hidden="true"
                            />
                          </div>
                        )
                      })()}
                      <span className="text-sm truncate">
                        {transaction.category.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* Amount */}
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "font-semibold",
                      transaction.type === "income"
                        ? "text-emerald-500"
                        : transaction.type === "expense"
                        ? "text-rose-500"
                        : "text-blue-500"
                    )}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </span>
                </TableCell>

                {/* Account */}
                <TableCell>
                  {transaction.account ? (
                    <span className="text-sm">{transaction.account.name}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* Member */}
                <TableCell>
                  {transaction.user ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-7 w-7 cursor-pointer">
                          <AvatarImage
                            src={transaction.user.avatar || ""}
                            alt={transaction.user.name}
                          />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {transaction.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>{transaction.user.name}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* Installment */}
                <TableCell>
                  {transaction.installment ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="cursor-help">
                          {transaction.installment.current}/{transaction.installment.total}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs space-y-1">
                          <p>
                            Parcela {transaction.installment.current} de{" "}
                            {transaction.installment.total}
                          </p>
                          <p className="text-muted-foreground">
                            Total: {formatCurrency(transaction.installment.totalAmount)}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-50 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        aria-label={`Ações para ${transaction.description}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Ações para {transaction.description}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(transaction)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate?.(transaction)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      {transaction.attachment && (
                        <DropdownMenuItem
                          onClick={() => onViewAttachment?.(transaction.attachment!)}
                        >
                          <Paperclip className="mr-2 h-4 w-4" />
                          Ver anexo
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(transaction.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode
              ser desfeita.
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
    </TooltipProvider>
  )
}
