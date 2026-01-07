"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ChartWrapperProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
  height?: number | string
}

export function ChartWrapper({
  children,
  className,
  title,
  subtitle,
  loading = false,
  empty = false,
  emptyMessage = "Sem dados para exibir",
  height = 300,
}: ChartWrapperProps) {
  if (loading) {
    return (
      <div className={cn("w-full", className)} style={{ height }}>
        {(title || subtitle) && (
          <div className="mb-4">
            {title && <div className="h-6 w-32 skeleton-shimmer rounded mb-1" />}
            {subtitle && <div className="h-4 w-48 skeleton-shimmer rounded" />}
          </div>
        )}
        <div className="w-full h-full skeleton-shimmer rounded-lg" />
      </div>
    )
  }

  if (empty) {
    return (
      <div className={cn("w-full", className)} style={{ height }}>
        {(title || subtitle) && (
          <div className="mb-4">
            {title && <h3 className="font-semibold">{title}</h3>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        <div className="w-full h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
          {emptyMessage}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full animate-chart-pie", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="font-semibold">{title}</h3>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div style={{ height }}>{children}</div>
    </div>
  )
}
