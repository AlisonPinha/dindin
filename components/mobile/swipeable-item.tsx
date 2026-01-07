"use client"

import { useRef, useState, useCallback } from "react"
import { Trash2, Edit, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface SwipeAction {
  icon: React.ReactNode
  label: string
  color: string
  onClick: () => void
}

interface SwipeableItemProps {
  children: React.ReactNode
  className?: string
  onDelete?: () => void
  onEdit?: () => void
  actions?: SwipeAction[]
  deleteThreshold?: number
  disabled?: boolean
}

export function SwipeableItem({
  children,
  className,
  onDelete,
  onEdit,
  actions,
  deleteThreshold = 100,
  disabled = false,
}: SwipeableItemProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)

  // Default actions if not provided
  const defaultActions: SwipeAction[] = []
  if (onEdit) {
    defaultActions.push({
      icon: <Edit className="h-5 w-5" />,
      label: "Editar",
      color: "bg-blue-500",
      onClick: onEdit,
    })
  }
  if (onDelete) {
    defaultActions.push({
      icon: <Trash2 className="h-5 w-5" />,
      label: "Excluir",
      color: "bg-red-500",
      onClick: () => {
        setIsDeleting(true)
        setTimeout(() => onDelete(), 300)
      },
    })
  }

  const swipeActions = actions || defaultActions

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return
      startX.current = e.touches[0].clientX
      currentX.current = translateX
      setIsDragging(true)
    },
    [disabled, translateX]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || disabled) return
      const diff = e.touches[0].clientX - startX.current
      const newTranslateX = Math.min(0, Math.max(currentX.current + diff, -200))
      setTranslateX(newTranslateX)
    },
    [isDragging, disabled]
  )

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    // Snap to actions or back to closed
    const actionWidth = swipeActions.length * 70
    if (translateX < -deleteThreshold) {
      // Show actions
      setTranslateX(-actionWidth)
    } else {
      // Snap back
      setTranslateX(0)
    }
  }, [isDragging, translateX, deleteThreshold, swipeActions.length])

  const handleActionClick = (action: SwipeAction) => {
    setTranslateX(0)
    action.onClick()
  }

  // Close swipe on outside click
  const handleContainerClick = () => {
    if (translateX !== 0) {
      setTranslateX(0)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden touch-pan-y",
        isDeleting && "animate-slide-out-right",
        className
      )}
      onClick={handleContainerClick}
    >
      {/* Action buttons (behind content) */}
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        {swipeActions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleActionClick(action)}
            className={cn(
              "flex w-[70px] flex-col items-center justify-center text-white transition-transform",
              action.color
            )}
            style={{
              transform: `translateX(${Math.min(0, translateX + 200)}px)`,
            }}
          >
            {action.icon}
            <span className="mt-1 text-xs">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div
        className={cn(
          "relative bg-background",
          isDragging ? "transition-none" : "transition-transform duration-200"
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}

        {/* Swipe indicator */}
        {translateX === 0 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30 lg:hidden">
            <MoreHorizontal className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  )
}
