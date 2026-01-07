"use client"

import {
  Home,
  ShoppingBag,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCurrency, cn } from "@/lib/utils"

interface BudgetCategory {
  name: string
  targetPercentage: number
  actualPercentage: number
  actualAmount: number
  targetAmount: number
  icon: React.ElementType
  color: string
  bgColor: string
}

interface BudgetRuleCardProps {
  totalIncome: number
  essentialsSpent: number
  lifestyleSpent: number
  investmentsSpent: number
  className?: string
}

function LinearProgressBar({
  name,
  targetPercentage,
  actualPercentage,
  actualAmount,
  targetAmount,
  icon: Icon,
  color,
  bgColor,
}: BudgetCategory) {
  const isOver = actualPercentage > targetPercentage
  const diff = actualPercentage - targetPercentage

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg", bgColor)}>
            <Icon className={cn("h-4 w-4", color)} />
          </div>
          <div>
            <p className="font-medium text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">
              Meta: {targetPercentage}%
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("font-semibold", isOver && "text-rose-500")}>
            {actualPercentage.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(actualAmount)} / {formatCurrency(targetAmount)}
          </p>
        </div>
      </div>

      <div className="relative">
        <Progress
          value={Math.min(actualPercentage, targetPercentage)}
          className="h-3"
        />
        {/* Overflow indicator */}
        {isOver && (
          <div
            className="absolute top-0 h-3 bg-rose-500/30 rounded-r-full"
            style={{
              left: `${(targetPercentage / 100) * 100}%`,
              width: `${Math.min(diff, 100 - targetPercentage)}%`,
            }}
          />
        )}
        {/* Target marker */}
        <div
          className="absolute top-0 w-0.5 h-3 bg-foreground/50"
          style={{ left: `${targetPercentage}%` }}
        />
      </div>

      {isOver && (
        <p className="text-xs text-rose-500 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {diff.toFixed(1)}% acima da meta
        </p>
      )}
      {!isOver && actualPercentage >= targetPercentage * 0.9 && (
        <p className="text-xs text-amber-500 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Próximo do limite
        </p>
      )}
      {!isOver && actualPercentage < targetPercentage * 0.9 && (
        <p className="text-xs text-emerald-500 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Dentro da meta
        </p>
      )}
    </div>
  )
}

function getTip(
  essentialsPercentage: number,
  lifestylePercentage: number,
  investmentsPercentage: number
): { type: "success" | "warning" | "error"; message: string } {
  const essentialsOver = essentialsPercentage > 50
  const lifestyleOver = lifestylePercentage > 30
  const investmentsLow = investmentsPercentage < 20

  if (!essentialsOver && !lifestyleOver && !investmentsLow) {
    return {
      type: "success",
      message: "Parabéns! Você está seguindo a regra 50/30/20 perfeitamente!",
    }
  }

  if (essentialsOver && essentialsPercentage > 60) {
    return {
      type: "error",
      message: `Você está gastando ${essentialsPercentage.toFixed(0)}% em essenciais, ${(essentialsPercentage - 50).toFixed(0)}% acima da meta. Considere revisar gastos fixos como moradia e serviços.`,
    }
  }

  if (essentialsOver) {
    return {
      type: "warning",
      message: `Gastos essenciais em ${essentialsPercentage.toFixed(0)}%. Tente reduzir em ${(essentialsPercentage - 50).toFixed(0)}% para equilibrar seu orçamento.`,
    }
  }

  if (lifestyleOver && lifestylePercentage > 40) {
    return {
      type: "error",
      message: `Estilo de vida em ${lifestylePercentage.toFixed(0)}%, ${(lifestylePercentage - 30).toFixed(0)}% acima do ideal. Revise gastos com lazer e compras não essenciais.`,
    }
  }

  if (lifestyleOver) {
    return {
      type: "warning",
      message: `Gastos livres em ${lifestylePercentage.toFixed(0)}%. Pequenos cortes podem ajudar a voltar aos 30%.`,
    }
  }

  if (investmentsLow && investmentsPercentage < 10) {
    return {
      type: "error",
      message: `Investimentos em apenas ${investmentsPercentage.toFixed(0)}%. Priorize guardar pelo menos 20% da renda para seu futuro.`,
    }
  }

  if (investmentsLow) {
    return {
      type: "warning",
      message: `Investimentos em ${investmentsPercentage.toFixed(0)}%. Aumente gradualmente até atingir os 20% recomendados.`,
    }
  }

  return {
    type: "warning",
    message: "Continue acompanhando seus gastos para manter o equilíbrio financeiro.",
  }
}

