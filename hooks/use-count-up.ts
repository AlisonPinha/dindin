"use client"

import { useEffect, useState, useRef, useCallback } from "react"

interface UseCountUpOptions {
  start?: number
  end: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  separator?: string
  decimalSeparator?: string
  enabled?: boolean
  onComplete?: () => void
}

interface UseCountUpReturn {
  value: number
  formattedValue: string
  isAnimating: boolean
  reset: () => void
  start: () => void
}

export function useCountUp({
  start = 0,
  end,
  duration = 1000,
  decimals = 0,
  prefix = "",
  suffix = "",
  separator = ".",
  decimalSeparator = ",",
  enabled = true,
  onComplete,
}: UseCountUpOptions): UseCountUpReturn {
  const [value, setValue] = useState(enabled ? start : end)
  const [isAnimating, setIsAnimating] = useState(false)
  const frameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const hasAnimatedRef = useRef(false)

  // Easing function for smooth animation
  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4)
  }

  const formatNumber = useCallback(
    (num: number): string => {
      const fixedNum = num.toFixed(decimals)
      const [intPart, decPart] = fixedNum.split(".")

      // Add thousand separators
      const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)

      const result = decPart
        ? `${formattedInt}${decimalSeparator}${decPart}`
        : formattedInt

      return `${prefix}${result}${suffix}`
    },
    [decimals, separator, decimalSeparator, prefix, suffix]
  )

  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutQuart(progress)

      const currentValue = start + (end - start) * easedProgress
      setValue(currentValue)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setValue(end)
        setIsAnimating(false)
        hasAnimatedRef.current = true
        onComplete?.()
      }
    },
    [start, end, duration, onComplete]
  )

  const startAnimation = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }
    startTimeRef.current = null
    setValue(start)
    setIsAnimating(true)
    frameRef.current = requestAnimationFrame(animate)
  }, [start, animate])

  const reset = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }
    startTimeRef.current = null
    setValue(start)
    setIsAnimating(false)
    hasAnimatedRef.current = false
  }, [start])

  // Auto-start on mount if enabled
  useEffect(() => {
    if (enabled && !hasAnimatedRef.current) {
      startAnimation()
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [enabled, startAnimation])

  // Update when end value changes
  useEffect(() => {
    if (enabled && hasAnimatedRef.current) {
      startAnimation()
    }
  }, [end, enabled, startAnimation])

  return {
    value,
    formattedValue: formatNumber(value),
    isAnimating,
    reset,
    start: startAnimation,
  }
}

// Hook for currency animation (Brazilian Real)
interface UseCurrencyCountUpOptions {
  value: number
  duration?: number
  enabled?: boolean
  onComplete?: () => void
}

export function useCurrencyCountUp({
  value,
  duration = 1000,
  enabled = true,
  onComplete,
}: UseCurrencyCountUpOptions) {
  return useCountUp({
    end: value,
    duration,
    decimals: 2,
    prefix: "R$ ",
    separator: ".",
    decimalSeparator: ",",
    enabled,
    onComplete,
  })
}

// Hook for percentage animation
interface UsePercentageCountUpOptions {
  value: number
  duration?: number
  decimals?: number
  enabled?: boolean
  onComplete?: () => void
}

export function usePercentageCountUp({
  value,
  duration = 800,
  decimals = 1,
  enabled = true,
  onComplete,
}: UsePercentageCountUpOptions) {
  return useCountUp({
    end: value,
    duration,
    decimals,
    suffix: "%",
    separator: ".",
    decimalSeparator: ",",
    enabled,
    onComplete,
  })
}
