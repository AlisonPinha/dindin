"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Search,
  Check,
  Undo2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CurrencyInput } from "@/components/ui/currency-input"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { cn, generateId } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

type TransactionType = "expense" | "income" | "transfer"

interface QuickTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: TransactionType
}

// Mock categories - in real app, fetch from API/store
const mockCategories = {
  expense: [
    { id: "1", name: "Alimentação", color: "#f97316", icon: "UtensilsCrossed", recentCount: 15 },
    { id: "2", name: "Transporte", color: "#eab308", icon: "Car", recentCount: 12 },
    { id: "3", name: "Moradia", color: "#ef4444", icon: "Home", recentCount: 8 },
    { id: "4", name: "Lazer", color: "#06b6d4", icon: "Gamepad2", recentCount: 6 },
    { id: "5", name: "Saúde", color: "#ec4899", icon: "Heart", recentCount: 5 },
    { id: "6", name: "Compras", color: "#d946ef", icon: "ShoppingBag", recentCount: 4 },
    { id: "7", name: "Educação", color: "#8b5cf6", icon: "GraduationCap", recentCount: 3 },
    { id: "8", name: "Assinaturas", color: "#6366f1", icon: "CreditCard", recentCount: 2 },
    { id: "9", name: "Restaurantes", color: "#f43f5e", icon: "Coffee", recentCount: 1 },
    { id: "10", name: "Outros", color: "#64748b", icon: "MoreHorizontal", recentCount: 0 },
  ],
  income: [
    { id: "11", name: "Salário", color: "#22c55e", icon: "Briefcase", recentCount: 10 },
    { id: "12", name: "Freelance", color: "#10b981", icon: "Laptop", recentCount: 5 },
    { id: "13", name: "Rendimentos", color: "#3b82f6", icon: "TrendingUp", recentCount: 3 },
    { id: "14", name: "Outros", color: "#8b5cf6", icon: "Plus", recentCount: 1 },
  ],
}

// Mock accounts - in real app, fetch from API/store
const mockAccounts = [
  { id: "1", name: "Nubank", color: "#8b5cf6" },
  { id: "2", name: "Itaú", color: "#f97316" },
  { id: "3", name: "Cartão Nubank", color: "#a855f7" },
]

const typeConfig = {
  expense: {
    title: "Despesa Rápida",
    icon: ArrowDownCircle,
    color: "text-rose-500",
    bgColor: "bg-rose-500",
    buttonColor: "bg-rose-500 hover:bg-rose-600",
  },
  income: {
    title: "Receita Rápida",
    icon: ArrowUpCircle,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500",
    buttonColor: "bg-emerald-500 hover:bg-emerald-600",
  },
  transfer: {
    title: "Transferência",
    icon: ArrowLeftRight,
    color: "text-blue-500",
    bgColor: "bg-blue-500",
    buttonColor: "bg-blue-500 hover:bg-blue-600",
  },
}

interface FormState {
  value: number
  categoryId: string
  description: string
  accountId: string
  toAccountId: string
}

const defaultFormState: FormState = {
  value: 0,
  categoryId: "",
  description: "",
  accountId: "",
  toAccountId: "",
}

