"use client"

import { useState, useMemo } from "react"
import {
  Home,
  ShoppingBag,
  TrendingUp,
  Info,
  Check,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { cn, formatCurrency } from "@/lib/utils"

type BudgetGroup = "essentials" | "lifestyle" | "investments"

interface CategoryForBudget {
  id: string
  name: string
  color: string
  budgetGroup?: BudgetGroup
}

interface BudgetRuleConfig {
  essentialsPercent: number
  lifestylePercent: number
  investmentsPercent: number
}

interface BudgetRuleTabProps {
  config: BudgetRuleConfig
  categories: CategoryForBudget[]
  monthlyIncome: number
  onConfigChange: (config: BudgetRuleConfig) => void
  onCategoryGroupChange: (categoryId: string, group: BudgetGroup) => void
}

const groupConfig = [
  {
    key: "essentials" as BudgetGroup,
    label: "Essenciais",
    description: "Moradia, alimentação, saúde, transporte",
    icon: Home,
    color: "text-blue-500",
    bgColor: "bg-blue-500",
    borderColor: "border-blue-500",
  },
  {
    key: "lifestyle" as BudgetGroup,
    label: "Estilo de Vida",
    description: "Lazer, compras, assinaturas, hobbies",
    icon: ShoppingBag,
    color: "text-purple-500",
    bgColor: "bg-purple-500",
    borderColor: "border-purple-500",
  },
  {
    key: "investments" as BudgetGroup,
    label: "Investimentos",
    description: "Poupança, investimentos, reservas",
    icon: TrendingUp,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500",
    borderColor: "border-emerald-500",
  },
]

export function BudgetRuleTab({
  config,
  categories,
  monthlyIncome,
  onConfigChange,
  onCategoryGroupChange,
}: BudgetRuleTabProps) {
  const { toast } = useToast()
  const [localConfig, setLocalConfig] = useState(config)
  const [isDirty, setIsDirty] = useState(false)

  const total = localConfig.essentialsPercent + localConfig.lifestylePercent + localConfig.investmentsPercent

  const categoriesByGroup = useMemo(() => {
    return {
      essentials: categories.filter((c) => c.budgetGroup === "essentials"),
      lifestyle: categories.filter((c) => c.budgetGroup === "lifestyle"),
      investments: categories.filter((c) => c.budgetGroup === "investments"),
      unassigned: categories.filter((c) => !c.budgetGroup),
    }
  }, [categories])

  const handleSliderChange = (group: BudgetGroup, value: number[]) => {
    const newValue = value[0]
    const diff = newValue - localConfig[`${group}Percent` as keyof BudgetRuleConfig]

    // Distribute the difference to other sliders proportionally
    const otherGroups = groupConfig.filter((g) => g.key !== group)
    const otherTotal = otherGroups.reduce(
      (sum, g) => sum + localConfig[`${g.key}Percent` as keyof BudgetRuleConfig],
      0
    )

    if (otherTotal === 0) return

    const newConfig = { ...localConfig }
    newConfig[`${group}Percent` as keyof BudgetRuleConfig] = newValue

    otherGroups.forEach((g) => {
      const currentValue = localConfig[`${g.key}Percent` as keyof BudgetRuleConfig]
      const proportion = currentValue / otherTotal
      const adjustment = Math.round(diff * proportion)
      newConfig[`${g.key}Percent` as keyof BudgetRuleConfig] = Math.max(
        0,
        Math.min(100, currentValue - adjustment)
      )
    })

    // Ensure total is exactly 100
    const newTotal = newConfig.essentialsPercent + newConfig.lifestylePercent + newConfig.investmentsPercent
    if (newTotal !== 100) {
      const adjustment = 100 - newTotal
      const adjustGroup = otherGroups[0].key
      newConfig[`${adjustGroup}Percent` as keyof BudgetRuleConfig] += adjustment
    }

    setLocalConfig(newConfig)
    setIsDirty(true)
  }

  const handleSave = () => {
    if (total !== 100) {
      toast({
        title: "Percentuais inválidos",
        description: "A soma dos percentuais deve ser exatamente 100%.",
        variant: "destructive",
      })
      return
    }

    onConfigChange(localConfig)
    setIsDirty(false)
    toast({
      title: "Configuração salva",
      description: "Sua regra percentual foi atualizada.",
    })
  }

  const handleReset = () => {
    setLocalConfig({ essentialsPercent: 50, lifestylePercent: 30, investmentsPercent: 20 })
    setIsDirty(true)
  }

  const handleCategoryClick = (categoryId: string, currentGroup: BudgetGroup | undefined, newGroup: BudgetGroup) => {
    if (currentGroup === newGroup) return
    onCategoryGroupChange(categoryId, newGroup)
    toast({
      title: "Categoria atualizada",
      description: `Categoria movida para ${groupConfig.find((g) => g.key === newGroup)?.label}.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Percentages Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Regra Percentual</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      A regra 50/30/20 é uma diretriz popular para orçamento:
                      50% para necessidades, 30% para desejos, 20% para poupança/investimentos.
                      Ajuste conforme sua realidade.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Restaurar 50/30/20
              </Button>
              {isDirty && (
                <Button size="sm" onClick={handleSave}>
                  Salvar
                </Button>
              )}
            </div>
          </div>
          <CardDescription>
            Defina como dividir sua renda mensal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Preview */}
          <div className="p-4 rounded-xl bg-muted/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Renda mensal base</span>
              <span className="font-semibold">{formatCurrency(monthlyIncome)}</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${localConfig.essentialsPercent}%` }}
              />
              <div
                className="bg-purple-500 transition-all"
                style={{ width: `${localConfig.lifestylePercent}%` }}
              />
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${localConfig.investmentsPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{localConfig.essentialsPercent}%</span>
              <span>{localConfig.lifestylePercent}%</span>
              <span>{localConfig.investmentsPercent}%</span>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-6">
            {groupConfig.map((group) => {
              const percent = localConfig[`${group.key}Percent` as keyof BudgetRuleConfig]
              const amount = (monthlyIncome * percent) / 100

              return (
                <div key={group.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-2 rounded-lg", `${group.bgColor}/10`)}>
                        <group.icon className={cn("h-4 w-4", group.color)} />
                      </div>
                      <div>
                        <p className="font-medium">{group.label}</p>
                        <p className="text-xs text-muted-foreground">{group.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-lg font-bold", group.color)}>{percent}%</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(amount)}</p>
                    </div>
                  </div>
                  <Slider
                    value={[percent]}
                    onValueChange={(value) => handleSliderChange(group.key, value)}
                    max={100}
                    min={0}
                    step={1}
                    className={cn(
                      "[&_[role=slider]]:border-2",
                      group.key === "essentials" && "[&_[role=slider]]:border-blue-500 [&_.bg-primary]:bg-blue-500",
                      group.key === "lifestyle" && "[&_[role=slider]]:border-purple-500 [&_.bg-primary]:bg-purple-500",
                      group.key === "investments" && "[&_[role=slider]]:border-emerald-500 [&_.bg-primary]:bg-emerald-500"
                    )}
                  />
                </div>
              )
            })}
          </div>

          {/* Total indicator */}
          <div
            className={cn(
              "p-3 rounded-lg text-sm text-center",
              total === 100 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
            )}
          >
            {total === 100 ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />
                Total: 100% - Configuração válida
              </span>
            ) : (
              <span>Total: {total}% - Deve somar 100%</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias por Grupo</CardTitle>
          <CardDescription>
            Defina a qual grupo cada categoria de despesa pertence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Unassigned categories */}
          {categoriesByGroup.unassigned.length > 0 && (
            <div className="p-4 rounded-lg border-2 border-dashed border-amber-500/50 bg-amber-500/5">
              <p className="text-sm font-medium text-amber-600 mb-3">
                Categorias sem grupo ({categoriesByGroup.unassigned.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {categoriesByGroup.unassigned.map((category) => (
                  <div key={category.id} className="flex items-center gap-1">
                    <Badge variant="outline" className="gap-1">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </Badge>
                    <div className="flex gap-0.5">
                      {groupConfig.map((group) => (
                        <Button
                          key={group.key}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCategoryClick(category.id, undefined, group.key)}
                        >
                          <group.icon className={cn("h-3 w-3", group.color)} />
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group columns */}
          <div className="grid md:grid-cols-3 gap-4">
            {groupConfig.map((group) => {
              const groupCategories = categoriesByGroup[group.key]

              return (
                <div
                  key={group.key}
                  className={cn(
                    "p-4 rounded-lg border-2",
                    group.borderColor,
                    `${group.bgColor}/5`
                  )}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <group.icon className={cn("h-5 w-5", group.color)} />
                    <span className={cn("font-medium", group.color)}>
                      {group.label}
                    </span>
                    <Badge variant="secondary" className="ml-auto">
                      {groupCategories.length}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {groupCategories.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma categoria
                      </p>
                    ) : (
                      groupCategories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-2 rounded-md bg-background/50"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm">{category.name}</span>
                          </div>
                          <div className="flex gap-0.5">
                            {groupConfig
                              .filter((g) => g.key !== group.key)
                              .map((otherGroup) => (
                                <Button
                                  key={otherGroup.key}
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-50 hover:opacity-100"
                                  onClick={() =>
                                    handleCategoryClick(category.id, group.key, otherGroup.key)
                                  }
                                  title={`Mover para ${otherGroup.label}`}
                                >
                                  <otherGroup.icon
                                    className={cn("h-3 w-3", otherGroup.color)}
                                  />
                                </Button>
                              ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
