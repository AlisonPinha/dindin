"use client"

import { useEffect, useState, useCallback } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  X,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { NotificationType, NotificationAction } from "@/types"

interface NotificationToastProps {
  id: string
  title: string
  message: string
  type: NotificationType
  action?: NotificationAction
  duration?: number
  onDismiss: (id: string) => void
  onAction?: () => void
}

const typeConfig: Record<
  NotificationType,
  {
    icon: React.ElementType
    bgColor: string
    borderColor: string
    iconColor: string
    iconBg: string
  }
> = {
  info: {
    icon: Info,
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900",
  },
  danger: {
    icon: XCircle,
    bgColor: "bg-rose-50 dark:bg-rose-950/50",
    borderColor: "border-rose-200 dark:border-rose-800",
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-100 dark:bg-rose-900",
  },
  success: {
    icon: CheckCircle2,
    bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900",
  },
}

export function NotificationToast({
  id,
  title,
  message,
  type,
  action,
  duration = 5000,
  onDismiss,
  onAction,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [progress, setProgress] = useState(100)

  const config = typeConfig[type]
  const Icon = config.icon

  const handleDismiss = useCallback(() => {
    setIsLeaving(true)
    setTimeout(() => onDismiss(id), 300)
  }, [id, onDismiss])

  useEffect(() => {
    // Enter animation
    const enterTimer = setTimeout(() => setIsVisible(true), 10)

    // Progress bar animation
    const startTime = Date.now()
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)

      if (remaining <= 0) {
        clearInterval(progressInterval)
      }
    }, 50)

    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      handleDismiss()
    }, duration)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(dismissTimer)
      clearInterval(progressInterval)
    }
  }, [duration, handleDismiss])

  const handleAction = () => {
    if (action?.onClick) {
      action.onClick()
    }
    if (onAction) {
      onAction()
    }
    if (action?.href) {
      window.location.href = action.href
    }
    handleDismiss()
  }

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all duration-300",
        config.bgColor,
        config.borderColor,
        isVisible && !isLeaving
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Animated Icon */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              config.iconBg
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 animate-in zoom-in-50 duration-300",
                config.iconColor
              )}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {message}
            </p>

            {/* Action Button */}
            {action && (
              <button
                onClick={handleAction}
                className={cn(
                  "mt-2 inline-flex items-center gap-1 text-sm font-medium transition-colors",
                  config.iconColor,
                  "hover:underline"
                )}
              >
                {action.label}
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-muted/30">
        <div
          className={cn(
            "h-full transition-all duration-100 ease-linear",
            type === "info" && "bg-blue-500",
            type === "warning" && "bg-amber-500",
            type === "danger" && "bg-rose-500",
            type === "success" && "bg-emerald-500"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

// Container for stacking multiple toasts
interface NotificationToastContainerProps {
  children: React.ReactNode
}

export function NotificationToastContainer({
  children,
}: NotificationToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {children}
    </div>
  )
}
