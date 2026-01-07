"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, cn } from "@/lib/utils"

interface AllocationItem {
  type: string
  label: string
  value: number
  color: string
  targetPercent?: number
  [key: string]: string | number | undefined
}

interface AllocationCardProps {
  currentAllocation: AllocationItem[]
  totalValue: number
  className?: string
}

const CustomTooltip = ({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: AllocationItem }>
}) => {
  if (!active || !payload || !payload[0]) return null

  const item = payload[0].payload

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 space-y-1">
      <p className="font-medium text-sm flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        {item.label}
      </p>
      <p className="text-sm">{formatCurrency(item.value)}</p>
    </div>
  )
}

function generateSuggestions(
  allocation: AllocationItem[],
  totalValue: number
): { type: "success" | "warning" | "info"; message: string }[] {
  const suggestions: { type: "success" | "warning" | "info"; message: string }[] = []

  allocation.forEach((item) => {
    if (item.targetPercent === undefined) return

    const currentPercent = totalValue > 0 ? (item.value / totalValue) * 100 : 0
    const diff = currentPercent - item.targetPercent

    if (Math.abs(diff) <= 2) {
      // Within 2% is good
      return
    }

    if (diff > 5) {
      suggestions.push({
        type: "warning",
        message: `Você está ${diff.toFixed(0)}% acima do ideal em ${item.label}. Considere rebalancear.`,
      })
    } else if (diff < -5) {
      suggestions.push({
        type: "info",
        message: `Você está ${Math.abs(diff).toFixed(0)}% abaixo em ${item.label}. Próximo aporte pode ser direcionado aqui.`,
      })
    }
  })

  if (suggestions.length === 0) {
    suggestions.push({
      type: "success",
      message: "Sua carteira está bem balanceada! Continue assim.",
    })
  }

  return suggestions
}

export function AllocationCard({
  currentAllocation,
  totalValue,
  className,
}: AllocationCardProps) {
  const suggestions = useMemo(
    () => generateSuggestions(currentAllocation, totalValue),
    [currentAllocation, totalValue]
  )

  const hasTargets = currentAllocation.some((item) => item.targetPercent !== undefined)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Alocação da Carteira</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          {/* Pie Chart */}
          <div className="w-[180px] h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {currentAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend with percentages */}
          <div className="flex-1 space-y-3">
            {currentAllocation.map((item) => {
              const currentPercent = totalValue > 0 ? (item.value / totalValue) * 100 : 0
              const diff = item.targetPercent !== undefined
                ? currentPercent - item.targetPercent
                : null

              return (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {currentPercent.toFixed(1)}%
                      </span>
                      {diff !== null && (
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          Math.abs(diff) <= 2
                            ? "bg-emerald-500/10 text-emerald-500"
                            : diff > 0
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-blue-500/10 text-blue-500"
                        )}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {item.targetPercent !== undefined && (
                    <div className="flex items-center gap-2">
                      <Progress
                        value={currentPercent}
                        className="h-1.5 flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        Meta: {item.targetPercent}%
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Target vs Actual comparison */}
        {hasTargets && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Atual vs Ideal</p>
            <div className="grid grid-cols-2 gap-4">
              {currentAllocation.map((item) => {
                if (item.targetPercent === undefined) return null

                const currentPercent = totalValue > 0 ? (item.value / totalValue) * 100 : 0
                const isOver = currentPercent > item.targetPercent
                const isUnder = currentPercent < item.targetPercent - 2

                return (
                  <div key={item.type} className="flex items-center gap-2 text-sm">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.label}:</span>
                    <div className="flex items-center gap-1">
                      {isOver ? (
                        <TrendingUp className="h-3 w-3 text-amber-500" />
                      ) : isUnder ? (
                        <TrendingDown className="h-3 w-3 text-blue-500" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      )}
                      <span className={cn(
                        "font-medium",
                        isOver && "text-amber-500",
                        isUnder && "text-blue-500",
                        !isOver && !isUnder && "text-emerald-500"
                      )}>
                        {currentPercent.toFixed(0)}% / {item.targetPercent}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg flex items-start gap-3 text-sm",
                suggestion.type === "success" && "bg-emerald-500/10",
                suggestion.type === "warning" && "bg-amber-500/10",
                suggestion.type === "info" && "bg-blue-500/10"
              )}
            >
              {suggestion.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : suggestion.type === "warning" ? (
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              )}
              <p className={cn(
                suggestion.type === "success" && "text-emerald-600",
                suggestion.type === "warning" && "text-amber-600",
                suggestion.type === "info" && "text-blue-600"
              )}>
                {suggestion.message}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
