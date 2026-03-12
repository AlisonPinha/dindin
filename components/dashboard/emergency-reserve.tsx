"use client"

import { Shield, AlertTriangle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useStore } from "@/hooks/use-store"
import { useTransacoesDoMes } from "@/hooks/use-transacoes-do-mes"
import { useMemo } from "react"
import { getTransacoesDoMes } from "@/lib/calculations"
import { cn } from "@/lib/utils"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function EmergencyReserve() {
  const { accounts, transactions, investments } = useStore()
  const { mesVis, anoVis } = useTransacoesDoMes()

  const data = useMemo(() => {
    // Calculate average expenses over last 6 months
    let totalExpenses = 0
    let monthsWithData = 0

    for (let i = 0; i < 6; i++) {
      let m = mesVis - i
      let y = anoVis
      while (m < 0) { m += 12; y -= 1 }

      const monthTx = getTransacoesDoMes(transactions, m, y)
      const expenses = monthTx
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)

      if (expenses > 0) {
        totalExpenses += expenses
        monthsWithData++
      }
    }

    const avgMonthlyExpenses = monthsWithData > 0 ? totalExpenses / monthsWithData : 0
    const targetMonths = 6
    const targetAmount = avgMonthlyExpenses * targetMonths

    // Available reserves: checking accounts + investments (not credit cards)
    const availableReserve = accounts
      .filter(a => a.type !== "credit")
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0)

    const investmentReserve = investments.reduce((sum, inv) => sum + (Number(inv.currentPrice) || 0), 0)

    const totalReserve = availableReserve + investmentReserve
    const monthsCovered = avgMonthlyExpenses > 0 ? totalReserve / avgMonthlyExpenses : 0
    const percentage = targetAmount > 0 ? Math.min(100, (totalReserve / targetAmount) * 100) : 0

    return { avgMonthlyExpenses, targetAmount, totalReserve, monthsCovered, percentage, targetMonths }
  }, [accounts, transactions, investments, mesVis, anoVis])

  const getStatus = () => {
    if (data.monthsCovered >= 6) return { label: "Adequada", color: "text-emerald-500", bg: "bg-emerald-500", icon: CheckCircle }
    if (data.monthsCovered >= 3) return { label: "Em construção", color: "text-amber-500", bg: "bg-amber-500", icon: Shield }
    return { label: "Insuficiente", color: "text-rose-500", bg: "bg-rose-500", icon: AlertTriangle }
  }

  const status = getStatus()
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className={cn("h-5 w-5", status.color)} />
            <CardTitle className="text-lg">Reserva de Emergência</CardTitle>
          </div>
          <span className={cn("text-xs font-medium px-2 py-1 rounded-full", status.color, `${status.bg}/10`)}>
            {status.label}
          </span>
        </div>
        <CardDescription>Meta: {data.targetMonths} meses de despesas</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Months covered */}
        <div className="text-center">
          <p className={cn("text-4xl font-bold", status.color)}>
            {data.monthsCovered.toFixed(1)}
          </p>
          <p className="text-sm text-muted-foreground">meses cobertos</p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(data.totalReserve)}</span>
            <span>Meta: {formatCurrency(data.targetAmount)}</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", status.bg)}
              style={{ width: `${Math.min(100, data.percentage)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {data.percentage.toFixed(0)}% da meta
          </p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-xs">Gasto médio/mês</p>
            <p className="font-semibold">{formatCurrency(data.avgMonthlyExpenses)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-xs">Reserva atual</p>
            <p className="font-semibold">{formatCurrency(data.totalReserve)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
