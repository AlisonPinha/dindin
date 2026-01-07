"use client"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Wallet,
  TrendingUp,
  Target,
  PieChart,
  Calendar as CalendarIcon,
  AlertTriangle,
  Check,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { CurrencyInput } from "@/components/ui/currency-input"
import { cn } from "@/lib/utils"
import type {
  AdvancedGoalType,
  AdvancedGoalConfig,
  AdvancedGoal,
  Category,
  InvestmentType,
  AlertThreshold,
} from "@/types"

interface AdvancedGoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialData?: AdvancedGoal
  categories: Category[]
  onSubmit: (data: Omit<AdvancedGoal, "id" | "userId" | "createdAt" | "updatedAt">) => void
}

const goalTypeConfig: {
  value: AdvancedGoalType
  label: string
  description: string
  icon: React.ElementType
  emoji: string
  color: string
  bgColor: string
}[] = [
  {
    value: "category_limit",
    label: "Limite de Categoria",
    description: "Definir teto de gastos para uma categoria",
    icon: Wallet,
    emoji: "💰",
    color: "text-amber-500",
    bgColor: "bg-amber-500",
  },
  {
    value: "monthly_investment",
    label: "Investimento Mensal",
    description: "Meta de aporte mensal",
    icon: TrendingUp,
    emoji: "📈",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500",
  },
  {
    value: "patrimony_target",
    label: "Patrimônio",
    description: "Alcançar X valor até data Y",
    icon: Target,
    emoji: "🎯",
    color: "text-blue-500",
    bgColor: "bg-blue-500",
  },
  {
    value: "percentage_rule",
    label: "Regra Percentual",
    description: "Manter distribuição 50/30/20",
    icon: PieChart,
    emoji: "⚖️",
    color: "text-purple-500",
    bgColor: "bg-purple-500",
  },
]

const investmentTypes: { value: InvestmentType; label: string }[] = [
  { value: "stocks", label: "Ações" },
  { value: "bonds", label: "Renda Fixa" },
  { value: "crypto", label: "Criptomoedas" },
  { value: "real_estate", label: "Fundos Imobiliários" },
  { value: "funds", label: "Fundos de Investimento" },
  { value: "other", label: "Outros" },
]

const alertThresholds: AlertThreshold[] = [70, 80, 90]

interface FormState {
  name: string
  goalType: AdvancedGoalType | null
  isActive: boolean
  // Category Limit
  categoryId: string
  maxAmount: number
  selectedAlerts: AlertThreshold[]
  // Monthly Investment
  minInvestmentAmount: number
  investmentType: InvestmentType | undefined
  // Patrimony Target
  patrimonyTarget: number
  patrimonyDeadline: Date | undefined
  includeAccounts: boolean
  includeInvestments: boolean
  // Percentage Rule
  essentialsPercent: number
  investmentsPercent: number
  lifestylePercent: number
}

const defaultFormState: FormState = {
  name: "",
  goalType: null,
  isActive: true,
  categoryId: "",
  maxAmount: 0,
  selectedAlerts: [80],
  minInvestmentAmount: 0,
  investmentType: undefined,
  patrimonyTarget: 0,
  patrimonyDeadline: undefined,
  includeAccounts: true,
  includeInvestments: true,
  essentialsPercent: 50,
  investmentsPercent: 20,
  lifestylePercent: 30,
}

