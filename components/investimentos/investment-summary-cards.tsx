"use client"

import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatPercentage, cn } from "@/lib/utils"

interface InvestmentSummaryCardsProps {
  totalInvested: number
  totalCurrent: number
  monthlyContribution: number
  monthlyTarget: number
  distributionByType: {
    type: string
    label: string
    value: number
    color: string
  }[]
}

function MiniDonut({
  data,
  size = 60,
}: {
  data: { label: string; value: number; color: string }[]
  size?: number
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cumulativePercent = 0

  const segments = data.map((item) => {
    const percent = total > 0 ? (item.value / total) * 100 : 0
    const startAngle = cumulativePercent * 3.6 - 90
    cumulativePercent += percent
    const endAngle = cumulativePercent * 3.6 - 90

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const radius = size / 2 - 4
    const centerX = size / 2
    const centerY = size / 2

    const x1 = centerX + radius * Math.cos(startRad)
    const y1 = centerY + radius * Math.sin(startRad)
    const x2 = centerX + radius * Math.cos(endRad)
    const y2 = centerY + radius * Math.sin(endRad)

    const largeArc = percent > 50 ? 1 : 0

    return {
      ...item,
      d: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
    }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((segment, i) => (
        <path
          key={i}
          d={segment.d}
          fill={segment.color}
          className="transition-all hover:opacity-80"
        />
      ))}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 4}
        fill="hsl(var(--background))"
      />
    </svg>
  )
}

export function InvestmentSummaryCards({
  totalInvested,
  totalCurrent,
  monthlyContribution,
  monthlyTarget,
  distributionByType,
}: InvestmentSummaryCardsProps) {
  const totalReturn = totalCurrent - totalInvested
  const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0
  const isPositive = totalReturn >= 0

  const contributionProgress = monthlyTarget > 0
    ? Math.min((monthlyContribution / monthlyTarget) * 100, 100)
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Invested */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Investido</p>
              <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Return */}
      <Card className={cn(
        "border-l-4",
        isPositive ? "border-l-emerald-500" : "border-l-rose-500"
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rentabilidade Total</p>
              <p className={cn(
                "text-2xl font-bold",
                isPositive ? "text-emerald-500" : "text-rose-500"
              )}>
                {isPositive ? "+" : ""}{formatCurrency(totalReturn)}
              </p>
              <p className={cn(
                "text-sm",
                isPositive ? "text-emerald-500" : "text-rose-500"
              )}>
                {isPositive ? "+" : ""}{formatPercentage(returnPercentage)}
              </p>
            </div>
            <div className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center",
              isPositive ? "bg-emerald-500/10" : "bg-rose-500/10"
            )}>
              {isPositive ? (
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              ) : (
                <TrendingDown className="h-6 w-6 text-rose-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Contribution vs Target */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Aporte do Mês</p>
              <p className="text-2xl font-bold">{formatCurrency(monthlyContribution)}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Meta: {formatCurrency(monthlyTarget)}</span>
              <span className={cn(
                "font-medium",
                contributionProgress >= 100 ? "text-emerald-500" : "text-muted-foreground"
              )}>
                {contributionProgress.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={contributionProgress}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Distribution by Type */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Distribuição</p>
              <div className="mt-2 space-y-1">
                {distributionByType.slice(0, 3).map((item) => (
                  <div key={item.type} className="flex items-center gap-2 text-xs">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium ml-auto">
                      {((item.value / totalCurrent) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <MiniDonut data={distributionByType} size={70} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
