"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedNumberProps {
  value: number
  duration?: number
  formatOptions?: Intl.NumberFormatOptions
  prefix?: string
  suffix?: string
  className?: string
  decimals?: number
}

export function AnimatedNumber({
  value,
  duration = 1000,
  formatOptions,
  prefix = "",
  suffix = "",
  className,
  decimals = 0,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const previousValue = useRef(0)
  const animationRef = useRef<number>()

  useEffect(() => {
    const startValue = previousValue.current
    const endValue = value
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3)

      const currentValue = startValue + (endValue - startValue) * easeOut
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        previousValue.current = endValue
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, duration])

  const formattedValue = formatOptions
    ? new Intl.NumberFormat("pt-BR", formatOptions).format(displayValue)
    : displayValue.toFixed(decimals)

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  )
}

// Currency variant
interface AnimatedCurrencyProps {
  value: number
  duration?: number
  className?: string
  showSign?: boolean
}

export function AnimatedCurrency({
  value,
  duration = 1000,
  className,
  showSign = false,
}: AnimatedCurrencyProps) {
  const sign = showSign && value > 0 ? "+" : ""

  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      prefix={`${sign}R$ `}
      formatOptions={{
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }}
      className={className}
    />
  )
}

// Percentage variant
interface AnimatedPercentageProps {
  value: number
  duration?: number
  className?: string
  showSign?: boolean
}

export function AnimatedPercentage({
  value,
  duration = 1000,
  className,
  showSign = false,
}: AnimatedPercentageProps) {
  const sign = showSign && value > 0 ? "+" : ""

  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      prefix={sign}
      suffix="%"
      decimals={1}
      className={className}
    />
  )
}
