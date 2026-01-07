"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  PiggyBank,
  TrendingUp,
  Wallet,
  Target,
  Calendar as CalendarIcon,
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
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CurrencyInput } from "@/components/ui/currency-input"
import { cn } from "@/lib/utils"
import type { GoalType } from "@/types"

interface GoalFormData {
  id?: string
  name: string
  description: string
  type: GoalType
  targetAmount: number
  currentAmount: number
  deadline?: Date
  color?: string
}

interface GoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialData?: Partial<GoalFormData>
  onSubmit: (data: GoalFormData) => void
}

const goalTypes: {
  value: GoalType
  label: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
}[] = [
  {
    value: "savings",
    label: "Economia",
    description: "Reserva de emergência, viagem, etc.",
    icon: PiggyBank,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500",
  },
  {
    value: "investment",
    label: "Investimento",
    description: "Aportes, carteira, patrimônio",
    icon: TrendingUp,
    color: "text-blue-500",
    bgColor: "bg-blue-500",
  },
  {
    value: "patrimony",
    label: "Patrimônio",
    description: "Casa, carro, bens de valor",
    icon: Wallet,
    color: "text-purple-500",
    bgColor: "bg-purple-500",
  },
  {
    value: "budget",
    label: "Orçamento",
    description: "Limites de gastos, regra 50/30/20",
    icon: Target,
    color: "text-orange-500",
    bgColor: "bg-orange-500",
  },
]

const colorOptions = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#ec4899", // pink
]

const defaultFormData: GoalFormData = {
  name: "",
  description: "",
  type: "savings",
  targetAmount: 0,
  currentAmount: 0,
}

export function GoalModal({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit,
}: GoalModalProps) {
  const [formData, setFormData] = useState<GoalFormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setFormData({ ...defaultFormData, ...initialData })
      } else {
        setFormData(defaultFormData)
      }
      setErrors({})
    }
  }, [open, mode, initialData])

  const updateField = <K extends keyof GoalFormData>(
    field: K,
    value: GoalFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório"
    }
    if (formData.targetAmount <= 0) {
      newErrors.targetAmount = "Valor da meta deve ser maior que zero"
    }
    if (formData.currentAmount < 0) {
      newErrors.currentAmount = "Valor atual não pode ser negativo"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSubmit(formData)
    onOpenChange(false)
  }

  const progress =
    formData.targetAmount > 0
      ? (formData.currentAmount / formData.targetAmount) * 100
      : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "Nova Meta" : "Editar Meta"}
          </SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Defina uma nova meta financeira"
              : "Atualize os detalhes da sua meta"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Goal Type */}
          <div className="space-y-3">
            <Label>Tipo de Meta</Label>
            <div className="grid grid-cols-2 gap-2">
              {goalTypes.map((type) => {
                const isSelected = formData.type === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateField("type", type.value)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all",
                      isSelected
                        ? `border-current ${type.color} bg-current/5`
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg flex-shrink-0",
                        isSelected ? `${type.bgColor}/10` : "bg-muted"
                      )}
                    >
                      <type.icon
                        className={cn(
                          "h-4 w-4",
                          isSelected ? type.color : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isSelected ? type.color : "text-foreground"
                        )}
                      >
                        {type.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Meta *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Ex: Reserva de emergência"
              className={cn(
                errors.name && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Descreva sua meta..."
              rows={2}
            />
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label htmlFor="targetAmount">Valor da Meta *</Label>
            <CurrencyInput
              id="targetAmount"
              value={formData.targetAmount}
              onChange={(value) => updateField("targetAmount", value)}
              className={cn(
                "text-xl h-12",
                errors.targetAmount &&
                  "border-destructive focus-visible:ring-destructive"
              )}
              placeholder="0,00"
            />
            {errors.targetAmount && (
              <p className="text-xs text-destructive">{errors.targetAmount}</p>
            )}
          </div>

          {/* Current Amount */}
          <div className="space-y-2">
            <Label htmlFor="currentAmount">Valor Atual</Label>
            <CurrencyInput
              id="currentAmount"
              value={formData.currentAmount}
              onChange={(value) => updateField("currentAmount", value)}
              className={cn(
                errors.currentAmount &&
                  "border-destructive focus-visible:ring-destructive"
              )}
              placeholder="0,00"
            />
            {errors.currentAmount && (
              <p className="text-xs text-destructive">{errors.currentAmount}</p>
            )}

            {/* Progress preview */}
            {formData.targetAmount > 0 && (
              <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progresso atual</span>
                  <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      goalTypes.find((t) => t.value === formData.type)?.bgColor ||
                        "bg-primary"
                    )}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label>Prazo (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deadline ? (
                    format(formData.deadline, "PPP", { locale: ptBR })
                  ) : (
                    <span>Sem prazo definido</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.deadline}
                  onSelect={(date) => updateField("deadline", date)}
                  locale={ptBR}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {formData.deadline && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => updateField("deadline", undefined)}
              >
                Remover prazo
              </Button>
            )}
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Cor (opcional)</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateField("color", color)}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    formData.color === color &&
                      "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
              <button
                type="button"
                onClick={() => updateField("color", undefined)}
                className={cn(
                  "h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-xs text-muted-foreground",
                  !formData.color &&
                    "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                )}
              >
                Auto
              </button>
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
            <Button type="button" className="flex-1" onClick={handleSubmit}>
              {mode === "create" ? "Criar Meta" : "Salvar Alterações"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
