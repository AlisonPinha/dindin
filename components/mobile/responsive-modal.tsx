"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface ResponsiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  // Mobile-specific props
  fullscreenOnMobile?: boolean
  // Desktop-specific props
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

const maxWidthClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  full: "sm:max-w-full",
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  fullscreenOnMobile = true,
  maxWidth = "lg",
}: ResponsiveModalProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Mobile: Full-screen drawer
  if (isMobile && fullscreenOnMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[100dvh] max-h-[100dvh] rounded-none">
          {/* Header with close button */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              {title && (
                <DrawerTitle className="text-lg font-semibold">
                  {title}
                </DrawerTitle>
              )}
              {description && (
                <DrawerDescription className="text-sm text-muted-foreground">
                  {description}
                </DrawerDescription>
              )}
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <X className="h-5 w-5" />
                <span className="sr-only">Fechar</span>
              </Button>
            </DrawerClose>
          </div>

          {/* Scrollable content */}
          <div className={cn("flex-1 overflow-auto p-4", className)}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <DrawerFooter className="border-t px-4 py-3 safe-area-inset-bottom">
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    )
  }

  // Mobile: Regular drawer (not fullscreen)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            {title && <DrawerTitle>{title}</DrawerTitle>}
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          <div className={cn("px-4 pb-4", className)}>{children}</div>
          {footer && <DrawerFooter className="pt-2">{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop: Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(maxWidthClasses[maxWidth], className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}

// Utility components for consistent modal structure
interface ResponsiveModalSectionProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveModalSection({
  children,
  className,
}: ResponsiveModalSectionProps) {
  return <div className={cn("space-y-4", className)}>{children}</div>
}

// Action buttons footer preset
interface ResponsiveModalActionsProps {
  onCancel?: () => void
  onConfirm?: () => void
  cancelText?: string
  confirmText?: string
  confirmVariant?: "default" | "destructive"
  isLoading?: boolean
  disabled?: boolean
}

export function ResponsiveModalActions({
  onCancel,
  onConfirm,
  cancelText = "Cancelar",
  confirmText = "Confirmar",
  confirmVariant = "default",
  isLoading = false,
  disabled = false,
}: ResponsiveModalActionsProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <Button
          onClick={onConfirm}
          variant={confirmVariant}
          disabled={disabled || isLoading}
          className="w-full h-12"
        >
          {isLoading ? "Carregando..." : confirmText}
        </Button>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isLoading}
            className="w-full h-12"
          >
            {cancelText}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex gap-2 justify-end">
      {onCancel && (
        <Button onClick={onCancel} variant="outline" disabled={isLoading}>
          {cancelText}
        </Button>
      )}
      <Button
        onClick={onConfirm}
        variant={confirmVariant}
        disabled={disabled || isLoading}
      >
        {isLoading ? "Carregando..." : confirmText}
      </Button>
    </div>
  )
}
