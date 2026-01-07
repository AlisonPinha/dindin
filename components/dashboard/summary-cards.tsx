"use client"

import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, cn } from "@/lib/utils"

interface SummaryCardData {
  title: string
  value: number
  previousValue: number
  icon: React.ElementType
  type: "balance" | "income" | "expense" | "investment"
}

interface SummaryCardsProps {
  totalBalance: number
  previousBalance: number
  totalIncome: number
  previousIncome: number
  totalExpenses: number
  previousExpenses: number
  totalInvested: number
  previousInvested: number
}

function calculateVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

function SummaryCard({ data }: { data: SummaryCardData }) {
  const variation = calculateVariation(data.value, data.previousValue)
  const isPositive = variation >= 0

  const getColorClasses = () => {
    switch (data.type) {
      case "balance":
        return {
          iconBg: "bg-primary/10",
          iconColor: "text-primary",
          valueColor: "text-foreground",
        }
      case "income":
        return {
          iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
          iconColor: "text-emerald-600 dark:text-emerald-400",
          valueColor: "text-emerald-600 dark:text-emerald-400",
        }
      case "expense":
        return {
          iconBg: "bg-rose-100 dark:bg-rose-950/50",
          iconColor: "text-rose-500 dark:text-rose-400",
          valueColor: "text-rose-500 dark:text-rose-400",
        }
      case "investment":
        return {
          iconBg: "bg-blue-100 dark:bg-blue-950/50",
          iconColor: "text-blue-600 dark:text-blue-400",
          valueColor: "text-blue-600 dark:text-blue-400",
        }
    }
  }

  const colors = getColorClasses()

  // For expenses, positive variation means spending more (bad)
  const isVariationGood = data.type === "expense" ? !isPositive : isPositive

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{data.title}</p>
            <p className={cn("text-2xl font-bold", colors.valueColor)}>
              {formatCurrency(data.value)}
            </p>
            <div className="flex items-center gap-1">
              {isVariationGood ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-rose-500" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  isVariationGood ? "text-emerald-500" : "text-rose-500"
                )}
              >
                {isPositive ? "+" : ""}
                {variation.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs mês anterior</span>
            </div>
          </div>
          <div className={cn("rounded-xl p-3", colors.iconBg)}>
            <data.icon className={cn("h-6 w-6", colors.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SummaryCards({
  totalBalance,
  previousBalance,
  totalIncome,
  previousIncome,
  totalExpenses,
  previousExpenses,
  totalInvested,
  previousInvested,
}: SummaryCardsProps) {
  const cards: SummaryCardData[] = [
    {
      title: "Saldo Total",
      value: totalBalance,
      previousValue: previousBalance,
      icon: Wallet,
      type: "balance",
    },
    {
      title: "Receitas do Mês",
      value: totalIncome,
      previousValue: previousIncome,
      icon: TrendingUp,
      type: "income",
    },
    {
      title: "Despesas do Mês",
      value: totalExpenses,
      previousValue: previousExpenses,
      icon: TrendingDown,
      type: "expense",
    },
    {
      title: "Investido no Mês",
      value: totalInvested,
      previousValue: previousInvested,
      icon: PiggyBank,
      type: "investment",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard key={card.title} data={card} />
      ))}
    </div>
  )
}
