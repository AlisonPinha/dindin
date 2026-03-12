"use client"

import { TrendingUp, TrendingDown, Award } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { usePatrimonio } from "@/hooks/use-patrimonio"
import { cn } from "@/lib/utils"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toFixed(0)
}

export function NetWorthEvolution() {
  const { current, evolution, growthPercent, milestones } = usePatrimonio()

  const isPositiveGrowth = growthPercent !== null && growthPercent >= 0
  const reachedMilestones = milestones.filter(m => m.reached)
  const nextMilestone = milestones.find(m => !m.reached)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Patrimônio Líquido</CardTitle>
            <CardDescription>Evolução dos últimos 12 meses</CardDescription>
          </div>
          {growthPercent !== null && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
              isPositiveGrowth ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
            )}>
              {isPositiveGrowth ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {growthPercent > 0 ? "+" : ""}{growthPercent.toFixed(1)}%
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Value */}
        <div className="text-center py-2">
          <p className={cn(
            "text-3xl font-bold",
            current.patrimonioLiquido >= 0 ? "text-emerald-500" : "text-rose-500"
          )}>
            {formatCurrency(current.patrimonioLiquido)}
          </p>
          <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>Contas: {formatCurrency(current.saldoContas)}</span>
            <span>Invest.: {formatCurrency(current.saldoInvestimentos)}</span>
            {current.dividas > 0 && <span className="text-rose-400">Dívidas: {formatCurrency(current.dividas)}</span>}
          </div>
        </div>

        {/* Chart */}
        {evolution.length > 1 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolution} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11 }} width={50} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number), "Patrimônio"]}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="patrimonioLiquido"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#netWorthGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Dados de evolução aparecerão após o segundo mês
          </div>
        )}

        {/* Milestones */}
        <div className="flex flex-wrap gap-2">
          {reachedMilestones.map(m => (
            <div key={m.value} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
              <Award className="h-3 w-3" />
              {m.label}
            </div>
          ))}
          {nextMilestone && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
              Próximo: {nextMilestone.label}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
