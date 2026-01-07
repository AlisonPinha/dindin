"use client"

import * as React from "react"
import {
  AlertTriangle,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Info,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

type ConfirmationType = "delete" | "warning" | "info" | "success" | "question"

interface ConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type?: ConfirmationType
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  children?: React.ReactNode
  destructive?: boolean
}

const typeConfig: Record<
  ConfirmationType,
  { icon: React.ElementType; iconColor: string; buttonVariant: "default" | "destructive" }
> = {
  delete: {
    icon: Trash2,
    iconColor: "text-destructive",
    buttonVariant: "destructive",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    buttonVariant: "default",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    buttonVariant: "default",
  },
  success: {
    icon: CheckCircle2,
    iconColor: "text-green-500",
    buttonVariant: "default",
  },
  question: {
    icon: HelpCircle,
    iconColor: "text-muted-foreground",
    buttonVariant: "default",
  },
}

export function ConfirmationModal({
  open,
  onOpenChange,
  type = "question",
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  isLoading = false,
  children,
  destructive,
}: ConfirmationModalProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const config = typeConfig[type]
  const Icon = config.icon

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const loading = isLoading || isProcessing
  const buttonVariant = destructive ? "destructive" : config.buttonVariant

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "rounded-full p-3 shrink-0",
                type === "delete" && "bg-destructive/10",
                type === "warning" && "bg-amber-500/10",
                type === "info" && "bg-blue-500/10",
                type === "success" && "bg-green-500/10",
                type === "question" && "bg-muted"
              )}
            >
              <Icon className={cn("h-6 w-6", config.iconColor)} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="text-left mt-2">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>

        {/* Custom content (preview, summary, etc) */}
        {children && <div className="py-4">{children}</div>}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              buttonVariant === "destructive" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Preview de transação parcelada
interface InstallmentPreviewProps {
  totalAmount: number
  installments: number
  startDate: Date
  description: string
}

export function InstallmentPreview({
  totalAmount,
  installments,
  startDate,
  description,
}: InstallmentPreviewProps) {
  const installmentAmount = totalAmount / installments

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  // Gerar preview das primeiras 3 parcelas
  const previewInstallments = Array.from({ length: Math.min(3, installments) }, (_, i) => {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)
    return {
      number: i + 1,
      date,
      amount: installmentAmount,
    }
  })

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Valor total:</span>
        <span className="font-semibold">{formatCurrency(totalAmount)}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Valor por parcela:</span>
        <span className="font-semibold text-primary">
          {installments}x de {formatCurrency(installmentAmount)}
        </span>
      </div>

      <div className="border-t pt-4">
        <p className="text-xs text-muted-foreground mb-2">Parcelas que serão criadas:</p>
        <div className="space-y-2">
          {previewInstallments.map((inst) => (
            <div
              key={inst.number}
              className="flex items-center justify-between text-sm bg-background rounded px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {inst.number}/{installments}
                </span>
                <span>{description}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>{formatDate(inst.date)}</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(inst.amount)}
                </span>
              </div>
            </div>
          ))}
          {installments > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              + {installments - 3} parcela{installments - 3 > 1 ? "s" : ""} restante{installments - 3 > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Delete confirmation com contagem
interface DeleteConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  itemName: string
  itemCount?: number
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
  warningMessage?: string
}

export function DeleteConfirmation({
  open,
  onOpenChange,
  title = "Excluir item",
  itemName,
  itemCount = 1,
  onConfirm,
  isLoading,
  warningMessage,
}: DeleteConfirmationProps) {
  const description =
    itemCount > 1
      ? `Você está prestes a excluir ${itemCount} itens. Esta ação não pode ser desfeita.`
      : `Você está prestes a excluir "${itemName}". Esta ação não pode ser desfeita.`

  return (
    <ConfirmationModal
      open={open}
      onOpenChange={onOpenChange}
      type="delete"
      title={title}
      description={description}
      confirmLabel={itemCount > 1 ? `Excluir ${itemCount} itens` : "Excluir"}
      onConfirm={onConfirm}
      isLoading={isLoading}
      destructive
    >
      {warningMessage && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{warningMessage}</span>
        </div>
      )}
    </ConfirmationModal>
  )
}

// Hook para usar o modal de confirmação
export function useConfirmationModal() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<Omit<ConfirmationModalProps, "open" | "onOpenChange">>({
    title: "",
    onConfirm: () => {},
  })

  const confirm = React.useCallback(
    (options: Omit<ConfirmationModalProps, "open" | "onOpenChange">) => {
      return new Promise<boolean>((resolve) => {
        setConfig({
          ...options,
          onConfirm: async () => {
            await options.onConfirm?.()
            setIsOpen(false)
            resolve(true)
          },
          onCancel: () => {
            options.onCancel?.()
            resolve(false)
          },
        })
        setIsOpen(true)
      })
    },
    []
  )

  const ConfirmationModalComponent = React.useCallback(
    () => (
      <ConfirmationModal
        open={isOpen}
        onOpenChange={setIsOpen}
        {...config}
      />
    ),
    [isOpen, config]
  )

  return {
    confirm,
    ConfirmationModal: ConfirmationModalComponent,
  }
}
