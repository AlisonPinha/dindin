"use client"

import * as React from "react"

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  maxPull?: number
  disabled?: boolean
}

interface UsePullToRefreshReturn {
  containerRef: React.RefObject<HTMLDivElement>
  pullDistance: number
  isRefreshing: boolean
  isPulling: boolean
  progress: number
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = React.useState(0)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isPulling, setIsPulling] = React.useState(false)

  const startYRef = React.useRef(0)
  const currentYRef = React.useRef(0)

  const progress = Math.min(pullDistance / threshold, 1)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container || disabled) return

    let touchStartY = 0
    let touchCurrentY = 0
    let isTouchActive = false

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh when at the top of the scroll container
      if (container.scrollTop > 0) return

      touchStartY = e.touches[0].clientY
      touchCurrentY = touchStartY
      isTouchActive = true
      startYRef.current = touchStartY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchActive || isRefreshing) return

      touchCurrentY = e.touches[0].clientY
      const diff = touchCurrentY - touchStartY

      // Only pull down, not up
      if (diff <= 0) {
        setPullDistance(0)
        setIsPulling(false)
        return
      }

      // Check if we're at the top of the scroll
      if (container.scrollTop > 0) {
        setPullDistance(0)
        setIsPulling(false)
        return
      }

      // Prevent default scroll behavior when pulling
      e.preventDefault()

      // Apply resistance as we pull further
      const resistance = 0.5
      let distance = diff * resistance

      // Cap at maxPull with extra resistance
      if (distance > maxPull) {
        distance = maxPull + (distance - maxPull) * 0.2
      }

      setPullDistance(distance)
      setIsPulling(true)
    }

    const handleTouchEnd = async () => {
      if (!isTouchActive) return
      isTouchActive = false

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        setPullDistance(threshold) // Hold at threshold during refresh

        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
          setPullDistance(0)
        }
      } else {
        setPullDistance(0)
      }

      setIsPulling(false)
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd, { passive: true })
    container.addEventListener("touchcancel", handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
      container.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [disabled, isRefreshing, maxPull, onRefresh, pullDistance, threshold])

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isPulling,
    progress,
  }
}

// Hook for swipe between months
interface UseSwipeNavigationOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  disabled?: boolean
}

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
  disabled = false,
}: UseSwipeNavigationOptions) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [swipeOffset, setSwipeOffset] = React.useState(0)
  const [isSwiping, setIsSwiping] = React.useState(false)

  const startXRef = React.useRef(0)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container || disabled) return

    let touchStartX = 0
    let isTouchActive = false

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
      startXRef.current = touchStartX
      isTouchActive = true
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchActive) return

      const currentX = e.touches[0].clientX
      const diff = currentX - touchStartX

      // Apply resistance
      const resistance = 0.4
      const offset = diff * resistance

      setSwipeOffset(offset)
      setIsSwiping(true)
    }

    const handleTouchEnd = () => {
      if (!isTouchActive) return
      isTouchActive = false

      if (swipeOffset > threshold) {
        onSwipeRight?.()
      } else if (swipeOffset < -threshold) {
        onSwipeLeft?.()
      }

      setSwipeOffset(0)
      setIsSwiping(false)
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchmove", handleTouchMove, { passive: true })
    container.addEventListener("touchend", handleTouchEnd, { passive: true })
    container.addEventListener("touchcancel", handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
      container.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [disabled, onSwipeLeft, onSwipeRight, swipeOffset, threshold])

  return {
    containerRef,
    swipeOffset,
    isSwiping,
  }
}
