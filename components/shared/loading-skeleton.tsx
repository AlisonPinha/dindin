"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Re-export from animations for convenience
export {
  Skeleton,
  CardSkeleton,
  SummaryCardsSkeleton,
  TableSkeleton,
  TransactionListSkeleton,
  ChartSkeleton,
  GoalCardSkeleton,
  InvestmentCardSkeleton,
  PageSkeleton,
} from "@/components/animations/skeleton"

// Additional loading states

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  className?: string
}

export function LoadingOverlay({
  isLoading,
  children,
  className,
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  )
}

// Loading dots animation
export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}

// Inline loading text
interface LoadingTextProps {
  text?: string
  className?: string
}

export function LoadingText({
  text = "Carregando",
  className,
}: LoadingTextProps) {
  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
      <LoadingSpinner size="sm" />
      <span>{text}...</span>
    </div>
  )
}

// Button loading state helper
interface LoadingButtonContentProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
}

export function LoadingButtonContent({
  isLoading,
  children,
  loadingText = "Carregando...",
}: LoadingButtonContentProps) {
  if (isLoading) {
    return (
      <>
        <LoadingSpinner size="sm" className="mr-2" />
        {loadingText}
      </>
    )
  }
  return <>{children}</>
}

// Full page loading
export function FullPageLoading() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )
}

// Suspense fallback wrapper
interface SuspenseLoaderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function SuspenseLoader({ children, fallback }: SuspenseLoaderProps) {
  return (
    <React.Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </React.Suspense>
  )
}
