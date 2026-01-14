"use client"

import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Scale, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, cn } from "@/lib/utils"

interface SummaryCardData {
  title: string
  value: number
  previousValue: number
  icon: React.ElementType
  type: "balance" | "income" | "expense" | "investment" | "monthly_balance"
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

interface VariationResult {
  value: number | null // null significa "sem comparação"
  label: string
  isNew: boolean // true quando é novo (anterior era 0)
}

function calculateVariation(current: number, previous: number): VariationResult {
  // Handle invalid inputs
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    return { value: null, label: "—", isNew: false }
  }

  // Ambos são zero - sem variação
  if (current === 0 && previous === 0) {
    return { value: 0, label: "0%", isNew: false }
  }

  // Anterior era zero - é um valor novo
  if (previous === 0) {
    return { value: null, label: "Novo", isNew: true }
  }

  const result = ((current - previous) / previous) * 100

  // Handle potential NaN/Infinity results
  if (!Number.isFinite(result)) {
    return { value: null, label: "—", isNew: false }
  }

  const prefix = result >= 0 ? "+" : ""
  return { value: result, label: `${prefix}${result.toFixed(1)}%`, isNew: false }
}

function SummaryCard({ data }: { data: SummaryCardData }) {
  // Garantir que os valores sejam números válidos
  const value = Number.isFinite(data.value) ? data.value : 0
  const previousValue = Number.isFinite(data.previousValue) ? data.previousValue : 0

  const variation = calculateVariation(Math.abs(value), Math.abs(previousValue))
  const isPositive = variation.value !== null && variation.value >= 0

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
      case "monthly_balance":
        // Cor baseada no valor do balanço (positivo = verde, negativo = vermelho)
        if (value >= 0) {
          return {
            iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            valueColor: "text-emerald-600 dark:text-emerald-400",
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
  // For monthly_balance, positive value is good, negative is bad
  // Se não tem variação numérica (null), consideramos neutro
  const isVariationGood = variation.value === null
    ? null
    : data.type === "expense"
      ? !isPositive
      : isPositive

  // Formatar valor
  const displayValue = formatCurrency(Math.abs(value))
  // Prefixo para balanço do mês
  const valuePrefix = data.type === "monthly_balance" ? (value >= 0 ? "+" : "-") : ""

  // Determinar ícone e cor da variação
  const getVariationIcon = () => {
    if (variation.value === null) {
      return <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
    }
    if (isVariationGood) {
      return <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
    }
    return <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-rose-500" />
  }

  const getVariationColor = () => {
    if (variation.value === null) return "text-muted-foreground"
    return isVariationGood ? "text-emerald-500" : "text-rose-500"
  }

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        {/* Mobile: layout horizontal | Desktop: layout vertical */}
        <div className="flex items-center justify-between sm:items-start">
          {/* Mobile: ícone à esquerda | Desktop: ícone à direita */}
          <div className={cn("rounded-xl p-2 sm:p-3 sm:hidden", colors.iconBg)}>
            <data.icon className={cn("h-5 w-5", colors.iconColor)} />
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0 ml-3 sm:ml-0 sm:space-y-2">
            {/* Mobile: título e variação na mesma linha */}
            <div className="flex items-center justify-between sm:block">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                {data.title}
              </p>
              {/* Variação - visível apenas no mobile inline */}
              <div className="flex items-center gap-1 sm:hidden">
                {getVariationIcon()}
                <span className={cn("text-xs font-medium", getVariationColor())}>
                  {variation.label}
                </span>
              </div>
            </div>

            {/* Valor */}
            <p className={cn(
              "text-lg sm:text-2xl font-bold truncate",
              colors.valueColor
            )}>
              {valuePrefix}{displayValue}
            </p>

            {/* Desktop: linha de variação completa */}
            <div className="hidden sm:flex items-center gap-1">
              {getVariationIcon()}
              <span className={cn("text-xs font-medium", getVariationColor())}>
                {variation.label}
              </span>
              <span className="text-xs text-muted-foreground">vs mês anterior</span>
            </div>
          </div>

          {/* Desktop: ícone à direita */}
          <div className={cn("rounded-xl p-3 hidden sm:block", colors.iconBg)}>
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
  // Calcular balanço do mês (receitas - despesas)
  const currentMonthlyBalance = totalIncome - totalExpenses
  const previousMonthlyBalance = previousIncome - previousExpenses

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
      title: "Balanço do Mês",
      value: Number.isFinite(currentMonthlyBalance) ? currentMonthlyBalance : 0,
      previousValue: Number.isFinite(previousMonthlyBalance) ? previousMonthlyBalance : 0,
      icon: Scale,
      type: "monthly_balance",
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