export function QuickTransactionModal({
  open,
  onOpenChange,
  type,
}: QuickTransactionModalProps) {
  const { toast } = useToast()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [formState, setFormState] = useState<FormState>(defaultFormState)
  const [categorySearch, setCategorySearch] = useState("")
  const [showCategorySearch, setShowCategorySearch] = useState(false)
  const valueInputRef = useRef<HTMLInputElement>(null)

  const config = typeConfig[type]
  const Icon = config.icon

  // Get categories for current type
  const categories = useMemo(() => {
    if (type === "transfer") return []
    return mockCategories[type] || []
  }, [type])

  // Filter and sort categories (recent first, then search)
  const filteredCategories = useMemo(() => {
    let cats = [...categories]

    // Sort by recent usage
    cats.sort((a, b) => b.recentCount - a.recentCount)

    // Filter by search
    if (categorySearch) {
      cats = cats.filter((c) =>
        c.name.toLowerCase().includes(categorySearch.toLowerCase())
      )
    }

    return cats
  }, [categories, categorySearch])

  // Get top 5 recent categories
  const recentCategories = useMemo(() => {
    return filteredCategories.slice(0, 5)
  }, [filteredCategories])

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormState(defaultFormState)
      setCategorySearch("")
      setShowCategorySearch(false)
      // Focus value input after a short delay
      setTimeout(() => {
        valueInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (formState.value <= 0) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor maior que zero.",
        variant: "destructive",
      })
      return
    }

    if (type !== "transfer" && !formState.categoryId) {
      toast({
        title: "Categoria obrigatória",
        description: "Selecione uma categoria para a transação.",
        variant: "destructive",
      })
      return
    }

    if (!formState.accountId) {
      toast({
        title: "Conta obrigatória",
        description: "Selecione uma conta para a transação.",
        variant: "destructive",
      })
      return
    }

    if (type === "transfer" && !formState.toAccountId) {
      toast({
        title: "Conta destino obrigatória",
        description: "Selecione a conta de destino.",
        variant: "destructive",
      })
      return
    }

    if (type === "transfer" && formState.accountId === formState.toAccountId) {
      toast({
        title: "Contas iguais",
        description: "A conta de origem e destino devem ser diferentes.",
        variant: "destructive",
      })
      return
    }

    // Create transaction (mock - in real app, call API)
    const transactionId = generateId()
    const category = categories.find((c) => c.id === formState.categoryId)
    const account = mockAccounts.find((a) => a.id === formState.accountId)
    const toAccount = mockAccounts.find((a) => a.id === formState.toAccountId)

    // Close modal
    onOpenChange(false)

    // Show success toast with undo option
    const typeLabels = {
      expense: "Despesa",
      income: "Receita",
      transfer: "Transferência",
    }

    const description =
      type === "transfer"
        ? `R$ ${formState.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de ${account?.name} para ${toAccount?.name}`
        : `R$ ${formState.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em ${category?.name}`

    toast({
      title: `${typeLabels[type]} registrada`,
      description,
      action: (
        <ToastAction
          altText="Desfazer"
          onClick={() => handleUndo(transactionId)}
          className="gap-1"
        >
          <Undo2 className="h-3 w-3" />
          Desfazer
        </ToastAction>
      ),
    })
  }

  const handleUndo = (_transactionId: string) => {
    // TODO: Implement actual undo logic - delete the transaction via API
    toast({
      title: "Transação desfeita",
      description: "A transação foi removida com sucesso.",
    })
  }

  const content = (
    <div className="space-y-4 py-2">
      {/* Value Input - Most prominent */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs uppercase tracking-wide">
          Valor
        </Label>
        <div className="relative">
          <CurrencyInput
            ref={valueInputRef}
            value={formState.value}
            onChange={(value) => updateField("value", value)}
            className={cn(
              "h-14 text-2xl font-bold",
              type === "expense" && "focus-visible:ring-rose-500",
              type === "income" && "focus-visible:ring-emerald-500",
              type === "transfer" && "focus-visible:ring-blue-500"
            )}
            placeholder="0,00"
          />
        </div>
      </div>

      {/* Category Selection (not for transfer) */}
      {type !== "transfer" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Categoria
            </Label>
            <button
              type="button"
              onClick={() => setShowCategorySearch(!showCategorySearch)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Search className="h-3 w-3" />
              Buscar
            </button>
          </div>

          {showCategorySearch && (
            <Input
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Buscar categoria..."
              className="h-9"
              autoFocus
            />
          )}

          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            {(showCategorySearch ? filteredCategories : recentCategories).map(
              (category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => updateField("categoryId", category.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all",
                    formState.categoryId === category.id
                      ? "ring-2 ring-offset-2 ring-offset-background"
                      : "hover:bg-muted"
                  )}
                  style={{
                    backgroundColor:
                      formState.categoryId === category.id
                        ? category.color + "20"
                        : undefined,
                    borderColor: category.color,
                    border: "1px solid",
                    ...(formState.categoryId === category.id && {
                      ringColor: category.color,
                    }),
                  }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                  {formState.categoryId === category.id && (
                    <Check className="h-3 w-3" style={{ color: category.color }} />
                  )}
                </button>
              )
            )}
          </div>

          {showCategorySearch && filteredCategories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhuma categoria encontrada
            </p>
          )}
        </div>
      )}

      {/* Account Selection */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs uppercase tracking-wide">
          {type === "transfer" ? "Conta origem" : "Conta"}
        </Label>
        <Select
          value={formState.accountId}
          onValueChange={(value) => updateField("accountId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a conta" />
          </SelectTrigger>
          <SelectContent>
            {mockAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: account.color }}
                  />
                  {account.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* To Account (transfer only) */}
      {type === "transfer" && (
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wide">
            Conta destino
          </Label>
          <Select
            value={formState.toAccountId}
            onValueChange={(value) => updateField("toAccountId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta destino" />
            </SelectTrigger>
            <SelectContent>
              {mockAccounts
                .filter((a) => a.id !== formState.accountId)
                .map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: account.color }}
                      />
                      {account.name}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Description (optional) */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs uppercase tracking-wide">
          Descrição <span className="text-muted-foreground/60">(opcional)</span>
        </Label>
        <Input
          value={formState.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Ex: Almoço com a família"
          className="h-10"
        />
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        className={cn("w-full h-12 text-base font-semibold gap-2", config.buttonColor)}
      >
        <Check className="h-5 w-5" />
        Salvar
      </Button>
    </div>
  )

  // Desktop: Dialog, Mobile: Drawer
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  config.bgColor
                )}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span>{config.title}</span>
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-center gap-2">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                config.bgColor
              )}
            >
              <Icon className="h-4 w-4 text-white" />
            </div>
            <span>{config.title}</span>
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8">{content}</div>
      </DrawerContent>
    </Drawer>
  )
}
