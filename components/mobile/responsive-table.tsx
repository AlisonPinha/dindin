"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { SwipeableItem } from "./swipeable-item"
import { ChevronRight } from "lucide-react"

// Column definition for responsive table
export interface ResponsiveColumn<T> {
  key: keyof T | string
  header: string
  cell: (item: T) => React.ReactNode
  // For mobile card layout
  isPrimary?: boolean // Main title in card
  isSecondary?: boolean // Subtitle in card
  isValue?: boolean // Right-aligned value
  hideOnMobile?: boolean // Hide on mobile
  hideOnDesktop?: boolean // Hide on desktop (mobile-only info)
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: ResponsiveColumn<T>[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  onDelete?: (item: T) => void
  onEdit?: (item: T) => void
  emptyState?: React.ReactNode
  className?: string
  cardClassName?: string
  // Mobile card customization
  renderMobileCard?: (item: T, columns: ResponsiveColumn<T>[]) => React.ReactNode
  // Loading state
  isLoading?: boolean
  loadingRows?: number
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  onDelete,
  onEdit,
  emptyState,
  className,
  cardClassName,
  renderMobileCard,
  isLoading,
  loadingRows = 5,
}: ResponsiveTableProps<T>) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Loading skeleton
  if (isLoading) {
    if (isMobile) {
      return (
        <div className="space-y-3">
          {Array.from({ length: loadingRows }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border bg-card p-4 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
                <div className="h-5 w-20 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="rounded-lg border">
        <div className="border-b bg-muted/50 p-4">
          <div className="flex gap-4">
            {columns
              .filter((col) => !col.hideOnDesktop)
              .map((_, i) => (
                <div key={i} className="h-4 flex-1 bg-muted rounded animate-pulse" />
              ))}
          </div>
        </div>
        {Array.from({ length: loadingRows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className={cn("flex gap-4 p-4", rowIndex < loadingRows - 1 && "border-b")}
          >
            {columns
              .filter((col) => !col.hideOnDesktop)
              .map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 flex-1 bg-muted rounded animate-pulse"
                />
              ))}
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        {emptyState || (
          <p className="text-muted-foreground">Nenhum item encontrado</p>
        )}
      </div>
    )
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item) => {
          const key = keyExtractor(item)
          const primaryCol = columns.find((c) => c.isPrimary)
          const secondaryCol = columns.find((c) => c.isSecondary)
          const valueCol = columns.find((c) => c.isValue)

          const cardContent = renderMobileCard ? (
            renderMobileCard(item, columns)
          ) : (
            <div
              className={cn(
                "flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors",
                onRowClick && "cursor-pointer active:bg-muted/50",
                cardClassName
              )}
              onClick={() => onRowClick?.(item)}
            >
              <div className="flex-1 min-w-0">
                {primaryCol && (
                  <div className="font-medium truncate">
                    {primaryCol.cell(item)}
                  </div>
                )}
                {secondaryCol && (
                  <div className="text-sm text-muted-foreground truncate">
                    {secondaryCol.cell(item)}
                  </div>
                )}
                {/* Extra mobile-only columns */}
                {columns
                  .filter((c) => c.hideOnDesktop && !c.isPrimary && !c.isSecondary && !c.isValue)
                  .map((col) => (
                    <div key={String(col.key)} className="text-sm text-muted-foreground mt-1">
                      {col.cell(item)}
                    </div>
                  ))}
              </div>
              {valueCol && (
                <div className="font-semibold shrink-0">{valueCol.cell(item)}</div>
              )}
              {onRowClick && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </div>
          )

          // Wrap with swipeable if actions are available
          if (onDelete || onEdit) {
            return (
              <SwipeableItem
                key={key}
                onDelete={onDelete ? () => onDelete(item) : undefined}
                onEdit={onEdit ? () => onEdit(item) : undefined}
              >
                {cardContent}
              </SwipeableItem>
            )
          }

          return <div key={key}>{cardContent}</div>
        })}
      </div>
    )
  }

  // Desktop table view
  return (
    <div className={cn("relative w-full overflow-auto rounded-lg border", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50">
            {columns
              .filter((col) => !col.hideOnDesktop)
              .map((column) => (
                <th
                  key={String(column.key)}
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                >
                  {column.header}
                </th>
              ))}
            {(onDelete || onEdit) && (
              <th className="h-12 w-12 px-4 text-right align-middle font-medium text-muted-foreground">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={cn(
                "border-b transition-colors hover:bg-muted/50",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns
                .filter((col) => !col.hideOnDesktop)
                .map((column) => (
                  <td
                    key={String(column.key)}
                    className="p-4 align-middle"
                  >
                    {column.cell(item)}
                  </td>
                ))}
              {(onDelete || onEdit) && (
                <td className="p-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(item)
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(item)
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
