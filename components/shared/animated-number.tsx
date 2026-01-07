"use client"

import * as React from "react"
import { useCountUp, useCurrencyCountUp, usePercentageCountUp } from "@/hooks/use-count-up"
import { cn } from "@/lib/utils"

interface AnimatedNumberProps {
  value: number
  className?: string
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  enabled?: boolean
}

export function AnimatedNumber({
  value,
  className,
  duration = 1000,
  decimals = 0,
  prefix = "",
  suffix = "",
  enabled = true,
}: AnimatedNumberProps) {
  const { formattedValue, isAnimating } = useCountUp({
    end: value,
    duration,
    decimals,
    prefix,
    suffix,
    enabled,
  })

  return (
    <span
      className={cn(
        "tabular-nums transition-opacity",
        isAnimating && "animate-count-up",
        className
      )}
    >
      {formattedValue}
    </span>
  )
}

interface AnimatedCurrencyProps {
  value: number
  className?: string
  duration?: number
  enabled?: boolean
  showSign?: boolean
  colorize?: boolean
}

export function AnimatedCurrency({
  value,
  className,
  duration = 1000,
  enabled = true,
  showSign = false,
  colorize = false,
}: AnimatedCurrencyProps) {
  const { formattedValue, isAnimating } = useCurrencyCountUp({
    value: Math.abs(value),
    duration,
    enabled,
  })

  const isPositive = value >= 0
  const sign = showSign ? (isPositive ? "+" : "-") : value < 0 ? "-" : ""

  return (
    <span
      className={cn(
        "tabular-nums transition-opacity",
        isAnimating && "animate-count-up",
        colorize && isPositive && "text-income",
        colorize && !isPositive && "text-expense",
        className
      )}
    >
      {sign}
      {formattedValue}
    </span>
  )
}

interface AnimatedPercentageProps {
  value: number
  className?: string
  duration?: number
  decimals?: number
  enabled?: boolean
  showSign?: boolean
  colorize?: boolean
}

export function AnimatedPercentage({
  value,
  className,
  duration = 800,
  decimals = 1,
  enabled = true,
  showSign = false,
  colorize = false,
}: AnimatedPercentageProps) {
  const { formattedValue, isAnimating } = usePercentageCountUp({
    value: Math.abs(value),
    duration,
    decimals,
    enabled,
  })

  const isPositive = value >= 0
  const sign = showSign ? (isPositive ? "+" : "-") : value < 0 ? "-" : ""

  return (
    <span
      className={cn(
        "tabular-nums transition-opacity",
        isAnimating && "animate-count-up",
        colorize && isPositive && "text-income",
        colorize && !isPositive && "text-expense",
        className
      )}
    >
      {sign}
      {formattedValue}
    </span>
  )
}

// Compact number display (1.5K, 2.3M, etc.)
interface AnimatedCompactNumberProps {
  value: number
  className?: string
  duration?: number
  enabled?: boolean
}

export function AnimatedCompactNumber({
  value,
  className,
  duration = 1000,
  enabled = true,
}: AnimatedCompactNumberProps) {
  const formatCompact = (num: number): { value: number; suffix: string } => {
    const absNum = Math.abs(num)
    if (absNum >= 1_000_000_000) {
      return { value: num / 1_000_000_000, suffix: "B" }
    }
    if (absNum >= 1_000_000) {
      return { value: num / 1_000_000, suffix: "M" }
    }
    if (absNum >= 1_000) {
      return { value: num / 1_000, suffix: "K" }
    }
    return { value: num, suffix: "" }
  }

  const { value: compactValue, suffix } = formatCompact(value)

  const { formattedValue, isAnimating } = useCountUp({
    end: compactValue,
    duration,
    decimals: suffix ? 1 : 0,
    suffix,
    enabled,
  })

  return (
    <span
      className={cn(
        "tabular-nums transition-opacity",
        isAnimating && "animate-count-up",
        className
      )}
    >
      {formattedValue}
    </span>
  )
}
