"use client"

import useSWR from "swr"
import type { Challenge } from "@/types"
import { parseLocalDate } from "@/lib/mappers"

interface DbDesafioRaw {
  id: string
  user_id: string
  nome: string
  descricao: string | null
  tipo: string
  template: string | null
  data_inicio: string
  data_fim: string
  meta_valor: number | null
  valor_atual: number
  status: string
  streak_conjunto: number
  created_at: string
  updated_at: string
}

const typeMap: Record<string, Challenge["type"]> = {
  SEMANAL: "weekly",
  MENSAL: "monthly",
  ANUAL: "annual",
  CUSTOM: "custom",
}

const statusMap: Record<string, Challenge["status"]> = {
  ATIVO: "active",
  COMPLETO: "completed",
  FALHOU: "failed",
  CANCELADO: "cancelled",
}

function mapToChallenge(db: DbDesafioRaw): Challenge {
  return {
    id: db.id,
    userId: db.user_id,
    name: db.nome,
    description: db.descricao,
    type: typeMap[db.tipo] || "custom",
    template: db.template,
    startDate: parseLocalDate(db.data_inicio),
    endDate: parseLocalDate(db.data_fim),
    targetValue: db.meta_valor,
    currentValue: db.valor_atual,
    status: statusMap[db.status] || "active",
    streakCount: db.streak_conjunto,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  }
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useDesafios() {
  const { data, error, isLoading, mutate } = useSWR<{ desafios: DbDesafioRaw[] }>(
    "/api/desafios",
    fetcher,
    { dedupingInterval: 30000 }
  )

  const challenges: Challenge[] = (data?.desafios || []).map(mapToChallenge)
  const active = challenges.filter(c => c.status === "active")
  const completed = challenges.filter(c => c.status === "completed")

  const createChallenge = async (input: {
    nome: string
    descricao?: string
    tipo: string
    template?: string
    dataInicio: string
    dataFim: string
    metaValor?: number
  }) => {
    await fetch("/api/desafios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    mutate()
  }

  const updateChallenge = async (id: string, updates: Record<string, unknown>) => {
    await fetch("/api/desafios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    })
    mutate()
  }

  const deleteChallenge = async (id: string) => {
    await fetch(`/api/desafios?id=${id}`, { method: "DELETE" })
    mutate()
  }

  return {
    challenges,
    active,
    completed,
    isLoading,
    error,
    createChallenge,
    updateChallenge,
    deleteChallenge,
  }
}
