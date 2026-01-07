"use client"

import * as React from "react"
import {
  Check,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Heart,
  Star,
  Bell,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Base animated icon wrapper
interface AnimatedIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon: LucideIcon
  size?: number
  animation?: "spin" | "pulse" | "bounce" | "ping" | "none"
  color?: string
}

export function AnimatedIcon({
  icon: Icon,
  size = 20,
  animation = "none",
  color,
  className,
  ...props
}: AnimatedIconProps) {
  const animationClasses = {
    spin: "animate-spin",
    pulse: "animate-pulse",
    bounce: "animate-bounce",
    ping: "animate-ping",
    none: "",
  }

  return (
    <span className={cn("inline-flex", className)} {...props}>
      <Icon
        size={size}
        className={cn(animationClasses[animation])}
        style={{ color }}
      />
    </span>
  )
}

// Loading spinner icon
interface SpinnerIconProps {
  size?: number
  className?: string
}

export function SpinnerIcon({ size = 20, className }: SpinnerIconProps) {
  return (
    <Loader2
      size={size}
      className={cn("animate-spin text-muted-foreground", className)}
    />
  )
}

// Success check icon with draw animation
interface SuccessIconProps {
  size?: number
  className?: string
  animated?: boolean
}

export function SuccessIcon({ size = 20, className, animated = true }: SuccessIconProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-success/10 p-1",
        animated && "scale-in",
        className
      )}
    >
      <Check
        size={size}
        className={cn("text-success", animated && "animate-checkmark")}
        strokeWidth={3}
      />
    </span>
  )
}

// Error X icon
interface ErrorIconProps {
  size?: number
  className?: string
  animated?: boolean
}

export function ErrorIcon({ size = 20, className, animated = true }: ErrorIconProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-danger/10 p-1",
        animated && "scale-in",
        className
      )}
    >
      <X
        size={size}
        className={cn("text-danger", animated && "shake")}
        strokeWidth={3}
      />
    </span>
  )
}

// Trend indicator icons
interface TrendIconProps {
  trend: "up" | "down" | "neutral"
  size?: number
  className?: string
  animated?: boolean
}

export function TrendIcon({ trend, size = 16, className, animated = true }: TrendIconProps) {
  if (trend === "neutral") {
    return (
      <span className={cn("inline-flex text-muted-foreground", className)}>
        <ArrowUp size={size} className="rotate-90" />
      </span>
    )
  }

  const isUp = trend === "up"
  const Icon = isUp ? TrendingUp : TrendingDown

  return (
    <span
      className={cn(
        "inline-flex",
        isUp ? "text-success" : "text-danger",
        animated && "animate-count-up",
        className
      )}
    >
      <Icon size={size} />
    </span>
  )
}

// Arrow indicator for changes
interface ChangeArrowProps {
  value: number
  size?: number
  className?: string
  showZero?: boolean
}

export function ChangeArrow({ value, size = 14, className, showZero = false }: ChangeArrowProps) {
  if (value === 0 && !showZero) return null

  const isPositive = value > 0
  const Icon = isPositive ? ArrowUp : ArrowDown

  return (
    <span
      className={cn(
        "inline-flex items-center",
        isPositive ? "text-success" : "text-danger",
        className
      )}
    >
      <Icon size={size} />
    </span>
  )
}

// Refresh/sync icon with spin on click
interface RefreshIconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: number
  isRefreshing?: boolean
}

export function RefreshIcon({
  size = 18,
  isRefreshing = false,
  className,
  ...props
}: RefreshIconProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center p-1 rounded-md",
        "hover:bg-muted transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isRefreshing && "pointer-events-none",
        className
      )}
      {...props}
    >
      <RefreshCw
        size={size}
        className={cn("transition-transform", isRefreshing && "animate-spin")}
      />
    </button>
  )
}

// Notification bell with badge and shake
interface NotificationBellProps {
  count?: number
  size?: number
  className?: string
  hasNew?: boolean
}

export function NotificationBell({
  count = 0,
  size = 20,
  className,
  hasNew = false,
}: NotificationBellProps) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <Bell
        size={size}
        className={cn(
          "transition-transform",
          hasNew && "animate-bounce"
        )}
      />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger text-[10px] font-medium text-white px-1">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </span>
  )
}

// Heart icon with like animation
interface HeartIconProps {
  filled?: boolean
  size?: number
  className?: string
  onClick?: () => void
}

export function HeartIcon({
  filled = false,
  size = 20,
  className,
  onClick,
}: HeartIconProps) {
  const [isAnimating, setIsAnimating] = React.useState(false)

  const handleClick = () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)
    onClick?.()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center p-1 rounded-md",
        "hover:bg-muted/50 transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <Heart
        size={size}
        className={cn(
          "transition-all duration-200",
          filled && "fill-danger text-danger",
          isAnimating && "scale-125"
        )}
      />
    </button>
  )
}

// Star rating icon
interface StarIconProps {
  filled?: boolean | "half"
  size?: number
  className?: string
  onClick?: () => void
}

export function StarIcon({
  filled = false,
  size = 18,
  className,
  onClick,
}: StarIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "inline-flex transition-transform hover:scale-110",
        onClick && "cursor-pointer",
        !onClick && "cursor-default",
        className
      )}
    >
      <Star
        size={size}
        className={cn(
          "transition-colors",
          filled === true && "fill-warning text-warning",
          filled === "half" && "fill-warning/50 text-warning",
          !filled && "text-muted-foreground"
        )}
      />
    </button>
  )
}

// Sparkle effect for achievements
interface SparkleEffectProps {
  active?: boolean
  className?: string
}

export function SparkleEffect({ active = false, className }: SparkleEffectProps) {
  if (!active) return null

  return (
    <span className={cn("absolute inset-0 pointer-events-none", className)}>
      <Sparkles
        className="absolute top-0 left-1/4 text-warning animate-ping"
        size={12}
        style={{ animationDelay: "0ms" }}
      />
      <Sparkles
        className="absolute top-1/4 right-0 text-warning animate-ping"
        size={10}
        style={{ animationDelay: "200ms" }}
      />
      <Sparkles
        className="absolute bottom-0 left-0 text-warning animate-ping"
        size={14}
        style={{ animationDelay: "400ms" }}
      />
      <Sparkles
        className="absolute bottom-1/4 right-1/4 text-warning animate-ping"
        size={8}
        style={{ animationDelay: "600ms" }}
      />
    </span>
  )
}

// Quick action flash icon
interface FlashIconProps {
  size?: number
  className?: string
  animated?: boolean
}

export function FlashIcon({ size = 16, className, animated = false }: FlashIconProps) {
  return (
    <Zap
      size={size}
      className={cn(
        "text-warning",
        animated && "animate-pulse",
        className
      )}
    />
  )
}

// Status indicator dot
interface StatusDotProps {
  status: "success" | "warning" | "danger" | "info" | "neutral"
  size?: "sm" | "md" | "lg"
  pulse?: boolean
  className?: string
}

export function StatusDot({
  status,
  size = "md",
  pulse = false,
  className,
}: StatusDotProps) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  }

  const statusClasses = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-investment",
    neutral: "bg-muted-foreground",
  }

  return (
    <span className={cn("relative inline-flex", className)}>
      <span
        className={cn(
          "rounded-full",
          sizeClasses[size],
          statusClasses[status]
        )}
      />
      {pulse && (
        <span
          className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-75",
            statusClasses[status]
          )}
        />
      )}
    </span>
  )
}
