"use client"

import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Pause,
  Play,
  Check,
  Target,
  Wallet,
  TrendingUp,
  PiggyBank,
  Flame,
  Calendar,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCurrency, cn } from "@/lib/utils"
import { differenceInDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Goal, GoalType, GoalHealthStatus } from "@/types"

interface GoalCardEnhancedProps {
  goal: Goal
  onEdit?: (goal: Goal) => void
  onDelete?: (id: string) => void
  onStatusChange?: (id: string, status: Goal["status"]) => void
}

const goalTypeConfig: Record<
  GoalType,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  savings: {
    label: "Economia",
    icon: PiggyBank,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  investment: {
    label: "Investimento",
    icon: TrendingUp,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  patrimony: {
    label: "Patrimônio",
    icon: Wallet,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  budget: {
    label: "Orçamento",
    icon: Target,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
}

const healthStatusConfig: Record<
  GoalHealthStatus,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  on_track: {
    label: "No caminho",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  attention: {
    label: "Atenção",
    icon: AlertTriangle,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  risk: {
    label: "Risco",
    icon: AlertCircle,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
}

function calculateHealthStatus(goal: Goal): GoalHealthStatus {
  const progress = (goal.currentAmount / goal.targetAmount) * 100

  if (!goal.deadline) {
    if (progress >= 50) return "on_track"
    if (progress >= 25) return "attention"
    return "risk"
  }

  const daysRemaining = differenceInDays(new Date(goal.deadline), new Date())
  const totalDays = differenceInDays(new Date(goal.deadline), new Date(goal.createdAt))
  const timeProgress = totalDays > 0 ? ((totalDays - daysRemaining) / totalDays) * 100 : 100

  if (progress >= timeProgress) return "on_track"
  if (progress >= timeProgress * 0.7) return "attention"
  return "risk"
}

function CircularProgress({
  progress,
  size = 80,
  strokeWidth = 8,
  color,
}: {
  progress: number
  size?: number
  strokeWidth?: number
  color: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

export function GoalCardEnhanced({
  goal,
  onEdit,
  onDelete,
  onStatusChange,
}: GoalCardEnhancedProps) {
  const progress = (goal.currentAmount / goal.targetAmount) * 100
  const typeConfig = goalTypeConfig[goal.type || "savings"]
  const TypeIcon = typeConfig.icon
  const healthStatus = calculateHealthStatus(goal)
  const healthConfig = healthStatusConfig[healthStatus]
  const HealthIcon = healthConfig.icon

  const daysRemaining = goal.deadline
    ? differenceInDays(new Date(goal.deadline), new Date())
    : null

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-md",
        goal.status === "completed" && "border-emerald-500/50",
        goal.status === "paused" && "opacity-60"
      )}
    >
      {/* Type indicator bar */}
      <div
        className={cn("absolute top-0 left-0 right-0 h-1", typeConfig.bgColor)}
        style={{
          backgroundColor: goal.color || undefined,
        }}
      />

      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Icon and info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={cn(
                "flex-shrink-0 p-2.5 rounded-xl",
                typeConfig.bgColor
              )}
              style={{
                backgroundColor: goal.color ? `${goal.color}20` : undefined,
              }}
            >
              <TypeIcon
                className={cn("h-5 w-5", typeConfig.color)}
                style={{ color: goal.color || undefined }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{goal.name}</h3>
                <Badge
                  variant="secondary"
                  className={cn("text-xs", typeConfig.bgColor, typeConfig.color)}
                >
                  {typeConfig.label}
                </Badge>
              </div>

              {goal.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {goal.description}
                </p>
              )}

              {/* Status and streak */}
              <div className="flex items-center gap-3 mt-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                          healthConfig.bgColor,
                          healthConfig.color
                        )}
                      >
                        <HealthIcon className="h-3 w-3" />
                        <span>{healthConfig.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {healthStatus === "on_track" &&
                        "Você está no ritmo para atingir sua meta!"}
                      {healthStatus === "attention" &&
                        "Atenção: o progresso está um pouco abaixo do esperado"}
                      {healthStatus === "risk" &&
                        "Risco: é necessário acelerar para atingir a meta no prazo"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {goal.streak && goal.streak > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-xs text-orange-500">
                          <Flame className="h-3 w-3" />
                          <span>{goal.streak} meses</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {goal.streak} meses consecutivos batendo a meta!
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Progress circle and menu */}
          <div className="flex items-start gap-2">
            <CircularProgress
              progress={progress}
              size={70}
              strokeWidth={6}
              color={typeConfig.color}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Ações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(goal)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                {goal.status === "active" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => onStatusChange?.(goal.id, "paused")}
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pausar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onStatusChange?.(goal.id, "completed")}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Concluir
                    </DropdownMenuItem>
                  </>
                )}
                {goal.status === "paused" && (
                  <DropdownMenuItem
                    onClick={() => onStatusChange?.(goal.id, "active")}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Retomar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete?.(goal.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Values */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Atual</p>
              <p className="font-semibold text-base">
                {formatCurrency(goal.currentAmount)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-xs">Meta</p>
              <p className="font-semibold text-base">
                {formatCurrency(goal.targetAmount)}
              </p>
            </div>
            {goal.deadline && (
              <div className="text-right">
                <p className="text-muted-foreground text-xs flex items-center justify-end gap-1">
                  <Calendar className="h-3 w-3" />
                  Prazo
                </p>
                <p
                  className={cn(
                    "font-semibold text-base",
                    daysRemaining !== null &&
                      daysRemaining < 30 &&
                      daysRemaining > 0 &&
                      "text-amber-500",
                    daysRemaining !== null && daysRemaining <= 0 && "text-rose-500"
                  )}
                >
                  {format(new Date(goal.deadline), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
