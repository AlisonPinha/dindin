"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

interface ResponsiveChartProps {
  children: React.ReactNode
  className?: string
  // Minimum width for chart content
  minWidth?: number
  // Desktop height
  height?: number
  // Mobile height (typically shorter)
  mobileHeight?: number
  // Show scroll indicator on mobile
  showScrollHint?: boolean
}

export function ResponsiveChart({
  children,
  className,
  minWidth = 400,
  height = 350,
  mobileHeight = 250,
  showScrollHint = true,
}: ResponsiveChartProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [canScroll, setCanScroll] = React.useState(false)
  const [hasScrolled, setHasScrolled] = React.useState(false)

  // Check if content overflows
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const checkScroll = () => {
      setCanScroll(container.scrollWidth > container.clientWidth)
    }

    checkScroll()
    window.addEventListener("resize", checkScroll)
    return () => window.removeEventListener("resize", checkScroll)
  }, [])

  // Track scroll
  const handleScroll = () => {
    if (!hasScrolled) {
      setHasScrolled(true)
    }
  }

  const chartHeight = isMobile ? mobileHeight : height

  return (
    <div className={cn("relative", className)}>
      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="overflow-x-auto scrollbar-thin"
        style={{ WebkitOverflowScrolling: "touch" }}
        onScroll={handleScroll}
      >
        <div
          style={{
            minWidth: isMobile ? minWidth : "100%",
            height: chartHeight,
          }}
        >
          {children}
        </div>
      </div>

      {/* Scroll hint indicator for mobile */}
      {isMobile && showScrollHint && canScroll && !hasScrolled && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="flex items-center gap-1 bg-gradient-to-l from-background via-background to-transparent pl-8 pr-2 py-2">
            <div className="flex items-center gap-0.5 text-muted-foreground animate-pulse">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Simplified chart wrapper for common use cases
interface SimpleChartContainerProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  className?: string
  action?: React.ReactNode
}

export function SimpleChartContainer({
  children,
  title,
  subtitle,
  className,
  action,
}: SimpleChartContainerProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 sm:p-6", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="font-semibold text-responsive-base">{title}</h3>
            )}
            {subtitle && (
              <p className="text-responsive-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      <ResponsiveChart>{children}</ResponsiveChart>
    </div>
  )
}

// Legend component for mobile-friendly chart legends
interface ChartLegendProps {
  items: {
    color: string
    label: string
    value?: string | number
  }[]
  className?: string
  layout?: "horizontal" | "vertical" | "grid"
}

export function ChartLegend({
  items,
  className,
  layout = "horizontal",
}: ChartLegendProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  const layoutClasses = {
    horizontal: "flex flex-wrap gap-4",
    vertical: "flex flex-col gap-2",
    grid: "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-4",
  }

  // On mobile with many items, use grid layout
  const effectiveLayout =
    isMobile && items.length > 4 && layout === "horizontal" ? "grid" : layout

  return (
    <div className={cn(layoutClasses[effectiveLayout], className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground truncate">{item.label}</span>
          {item.value !== undefined && (
            <span className="font-medium">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  )
}

// Summary stats row for charts
interface ChartStatsProps {
  stats: {
    label: string
    value: string | number
    trend?: "up" | "down" | "neutral"
    trendValue?: string
  }[]
  className?: string
}

export function ChartStats({ stats, className }: ChartStatsProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        stats.length === 2 && "grid-cols-2",
        stats.length === 3 && "grid-cols-3",
        stats.length >= 4 && "grid-cols-2 sm:grid-cols-4",
        className
      )}
    >
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <p className="text-responsive-xl font-bold">{stat.value}</p>
          <p className="text-responsive-xs text-muted-foreground">
            {stat.label}
          </p>
          {stat.trendValue && (
            <p
              className={cn(
                "text-xs font-medium",
                stat.trend === "up" && "text-emerald-500",
                stat.trend === "down" && "text-rose-500",
                stat.trend === "neutral" && "text-muted-foreground"
              )}
            >
              {stat.trend === "up" && "↑ "}
              {stat.trend === "down" && "↓ "}
              {stat.trendValue}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