export function AdvancedGoalModal({
  open,
  onOpenChange,
  mode,
  initialData,
  categories,
  onSubmit,
}: AdvancedGoalModalProps) {
  const [formState, setFormState] = useState<FormState>(defaultFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        const config = initialData.config
        setFormState({
          ...defaultFormState,
          name: initialData.name,
          goalType: config.type,
          isActive: initialData.isActive,
          ...(config.type === "category_limit" && {
            categoryId: config.categoryId,
            maxAmount: config.maxAmount,
            selectedAlerts: config.alertThresholds,
          }),
          ...(config.type === "monthly_investment" && {
            minInvestmentAmount: config.minAmount,
            investmentType: config.investmentType,
          }),
          ...(config.type === "patrimony_target" && {
            patrimonyTarget: config.targetAmount,
            patrimonyDeadline: new Date(config.deadline),
            includeAccounts: config.includeAccounts,
            includeInvestments: config.includeInvestments,
          }),
          ...(config.type === "percentage_rule" && {
            essentialsPercent: config.essentialsPercent,
            investmentsPercent: config.investmentsPercent,
            lifestylePercent: config.lifestylePercent,
          }),
        })
      } else {
        setFormState(defaultFormState)
      }
      setErrors({})
    }
  }, [open, mode, initialData])

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Handle percentage sliders - ensure they sum to 100
  const handlePercentageChange = (
    field: "essentialsPercent" | "investmentsPercent" | "lifestylePercent",
    value: number
  ) => {
    const others = {
      essentialsPercent: ["investmentsPercent", "lifestylePercent"] as const,
      investmentsPercent: ["essentialsPercent", "lifestylePercent"] as const,
      lifestylePercent: ["essentialsPercent", "investmentsPercent"] as const,
    }

    const [other1, other2] = others[field]
    const remaining = 100 - value
    const currentOther1 = formState[other1]
    const currentOther2 = formState[other2]
    const totalOthers = currentOther1 + currentOther2

    if (totalOthers === 0) {
      setFormState((prev) => ({
        ...prev,
        [field]: value,
        [other1]: Math.floor(remaining / 2),
        [other2]: Math.ceil(remaining / 2),
      }))
    } else {
      const ratio1 = currentOther1 / totalOthers
      const ratio2 = currentOther2 / totalOthers
      setFormState((prev) => ({
        ...prev,
        [field]: value,
        [other1]: Math.round(remaining * ratio1),
        [other2]: Math.round(remaining * ratio2),
      }))
    }
  }

  const percentageSum = useMemo(() => {
    return formState.essentialsPercent + formState.investmentsPercent + formState.lifestylePercent
  }, [formState.essentialsPercent, formState.investmentsPercent, formState.lifestylePercent])

  const toggleAlert = (threshold: AlertThreshold) => {
    setFormState((prev) => ({
      ...prev,
      selectedAlerts: prev.selectedAlerts.includes(threshold)
        ? prev.selectedAlerts.filter((t) => t !== threshold)
        : [...prev.selectedAlerts, threshold].sort((a, b) => a - b),
    }))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formState.name.trim()) {
      newErrors.name = "Nome é obrigatório"
    }

    if (!formState.goalType) {
      newErrors.goalType = "Selecione um tipo de meta"
    }

    if (formState.goalType === "category_limit") {
      if (!formState.categoryId) {
        newErrors.categoryId = "Selecione uma categoria"
      }
      if (formState.maxAmount <= 0) {
        newErrors.maxAmount = "Valor máximo deve ser maior que zero"
      }
    }

    if (formState.goalType === "monthly_investment") {
      if (formState.minInvestmentAmount <= 0) {
        newErrors.minInvestmentAmount = "Valor mínimo deve ser maior que zero"
      }
    }

    if (formState.goalType === "patrimony_target") {
      if (formState.patrimonyTarget <= 0) {
        newErrors.patrimonyTarget = "Valor alvo deve ser maior que zero"
      }
      if (!formState.patrimonyDeadline) {
        newErrors.patrimonyDeadline = "Data limite é obrigatória"
      }
    }

    if (formState.goalType === "percentage_rule") {
      if (percentageSum !== 100) {
        newErrors.percentageRule = "Os percentuais devem somar 100%"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate() || !formState.goalType) return

    let config: AdvancedGoalConfig

    switch (formState.goalType) {
      case "category_limit":
        config = {
          type: "category_limit",
          categoryId: formState.categoryId,
          maxAmount: formState.maxAmount,
          alertThresholds: formState.selectedAlerts,
        }
        break
      case "monthly_investment":
        config = {
          type: "monthly_investment",
          minAmount: formState.minInvestmentAmount,
          investmentType: formState.investmentType,
        }
        break
      case "patrimony_target":
        config = {
          type: "patrimony_target",
          targetAmount: formState.patrimonyTarget,
          deadline: formState.patrimonyDeadline!,
          includeAccounts: formState.includeAccounts,
          includeInvestments: formState.includeInvestments,
        }
        break
      case "percentage_rule":
        config = {
          type: "percentage_rule",
          essentialsPercent: formState.essentialsPercent,
          investmentsPercent: formState.investmentsPercent,
          lifestylePercent: formState.lifestylePercent,
        }
        break
    }

    onSubmit({
      name: formState.name,
      config,
      isActive: formState.isActive,
    })

    onOpenChange(false)
  }

  const expenseCategories = categories.filter((c) => c.type === "expense")
  const selectedTypeConfig = goalTypeConfig.find((t) => t.value === formState.goalType)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "Nova Meta Avançada" : "Editar Meta"}
          </SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Defina uma meta personalizada para suas finanças"
              : "Atualize os detalhes da sua meta"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Goal Type Selection */}
          <div className="space-y-3">
            <Label>Tipo de Meta</Label>
            <div className="grid grid-cols-2 gap-3">
              {goalTypeConfig.map((type) => {
                const isSelected = formState.goalType === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateField("goalType", type.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all",
                      isSelected
                        ? `border-current ${type.color} bg-current/5`
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <span className="text-2xl">{type.emoji}</span>
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isSelected ? type.color : "text-foreground"
                        )}
                      >
                        {type.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {type.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            {errors.goalType && (
              <p className="text-xs text-destructive">{errors.goalType}</p>
            )}
          </div>

          {/* Dynamic Fields based on Goal Type */}
          {formState.goalType && (
            <div className="space-y-6 pt-4 border-t">
              {/* Category Limit Fields */}
              {formState.goalType === "category_limit" && (
                <>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={formState.categoryId}
                      onValueChange={(value) => updateField("categoryId", value)}
                    >
                      <SelectTrigger
                        className={cn(errors.categoryId && "border-destructive")}
                      >
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && (
                      <p className="text-xs text-destructive">{errors.categoryId}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Máximo Mensal</Label>
                    <CurrencyInput
                      value={formState.maxAmount}
                      onChange={(value) => updateField("maxAmount", value)}
                      className={cn(
                        "text-lg",
                        errors.maxAmount && "border-destructive"
                      )}
                      placeholder="0,00"
                    />
                    {errors.maxAmount && (
                      <p className="text-xs text-destructive">{errors.maxAmount}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>Alertar em</Label>
                    <div className="flex gap-3">
                      {alertThresholds.map((threshold) => {
                        const isSelected = formState.selectedAlerts.includes(threshold)
                        return (
                          <button
                            key={threshold}
                            type="button"
                            onClick={() => toggleAlert(threshold)}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                              isSelected
                                ? "border-amber-500 bg-amber-500/10 text-amber-600"
                                : "border-border hover:border-muted-foreground/50"
                            )}
                          >
                            {isSelected && <Check className="h-4 w-4" />}
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium">{threshold}%</span>
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Receba alertas quando atingir esses percentuais do limite
                    </p>
                  </div>
                </>
              )}

              {/* Monthly Investment Fields */}
              {formState.goalType === "monthly_investment" && (
                <>
                  <div className="space-y-2">
                    <Label>Valor Mínimo de Aporte</Label>
                    <CurrencyInput
                      value={formState.minInvestmentAmount}
                      onChange={(value) => updateField("minInvestmentAmount", value)}
                      className={cn(
                        "text-lg",
                        errors.minInvestmentAmount && "border-destructive"
                      )}
                      placeholder="0,00"
                    />
                    {errors.minInvestmentAmount && (
                      <p className="text-xs text-destructive">
                        {errors.minInvestmentAmount}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Investimento (opcional)</Label>
                    <Select
                      value={formState.investmentType || ""}
                      onValueChange={(value) =>
                        updateField(
                          "investmentType",
                          value ? (value as InvestmentType) : undefined
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Qualquer tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Qualquer tipo</SelectItem>
                        {investmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Patrimony Target Fields */}
              {formState.goalType === "patrimony_target" && (
                <>
                  <div className="space-y-2">
                    <Label>Valor Alvo</Label>
                    <CurrencyInput
                      value={formState.patrimonyTarget}
                      onChange={(value) => updateField("patrimonyTarget", value)}
                      className={cn(
                        "text-xl h-12",
                        errors.patrimonyTarget && "border-destructive"
                      )}
                      placeholder="0,00"
                    />
                    {errors.patrimonyTarget && (
                      <p className="text-xs text-destructive">
                        {errors.patrimonyTarget}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Data Limite</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formState.patrimonyDeadline && "text-muted-foreground",
                            errors.patrimonyDeadline && "border-destructive"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formState.patrimonyDeadline ? (
                            format(formState.patrimonyDeadline, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formState.patrimonyDeadline}
                          onSelect={(date) => updateField("patrimonyDeadline", date)}
                          locale={ptBR}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.patrimonyDeadline && (
                      <p className="text-xs text-destructive">
                        {errors.patrimonyDeadline}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>Incluir no cálculo</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="includeAccounts"
                            checked={formState.includeAccounts}
                            onCheckedChange={(checked) =>
                              updateField("includeAccounts", checked as boolean)
                            }
                          />
                          <Label htmlFor="includeAccounts" className="cursor-pointer">
                            Saldo das Contas
                          </Label>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="includeInvestments"
                            checked={formState.includeInvestments}
                            onCheckedChange={(checked) =>
                              updateField("includeInvestments", checked as boolean)
                            }
                          />
                          <Label htmlFor="includeInvestments" className="cursor-pointer">
                            Investimentos
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Percentage Rule Fields */}
              {formState.goalType === "percentage_rule" && (
                <>
                  <div className="space-y-6">
                    {/* Essentials */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-blue-600">Essenciais</Label>
                        <span className="text-lg font-bold text-blue-600">
                          {formState.essentialsPercent}%
                        </span>
                      </div>
                      <Slider
                        value={[formState.essentialsPercent]}
                        onValueChange={([value]) =>
                          handlePercentageChange("essentialsPercent", value)
                        }
                        max={100}
                        step={1}
                        className="[&_[role=slider]]:bg-blue-500"
                      />
                      <p className="text-xs text-muted-foreground">
                        Moradia, alimentação, contas essenciais
                      </p>
                    </div>

                    {/* Investments */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-emerald-600">Investimentos</Label>
                        <span className="text-lg font-bold text-emerald-600">
                          {formState.investmentsPercent}%
                        </span>
                      </div>
                      <Slider
                        value={[formState.investmentsPercent]}
                        onValueChange={([value]) =>
                          handlePercentageChange("investmentsPercent", value)
                        }
                        max={100}
                        step={1}
                        className="[&_[role=slider]]:bg-emerald-500"
                      />
                      <p className="text-xs text-muted-foreground">
                        Poupança, ações, renda fixa, fundos
                      </p>
                    </div>

                    {/* Lifestyle */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-purple-600">Livres</Label>
                        <span className="text-lg font-bold text-purple-600">
                          {formState.lifestylePercent}%
                        </span>
                      </div>
                      <Slider
                        value={[formState.lifestylePercent]}
                        onValueChange={([value]) =>
                          handlePercentageChange("lifestylePercent", value)
                        }
                        max={100}
                        step={1}
                        className="[&_[role=slider]]:bg-purple-500"
                      />
                      <p className="text-xs text-muted-foreground">
                        Lazer, compras, assinaturas
                      </p>
                    </div>

                    {/* Sum indicator */}
                    <div
                      className={cn(
                        "p-3 rounded-lg flex items-center justify-between",
                        percentageSum === 100
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      <span className="font-medium">Total</span>
                      <span className="font-bold">{percentageSum}%</span>
                    </div>
                    {errors.percentageRule && (
                      <p className="text-xs text-destructive">{errors.percentageRule}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Common Fields */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="goalName">Nome da Meta</Label>
              <Input
                id="goalName"
                value={formState.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder={
                  selectedTypeConfig
                    ? `Ex: ${selectedTypeConfig.label} - ${
                        formState.goalType === "category_limit"
                          ? "Alimentação"
                          : formState.goalType === "monthly_investment"
                          ? "Renda Fixa"
                          : formState.goalType === "patrimony_target"
                          ? "Primeiro Milhão"
                          : "50/30/20"
                      }`
                    : "Nome da meta"
                }
                className={cn(errors.name && "border-destructive")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label htmlFor="isActive" className="cursor-pointer">
                  Meta Ativa
                </Label>
                <p className="text-xs text-muted-foreground">
                  Desative para pausar o acompanhamento
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formState.isActive}
                onCheckedChange={(checked) => updateField("isActive", checked)}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-col">
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleSubmit}
              disabled={!formState.goalType}
            >
              {mode === "create" ? "Criar Meta" : "Salvar Alterações"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
