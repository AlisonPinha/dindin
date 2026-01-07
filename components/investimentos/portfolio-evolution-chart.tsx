"use client"

import { useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, cn } from "@/lib/utils"

type TimeRange = "6m" | "1y" | "all"

interface PortfolioDataPoint {
  date: string
  total: number
  stocks?: number
  bonds?: number
  crypto?: number
  realEstate?: number
  funds?: number
  other?: number
}

interface PortfolioEvolutionChartProps {
  data: PortfolioDataPoint[]
  className?: string
}

const typeConfig: Record<string, { label: string; color: string }> = {
  stocks: { label: "Ações", color: "#3b82f6" },
  bonds: { label: "Renda Fixa", color: "#22c55e" },
  crypto: { label: "Cripto", color: "#f97316" },
  realEstate: { label: "FIIs", color: "#8b5cf6" },
  funds: { label: "Fundos", color: "#06b6d4" },
  other: { label: "Outros", color: "#64748b" },
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (!active || !payload) return null

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 space-y-2">
      <p className="font-medium text-sm">{label}</p>
      {payload.map((entry, index) => {
        const config = typeConfig[entry.name] || { label: "Total", color: entry.color }
        return (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">
                {entry.name === "total" ? "Total" : config.label}
              </span>
            </div>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

export function PortfolioEvolutionChart({
  data,
  className,
}: PortfolioEvolutionChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("6m")
  const [showByType, setShowByType] = useState(false)

  // Filter data based on time range
  const getFilteredData = () => {
    const now = new Date()
    let cutoffDate: Date

    switch (timeRange) {
      case "6m":
        cutoffDate = new Date(now.setMonth(now.getMonth() - 6))
        break
      case "1y":
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1))
        break
      case "all":
      default:
        return data
    }

    return data.filter((item) => new Date(item.date) >= cutoffDate)
  }

  const filteredData = getFilteredData()

  // Calculate growth
  const firstValue = filteredData[0]?.total || 0
  const lastValue = filteredData[filteredData.length - 1]?.total || 0
  const growth = lastValue - firstValue
  const growthPercent = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0

  // Get available types (non-zero values)
  const availableTypes = Object.keys(typeConfig).filter((type) =>
    filteredData.some((item) => (item[type as keyof PortfolioDataPoint] as number) > 0)
  )

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Evolução Patrimonial</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold">{formatCurrency(lastValue)}</span>
              <span className={cn(
                "text-sm px-2 py-0.5 rounded-full",
                growth >= 0
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-rose-500/10 text-rose-500"
              )}>
                {growth >= 0 ? "+" : ""}{growthPercent.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border p-1">
              {(["6m", "1y", "all"] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-3"
                  onClick={() => setTimeRange(range)}
                >
                  {range === "6m" ? "6 meses" : range === "1y" ? "1 ano" : "Tudo"}
                </Button>
              ))}
            </div>
            <Button
              variant={showByType ? "default" : "outline"}
              size="sm"
              onClick={() => setShowByType(!showByType)}
            >
              Por Tipo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              {showByType && <Legend />}

              {showByType ? (
                availableTypes.map((type) => (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={type}
                    name={type}
                    stroke={typeConfig[type].color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))
              ) : (
                <Line
                  type="monotone"
                  dataKey="total"
                  name="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Type Legend */}
        {showByType && (
          <div className="flex flex-wrap gap-4 justify-center mt-4 pt-4 border-t">
            {availableTypes.map((type) => (
              <div key={type} className="flex items-center gap-2 text-sm">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: typeConfig[type].color }}
                />
                <span className="text-muted-foreground">{typeConfig[type].label}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
