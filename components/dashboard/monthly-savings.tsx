"use client"

import {
  Sparkles,
  TrendingUp,
  PiggyBank,
  PartyPopper,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, cn } from "@/lib/utils"

interface CategorySaving {
  categoryId: string
  categoryName: string
  categoryColor: string
  budgetAmount: number
  spentAmount: number
  savedAmount: number
}

interface MonthlySavingsProps {
  categorySavings: CategorySaving[]
  totalBudget: number
  totalSpent: number
  className?: string
}

export function MonthlySavings({
  categorySavings,
  totalBudget,
  totalSpent,
  className,
}: MonthlySavingsProps) {
  const totalSaved = totalBudget - totalSpent
  const isOverBudget = totalSaved < 0

  // Sort categories by savings amount (descending)
  const sortedSavings = [...categorySavings]
    .filter((c) => c.savedAmount !== 0)
    .sort((a, b) => b.savedAmount - a.savedAmount)

  // Get top saver
  const topSaver = sortedSavings.find((c) => c.savedAmount > 0)

  // Get categories that went over budget
  const overBudgetCategories = sortedSavings.filter((c) => c.savedAmount < 0)

  // Categories with positive savings
  const positiveSavings = sortedSavings.filter((c) => c.savedAmount > 0)

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-lg">Economia do Mês</CardTitle>
          </div>
          <span
            className={cn(
              "text-lg font-bold",
              isOverBudget ? "text-rose-500" : "text-emerald-500"
            )}
          >
            {isOverBudget ? "-" : "+"} {formatCurrency(Math.abs(totalSaved))}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Highlight message */}
        {topSaver && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <PartyPopper className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Parabéns!
                </p>
                <p className="text-sm text-muted-foreground">
                  Vocês economizaram{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(topSaver.savedAmount)}
                  </span>{" "}
                  em{" "}
                  <span className="font-semibold" style={{ color: topSaver.categoryColor }}>
                    {topSaver.categoryName}
                  </span>{" "}
                  este mês!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Savings by category */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            Economia por categoria
          </p>

          {positiveSavings.length > 0 && (
            <div className="space-y-3">
              {positiveSavings.map((category) => {
                const savingsPercent = (category.savedAmount / category.budgetAmount) * 100
                const spentPercent = (category.spentAmount / category.budgetAmount) * 100

                return (
                  <div key={category.categoryId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.categoryColor }}
                        />
                        <span className="font-medium">{category.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {formatCurrency(category.spentAmount)} / {formatCurrency(category.budgetAmount)}
                        </span>
                        <span className="font-semibold text-emerald-500">
                          +{formatCurrency(category.savedAmount)}
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(spentPercent, 100)}%`,
                          backgroundColor: category.categoryColor,
                        }}
                      />
                      {/* Savings indicator */}
                      <div
                        className="absolute h-full bg-emerald-500/30 rounded-r-full"
                        style={{
                          left: `${spentPercent}%`,
                          width: `${savingsPercent}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Over budget categories */}
          {overBudgetCategories.length > 0 && (
            <div className="pt-4 border-t space-y-3">
              <p className="text-sm font-medium text-rose-500 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Acima do orçamento
              </p>
              {overBudgetCategories.map((category) => {
                const overPercent = Math.abs(
                  (category.savedAmount / category.budgetAmount) * 100
                )

                return (
                  <div key={category.categoryId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.categoryColor }}
                        />
                        <span className="font-medium">{category.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {formatCurrency(category.spentAmount)} / {formatCurrency(category.budgetAmount)}
                        </span>
                        <span className="font-semibold text-rose-500">
                          {formatCurrency(category.savedAmount)}
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-rose-500 rounded-full"
                        style={{ width: "100%" }}
                      />
                      {/* Overflow indicator */}
                      <div
                        className="absolute h-full bg-rose-600"
                        style={{
                          left: "100%",
                          width: `${Math.min(overPercent, 50)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-rose-500">
                      {overPercent.toFixed(0)}% acima do orçamento
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Orçamento</p>
            <p className="text-lg font-semibold">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Gasto</p>
            <p className="text-lg font-semibold">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Economia</p>
            <p
              className={cn(
                "text-lg font-semibold",
                isOverBudget ? "text-rose-500" : "text-emerald-500"
              )}
            >
              {isOverBudget ? "" : "+"}{formatCurrency(totalSaved)}
            </p>
          </div>
        </div>

        {/* Tip */}
        {totalSaved > 0 && (
          <div className="p-3 rounded-lg bg-emerald-500/10 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <p className="text-emerald-600 dark:text-emerald-400">
                Que tal investir os {formatCurrency(totalSaved)} economizados?
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
