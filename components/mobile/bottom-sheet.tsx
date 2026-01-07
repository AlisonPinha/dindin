"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  description?: string
  showHandle?: boolean
  showCloseButton?: boolean
  snapPoints?: number[]
  defaultSnapPoint?: number
  className?: string
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  showHandle = true,
  showCloseButton = true,
  snapPoints = [0.5, 0.9],
  defaultSnapPoint = 0,
  className,
}: BottomSheetProps) {
  const sheetRef = React.useRef<HTMLDivElement>(null)
  const [currentSnap, setCurrentSnap] = React.useState(defaultSnapPoint)
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragOffset, setDragOffset] = React.useState(0)

  const startYRef = React.useRef(0)
  const currentYRef = React.useRef(0)

  const currentHeight = snapPoints[currentSnap] * 100

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
    currentYRef.current = 0
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startYRef.current
    currentYRef.current = diff

    // Only allow dragging down
    if (diff > 0) {
      setDragOffset(diff)
    } else {
      // Allow slight upward drag to snap to higher point
      setDragOffset(Math.max(diff, -50))
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)

    const threshold = 100

    if (dragOffset > threshold) {
      // Dragged down significantly
      if (currentSnap > 0) {
        setCurrentSnap(currentSnap - 1)
      } else {
        handleClose()
      }
    } else if (dragOffset < -threshold) {
      // Dragged up
      if (currentSnap < snapPoints.length - 1) {
        setCurrentSnap(currentSnap + 1)
      }
    }

    setDragOffset(0)
  }

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, onOpenChange])

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
          "transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "bottom-sheet-title" : undefined}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50",
          "rounded-t-2xl bg-background shadow-2xl",
          "transition-all duration-300 ease-out",
          isDragging && "transition-none",
          className
        )}
        style={{
          height: `${currentHeight}vh`,
          transform: `translateY(${Math.max(0, dragOffset)}px)`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Drag handle */}
        {showHandle && (
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="h-1 w-12 rounded-full bg-muted-foreground/30" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 pb-2">
            <div>
              {title && (
                <h2
                  id="bottom-sheet-title"
                  className="text-lg font-semibold"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-10 w-10 shrink-0"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Fechar</span>
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className="flex-1 overflow-auto px-4 pb-4"
          style={{
            maxHeight: `calc(${currentHeight}vh - ${showHandle ? "20px" : "0px"} - ${title ? "60px" : "0px"} - env(safe-area-inset-bottom))`,
          }}
        >
          {children}
        </div>
      </div>
    </>
  )
}

// Hook for programmatic control
interface UseBottomSheetReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export function useBottomSheet(initialOpen = false): UseBottomSheetReturn {
  const [isOpen, setIsOpen] = React.useState(initialOpen)

  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])
  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), [])

  return {
    isOpen,
    open,
    close,
    toggle,
  }
}
