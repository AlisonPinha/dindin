"use client"

import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface WeeklyData {
  week: string
  income: number
  expense: number
  balance: number
}

interface WeeklyFlowChartProps {
  data: WeeklyData[]
}

export function WeeklyFlowChart({ data }: WeeklyFlowChartProps) {
  // Calculate cumulative balance (trend line)
  let cumulative = 0
  const dataWithTrend = data.map((item) => {
    cumulative += item.income - item.expense
    return {
      ...item,
      trend: cumulative,
    }
  })

  const totalIncome = data.reduce((sum, item) => sum + item.income, 0)
  const totalExpense = data.reduce((sum, item) => sum + item.expense, 0)
  const netBalance = totalIncome - totalExpense

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fluxo do Mês</CardTitle>
            <CardDescription>Receitas vs Despesas por semana</CardDescription>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Receitas</span>
              <span className="font-medium text-emerald-500">
                {formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500" />
              <span className="text-muted-foreground">Despesas</span>
              <span className="font-medium text-rose-500">
                {formatCurrency(totalExpense)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dataWithTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                tickFormatter={(value) =>
                  new Intl.NumberFormat("pt-BR", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(value)
                }
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  name === "income"
                    ? "Receitas"
                    : name === "expense"
                    ? "Despesas"
                    : "Tendência",
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    income: "Receitas",
                    expense: "Despesas",
                    trend: "Saldo Acumulado",
                  }
                  return (
                    <span className="text-xs text-muted-foreground">
                      {labels[value] || value}
                    </span>
                  )
                }}
              />
              <Bar
                dataKey="income"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name="income"
              />
              <Bar
                dataKey="expense"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                name="expense"
              />
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: "#8b5cf6", strokeWidth: 2 }}
                name="trend"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Net balance indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-muted/50 p-3">
          <span className="text-sm text-muted-foreground">Saldo do mês:</span>
          <span
            className={`text-lg font-bold ${
              netBalance >= 0 ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {netBalance >= 0 ? "+" : ""}
            {formatCurrency(netBalance)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
