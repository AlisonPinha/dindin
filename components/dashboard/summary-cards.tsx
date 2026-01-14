"use client"

import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Percent } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, cn } from "@/lib/utils"

interface SummaryCardData {
  title: string
  value: number
  previousValue: number
  icon: React.ElementType
  type: "balance" | "income" | "expense" | "investment" | "savings_rate"
  isPercentage?: boolean
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
  savingsRate?: number
  previousSavingsRate?: number
}

function calculateVariation(current: number, previous: number): number {
  // Handle invalid inputs
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return 0
  // Handle division by zero
  if (previous === 0) return current === 0 ? 0 : (current > 0 ? 100 : -100)
  const result = ((current - previous) / previous) * 100
  // Handle potential NaN/Infinity results
  return Number.isFinite(result) ? result : 0
}

function SummaryCard({ data }: { data: SummaryCardData }) {
  // Garantir que os valores sejam números válidos
  const value = Number.isFinite(data.value) ? data.value : 0
  const previousValue = Number.isFinite(data.previousValue) ? data.previousValue : 0

  const variation = data.isPercentage
    ? value - previousValue // Para percentuais, mostra diferença em pontos percentuais
    : calculateVariation(value, previousValue)
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
      case "savings_rate":
        // Cor baseada no valor da taxa de poupança
        if (value >= 20) {
          return {
            iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            valueColor: "text-emerald-600 dark:text-emerald-400",
          }
        } else if (value >= 10) {
          return {
            iconBg: "bg-amber-100 dark:bg-amber-950/50",
            iconColor: "text-amber-600 dark:text-amber-400",
            valueColor: "text-amber-600 dark:text-amber-400",
          }
        } else {
          return {
            iconBg: "bg-rose-100 dark:bg-rose-950/50",
            iconColor: "text-rose-500 dark:text-rose-400",
            valueColor: "text-rose-500 dark:text-rose-400",
          }
        }
    }
  }

  const colors = getColorClasses()

  // For expenses, positive variation means spending more (bad)
  // For savings_rate, positive is always good
  const isVariationGood = data.type === "expense" ? !isPositive : isPositive

  // Formatar valor
  const displayValue = data.isPercentage
    ? `${value.toFixed(1)}%`
    : formatCurrency(value)

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{data.title}</p>
            <p className={cn("text-2xl font-bold", colors.valueColor)}>
              {displayValue}
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
                {variation.toFixed(1)}{data.isPercentage ? "pp" : "%"}
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
  savingsRate,
  previousSavingsRate,
}: SummaryCardsProps) {
  // Calcular taxa de poupança se não fornecida
  const currentSavingsRate = savingsRate ?? (totalIncome > 0
    ? ((totalIncome - totalExpenses) / totalIncome) * 100
    : 0)
  const prevSavingsRate = previousSavingsRate ?? (previousIncome > 0
    ? ((previousIncome - previousExpenses) / previousIncome) * 100
    : 0)

  // Garantir que todos os valores sejam números válidos
  const cards: SummaryCardData[] = [
    {
      title: "Saldo Total",
      value: Number.isFinite(totalBalance) ? totalBalance : 0,
      previousValue: Number.isFinite(previousBalance) ? previousBalance : 0,
      icon: Wallet,
      type: "balance",
    },
    {
      title: "Receitas do Mês",
      value: Number.isFinite(totalIncome) ? totalIncome : 0,
      previousValue: Number.isFinite(previousIncome) ? previousIncome : 0,
      icon: TrendingUp,
      type: "income",
    },
    {
      title: "Despesas do Mês",
      value: Number.isFinite(totalExpenses) ? totalExpenses : 0,
      previousValue: Number.isFinite(previousExpenses) ? previousExpenses : 0,
      icon: TrendingDown,
      type: "expense",
    },
    {
      title: "Taxa de Poupança",
      value: Number.isFinite(currentSavingsRate) ? currentSavingsRate : 0,
      previousValue: Number.isFinite(prevSavingsRate) ? prevSavingsRate : 0,
      icon: Percent,
      type: "savings_rate",
      isPercentage: true,
    },
    {
      title: "Investido no Mês",
      value: Number.isFinite(totalInvested) ? totalInvested : 0,
      previousValue: Number.isFinite(previousInvested) ? previousInvested : 0,
      icon: PiggyBank,
      type: "investment",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <SummaryCard key={card.title} data={card} />
      ))}
    </div>
  )
}
