"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipPayload {
  name: string
  value: number
  color?: string
  fill?: string
  payload?: Record<string, unknown>
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  formatter?: (value: number, name: string) => string
  labelFormatter?: (label: string) => string
  className?: string
  showTotal?: boolean
}

export function CustomTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  className,
  showTotal = false,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const formatValue = (value: number, name: string): string => {
    if (formatter) {
      return formatter(value, name)
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatLabel = (lbl: string): string => {
    if (labelFormatter) {
      return labelFormatter(lbl)
    }
    return lbl
  }

  const total = showTotal
    ? payload.reduce((sum, entry) => sum + (entry.value || 0), 0)
    : null

  return (
    <div
      className={cn(
        "rounded-lg border bg-popover px-3 py-2 shadow-lg",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
    >
      {label && (
        <p className="text-sm font-medium text-foreground mb-1.5 border-b pb-1.5">
          {formatLabel(label)}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium tabular-nums">
              {formatValue(entry.value, entry.name)}
            </span>
          </div>
        ))}
        {showTotal && total !== null && (
          <div className="flex items-center justify-between gap-4 text-sm pt-1.5 mt-1.5 border-t">
            <span className="font-medium">Total</span>
            <span className="font-semibold tabular-nums">{formatValue(total, "total")}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Tooltip para porcentagens
interface PercentageTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  total?: number
}

export function PercentageTooltip({
  active,
  payload,
  label,
  total,
}: PercentageTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatPercent = (value: number, totalVal?: number): string => {
    if (!totalVal || totalVal === 0) return "0%"
    return `${((value / totalVal) * 100).toFixed(1)}%`
  }

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-lg animate-in fade-in-0 zoom-in-95">
      {label && (
        <p className="text-sm font-medium text-foreground mb-1.5 border-b pb-1.5">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium tabular-nums">{formatCurrency(entry.value)}</span>
              {total && (
                <span className="text-xs text-muted-foreground">
                  ({formatPercent(entry.value, total)})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Tooltip para comparação
interface ComparisonTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  comparisonLabel?: string
}

export function ComparisonTooltip({
  active,
  payload,
  label,
  comparisonLabel = "vs. mês anterior",
}: ComparisonTooltipProps) {
  if (!active || !payload || payload.length < 2) {
    return null
  }

  const current = payload[0]?.value || 0
  const previous = payload[1]?.value || 0
  const diff = current - previous
  const percentChange = previous !== 0 ? ((diff / previous) * 100).toFixed(1) : "0"

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-lg animate-in fade-in-0 zoom-in-95">
      {label && (
        <p className="text-sm font-medium text-foreground mb-1.5 border-b pb-1.5">
          {label}
        </p>
      )}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Atual</span>
          <span className="font-semibold tabular-nums">{formatCurrency(current)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">{comparisonLabel}</span>
          <span className="tabular-nums">{formatCurrency(previous)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm pt-1.5 mt-1.5 border-t">
          <span className="font-medium">Variação</span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              diff > 0 && "text-income",
              diff < 0 && "text-expense"
            )}
          >
            {diff > 0 ? "+" : ""}
            {percentChange}%
          </span>
        </div>
      </div>
    </div>
  )
}
