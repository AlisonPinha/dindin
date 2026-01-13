"use client"

import * as React from "react"
import { cn, formatCurrency } from "@/lib/utils"

interface LegendItem {
  value: string
  color: string
  payload?: {
    value?: number
    [key: string]: unknown
  }
}

interface ChartLegendProps {
  items: LegendItem[]
  onItemClick?: (item: LegendItem, index: number) => void
  activeItems?: string[]
  className?: string
  layout?: "horizontal" | "vertical"
  showValues?: boolean
  valueFormatter?: (value: number) => string
}

export function ChartLegend({
  items,
  onItemClick,
  activeItems,
  className,
  layout = "horizontal",
  showValues = false,
  valueFormatter,
}: ChartLegendProps) {
  const isInteractive = !!onItemClick

  const formatValue = (value: number): string => {
    if (valueFormatter) {
      return valueFormatter(value)
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const isActive = (item: LegendItem): boolean => {
    if (!activeItems) return true
    return activeItems.includes(item.value)
  }

  return (
    <div
      className={cn(
        "flex gap-3 flex-wrap",
        layout === "vertical" && "flex-col",
        className
      )}
    >
      {items.map((item, index) => {
        const active = isActive(item)

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onItemClick?.(item, index)}
            disabled={!isInteractive}
            className={cn(
              "flex items-center gap-2 text-sm transition-all",
              isInteractive && "cursor-pointer hover:opacity-80",
              !isInteractive && "cursor-default",
              !active && "opacity-40"
            )}
          >
            <span
              className={cn(
                "h-3 w-3 rounded-sm shrink-0 transition-transform",
                isInteractive && active && "scale-100",
                isInteractive && !active && "scale-75"
              )}
              style={{ backgroundColor: item.color }}
            />
            <span className={cn("text-muted-foreground", active && "text-foreground")}>
              {item.value}
            </span>
            {showValues && item.payload?.value !== undefined && (
              <span className="font-medium tabular-nums">
                {formatValue(item.payload.value)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// Legend with percentage breakdown
interface PercentageLegendItem {
  name: string
  value: number
  color: string
}

interface PercentageLegendProps {
  items: PercentageLegendItem[]
  total?: number
  className?: string
  onItemClick?: (item: PercentageLegendItem, index: number) => void
  activeItems?: string[]
}

export function PercentageLegend({
  items,
  total,
  className,
  onItemClick,
  activeItems,
}: PercentageLegendProps) {
  const calculatedTotal = total || items.reduce((sum, item) => sum + item.value, 0)
  const isInteractive = !!onItemClick


  const getPercentage = (value: number): number => {
    if (calculatedTotal === 0) return 0
    return (value / calculatedTotal) * 100
  }

  const isActive = (item: PercentageLegendItem): boolean => {
    if (!activeItems) return true
    return activeItems.includes(item.name)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => {
        const percentage = getPercentage(item.value)
        const active = isActive(item)

        return (
          <button
            key={item.name}
            type="button"
            onClick={() => onItemClick?.(item, index)}
            disabled={!isInteractive}
            className={cn(
              "w-full text-left transition-opacity",
              isInteractive && "cursor-pointer hover:opacity-80",
              !isInteractive && "cursor-default",
              !active && "opacity-40"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                <span className="font-medium tabular-nums">{formatCurrency(item.value)}</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
