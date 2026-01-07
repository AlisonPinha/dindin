"use client"

import { ArrowUpRight, ArrowDownLeft, Scale } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"

interface TransactionSummaryProps {
  totalIncome: number
  totalExpense: number
  className?: string
}

export function TransactionSummary({
  totalIncome,
  totalExpense,
  className,
}: TransactionSummaryProps) {
  const balance = totalIncome - totalExpense

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:left-72",
        className
      )}
    >
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">
          {/* Income */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
              <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entradas</p>
              <p className="text-lg font-bold text-emerald-500">
                +{formatCurrency(totalIncome)}
              </p>
            </div>
          </div>

          {/* Expense */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10">
              <ArrowUpRight className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saídas</p>
              <p className="text-lg font-bold text-rose-500">
                -{formatCurrency(totalExpense)}
              </p>
            </div>
          </div>

          {/* Balance */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "hidden sm:flex h-10 w-10 items-center justify-center rounded-full",
                balance >= 0 ? "bg-primary/10" : "bg-rose-500/10"
              )}
            >
              <Scale
                className={cn(
                  "h-5 w-5",
                  balance >= 0 ? "text-primary" : "text-rose-500"
                )}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo do período</p>
              <p
                className={cn(
                  "text-lg font-bold",
                  balance >= 0 ? "text-primary" : "text-rose-500"
                )}
              >
                {balance >= 0 ? "+" : ""}
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
