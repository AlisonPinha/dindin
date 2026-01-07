"use client"

import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Receipt,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, cn } from "@/lib/utils"

interface CategoryExpense {
  categoryId: string
  categoryName: string
  categoryColor: string
  currentAmount: number
  previousAmount: number
  percentage: number
}

interface TopExpensesProps {
  expenses: CategoryExpense[]
  totalExpenses: number
  className?: string
}

export function TopExpenses({
  expenses,
  totalExpenses,
  className,
}: TopExpensesProps) {
  // Sort by current amount and take top 5
  const topExpenses = [...expenses]
    .sort((a, b) => b.currentAmount - a.currentAmount)
    .slice(0, 5)

  // Calculate max for proportion bars
  const maxExpense = topExpenses.length > 0 ? topExpenses[0].currentAmount : 0

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-rose-500" />
            <CardTitle className="text-lg">Top Gastos do Mês</CardTitle>
          </div>
          <span className="text-sm text-muted-foreground">
            Total: {formatCurrency(totalExpenses)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {topExpenses.map((expense, index) => {
          const changePercent =
            expense.previousAmount > 0
              ? ((expense.currentAmount - expense.previousAmount) /
                  expense.previousAmount) *
                100
              : 0
          const isIncrease = changePercent > 0
          const isDecrease = changePercent < 0
          const barWidth = (expense.currentAmount / maxExpense) * 100

          return (
            <div key={expense.categoryId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Position badge */}
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0
                        ? "bg-rose-500 text-white"
                        : index === 1
                        ? "bg-rose-400 text-white"
                        : index === 2
                        ? "bg-rose-300 text-rose-900"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </div>

                  {/* Category */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: expense.categoryColor }}
                    />
                    <span className="font-medium">{expense.categoryName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Change indicator */}
                  {expense.previousAmount > 0 && (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        isIncrease
                          ? "text-rose-500"
                          : isDecrease
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                      )}
                    >
                      {isIncrease ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : isDecrease ? (
                        <ArrowDownRight className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      {Math.abs(changePercent).toFixed(0)}%
                    </div>
                  )}

                  {/* Amount */}
                  <span className="font-semibold min-w-[100px] text-right">
                    {formatCurrency(expense.currentAmount)}
                  </span>
                </div>
              </div>

              {/* Proportion bar */}
              <div className="relative">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: expense.categoryColor,
                      opacity: 1 - index * 0.15,
                    }}
                  />
                </div>
                {/* Percentage label */}
                <span className="absolute right-0 top-3 text-xs text-muted-foreground">
                  {expense.percentage.toFixed(1)}% do total
                </span>
              </div>
            </div>
          )
        })}

        {/* Other expenses summary */}
        {expenses.length > 5 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Outras {expenses.length - 5} categorias</span>
              <span>
                {formatCurrency(
                  expenses
                    .slice(5)
                    .reduce((sum, e) => sum + e.currentAmount, 0)
                )}
              </span>
            </div>
          </div>
        )}

        {/* Insights */}
        {topExpenses.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Insights</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              {/* Top category insight */}
              <p>
                <span className="font-medium" style={{ color: topExpenses[0].categoryColor }}>
                  {topExpenses[0].categoryName}
                </span>{" "}
                representa{" "}
                <span className="font-medium text-foreground">
                  {topExpenses[0].percentage.toFixed(0)}%
                </span>{" "}
                dos seus gastos
              </p>

              {/* Biggest increase */}
              {(() => {
                const biggestIncrease = [...topExpenses]
                  .filter((e) => e.previousAmount > 0)
                  .sort((a, b) => {
                    const aChange = (a.currentAmount - a.previousAmount) / a.previousAmount
                    const bChange = (b.currentAmount - b.previousAmount) / b.previousAmount
                    return bChange - aChange
                  })[0]

                if (biggestIncrease) {
                  const change =
                    ((biggestIncrease.currentAmount - biggestIncrease.previousAmount) /
                      biggestIncrease.previousAmount) *
                    100

                  if (change > 10) {
                    return (
                      <p className="text-rose-500">
                        <span
                          className="font-medium"
                          style={{ color: biggestIncrease.categoryColor }}
                        >
                          {biggestIncrease.categoryName}
                        </span>{" "}
                        aumentou{" "}
                        <span className="font-medium">{change.toFixed(0)}%</span> vs mês
                        anterior
                      </p>
                    )
                  }
                }
                return null
              })()}

              {/* Biggest decrease */}
              {(() => {
                const biggestDecrease = [...topExpenses]
                  .filter((e) => e.previousAmount > 0)
                  .sort((a, b) => {
                    const aChange = (a.currentAmount - a.previousAmount) / a.previousAmount
                    const bChange = (b.currentAmount - b.previousAmount) / b.previousAmount
                    return aChange - bChange
                  })[0]

                if (biggestDecrease) {
                  const change =
                    ((biggestDecrease.currentAmount - biggestDecrease.previousAmount) /
                      biggestDecrease.previousAmount) *
                    100

                  if (change < -10) {
                    return (
                      <p className="text-emerald-500">
                        <span
                          className="font-medium"
                          style={{ color: biggestDecrease.categoryColor }}
                        >
                          {biggestDecrease.categoryName}
                        </span>{" "}
                        reduziu{" "}
                        <span className="font-medium">{Math.abs(change).toFixed(0)}%</span> vs
                        mês anterior
                      </p>
                    )
                  }
                }
                return null
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