export function BudgetRuleCard({
  totalIncome,
  essentialsSpent,
  lifestyleSpent,
  investmentsSpent,
  className,
}: BudgetRuleCardProps) {
  const essentialsPercentage = totalIncome > 0 ? (essentialsSpent / totalIncome) * 100 : 0
  const lifestylePercentage = totalIncome > 0 ? (lifestyleSpent / totalIncome) * 100 : 0
  const investmentsPercentage = totalIncome > 0 ? (investmentsSpent / totalIncome) * 100 : 0

  const essentialsTarget = totalIncome * 0.5
  const lifestyleTarget = totalIncome * 0.3
  const investmentsTarget = totalIncome * 0.2

  const tip = getTip(essentialsPercentage, lifestylePercentage, investmentsPercentage)

  const categories: BudgetCategory[] = [
    {
      name: "Essenciais",
      targetPercentage: 50,
      actualPercentage: essentialsPercentage,
      actualAmount: essentialsSpent,
      targetAmount: essentialsTarget,
      icon: Home,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      name: "Estilo de Vida",
      targetPercentage: 30,
      actualPercentage: lifestylePercentage,
      actualAmount: lifestyleSpent,
      targetAmount: lifestyleTarget,
      icon: ShoppingBag,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      name: "Investimentos",
      targetPercentage: 20,
      actualPercentage: investmentsPercentage,
      actualAmount: investmentsSpent,
      targetAmount: investmentsTarget,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ]

  const overallHealth =
    !categories.some((c) => c.actualPercentage > c.targetPercentage * 1.1)
      ? "good"
      : categories.some((c) => c.actualPercentage > c.targetPercentage * 1.2)
      ? "bad"
      : "warning"

  return (
    <Card
      className={cn(
        "border-2 transition-all",
        overallHealth === "good" && "border-emerald-500/30 bg-emerald-500/5",
        overallHealth === "warning" && "border-amber-500/30 bg-amber-500/5",
        overallHealth === "bad" && "border-rose-500/30 bg-rose-500/5",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">Regra 50/30/20</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    A regra 50/30/20 sugere dividir sua renda em:
                  </p>
                  <ul className="text-sm mt-1 space-y-1">
                    <li>• 50% para necessidades essenciais</li>
                    <li>• 30% para estilo de vida</li>
                    <li>• 20% para investimentos e poupança</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Renda do mês</p>
            <p className="font-bold text-lg">{formatCurrency(totalIncome)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress bars */}
        <div className="space-y-5">
          {categories.map((category) => (
            <LinearProgressBar key={category.name} {...category} />
          ))}
        </div>

        {/* Tip section */}
        <div
          className={cn(
            "p-4 rounded-lg flex items-start gap-3",
            tip.type === "success" && "bg-emerald-500/10",
            tip.type === "warning" && "bg-amber-500/10",
            tip.type === "error" && "bg-rose-500/10"
          )}
        >
          <Lightbulb
            className={cn(
              "h-5 w-5 flex-shrink-0 mt-0.5",
              tip.type === "success" && "text-emerald-500",
              tip.type === "warning" && "text-amber-500",
              tip.type === "error" && "text-rose-500"
            )}
          />
          <div>
            <p className="font-medium text-sm">Dica</p>
            <p className="text-sm text-muted-foreground">{tip.message}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">
              {essentialsPercentage.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Essenciais</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-500">
              {lifestylePercentage.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Estilo de Vida</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-500">
              {investmentsPercentage.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Investimentos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
