"use client"

import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCurrency, cn } from "@/lib/utils"

interface MonthComparison {
  month: string
  projected: number
  actual: number
}

interface EndOfMonthProjectionProps {
  currentDayOfMonth: number
  totalDaysInMonth: number
  totalIncome: number
  currentExpenses: number
  averageDailyExpense: number
  previousMonths: MonthComparison[]
  className?: string
}

export function EndOfMonthProjection({
  currentDayOfMonth,
  totalDaysInMonth,
  totalIncome,
  currentExpenses,
  averageDailyExpense,
  previousMonths,
  className,
}: EndOfMonthProjectionProps) {
  // Calculate projections
  const remainingDays = totalDaysInMonth - currentDayOfMonth
  const projectedAdditionalExpenses = averageDailyExpense * remainingDays
  const projectedTotalExpenses = currentExpenses + projectedAdditionalExpenses
  const projectedBalance = totalIncome - projectedTotalExpenses

  // Calculate progress through month
  const monthProgress = (currentDayOfMonth / totalDaysInMonth) * 100
  const expenseProgress = (currentExpenses / totalIncome) * 100

  // Determine status
  const isTight = projectedBalance > 0 && projectedBalance < totalIncome * 0.1
  const isNegative = projectedBalance < 0

  // Get status config
  const getStatusConfig = () => {
    if (isNegative) {
      return {
        color: "text-rose-500",
        bgColor: "bg-rose-500/10",
        borderColor: "border-rose-500/30",
        icon: TrendingDown,
        label: "Atenção",
        message: `No ritmo atual, você ficará R$ ${Math.abs(projectedBalance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} no negativo`,
      }
    }
    if (isTight) {
      return {
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        icon: AlertTriangle,
        label: "Apertado",
        message: "Margem apertada. Cuidado com gastos extras.",
      }
    }
    return {
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      icon: CheckCircle2,
      label: "No caminho certo",
      message: "Continue assim! Projeção positiva para o mês.",
    }
  }

  const status = getStatusConfig()
  const StatusIcon = status.icon

  // Compare with previous months average
  const avgPreviousBalance =
    previousMonths.length > 0
      ? previousMonths.reduce((sum, m) => sum + m.actual, 0) / previousMonths.length
      : 0
  const differenceFromAvg = projectedBalance - avgPreviousBalance
  const percentageDiff =
    avgPreviousBalance !== 0
      ? ((differenceFromAvg / Math.abs(avgPreviousBalance)) * 100).toFixed(0)
      : 0

  return (
    <Card className={cn("border-2", status.borderColor, className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Projeção de Fim de Mês</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Baseado no seu ritmo atual de gastos (média de{" "}
                    {formatCurrency(averageDailyExpense)}/dia), projetamos quanto
                    sobrará ou faltará no fim do mês.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className={cn("flex items-center gap-1 text-sm font-medium", status.color)}>
            <StatusIcon className="h-4 w-4" />
            {status.label}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main projection */}
        <div className={cn("p-4 rounded-xl", status.bgColor)}>
          <p className="text-sm text-muted-foreground mb-1">
            Saldo projetado para fim do mês
          </p>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-3xl font-bold", status.color)}>
              {isNegative ? "-" : "+"} {formatCurrency(Math.abs(projectedBalance))}
            </span>
            {previousMonths.length > 0 && (
              <span
                className={cn(
                  "text-sm font-medium flex items-center gap-1",
                  differenceFromAvg >= 0 ? "text-emerald-500" : "text-rose-500"
                )}
              >
                {differenceFromAvg >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {percentageDiff}% vs média
              </span>
            )}
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-4">
          {/* Month progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso do mês</span>
              <span className="font-medium">
                Dia {currentDayOfMonth} de {totalDaysInMonth}
              </span>
            </div>
            <Progress value={monthProgress} className="h-2" />
          </div>

          {/* Expense vs Income progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gastos vs Renda</span>
              <span className="font-medium">
                {formatCurrency(currentExpenses)} / {formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="relative">
              <Progress
                value={Math.min(expenseProgress, 100)}
                className={cn(
                  "h-2",
                  expenseProgress > monthProgress ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"
                )}
              />
              {/* Month progress marker */}
              <div
                className="absolute top-0 w-0.5 h-2 bg-foreground/60"
                style={{ left: `${monthProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {expenseProgress > monthProgress
                ? `Você já gastou ${expenseProgress.toFixed(0)}% da renda com ${monthProgress.toFixed(0)}% do mês`
                : `Gastos abaixo do esperado para este ponto do mês`}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Gastos até agora</p>
            <p className="text-lg font-semibold">{formatCurrency(currentExpenses)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Projeção restante</p>
            <p className="text-lg font-semibold text-muted-foreground">
              +{formatCurrency(projectedAdditionalExpenses)}
            </p>
          </div>
        </div>

        {/* Previous months comparison */}
        {previousMonths.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Comparativo com meses anteriores</p>
            <div className="space-y-2">
              {previousMonths.map((month) => {
                const diff = month.actual - month.projected
                return (
                  <div key={month.month} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{month.month}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        Proj: {formatCurrency(month.projected)}
                      </span>
                      <span
                        className={cn(
                          "font-medium",
                          month.actual >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}
                      >
                        Real: {month.actual >= 0 ? "+" : ""}
                        {formatCurrency(month.actual)}
                      </span>
                      {diff !== 0 && (
                        <span
                          className={cn(
                            "text-xs",
                            diff > 0 ? "text-emerald-500" : "text-rose-500"
                          )}
                        >
                          ({diff > 0 ? "+" : ""}
                          {formatCurrency(diff)})
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className={cn("p-3 rounded-lg text-sm", status.bgColor)}>
          <p className={cn("font-medium", status.color)}>{status.message}</p>
        </div>
      </CardContent>
    </Card>
  )
}
