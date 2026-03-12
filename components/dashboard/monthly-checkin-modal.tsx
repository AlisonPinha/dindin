"use client"

import { CheckCircle, TrendingUp, Shield, Target, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTransacoesDoMes } from "@/hooks/use-transacoes-do-mes"
import { useStore } from "@/hooks/use-store"
import { cn } from "@/lib/utils"
import { useMemo } from "react"
import { getTransacoesDoMes } from "@/lib/calculations"

interface MonthlyCheckinModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export function MonthlyCheckinModal({ open, onOpenChange, onDone }: MonthlyCheckinModalProps) {
  const { totais, totaisAnteriores, regra503020, mesVis, anoVis } = useTransacoesDoMes()
  const { accounts, goals, investments, transactions } = useStore()

  // Emergency reserve
  const emergencyMonths = useMemo(() => {
    let totalExpenses = 0
    let months = 0
    for (let i = 0; i < 6; i++) {
      let m = mesVis - i
      let y = anoVis
      while (m < 0) { m += 12; y-- }
      const tx = getTransacoesDoMes(transactions, m, y)
      const exp = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
      if (exp > 0) { totalExpenses += exp; months++ }
    }
    const avg = months > 0 ? totalExpenses / months : 0
    const reserve = accounts.filter(a => a.type !== "credit").reduce((s, a) => s + (Number(a.balance) || 0), 0)
      + investments.reduce((s, i) => s + (Number(i.currentPrice) || 0), 0)
    return avg > 0 ? reserve / avg : 0
  }, [accounts, investments, transactions, mesVis, anoVis])

  // Patrimony growth vs previous
  const patrimonioGrowth = totais.saldo - totaisAnteriores.saldo

  // Active goals progress
  const activeGoals = goals.filter(g => g.status === "active")
  const goalsProgress = activeGoals.length > 0
    ? activeGoals.reduce((sum, g) => sum + Math.min(100, (g.currentAmount / g.targetAmount) * 100), 0) / activeGoals.length
    : 0

  // Score (simplified)
  let score = 100
  if (totais.saldo < 0) score -= 30
  else if (totais.receitas > 0 && (totais.receitas - totais.despesas) / totais.receitas < 0.1) score -= 15
  if (emergencyMonths < 3) score -= 20
  else if (emergencyMonths < 6) score -= 10
  const adherence503020 = regra503020.essenciais.status === "dentro" && regra503020.livres.status === "dentro"
  if (!adherence503020) score -= 15
  score = Math.max(0, Math.round(score))

  // Insights
  const insights = useMemo(() => {
    const result: string[] = []
    if (totais.despesas < totaisAnteriores.despesas && totaisAnteriores.despesas > 0) {
      const pct = ((totaisAnteriores.despesas - totais.despesas) / totaisAnteriores.despesas * 100).toFixed(0)
      result.push(`Gastaram ${pct}% menos que o mês anterior`)
    }
    if (totais.receitas > totaisAnteriores.receitas && totaisAnteriores.receitas > 0) {
      result.push("Renda maior que o mês anterior")
    }
    if (regra503020.investimentos.status === "dentro") {
      result.push("Meta de investimentos atingida")
    }
    if (result.length === 0) result.push("Continue monitorando para obter insights")
    return result
  }, [totais, totaisAnteriores, regra503020])

  const scoreColor = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-blue-500" : score >= 40 ? "text-amber-500" : "text-rose-500"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            Check-in de {MONTHS[mesVis]} {anoVis}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Score */}
          <div className="text-center py-4">
            <p className={cn("text-5xl font-bold", scoreColor)}>{score}</p>
            <p className="text-sm text-muted-foreground">Score do mês</p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <p className="text-xs text-muted-foreground">Receitas</p>
              <p className="font-semibold text-emerald-500">{formatCurrency(totais.receitas)}</p>
            </div>
            <div className="p-3 rounded-lg bg-rose-500/10">
              <p className="text-xs text-muted-foreground">Despesas</p>
              <p className="font-semibold text-rose-500">{formatCurrency(totais.despesas)}</p>
            </div>
            <div className={cn("p-3 rounded-lg", totais.saldo >= 0 ? "bg-blue-500/10" : "bg-amber-500/10")}>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className={cn("font-semibold", totais.saldo >= 0 ? "text-blue-500" : "text-amber-500")}>
                {formatCurrency(totais.saldo)}
              </p>
            </div>
          </div>

          {/* 50/30/20 */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm font-medium">Regra 50/30/20</p>
            <div className="flex gap-2 text-xs">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span>Essenciais</span>
                  <span className={regra503020.essenciais.status === "dentro" ? "text-emerald-500" : "text-amber-500"}>
                    {regra503020.essenciais.percentual.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full", regra503020.essenciais.status === "dentro" ? "bg-emerald-500" : "bg-amber-500")}
                    style={{ width: `${Math.min(100, regra503020.essenciais.percentual * 2)}%` }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span>Livres</span>
                  <span className={regra503020.livres.status === "dentro" ? "text-emerald-500" : "text-amber-500"}>
                    {regra503020.livres.percentual.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full", regra503020.livres.status === "dentro" ? "bg-emerald-500" : "bg-amber-500")}
                    style={{ width: `${Math.min(100, regra503020.livres.percentual * (100/30))}%` }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span>Invest.</span>
                  <span className={regra503020.investimentos.status === "dentro" ? "text-emerald-500" : "text-amber-500"}>
                    {regra503020.investimentos.percentual.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full", regra503020.investimentos.status === "dentro" ? "bg-emerald-500" : "bg-amber-500")}
                    style={{ width: `${Math.min(100, regra503020.investimentos.percentual * 5)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2">
              <TrendingUp className={cn("h-4 w-4", patrimonioGrowth >= 0 ? "text-emerald-500" : "text-rose-500")} />
              <div>
                <p className="text-xs text-muted-foreground">Crescimento</p>
                <p className={cn("text-sm font-semibold", patrimonioGrowth >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  {patrimonioGrowth >= 0 ? "+" : ""}{formatCurrency(patrimonioGrowth)}
                </p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2">
              <Shield className={cn("h-4 w-4", emergencyMonths >= 6 ? "text-emerald-500" : emergencyMonths >= 3 ? "text-amber-500" : "text-rose-500")} />
              <div>
                <p className="text-xs text-muted-foreground">Reserva</p>
                <p className="text-sm font-semibold">{emergencyMonths.toFixed(1)} meses</p>
              </div>
            </div>
          </div>

          {/* Goals */}
          {activeGoals.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-500" />
                <p className="text-sm font-medium">Metas ({activeGoals.length} ativas)</p>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${goalsProgress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Progresso médio: {goalsProgress.toFixed(0)}%</p>
            </div>
          )}

          {/* Insights */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Insights</p>
            </div>
            <ul className="space-y-1">
              {insights.map((insight, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {insight}</li>
              ))}
            </ul>
          </div>

          {/* Done button */}
          <Button onClick={onDone} className="w-full">
            Concluir Check-in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
