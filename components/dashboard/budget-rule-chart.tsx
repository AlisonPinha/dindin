"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, cn } from "@/lib/utils"
import { useTransacoesDoMes } from "@/hooks"

interface BudgetCategory {
  name: string
  targetPercent: number
  actualValue: number
  targetValue: number
  color: string
}

interface ChartDataItem {
  name: string
  value: number
  color: string
}

interface TooltipPayload {
  name: string
  value: number
  payload: ChartDataItem
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  const data = payload?.[0]
  if (!active || !data) return null

  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="font-semibold text-sm">{data.name}</p>
      <p className="text-base font-bold">{formatCurrency(data.value)}</p>
    </div>
  )
}

export function BudgetRuleChart() {
  const { regra503020 } = useTransacoesDoMes()

  const categories: BudgetCategory[] = [
    {
      name: "Essenciais (50%)",
      targetPercent: 50,
      actualValue: regra503020.essenciais.valor,
      targetValue: regra503020.essenciais.meta,
      color: "#10b981", // emerald
    },
    {
      name: "Livres (30%)",
      targetPercent: 30,
      actualValue: regra503020.livres.valor,
      targetValue: regra503020.livres.meta,
      color: "#3b82f6", // blue
    },
    {
      name: "Investimentos (20%)",
      targetPercent: 20,
      actualValue: regra503020.investimentos.valor,
      targetValue: regra503020.investimentos.meta,
      color: "#8b5cf6", // violet
    },
  ]

  const chartData = categories.map((cat) => ({
    name: cat.name.split(" (")[0],
    value: cat.actualValue,
    color: cat.color,
  }))

  const total = regra503020.totalGasto

  const getProgressStatus = (actual: number, target: number) => {
    const ratio = actual / target
    if (ratio <= 1) return "good" // Within budget
    if (ratio <= 1.1) return "warning" // Up to 10% over
    return "danger" // More than 10% over
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-emerald-500"
      case "warning":
        return "bg-amber-500"
      case "danger":
        return "bg-rose-500"
      default:
        return "bg-primary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "good":
        return "Dentro da meta"
      case "warning":
        return "Próximo do limite"
      case "danger":
        return "Acima do limite"
      default:
        return ""
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Regra 50/30/20
        </CardTitle>
        <CardDescription>
          Distribuição do orçamento mensal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Donut Chart */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Center text showing total */}
        <div className="text-center -mt-4">
          <p className="text-xs text-muted-foreground">Total gasto</p>
          <p className="text-lg font-bold">{formatCurrency(total)}</p>
        </div>

        {/* Progress bars */}
        <div className="space-y-4">
          {categories.map((category) => {
            const percentage = (category.actualValue / category.targetValue) * 100
            const status = getProgressStatus(category.actualValue, category.targetValue)
            const progressColor = getProgressColor(status)

            return (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name.split(" (")[0]}</span>
                    <span className="text-xs text-muted-foreground">
                      ({category.targetPercent}%)
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      status === "good" && "text-emerald-500",
                      status === "warning" && "text-amber-500",
                      status === "danger" && "text-rose-500"
                    )}
                  >
                    {getStatusText(status)}
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={Math.min(percentage, 100)}
                    className="h-2"
                  />
                  <div
                    className={cn(
                      "absolute inset-0 h-2 rounded-full transition-all",
                      progressColor
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(category.actualValue)}</span>
                  <span>Meta: {formatCurrency(category.targetValue)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
