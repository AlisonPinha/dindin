"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Calendar as CalendarIcon,
  LineChart,
  PiggyBank,
  Coins,
  Building2,
  Landmark,
  HelpCircle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { CurrencyInput } from "@/components/ui/currency-input"
import { cn } from "@/lib/utils"
import type { Investment, InvestmentType } from "./investments-table"

interface InvestmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialData?: Investment
  onSubmit: (data: Omit<Investment, "id">) => void
}

const typeConfig: {
  value: InvestmentType
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
}[] = [
  { value: "stocks", label: "Ações", icon: LineChart, color: "text-blue-500", bgColor: "bg-blue-500" },
  { value: "bonds", label: "Renda Fixa", icon: PiggyBank, color: "text-emerald-500", bgColor: "bg-emerald-500" },
  { value: "crypto", label: "Cripto", icon: Coins, color: "text-orange-500", bgColor: "bg-orange-500" },
  { value: "real_estate", label: "FIIs", icon: Building2, color: "text-purple-500", bgColor: "bg-purple-500" },
  { value: "funds", label: "Fundos", icon: Landmark, color: "text-cyan-500", bgColor: "bg-cyan-500" },
  { value: "other", label: "Outros", icon: HelpCircle, color: "text-slate-500", bgColor: "bg-slate-500" },
]

const commonInstitutions = [
  "XP Investimentos",
  "Nubank",
  "Rico",
  "Clear",
  "BTG Pactual",
  "Inter",
  "Itaú",
  "Bradesco",
  "Santander",
  "Banco do Brasil",
  "Binance",
  "Mercado Bitcoin",
  "Outro",
]

interface FormState {
  name: string
  ticker: string
  type: InvestmentType
  institution: string
  customInstitution: string
  purchasePrice: number
  currentPrice: number
  quantity: number
  purchaseDate: Date | undefined
  maturityDate: Date | undefined
}

const defaultFormState: FormState = {
  name: "",
  ticker: "",
  type: "stocks",
  institution: "",
  customInstitution: "",
  purchasePrice: 0,
  currentPrice: 0,
  quantity: 1,
  purchaseDate: new Date(),
  maturityDate: undefined,
}

