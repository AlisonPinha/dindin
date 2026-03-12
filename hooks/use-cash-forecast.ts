"use client"

import { useMemo } from "react"
import { useStore } from "./use-store"
import { useTransacoesDoMes } from "./use-transacoes-do-mes"

interface RecurringItem {
  description: string
  amount: number
  type: "income" | "expense"
  dueDay?: number
}

interface CashForecastData {
  rendaFixa: number
  despesasFixas: number
  parcelasFuturas: number
  sobraLivre: number
  proximasContas: RecurringItem[]
}

export function useCashForecast(): CashForecastData {
  const { transactions } = useStore()
  const { transacoes, totais } = useTransacoesDoMes()

  return useMemo(() => {
    // Find recurring transactions (isRecurring = true)
    const recorrentes = transacoes.filter(t => t.isRecurring)

    const rendaFixa = recorrentes
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)

    const despesasFixasRecorrentes = recorrentes
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    // Parcelas do mês (installments)
    const parcelas = transacoes.filter(
      t => t.installments && t.installments >= 2 && t.type === "expense"
    )
    const parcelasFuturas = parcelas.reduce((sum, t) => sum + t.amount, 0)

    const despesasFixas = despesasFixasRecorrentes + parcelasFuturas

    // Use actual income if no recurring income found
    const rendaEfetiva = rendaFixa > 0 ? rendaFixa : totais.receitas

    const sobraLivre = rendaEfetiva - despesasFixas

    // Build upcoming bills list
    const proximasContas: RecurringItem[] = [
      ...recorrentes
        .filter(t => t.type === "expense")
        .map(t => ({
          description: t.description,
          amount: t.amount,
          type: "expense" as const,
          dueDay: new Date(t.date).getDate(),
        })),
      ...parcelas.map(t => ({
        description: `${t.description}${t.installmentDisplay ? ` (${t.installmentDisplay})` : ""}`,
        amount: t.amount,
        type: "expense" as const,
        dueDay: new Date(t.date).getDate(),
      })),
    ].sort((a, b) => (a.dueDay || 0) - (b.dueDay || 0))

    return {
      rendaFixa: rendaEfetiva,
      despesasFixas,
      parcelasFuturas,
      sobraLivre,
      proximasContas,
    }
  }, [transacoes, totais, transactions])
}
