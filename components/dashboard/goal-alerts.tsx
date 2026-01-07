"use client"

import Link from "next/link"
import {
  AlertTriangle,
  Clock,
  Target,
  ArrowRight,
  Flame,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, calculatePercentage } from "@/lib/utils"
import type { Goal } from "@/types"

interface GoalAlertsProps {
  goals: Goal[]
}

type AlertLevel = "danger" | "warning" | "info"

interface GoalAlert {
  goal: Goal
  level: AlertLevel
  message: string
  daysRemaining?: number
  progress: number
}

function getAlertLevel(goal: Goal): GoalAlert | null {
  const progress = calculatePercentage(goal.currentAmount, goal.targetAmount)
  const now = new Date()

  // Calculate days remaining if deadline exists
  let daysRemaining: number | undefined
  if (goal.deadline) {
    const deadline = new Date(goal.deadline)
    daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Check for deadline alerts
  if (daysRemaining !== undefined) {
    // Expired
    if (daysRemaining < 0) {
      return {
        goal,
        level: "danger",
        message: "Prazo expirado!",
        daysRemaining,
        progress,
      }
    }
    // Less than 7 days and not completed
    if (daysRemaining <= 7 && progress < 100) {
      return {
        goal,
        level: "danger",
        message: `${daysRemaining} dia${daysRemaining !== 1 ? "s" : ""} restante${daysRemaining !== 1 ? "s" : ""}`,
        daysRemaining,
        progress,
      }
    }
    // Less than 30 days and less than 80% complete
    if (daysRemaining <= 30 && progress < 80) {
      return {
        goal,
        level: "warning",
        message: `${daysRemaining} dias restantes`,
        daysRemaining,
        progress,
      }
    }
  }

  // Progress alerts (no deadline or deadline far away)
  if (progress >= 90 && progress < 100) {
    return {
      goal,
      level: "info",
      message: "Quase lá!",
      daysRemaining,
      progress,
    }
  }

  return null
}

function getAlertStyles(level: AlertLevel) {
  switch (level) {
    case "danger":
      return {
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        text: "text-rose-500",
        icon: <AlertTriangle className="h-4 w-4" />,
      }
    case "warning":
      return {
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        text: "text-amber-500",
        icon: <Clock className="h-4 w-4" />,
      }
    case "info":
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        text: "text-emerald-500",
        icon: <Flame className="h-4 w-4" />,
      }
  }
}

export function GoalAlerts({ goals }: GoalAlertsProps) {
  // Filter active goals and get alerts
  const alerts = goals
    .filter((g) => g.status === "active")
    .map((goal) => getAlertLevel(goal))
    .filter((alert): alert is GoalAlert => alert !== null)
    .sort((a, b) => {
      // Sort by urgency: danger > warning > info
      const levelOrder = { danger: 0, warning: 1, info: 2 }
      return levelOrder[a.level] - levelOrder[b.level]
    })
    .slice(0, 3)

  if (alerts.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Alertas de Metas
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="text-xs text-primary hover:text-primary/80">
          <Link href="/metas" className="flex items-center gap-1">
            Ver metas
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const styles = getAlertStyles(alert.level)
            return (
              <div
                key={alert.goal.id}
                className={`p-3 rounded-lg border ${styles.bg} ${styles.border}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 ${styles.text}`}>
                    {styles.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">
                        {alert.goal.name}
                      </p>
                      <span className={`text-xs font-medium ${styles.text}`}>
                        {alert.message}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Progress
                        value={alert.progress}
                        className="h-1.5"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                      <span>{formatCurrency(alert.goal.currentAmount)}</span>
                      <span>{alert.progress.toFixed(0)}%</span>
                      <span>{formatCurrency(alert.goal.targetAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
