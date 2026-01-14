"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  Loader2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CurrencyInput } from "@/components/ui/currency-input"
import { cn, formatCurrency } from "@/lib/utils"
import type { Category, Account, User, TransactionType } from "@/types"

interface TransactionFormData {
  id?: string
  type: TransactionType
  amount: number
  description: string
  date: Date
  categoryId?: string
  accountId?: string
  memberId?: string
  // Credit card invoice month
  mesFatura?: string // Format: YYYY-MM-01
  // Installments
  isInstallment: boolean
  installmentCount: number
  // Recurrence
  isRecurring: boolean
  recurrenceFrequency: "weekly" | "monthly" | "yearly"
  recurrenceEndDate?: Date
  // Additional
  tags: string[]
  notes: string
  attachment?: File | string
}

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialData?: Partial<TransactionFormData>
  categories: Category[]
  accounts: Account[]
  members: User[]
  onSubmit: (data: TransactionFormData, addAnother?: boolean) => void
}

const transactionTypes: {
  value: TransactionType
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
}[] = [
  {
    value: "income",
    label: "Entrada",
    icon: ArrowDownLeft,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500",
  },
  {
    value: "expense",
    label: "Saída",
    icon: ArrowUpRight,
    color: "text-rose-500",
    bgColor: "bg-rose-500",
  },
]

const defaultFormData: TransactionFormData = {
  type: "expense",
  amount: 0,
  description: "",
  date: new Date(),
  mesFatura: undefined,
  isInstallment: false,
  installmentCount: 2,
  isRecurring: false,
  recurrenceFrequency: "monthly",
  tags: [],
  notes: "",
}

