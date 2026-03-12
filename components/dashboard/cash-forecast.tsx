"use client"

import { CalendarClock, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useCashForecast } from "@/hooks/use-cash-forecast"
import { cn } from "@/lib/utils"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function CashForecast() {
  const { rendaFixa, despesasFixas, sobraLivre, proximasContas } = useCashForecast()

  const isPositive = sobraLivre >= 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-blue-500" />
          <div>
            <CardTitle className="text-lg">Previsão de Caixa</CardTitle>
            <CardDescription>Renda fixa vs despesas fixas do mês</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
            <ArrowUpCircle className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Renda</p>
            <p className="text-sm font-semibold text-emerald-500">{formatCurrency(rendaFixa)}</p>
          </div>
          <div className="p-3 rounded-lg bg-rose-500/10 text-center">
            <ArrowDownCircle className="h-5 w-5 text-rose-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Fixos</p>
            <p className="text-sm font-semibold text-rose-500">{formatCurrency(despesasFixas)}</p>
          </div>
          <div className={cn("p-3 rounded-lg text-center", isPositive ? "bg-blue-500/10" : "bg-amber-500/10")}>
            <Wallet className={cn("h-5 w-5 mx-auto mb-1", isPositive ? "text-blue-500" : "text-amber-500")} />
            <p className="text-xs text-muted-foreground">Sobra</p>
            <p className={cn("text-sm font-semibold", isPositive ? "text-blue-500" : "text-amber-500")}>
              {formatCurrency(sobraLivre)}
            </p>
          </div>
        </div>

        {/* Upcoming bills */}
        {proximasContas.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 text-muted-foreground">Próximas contas</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {proximasContas.slice(0, 8).map((conta, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    {conta.dueDay && (
                      <span className="text-xs text-muted-foreground w-8">dia {conta.dueDay}</span>
                    )}
                    <span className="truncate max-w-[200px]">{conta.description}</span>
                  </div>
                  <span className="font-medium text-rose-500 whitespace-nowrap">
                    {formatCurrency(conta.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {proximasContas.length === 0 && rendaFixa === 0 && despesasFixas === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Marque transações como recorrentes para ver a previsão
          </div>
        )}
      </CardContent>
    </Card>
  )
}
