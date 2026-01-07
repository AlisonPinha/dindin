"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
  containerHeight?: number | string
  onEndReached?: () => void
  endReachedThreshold?: number
  keyExtractor?: (item: T, index: number) => string
  emptyComponent?: React.ReactNode
  headerComponent?: React.ReactNode
  footerComponent?: React.ReactNode
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 5,
  className,
  containerHeight = "100%",
  onEndReached,
  endReachedThreshold = 200,
  keyExtractor,
  emptyComponent,
  headerComponent,
  footerComponent,
}: VirtualListProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = React.useState(0)
  const [containerClientHeight, setContainerClientHeight] = React.useState(0)
  const hasCalledEndReached = React.useRef(false)

  // Calculate visible range
  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerClientHeight) / itemHeight) + overscan
  )

  const visibleItems = React.useMemo(() => {
    const result = []
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        result.push({
          item: items[i],
          index: i,
          style: {
            position: "absolute" as const,
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          },
        })
      }
    }
    return result
  }, [items, startIndex, endIndex, itemHeight])

  // Handle scroll
  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      setScrollTop(target.scrollTop)

      // Check if we've reached the end
      if (onEndReached) {
        const distanceFromEnd =
          totalHeight - (target.scrollTop + target.clientHeight)

        if (distanceFromEnd < endReachedThreshold && !hasCalledEndReached.current) {
          hasCalledEndReached.current = true
          onEndReached()
        } else if (distanceFromEnd >= endReachedThreshold) {
          hasCalledEndReached.current = false
        }
      }
    },
    [onEndReached, endReachedThreshold, totalHeight]
  )

  // Update container height on mount and resize
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateHeight = () => {
      setContainerClientHeight(container.clientHeight)
    }

    updateHeight()

    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [])

  // Empty state
  if (items.length === 0 && emptyComponent) {
    return (
      <div
        ref={containerRef}
        className={cn("overflow-auto", className)}
        style={{ height: containerHeight }}
      >
        {emptyComponent}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {headerComponent}

      <div
        style={{
          height: totalHeight,
          position: "relative",
        }}
      >
        {visibleItems.map(({ item, index, style }) => (
          <div
            key={keyExtractor ? keyExtractor(item, index) : index}
            style={style}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {footerComponent}
    </div>
  )
}

// Simpler hook version for custom implementations
interface UseVirtualListOptions {
  itemCount: number
  itemHeight: number
  containerHeight: number
  overscan?: number
}

interface UseVirtualListReturn {
  startIndex: number
  endIndex: number
  totalHeight: number
  offsetY: number
  visibleCount: number
  scrollTo: (index: number) => void
  scrollToTop: () => void
  scrollToBottom: () => void
}

export function useVirtualList(
  scrollTop: number,
  {
    itemCount,
    itemHeight,
    containerHeight,
    overscan = 5,
  }: UseVirtualListOptions
): UseVirtualListReturn {
  const totalHeight = itemCount * itemHeight

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleCount = endIndex - startIndex + 1
  const offsetY = startIndex * itemHeight

  const scrollTo = React.useCallback(
    (index: number) => {
      const targetScroll = index * itemHeight
      return targetScroll
    },
    [itemHeight]
  )

  const scrollToTop = React.useCallback(() => {
    return 0
  }, [])

  const scrollToBottom = React.useCallback(() => {
    return totalHeight - containerHeight
  }, [totalHeight, containerHeight])

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    visibleCount,
    scrollTo,
    scrollToTop,
    scrollToBottom,
  }
}

// Fixed height list with infinite scroll
interface InfiniteVirtualListProps<T> extends Omit<VirtualListProps<T>, "onEndReached"> {
  hasMore: boolean
  isLoading: boolean
  loadMore: () => void
  loadingComponent?: React.ReactNode
}

export function InfiniteVirtualList<T>({
  items,
  hasMore,
  isLoading,
  loadMore,
  loadingComponent,
  ...props
}: InfiniteVirtualListProps<T>) {
  const handleEndReached = React.useCallback(() => {
    if (hasMore && !isLoading) {
      loadMore()
    }
  }, [hasMore, isLoading, loadMore])

  return (
    <VirtualList
      {...props}
      items={items}
      onEndReached={handleEndReached}
      footerComponent={
        isLoading ? (
          loadingComponent || (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )
        ) : null
      }
    />
  )
}
