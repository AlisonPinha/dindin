"use client"

import { useMemo, useEffect, useRef } from "react"
import useSWR from "swr"
import { useStore } from "./use-store"
import { parseLocalDate } from "@/lib/mappers"
import { apiFetch } from "@/lib/api/fetch"

interface PatrimonioSnapshotRaw {
  id: string
  user_id: string
  mes_ano: string
  saldo_contas: number
  saldo_investimentos: number
  dividas: number
  patrimonio_liquido: number
  created_at: string
}

interface PatrimonioData {
  snapshots: PatrimonioSnapshotRaw[]
  current: {
    saldoContas: number
    saldoInvestimentos: number
    dividas: number
    patrimonioLiquido: number
  }
  evolution: {
    mesAno: string
    patrimonioLiquido: number
    label: string
  }[]
  growthPercent: number | null
  milestones: { value: number; label: string; reached: boolean }[]
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function usePatrimonio(): PatrimonioData {
  const { accounts, investments } = useStore()
  const hasCreatedSnapshot = useRef(false)

  // Fetch snapshots from API
  const { data, mutate } = useSWR<{ snapshots: PatrimonioSnapshotRaw[] }>(
    "/api/patrimonio?limit=12",
    fetcher,
    { dedupingInterval: 60000 }
  )

  // Auto-create snapshot for current month on first access
  useEffect(() => {
    if (hasCreatedSnapshot.current) return
    hasCreatedSnapshot.current = true

    apiFetch("/api/patrimonio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      .then(() => mutate())
      .catch((err) => {
        console.error("[usePatrimonio] Failed to auto-create snapshot:", err)
      })
  }, [mutate])

  // Calculate current values from store (real-time)
  const current = useMemo(() => {
    let saldoContas = 0
    let dividas = 0

    accounts.forEach(acc => {
      if (acc.type === "credit") {
        dividas += Number(acc.balance) || 0
      } else {
        saldoContas += Number(acc.balance) || 0
      }
    })

    const saldoInvestimentos = investments.reduce(
      (sum, inv) => sum + (Number(inv.currentPrice) || 0),
      0
    )

    return {
      saldoContas,
      saldoInvestimentos,
      dividas,
      patrimonioLiquido: saldoContas + saldoInvestimentos - dividas,
    }
  }, [accounts, investments])

  // Build evolution data
  const evolution = useMemo(() => {
    const snapshots = data?.snapshots || []
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

    return [...snapshots]
      .sort((a, b) => a.mes_ano.localeCompare(b.mes_ano))
      .map(s => {
        const date = parseLocalDate(s.mes_ano)
        return {
          mesAno: s.mes_ano,
          patrimonioLiquido: Number(s.patrimonio_liquido),
          label: `${monthNames[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`,
        }
      })
  }, [data])

  // Growth percentage
  const growthPercent = useMemo(() => {
    if (evolution.length < 2) return null
    const first = evolution[0]!
    const last = evolution[evolution.length - 1]!
    if (first.patrimonioLiquido === 0) return null
    return ((last.patrimonioLiquido - first.patrimonioLiquido) / Math.abs(first.patrimonioLiquido)) * 100
  }, [evolution])

  // Milestones
  const milestones = useMemo(() => {
    const pl = current.patrimonioLiquido
    return [
      { value: 10000, label: "R$ 10K", reached: pl >= 10000 },
      { value: 50000, label: "R$ 50K", reached: pl >= 50000 },
      { value: 100000, label: "R$ 100K", reached: pl >= 100000 },
      { value: 500000, label: "R$ 500K", reached: pl >= 500000 },
      { value: 1000000, label: "R$ 1M", reached: pl >= 1000000 },
    ]
  }, [current.patrimonioLiquido])

  return {
    snapshots: data?.snapshots || [],
    current,
    evolution,
    growthPercent,
    milestones,
  }
}
