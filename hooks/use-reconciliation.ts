"use client"

import { useState, useCallback } from "react"
import { apiFetch } from "@/lib/api/fetch"

interface OcrTransaction {
  descricao: string
  valor: number
  data: string
  tipo: string
}

interface MatchedItem {
  ocrIndex: number
  ocr: OcrTransaction
  existing: { id: string; descricao: string; valor: number; data: string }
  existingId: string
  score: number
  source: "deterministic" | "ai"
}

interface NewItem {
  ocrIndex: number
  ocr: OcrTransaction
}

interface ConflictCandidate {
  existingId: string
  existing: { id: string; descricao: string; valor: number; data: string }
  score: number
}

interface ConflictItem {
  ocrIndex: number
  ocr: OcrTransaction
  candidates: ConflictCandidate[]
}

interface ReconciliationSummary {
  total: number
  matched: number
  new: number
  conflicts: number
}

interface ReconciliationResult {
  matched: MatchedItem[]
  new: NewItem[]
  conflicts: ConflictItem[]
  summary: ReconciliationSummary
}

export function useReconciliation() {
  const [result, setResult] = useState<ReconciliationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reconcile = useCallback(
    async (transactions: OcrTransaction[], accountId: string, mesFatura?: string) => {
      setIsLoading(true)
      setError(null)
      setResult(null)

      try {
        const res = await apiFetch("/api/reconciliacao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions, accountId, mesFatura }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Erro ao reconciliar")
        }

        const data: ReconciliationResult = await res.json()
        setResult(data)
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao reconciliar"
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, isLoading, error, reconcile, reset }
}