export function InvestmentModal({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit,
}: InvestmentModalProps) {
  const [formState, setFormState] = useState<FormState>(defaultFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        const isCustomInstitution = !commonInstitutions.includes(initialData.institution)
        setFormState({
          name: initialData.name,
          ticker: initialData.ticker || "",
          type: initialData.type,
          institution: isCustomInstitution ? "Outro" : initialData.institution,
          customInstitution: isCustomInstitution ? initialData.institution : "",
          purchasePrice: initialData.purchasePrice,
          currentPrice: initialData.currentPrice,
          quantity: initialData.quantity,
          purchaseDate: new Date(initialData.purchaseDate),
          maturityDate: initialData.maturityDate ? new Date(initialData.maturityDate) : undefined,
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formState.name.trim()) {
      newErrors.name = "Nome é obrigatório"
    }

    if (!formState.institution) {
      newErrors.institution = "Selecione uma instituição"
    }

    if (formState.institution === "Outro" && !formState.customInstitution.trim()) {
      newErrors.customInstitution = "Informe a instituição"
    }

    if (formState.purchasePrice <= 0) {
      newErrors.purchasePrice = "Preço de compra deve ser maior que zero"
    }

    if (formState.currentPrice <= 0) {
      newErrors.currentPrice = "Preço atual deve ser maior que zero"
    }

    if (formState.quantity <= 0) {
      newErrors.quantity = "Quantidade deve ser maior que zero"
    }

    if (!formState.purchaseDate) {
      newErrors.purchaseDate = "Data de aplicação é obrigatória"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    const institution = formState.institution === "Outro"
      ? formState.customInstitution
      : formState.institution

    onSubmit({
      name: formState.name,
      ticker: formState.ticker || undefined,
      type: formState.type,
      institution,
      purchasePrice: formState.purchasePrice,
      currentPrice: formState.currentPrice,
      quantity: formState.quantity,
      purchaseDate: formState.purchaseDate!,
      maturityDate: formState.maturityDate,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Novo Investimento" : "Editar Investimento"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Adicione um novo investimento à sua carteira"
              : "Atualize as informações do investimento"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Type Selection */}
          <div className="space-y-3">
            <Label>Tipo de Investimento</Label>
            <div className="grid grid-cols-3 gap-2">
              {typeConfig.map((type) => {
                const isSelected = formState.type === type.value
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateField("type", type.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                      isSelected
                        ? `border-current ${type.color} ${type.bgColor}/10`
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isSelected ? type.color : "text-muted-foreground")} />
                    <span className={cn(
                      "text-xs font-medium",
                      isSelected ? type.color : "text-muted-foreground"
                    )}>
                      {type.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Investimento *</Label>
            <Input
              id="name"
              value={formState.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder={
                formState.type === "stocks"
                  ? "Ex: PETR4, VALE3"
                  : formState.type === "bonds"
                  ? "Ex: CDB 120% CDI"
                  : formState.type === "crypto"
                  ? "Ex: Bitcoin, Ethereum"
                  : formState.type === "real_estate"
                  ? "Ex: HGLG11, MXRF11"
                  : "Nome do investimento"
              }
              className={cn(errors.name && "border-destructive")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Ticker (optional) */}
          {(formState.type === "stocks" || formState.type === "real_estate") && (
            <div className="space-y-2">
              <Label htmlFor="ticker">Código/Ticker</Label>
              <Input
                id="ticker"
                value={formState.ticker}
                onChange={(e) => updateField("ticker", e.target.value.toUpperCase())}
                placeholder="Ex: PETR4"
                maxLength={10}
              />
            </div>
          )}

          {/* Institution */}
          <div className="space-y-2">
            <Label>Instituição *</Label>
            <Select
              value={formState.institution}
              onValueChange={(value) => updateField("institution", value)}
            >
              <SelectTrigger className={cn(errors.institution && "border-destructive")}>
                <SelectValue placeholder="Selecione a instituição" />
              </SelectTrigger>
              <SelectContent>
                {commonInstitutions.map((inst) => (
                  <SelectItem key={inst} value={inst}>
                    {inst}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.institution && (
              <p className="text-xs text-destructive">{errors.institution}</p>
            )}

            {formState.institution === "Outro" && (
              <Input
                value={formState.customInstitution}
                onChange={(e) => updateField("customInstitution", e.target.value)}
                placeholder="Nome da instituição"
                className={cn("mt-2", errors.customInstitution && "border-destructive")}
              />
            )}
            {errors.customInstitution && (
              <p className="text-xs text-destructive">{errors.customInstitution}</p>
            )}
          </div>

          {/* Values Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.000001"
                value={formState.quantity}
                onChange={(e) => updateField("quantity", parseFloat(e.target.value) || 0)}
                className={cn(errors.quantity && "border-destructive")}
              />
              {errors.quantity && (
                <p className="text-xs text-destructive">{errors.quantity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Preço Compra *</Label>
              <CurrencyInput
                value={formState.purchasePrice}
                onChange={(value) => updateField("purchasePrice", value)}
                className={cn(errors.purchasePrice && "border-destructive")}
                placeholder="0,00"
              />
              {errors.purchasePrice && (
                <p className="text-xs text-destructive">{errors.purchasePrice}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Preço Atual *</Label>
              <CurrencyInput
                value={formState.currentPrice}
                onChange={(value) => updateField("currentPrice", value)}
                className={cn(errors.currentPrice && "border-destructive")}
                placeholder="0,00"
              />
              {errors.currentPrice && (
                <p className="text-xs text-destructive">{errors.currentPrice}</p>
              )}
            </div>
          </div>

          {/* Totals Preview */}
          <div className="p-3 rounded-lg bg-muted/50 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Aplicado</p>
              <p className="font-semibold">
                R$ {(formState.purchasePrice * formState.quantity).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Valor Atual</p>
              <p className={cn(
                "font-semibold",
                formState.currentPrice >= formState.purchasePrice
                  ? "text-emerald-500"
                  : "text-rose-500"
              )}>
                R$ {(formState.currentPrice * formState.quantity).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Aplicação *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formState.purchaseDate && "text-muted-foreground",
                      errors.purchaseDate && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formState.purchaseDate ? (
                      format(formState.purchaseDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formState.purchaseDate}
                    onSelect={(date) => updateField("purchaseDate", date)}
                    locale={ptBR}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.purchaseDate && (
                <p className="text-xs text-destructive">{errors.purchaseDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Vencimento (opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formState.maturityDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formState.maturityDate ? (
                      format(formState.maturityDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formState.maturityDate}
                    onSelect={(date) => updateField("maturityDate", date)}
                    locale={ptBR}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {mode === "create" ? "Adicionar" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