// Helper to generate invoice month options (current month + 6 months ahead)
function getInvoiceMonthOptions(baseDate: Date): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`
    const label = `${months[date.getMonth()]} ${date.getFullYear()}`
    options.push({ value, label })
  }

  return options
}

export function TransactionModal({
  open,
  onOpenChange,
  mode,
  initialData,
  categories,
  accounts,
  members,
  onSubmit,
}: TransactionModalProps) {
  const [formData, setFormData] = useState<TransactionFormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newTag, setNewTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openSections, setOpenSections] = useState({
    installments: false,
    recurrence: false,
    additional: false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setFormData({ ...defaultFormData, ...initialData })
        // Open sections if they have data
        setOpenSections({
          installments: initialData.isInstallment || false,
          recurrence: initialData.isRecurring || false,
          additional: !!(initialData.tags?.length || initialData.notes || initialData.attachment),
        })
      } else {
        setFormData(defaultFormData)
        setOpenSections({ installments: false, recurrence: false, additional: false })
      }
      setErrors({})
    }
  }, [open, mode, initialData])

  const updateField = <K extends keyof TransactionFormData>(
    field: K,
    value: TransactionFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when field is updated
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

    if (formData.amount <= 0) {
      newErrors.amount = "Valor deve ser maior que zero"
    } else if (formData.amount > 999999999) {
      newErrors.amount = "Valor muito alto"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Descrição é obrigatória"
    } else if (formData.description.trim().length < 2) {
      newErrors.description = "Descrição deve ter pelo menos 2 caracteres"
    } else if (formData.description.length > 200) {
      newErrors.description = "Descrição deve ter no máximo 200 caracteres"
    }

    if (!formData.date) {
      newErrors.date = "Data é obrigatória"
    }

    // Validar parcelas
    if (formData.isInstallment && formData.installmentCount < 2) {
      newErrors.installmentCount = "Número de parcelas deve ser pelo menos 2"
    }

    // Validar recorrência
    if (formData.isRecurring && formData.recurrenceEndDate && formData.recurrenceEndDate < formData.date) {
      newErrors.recurrenceEndDate = "Data fim deve ser após a data inicial"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (addAnother = false) => {
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData, addAnother)

      if (addAnother) {
        // Reset form but keep some fields
        setFormData({
          ...defaultFormData,
          type: formData.type,
          categoryId: formData.categoryId,
          accountId: formData.accountId,
          memberId: formData.memberId,
          date: formData.date,
        })
        setErrors({})
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag)) {
      updateField("tags", [...formData.tags, tag])
    }
    setNewTag("")
  }

  const handleRemoveTag = (tagToRemove: string) => {
    updateField(
      "tags",
      formData.tags.filter((t) => t !== tagToRemove)
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"]
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({ ...prev, attachment: "Tipo de arquivo inválido" }))
        return
      }
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, attachment: "Arquivo muito grande (máx 5MB)" }))
        return
      }
      updateField("attachment", file)
    }
  }

  const removeAttachment = () => {
    updateField("attachment", undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const installmentValue = formData.isInstallment && formData.installmentCount > 0
    ? formData.amount / formData.installmentCount
    : 0

  const filteredCategories = categories.filter((cat) => {
    if (formData.type === "income") return cat.type === "income"
    if (formData.type === "expense") return cat.type === "expense"
    return true
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "Nova Transação" : "Editar Transação"}
          </SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Adicione uma nova transação às suas finanças"
              : "Edite os detalhes da transação"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Transaction Type Toggle */}
          <div className="space-y-2">
            <Label id="transaction-type-label">Tipo de Transação</Label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="transaction-type-label">
              {transactionTypes.map((type) => {
                const isSelected = formData.type === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => updateField("type", type.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                      isSelected
                        ? `border-current ${type.color} bg-current/5`
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-full",
                        isSelected ? `${type.bgColor}/10` : "bg-muted"
                      )}
                    >
                      <type.icon
                        className={cn(
                          "h-5 w-5",
                          isSelected ? type.color : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isSelected ? type.color : "text-muted-foreground"
                      )}
                    >
                      {type.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor *</Label>
            <CurrencyInput
              id="amount"
              value={formData.amount}
              onChange={(value) => updateField("amount", value)}
              className={cn(
                "text-2xl h-14",
                errors.amount && "border-destructive focus-visible:ring-destructive"
              )}
              placeholder="0,00"
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? "amount-error" : undefined}
            />
            {errors.amount && (
              <p id="amount-error" className="text-xs text-destructive" role="alert">{errors.amount}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Ex: Supermercado, Salário, etc."
              className={cn(
                errors.description && "border-destructive focus-visible:ring-destructive"
              )}
              maxLength={200}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "description-error" : undefined}
            />
            {errors.description && (
              <p id="description-error" className="text-xs text-destructive" role="alert">{errors.description}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date-trigger">Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-trigger"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground",
                    errors.date && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                  {formData.date ? (
                    format(formData.date, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => date && updateField("date", date)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category-trigger">Categoria</Label>
            <Select
              value={formData.categoryId || ""}
              onValueChange={(value) => updateField("categoryId", value || undefined)}
            >
              <SelectTrigger id="category-trigger">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
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
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label htmlFor="account-trigger">Conta</Label>
            <Select
              value={formData.accountId || ""}
              onValueChange={(value) => {
                updateField("accountId", value || undefined)
                // Clear mesFatura when changing account
                if (value) {
                  const selectedAccount = accounts.find(a => a.id === value)
                  // If not a credit card, clear mesFatura
                  if (selectedAccount?.type !== "credit") {
                    updateField("mesFatura", undefined)
                  }
                }
              }}
            >
              <SelectTrigger id="account-trigger">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Month - Only for Credit Cards */}
          {(() => {
            const selectedAccount = accounts.find(a => a.id === formData.accountId)
            const isCartaoCredito = selectedAccount?.type === "credit"

            if (!isCartaoCredito) return null

            const invoiceOptions = getInvoiceMonthOptions(formData.date)

            return (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label htmlFor="mesFatura-trigger">Fatura do Mês</Label>
                <p className="text-xs text-muted-foreground">
                  Em qual fatura essa compra vai aparecer?
                </p>
                <Select
                  value={formData.mesFatura || invoiceOptions[0]?.value || ""}
                  onValueChange={(value) => updateField("mesFatura", value)}
                >
                  <SelectTrigger id="mesFatura-trigger">
                    <SelectValue placeholder="Selecione o mês da fatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoiceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          })()}

          {/* Member */}
          <div className="space-y-2">
            <Label htmlFor="member-trigger">Membro</Label>
            <Select
              value={formData.memberId || ""}
              onValueChange={(value) => updateField("memberId", value || undefined)}
            >
              <SelectTrigger id="member-trigger">
                <SelectValue placeholder="Quem fez a transação?" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Installments Section */}
          <Collapsible
            open={openSections.installments}
            onOpenChange={(open) =>
              setOpenSections((prev) => ({ ...prev, installments: open }))
            }
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-0 hover:bg-transparent"
              >
                <span className="font-medium">Parcelamento</span>
                {openSections.installments ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="isInstallment">Parcelado?</Label>
                <Switch
                  id="isInstallment"
                  checked={formData.isInstallment}
                  onCheckedChange={(checked) => updateField("isInstallment", checked)}
                />
              </div>

              {formData.isInstallment && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label htmlFor="installmentCount">Número de parcelas</Label>
                    <Select
                      value={String(formData.installmentCount)}
                      onValueChange={(value) =>
                        updateField("installmentCount", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => i + 2).map((num) => (
                          <SelectItem key={num} value={String(num)}>
                            {num}x
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.amount > 0 && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Preview:</p>
                      <p className="text-lg font-semibold">
                        {formData.installmentCount}x de{" "}
                        <span className="text-primary">
                          {formatCurrency(installmentValue)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Recurrence Section */}
          <Collapsible
            open={openSections.recurrence}
            onOpenChange={(open) =>
              setOpenSections((prev) => ({ ...prev, recurrence: open }))
            }
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-0 hover:bg-transparent"
              >
                <span className="font-medium">Recorrência</span>
                {openSections.recurrence ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="isRecurring">Recorrente?</Label>
                <Switch
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => updateField("isRecurring", checked)}
                />
              </div>

              {formData.isRecurring && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label>Frequência</Label>
                    <Select
                      value={formData.recurrenceFrequency}
                      onValueChange={(value) =>
                        updateField(
                          "recurrenceFrequency",
                          value as TransactionFormData["recurrenceFrequency"]
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Data fim (opcional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.recurrenceEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.recurrenceEndDate ? (
                            format(formData.recurrenceEndDate, "PPP", { locale: ptBR })
                          ) : (
                            <span>Sem data fim</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.recurrenceEndDate}
                          onSelect={(date) => updateField("recurrenceEndDate", date)}
                          locale={ptBR}
                          disabled={(date) => date < formData.date}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Additional Section */}
          <Collapsible
            open={openSections.additional}
            onOpenChange={(open) =>
              setOpenSections((prev) => ({ ...prev, additional: open }))
            }
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-0 hover:bg-transparent"
              >
                <span className="font-medium">Informações Adicionais</span>
                {openSections.additional ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="new-tag">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Adicionar tag..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddTag}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-destructive/10"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Adicione observações..."
                  rows={3}
                />
              </div>

              {/* Attachment */}
              <div className="space-y-2">
                <Label htmlFor="attachment-input">Anexo</Label>
                <p id="attachment-help" className="text-xs text-muted-foreground">
                  Formatos aceitos: JPG, PNG, GIF, PDF (máx. 5MB)
                </p>
                <input
                  id="attachment-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-describedby="attachment-help attachment-error"
                />
                {!formData.attachment ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar imagem ou PDF
                  </Button>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {typeof formData.attachment === "string" ? (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      ) : formData.attachment.type.startsWith("image/") ? (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm truncate max-w-[200px]">
                        {typeof formData.attachment === "string"
                          ? formData.attachment
                          : formData.attachment.name}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={removeAttachment}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {errors.attachment && (
                  <p id="attachment-error" className="text-xs text-destructive" role="alert">{errors.attachment}</p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-col">
          {mode === "create" && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salvar e adicionar outra
            </Button>
          )}
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {mode === "create" ? "Salvar" : "Atualizar"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
