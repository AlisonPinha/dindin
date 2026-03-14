"use client"

import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BudgetAlertItem {
  categoryName: string
  categoryColor: string
  spent: number
  budget: number
  percent: number
}

interface BudgetAlertsProps {
  alerts: BudgetAlertItem[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function BudgetAlerts({ alerts }: BudgetAlertsProps) {
  if (alerts.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Alertas de Orcamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.categoryName} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: alert.categoryColor }}
                />
                <span className="font-medium">{alert.categoryName}</span>
              </div>
              <span
                className={`text-xs font-medium ${
                  alert.percent >= 100
                    ? "text-red-500"
                    : alert.percent >= 90
                      ? "text-amber-500"
                      : "text-yellow-500"
                }`}
              >
                {Math.round(alert.percent)}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  alert.percent >= 100
                    ? "bg-red-500"
                    : alert.percent >= 90
                      ? "bg-amber-500"
                      : "bg-yellow-500"
                }`}
                style={{ width: `${Math.min(alert.percent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(alert.spent)} de {formatCurrency(alert.budget)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
