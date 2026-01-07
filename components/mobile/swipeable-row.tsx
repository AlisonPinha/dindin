"use client"

import * as React from "react"
import { Edit2, Trash2, MoreHorizontal, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SwipeAction {
  icon: LucideIcon
  label: string
  onClick: () => void
  variant?: "default" | "danger" | "warning" | "success"
}

interface SwipeableRowProps {
  children: React.ReactNode
  leftActions?: SwipeAction[]
  rightActions?: SwipeAction[]
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  className?: string
  disabled?: boolean
}

export function SwipeableRow({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  className,
  disabled = false,
}: SwipeableRowProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [translateX, setTranslateX] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState<"left" | "right" | null>(null)

  const startXRef = React.useRef(0)
  const currentXRef = React.useRef(0)

  const maxLeftSwipe = leftActions.length * 70
  const maxRightSwipe = rightActions.length * 70

  const handleTouchStart = React.useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return
      startXRef.current = e.touches[0].clientX
      currentXRef.current = translateX
      setIsDragging(true)
    },
    [disabled, translateX]
  )

  const handleTouchMove = React.useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || disabled) return

      const currentX = e.touches[0].clientX
      const diff = currentX - startXRef.current
      let newTranslateX = currentXRef.current + diff

      // Limit swipe distance with resistance at edges
      if (newTranslateX > 0) {
        // Swiping right (reveal left actions)
        if (leftActions.length === 0) {
          newTranslateX = Math.min(newTranslateX * 0.3, 50)
        } else {
          newTranslateX = Math.min(newTranslateX, maxLeftSwipe + 20)
          if (newTranslateX > maxLeftSwipe) {
            newTranslateX = maxLeftSwipe + (newTranslateX - maxLeftSwipe) * 0.3
          }
        }
      } else {
        // Swiping left (reveal right actions)
        if (rightActions.length === 0) {
          newTranslateX = Math.max(newTranslateX * 0.3, -50)
        } else {
          newTranslateX = Math.max(newTranslateX, -(maxRightSwipe + 20))
          if (newTranslateX < -maxRightSwipe) {
            newTranslateX = -maxRightSwipe + (newTranslateX + maxRightSwipe) * 0.3
          }
        }
      }

      setTranslateX(newTranslateX)
    },
    [isDragging, disabled, leftActions.length, rightActions.length, maxLeftSwipe, maxRightSwipe]
  )

  const handleTouchEnd = React.useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    // Determine final position
    if (translateX > threshold && leftActions.length > 0) {
      setTranslateX(maxLeftSwipe)
      setIsOpen("left")
      onSwipeRight?.()
    } else if (translateX < -threshold && rightActions.length > 0) {
      setTranslateX(-maxRightSwipe)
      setIsOpen("right")
      onSwipeLeft?.()
    } else {
      setTranslateX(0)
      setIsOpen(null)
    }
  }, [isDragging, translateX, threshold, leftActions.length, rightActions.length, maxLeftSwipe, maxRightSwipe, onSwipeLeft, onSwipeRight])

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTranslateX(0)
        setIsOpen(null)
      }
    }

    if (isOpen) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [isOpen])

  const getActionBgColor = (variant: SwipeAction["variant"]) => {
    switch (variant) {
      case "danger":
        return "bg-danger"
      case "warning":
        return "bg-warning"
      case "success":
        return "bg-success"
      default:
        return "bg-primary"
    }
  }

  const handleActionClick = (action: SwipeAction) => {
    action.onClick()
    setTranslateX(0)
    setIsOpen(null)
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Left actions (revealed on swipe right) */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex">
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={cn(
                "flex flex-col items-center justify-center w-[70px] text-white",
                "transition-transform duration-200",
                getActionBgColor(action.variant)
              )}
              style={{
                transform: `translateX(${Math.min(0, translateX - maxLeftSwipe)}px)`,
              }}
            >
              <action.icon className="h-5 w-5 mb-1" aria-hidden="true" />
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right actions (revealed on swipe left) */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex">
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={cn(
                "flex flex-col items-center justify-center w-[70px] text-white",
                "transition-transform duration-200",
                getActionBgColor(action.variant)
              )}
              style={{
                transform: `translateX(${Math.max(0, translateX + maxRightSwipe)}px)`,
              }}
            >
              <action.icon className="h-5 w-5 mb-1" aria-hidden="true" />
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          "relative bg-background",
          isDragging ? "transition-none" : "transition-transform duration-200 ease-out"
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

// Pre-configured swipeable row for transactions
interface SwipeableTransactionRowProps {
  children: React.ReactNode
  onEdit?: () => void
  onDelete?: () => void
  onMore?: () => void
  className?: string
}

export function SwipeableTransactionRow({
  children,
  onEdit,
  onDelete,
  onMore,
  className,
}: SwipeableTransactionRowProps) {
  const rightActions: SwipeAction[] = []

  if (onEdit) {
    rightActions.push({
      icon: Edit2,
      label: "Editar",
      onClick: onEdit,
      variant: "default",
    })
  }

  if (onDelete) {
    rightActions.push({
      icon: Trash2,
      label: "Excluir",
      onClick: onDelete,
      variant: "danger",
    })
  }

  const leftActions: SwipeAction[] = []

  if (onMore) {
    leftActions.push({
      icon: MoreHorizontal,
      label: "Mais",
      onClick: onMore,
      variant: "default",
    })
  }

  return (
    <SwipeableRow
      leftActions={leftActions}
      rightActions={rightActions}
      className={className}
    >
      {children}
    </SwipeableRow>
  )
}
