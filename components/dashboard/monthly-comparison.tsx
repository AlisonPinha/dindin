"use client"

import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, cn } from "@/lib/utils"

interface MonthData {
  month: string
  income: number
  expenses: number
  investments: number
  balance: number
}

interface MonthlyComparisonProps {
  data: MonthData[]
  className?: string
}

export function MonthlyComparison({ data, className }: MonthlyComparisonProps) {
  // Calculate trends
  const currentMonth = data[data.length - 1]
  const previousMonth = data[data.length - 2]

  const incomeTrend = previousMonth
    ? ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100
    : 0
  const expensesTrend = previousMonth
    ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
    : 0
  const investmentsTrend = previousMonth
    ? ((currentMonth.investments - previousMonth.investments) / previousMonth.investments) * 100
    : 0

  // Calculate averages
  const avgIncome = data.reduce((sum, d) => sum + d.income, 0) / data.length
  const avgExpenses = data.reduce((sum, d) => sum + d.expenses, 0) / data.length
  const avgInvestments = data.reduce((sum, d) => sum + d.investments, 0) / data.length

  // Format data for chart
  const chartData = data.map((d) => ({
    ...d,
    balanceLine: d.balance,
  }))

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: { name: string; value: number; color: string }[]
    label?: string
  }) => {
    if (!active || !payload) return null

    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="font-medium mb-2">{label}</p>
        <div className="space-y-1.5 text-sm">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">
                  {entry.name === "income"
                    ? "Entradas"
                    : entry.name === "expenses"
                    ? "Saídas"
                    : entry.name === "investments"
                    ? "Investimentos"
                    : "Saldo"}
                </span>
              </div>
              <span className="font-medium">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const TrendIndicator = ({
    value,
    inverted = false,
  }: {
    value: number
    inverted?: boolean
  }) => {
    const isPositive = inverted ? value < 0 : value > 0
    const isNeutral = Math.abs(value) < 1

    if (isNeutral) {
      return (
        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          <Minus className="h-3 w-3" />
          {value.toFixed(1)}%
        </span>
      )
    }

    return (
      <span
        className={cn(
          "flex items-center gap-1 text-xs font-medium",
          isPositive ? "text-emerald-500" : "text-rose-500"
        )}
      >
        {value > 0 ? (
          <ArrowUpRight className="h-3 w-3" />
        ) : (
          <ArrowDownRight className="h-3 w-3" />
        )}
        {Math.abs(value).toFixed(1)}%
      </span>
    )
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Comparativo Mensal</CardTitle>
        <p className="text-sm text-muted-foreground">
          Últimos {data.length} meses
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()
                }
                className="fill-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="income"
                name="income"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="expenses"
                name="expenses"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="investments"
                name="investments"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Line
                type="monotone"
                dataKey="balanceLine"
                name="balanceLine"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-muted-foreground">Entradas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-rose-500" />
            <span className="text-muted-foreground">Saídas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            <span className="text-muted-foreground">Investimentos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <span className="text-muted-foreground">Saldo</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          {/* Income */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Entradas</p>
              <TrendIndicator value={incomeTrend} />
            </div>
            <p className="text-lg font-semibold text-emerald-500">
              {formatCurrency(currentMonth.income)}
            </p>
            <p className="text-xs text-muted-foreground">
              Média: {formatCurrency(avgIncome)}
            </p>
          </div>

          {/* Expenses */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Saídas</p>
              <TrendIndicator value={expensesTrend} inverted />
            </div>
            <p className="text-lg font-semibold text-rose-500">
              {formatCurrency(currentMonth.expenses)}
            </p>
            <p className="text-xs text-muted-foreground">
              Média: {formatCurrency(avgExpenses)}
            </p>
          </div>

          {/* Investments */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Investimentos</p>
              <TrendIndicator value={investmentsTrend} />
            </div>
            <p className="text-lg font-semibold text-blue-500">
              {formatCurrency(currentMonth.investments)}
            </p>
            <p className="text-xs text-muted-foreground">
              Média: {formatCurrency(avgInvestments)}
            </p>
          </div>
        </div>

        {/* Trend analysis */}
        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          {currentMonth.balance > previousMonth?.balance ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span>
                Saldo {formatCurrency(currentMonth.balance - previousMonth.balance)} maior que o mês passado
              </span>
            </div>
          ) : currentMonth.balance < previousMonth?.balance ? (
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
              <span>
                Saldo {formatCurrency(previousMonth.balance - currentMonth.balance)} menor que o mês passado
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Minus className="h-4 w-4" />
              <span>Saldo estável em relação ao mês passado</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
