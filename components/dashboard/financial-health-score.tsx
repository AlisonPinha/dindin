"use client"

import { Heart, AlertTriangle, CheckCircle, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FinancialHealthScoreProps {
  score: number
  savingsRate: number
  budgetAdherence: number
  emergencyFundMonths: number
  className?: string
}

export function FinancialHealthScore({
  score,
  savingsRate,
  budgetAdherence,
  emergencyFundMonths,
  className,
}: FinancialHealthScoreProps) {
  // Determinar status geral baseado no score
  const getStatus = () => {
    if (score >= 80) return { label: "Excelente", color: "text-emerald-500", bg: "bg-emerald-500", bgLight: "bg-emerald-500/10" }
    if (score >= 60) return { label: "Bom", color: "text-blue-500", bg: "bg-blue-500", bgLight: "bg-blue-500/10" }
    if (score >= 40) return { label: "Atenção", color: "text-amber-500", bg: "bg-amber-500", bgLight: "bg-amber-500/10" }
    return { label: "Crítico", color: "text-rose-500", bg: "bg-rose-500", bgLight: "bg-rose-500/10" }
  }

  const status = getStatus()

  // Métricas individuais
  const metrics = [
    {
      label: "Taxa de Poupança",
      value: savingsRate,
      target: 20,
      format: (v: number) => `${v.toFixed(1)}%`,
      description: savingsRate >= 20 ? "Meta atingida!" : `Meta: 20%`,
      isGood: savingsRate >= 20,
    },
    {
      label: "Aderência ao Orçamento",
      value: budgetAdherence,
      target: 100,
      format: (v: number) => `${v.toFixed(0)}%`,
      description: budgetAdherence >= 100 ? "Dentro do planejado" : "Acima do orçamento",
      isGood: budgetAdherence >= 90,
    },
    {
      label: "Reserva de Emergência",
      value: emergencyFundMonths,
      target: 6,
      format: (v: number) => `${v.toFixed(1)} meses`,
      description: emergencyFundMonths >= 6 ? "Reserva adequada" : `Meta: 6 meses`,
      isGood: emergencyFundMonths >= 6,
    },
  ]

  // Dicas baseadas no score
  const getTips = () => {
    const tips: string[] = []

    if (savingsRate < 20) {
      tips.push("Tente poupar pelo menos 20% da sua renda mensal")
    }
    if (budgetAdherence < 90) {
      tips.push("Revise seus gastos para ficar dentro do orçamento")
    }
    if (emergencyFundMonths < 6) {
      tips.push("Priorize construir uma reserva de emergência de 6 meses")
    }
    if (tips.length === 0) {
      tips.push("Continue assim! Suas finanças estão saudáveis")
    }

    return tips
  }

  const tips = getTips()

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className={cn("h-5 w-5", status.color)} />
            <CardTitle className="text-lg">Saúde Financeira</CardTitle>
          </div>
          <span className={cn("text-sm font-medium px-2 py-1 rounded-full", status.bgLight, status.color)}>
            {status.label}
          </span>
        </div>
        <CardDescription>Avaliação geral das suas finanças</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score Circle */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Background circle */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/20"
              />
              {/* Progress circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className={status.color}
                strokeDasharray={`${(score / 100) * 352} 352`}
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-3xl font-bold", status.color)}>{score}</span>
              <span className="text-xs text-muted-foreground">de 100</span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="space-y-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {metric.isGood ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-medium">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              </div>
              <span className={cn(
                "text-sm font-semibold",
                metric.isGood ? "text-emerald-500" : "text-amber-500"
              )}>
                {metric.format(metric.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">Dica para você</p>
              <p className="text-sm text-muted-foreground">
                {tips[0]}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
