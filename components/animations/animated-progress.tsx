"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedProgressProps {
  value: number
  max?: number
  className?: string
  indicatorClassName?: string
  showValue?: boolean
  duration?: number
  delay?: number
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  indicatorClassName,
  showValue = false,
  duration = 1000,
  delay = 0,
}: AnimatedProgressProps) {
  const [currentValue, setCurrentValue] = useState(0)
  const percentage = Math.min((value / max) * 100, 100)

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentValue(percentage)
    }, delay)

    return () => clearTimeout(timer)
  }, [percentage, delay])

  return (
    <div className="relative">
      <div
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-muted",
          className
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all ease-out origin-left",
            indicatorClassName
          )}
          style={{
            width: `${currentValue}%`,
            transitionDuration: `${duration}ms`,
          }}
        />
      </div>
      {showValue && (
        <span className="absolute right-0 -top-6 text-xs font-medium text-muted-foreground">
          {Math.round(currentValue)}%
        </span>
      )}
    </div>
  )
}

// Circular progress variant
interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  className?: string
  children?: React.ReactNode
  duration?: number
  color?: string
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  children,
  duration = 1000,
  color,
}: CircularProgressProps) {
  const [currentValue, setCurrentValue] = useState(0)
  const percentage = Math.min((value / max) * 100, 100)

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (currentValue / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentValue(percentage)
    }, 100)

    return () => clearTimeout(timer)
  }, [percentage])

  return (
    <div className={cn("relative inline-flex", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color || "hsl(var(--primary))"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: `stroke-dashoffset ${duration}ms ease-out`,
          }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}

// Multi-segment progress (for 50/30/20 rule)
interface SegmentedProgressProps {
  segments: {
    value: number
    max: number
    color: string
    label: string
  }[]
  className?: string
  duration?: number
}

export function SegmentedProgress({
  segments,
  className,
  duration = 1000,
}: SegmentedProgressProps) {
  const [isAnimated, setIsAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={cn("space-y-3", className)}>
      {segments.map((segment, index) => {
        const percentage = Math.min((segment.value / segment.max) * 100, 100)

        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{segment.label}</span>
              <span className="text-muted-foreground">
                {Math.round(percentage)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all ease-out origin-left"
                style={{
                  width: isAnimated ? `${percentage}%` : "0%",
                  backgroundColor: segment.color,
                  transitionDuration: `${duration}ms`,
                  transitionDelay: `${index * 150}ms`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
