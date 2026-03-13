"use client"

import { Smartphone, Zap, FileText, PenLine } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { TransactionOrigin } from "@/types"

const ORIGIN_CONFIG: Record<
  TransactionOrigin,
  { label: string; icon: typeof Smartphone; className: string; tooltip: string }
> = {
  manual: {
    label: "Manual",
    icon: PenLine,
    className: "border-gray-500/50 text-gray-600 bg-gray-500/10",
    tooltip: "Adicionada manualmente",
  },
  quick_add: {
    label: "Quick",
    icon: Zap,
    className: "border-yellow-500/50 text-yellow-600 bg-yellow-500/10",
    tooltip: "Via Quick Add",
  },
  apple_pay: {
    label: "Apple Pay",
    icon: Smartphone,
    className: "border-indigo-500/50 text-indigo-600 bg-indigo-500/10",
    tooltip: "Via Apple Pay",
  },
  ocr_import: {
    label: "OCR",
    icon: FileText,
    className: "border-teal-500/50 text-teal-600 bg-teal-500/10",
    tooltip: "Importada via OCR",
  },
}

interface OriginBadgeProps {
  origin: TransactionOrigin | undefined
  showManual?: boolean
  compact?: boolean
}

export function OriginBadge({ origin, showManual = false, compact = false }: OriginBadgeProps) {
  const effectiveOrigin = origin || "manual"

  // Don't show badge for manual transactions unless explicitly requested
  if (effectiveOrigin === "manual" && !showManual) return null

  const config = ORIGIN_CONFIG[effectiveOrigin]
  const Icon = config.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn("h-5 gap-1 cursor-help", config.className)}
        >
          <Icon className="h-3 w-3" />
          {!compact && <span className="text-[10px]">{config.label}</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{config.tooltip}</TooltipContent>
    </Tooltip>
  )
}
