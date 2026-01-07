"use client"

import { MoreHorizontal, Pencil, Trash2, Pause, Play, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency, formatDate, calculatePercentage } from "@/lib/utils"
import type { Goal } from "@/types"

interface GoalCardProps {
  goal: Goal
  onEdit?: (goal: Goal) => void
  onDelete?: (id: string) => void
  onStatusChange?: (id: string, status: Goal["status"]) => void
}

export function GoalCard({ goal, onEdit, onDelete, onStatusChange }: GoalCardProps) {
  const progress = calculatePercentage(goal.currentAmount, goal.targetAmount)
  const remaining = goal.targetAmount - goal.currentAmount

  return (
    <Card className="relative overflow-hidden">
      {goal.status === "completed" && (
        <div className="absolute inset-0 bg-green-500/10" />
      )}
      {goal.status === "paused" && (
        <div className="absolute inset-0 bg-muted/50" />
      )}
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">{goal.name}</CardTitle>
          {goal.description && (
            <p className="text-sm text-muted-foreground">{goal.description}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
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
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Atual</p>
            <p className="font-semibold text-primary">
              {formatCurrency(goal.currentAmount)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Meta</p>
            <p className="font-semibold">{formatCurrency(goal.targetAmount)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-muted-foreground">Falta</p>
            <p className="font-medium">
              {remaining > 0 ? formatCurrency(remaining) : "Meta atingida!"}
            </p>
          </div>
          {goal.deadline && (
            <div className="text-right">
              <p className="text-muted-foreground">Prazo</p>
              <p className="font-medium">{formatDate(goal.deadline)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
