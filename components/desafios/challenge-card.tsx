"use client"

import { Trophy, Flame, Clock, CheckCircle, MoreHorizontal, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Challenge } from "@/types"

interface ChallengeCardProps {
  challenge: Challenge
  onComplete?: (id: string) => void
  onDelete?: (id: string) => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function ChallengeCard({ challenge, onComplete, onDelete }: ChallengeCardProps) {
  const now = new Date()
  const endDate = new Date(challenge.endDate)
  const startDate = new Date(challenge.startDate)
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const daysElapsed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  const progress = challenge.targetValue && challenge.targetValue > 0
    ? Math.min(100, (challenge.currentValue / challenge.targetValue) * 100)
    : Math.min(100, (daysElapsed / totalDays) * 100)

  const isActive = challenge.status === "active"
  const isCompleted = challenge.status === "completed"

  return (
    <Card className={cn(isCompleted && "border-emerald-500/30 bg-emerald-500/5")}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{challenge.name}</h3>
            {challenge.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{challenge.description}</p>
            )}
          </div>
          {isActive && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onComplete?.(challenge.id)} className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(challenge.id)} className="gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {isCompleted && <Trophy className="h-5 w-5 text-yellow-500" />}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", isCompleted ? "bg-emerald-500" : "bg-blue-500")}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {challenge.targetValue ? (
              <>
                <span>{formatCurrency(challenge.currentValue)}</span>
                <span>{formatCurrency(challenge.targetValue)}</span>
              </>
            ) : (
              <>
                <span>{progress.toFixed(0)}%</span>
                <span>{daysRemaining > 0 ? `${daysRemaining} dias restantes` : "Encerrado"}</span>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 text-xs">
          {challenge.streakCount > 0 && (
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="h-3 w-3" />
              {challenge.streakCount} streak
            </div>
          )}
          {isActive && daysRemaining > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {daysRemaining}d restantes
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
