"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  MoreHorizontal,
  Repeat,
  Tag,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SwipeableRow } from "./swipeable-row"

type TransactionType = "RECEITA" | "DESPESA" | "INVESTIMENTO"

interface TransactionCardProps {
  id: string
  description: string
  value: number
  type: TransactionType
  category?: string
  categoryIcon?: React.ReactNode
  categoryColor?: string
  date: Date | string
  account?: string
  isRecurring?: boolean
  installment?: {
    current: number
    total: number
  }
  tags?: string[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onMore?: (id: string) => void
  className?: string
  enableSwipe?: boolean
}

export function TransactionCard({
  id,
  description,
  value,
  type,
  category,
  categoryIcon,
  categoryColor,
  date,
  account,
  isRecurring,
  installment,
  tags,
  onEdit,
  onDelete,
  onMore,
  className,
  enableSwipe = true,
}: TransactionCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Math.abs(val))
  }

  const formatDate = (d: Date | string) => {
    const dateObj = typeof d === "string" ? new Date(d) : d
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(dateObj)
  }

  const getTypeColor = () => {
    switch (type) {
      case "RECEITA":
        return "text-income"
      case "DESPESA":
        return "text-expense"
      case "INVESTIMENTO":
        return "text-investment"
      default:
        return "text-foreground"
    }
  }

  const getTypeIndicator = () => {
    switch (type) {
      case "RECEITA":
        return "bg-income"
      case "DESPESA":
        return "bg-expense"
      case "INVESTIMENTO":
        return "bg-investment"
      default:
        return "bg-muted"
    }
  }

  const cardContent = (
    <div
      className={cn(
        "relative rounded-xl border bg-card p-4",
        "transition-all duration-200",
        "active:scale-[0.99]",
        className
      )}
    >
      {/* Type indicator bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
          getTypeIndicator()
        )}
      />

      {/* Main content */}
      <div className="flex items-start gap-3 pl-2">
        {/* Category icon */}
        {categoryIcon && (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
            style={{
              backgroundColor: categoryColor
                ? `${categoryColor}20`
                : "hsl(var(--muted))",
              color: categoryColor || "hsl(var(--muted-foreground))",
            }}
          >
            {categoryIcon}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium truncate">{description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{formatDate(date)}</span>
                {category && (
                  <>
                    <span>•</span>
                    <span className="truncate">{category}</span>
                  </>
                )}
              </div>
            </div>

            {/* Value and actions */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn("font-semibold tabular-nums", getTypeColor())}>
                {type === "DESPESA" ? "-" : "+"}
                {formatCurrency(value)}
              </span>

              {/* More actions dropdown */}
              {(onEdit || onDelete || onMore) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Mais opções</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(id)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {onMore && (
                      <DropdownMenuItem onClick={() => onMore(id)}>
                        <MoreHorizontal className="h-4 w-4 mr-2" />
                        Ver detalhes
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Badges */}
          {(isRecurring || installment) && (
            <div className="flex items-center gap-2 mt-2">
              {isRecurring && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <Repeat className="h-3 w-3" />
                  Recorrente
                </span>
              )}
              {installment && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {installment.current}/{installment.total}
                </span>
              )}
            </div>
          )}

          {/* Expandable details */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t space-y-2 text-sm">
              {account && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Conta</span>
                  <span>{account}</span>
                </div>
              )}
              {tags && tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-muted px-2 py-0.5 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expand toggle */}
      {(account || (tags && tags.length > 0)) && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute bottom-1 left-1/2 -translate-x-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  )

  if (enableSwipe && (onEdit || onDelete)) {
    return (
      <SwipeableRow
        rightActions={[
          ...(onEdit
            ? [
                {
                  icon: Edit2 as LucideIcon,
                  label: "Editar",
                  onClick: () => onEdit(id),
                  variant: "default" as const,
                },
              ]
            : []),
          ...(onDelete
            ? [
                {
                  icon: Trash2 as LucideIcon,
                  label: "Excluir",
                  onClick: () => onDelete(id),
                  variant: "danger" as const,
                },
              ]
            : []),
        ]}
      >
        {cardContent}
      </SwipeableRow>
    )
  }

  return cardContent
}

// List wrapper with empty state
interface TransactionCardListProps {
  transactions: Array<TransactionCardProps>
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onMore?: (id: string) => void
  emptyMessage?: string
  className?: string
  enableSwipe?: boolean
}

export function TransactionCardList({
  transactions,
  onEdit,
  onDelete,
  onMore,
  emptyMessage = "Nenhuma transação encontrada",
  className,
  enableSwipe = true,
}: TransactionCardListProps) {
  // Group transactions by date - must be before early return
  const groupedTransactions = React.useMemo(() => {
    if (transactions.length === 0) return []

    const groups: Record<string, TransactionCardProps[]> = {}

    transactions.forEach((transaction) => {
      const dateKey =
        typeof transaction.date === "string"
          ? transaction.date.split("T")[0]
          : transaction.date.toISOString().split("T")[0]

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(transaction)
    })

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [transactions])

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  const formatGroupDate = (dateKey: string) => {
    const date = new Date(dateKey + "T12:00:00")
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Hoje"
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem"
    }

    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {groupedTransactions.map(([dateKey, dayTransactions]) => (
        <div key={dateKey}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 capitalize">
            {formatGroupDate(dateKey)}
          </h3>
          <div className="space-y-2">
            {dayTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                {...transaction}
                onEdit={onEdit}
                onDelete={onDelete}
                onMore={onMore}
                enableSwipe={enableSwipe}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
