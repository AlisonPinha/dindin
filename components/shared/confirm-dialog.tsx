"use client"

import * as React from "react"
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

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const isProcessing = loading || isLoading

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isProcessing}
            className={cn(
              variant === "destructive" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {isProcessing ? "Processando..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook for easier confirm dialog usage
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<{
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
    onConfirm: () => void | Promise<void>
  }>({
    title: "",
    onConfirm: () => {},
  })

  const confirm = React.useCallback(
    (options: {
      title: string
      description?: string
      confirmText?: string
      cancelText?: string
      variant?: "default" | "destructive"
    }) => {
      return new Promise<boolean>((resolve) => {
        setConfig({
          ...options,
          onConfirm: () => resolve(true),
        })
        setIsOpen(true)
      })
    },
    []
  )

  const ConfirmDialogComponent = React.useCallback(
    () => (
      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        {...config}
      />
    ),
    [isOpen, config]
  )

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
  }
}
