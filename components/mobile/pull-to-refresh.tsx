"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Loader2, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  className?: string
  threshold?: number
  maxPull?: number
  disabled?: boolean
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
  threshold = 80,
  maxPull = 120,
  disabled = false,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const startY = useRef(0)
  const isAtTop = useRef(true)

  const canPull = !disabled && !isRefreshing && isAtTop.current

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!canPull) return

      const container = containerRef.current
      if (container && container.scrollTop === 0) {
        startY.current = e.touches[0].clientY
        isAtTop.current = true
        setIsPulling(true)
      } else {
        isAtTop.current = false
      }
    },
    [canPull]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return

      const currentY = e.touches[0].clientY
      const diff = currentY - startY.current

      if (diff > 0 && isAtTop.current) {
        // Apply resistance
        const resistance = 0.5
        const distance = Math.min(diff * resistance, maxPull)
        setPullDistance(distance)

        // Prevent scroll when pulling
        if (distance > 0) {
          e.preventDefault()
        }
      }
    },
    [isPulling, isRefreshing, maxPull]
  )

  const handleTouchEnd = useCallback(async () => {
    setIsPulling(false)

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(60) // Keep some distance while refreshing

      try {
        await onRefresh()
      } catch (error) {
        console.error("Refresh failed:", error)
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const pullProgress = Math.min(pullDistance / threshold, 1)
  const showIndicator = pullDistance > 10 || isRefreshing

  return (
    <div ref={containerRef} className={cn("relative overflow-auto", className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center transition-all duration-200",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: Math.max(0, pullDistance - 40),
          transform: `translateX(-50%) rotate(${pullProgress * 180}deg)`,
        }}
      >
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-lg border",
            isRefreshing && "animate-spin"
          )}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 text-primary" />
          ) : (
            <ArrowDown
              className={cn(
                "h-5 w-5 transition-transform",
                pullProgress >= 1 ? "text-primary" : "text-muted-foreground"
              )}
              style={{
                transform: pullProgress >= 1 ? "rotate(180deg)" : "none",
              }}
            />
          )}
        </div>
      </div>

      {/* Pull text */}
      {showIndicator && !isRefreshing && (
        <div
          className="absolute left-1/2 -translate-x-1/2 text-xs text-muted-foreground transition-opacity z-10"
          style={{ top: pullDistance + 10 }}
        >
          {pullProgress >= 1 ? "Solte para atualizar" : "Puxe para atualizar"}
        </div>
      )}

      {/* Content with pull offset */}
      <div
        className={cn(
          "transition-transform duration-200",
          isPulling && "transition-none"
        )}
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  )
}

// Hook version for custom implementations
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullProgress, setPullProgress] = useState(0)

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
      setPullProgress(0)
    }
  }, [onRefresh])

  return {
    isRefreshing,
    pullProgress,
    setPullProgress,
    refresh,
  }
}
