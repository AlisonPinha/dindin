/**
 * API de Reconciliação — Story 3.3
 * POST /api/reconciliacao
 * Recebe transações OCR + accountId, executa matching determinístico + AI, retorna resultado classificado
 */

import { NextRequest } from "next/server"
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper"
import { ErrorResponses, SuccessResponses } from "@/lib/api"
import { logger } from "@/lib/logger"
import { matchTransactions } from "@/lib/reconciliation/matcher"
import { resolveAmbiguous } from "@/lib/reconciliation/ai-resolver"
import type { OcrTransaction, ExistingTransaction } from "@/lib/reconciliation/scorer"

export const runtime = "nodejs"
export const maxDuration = 30

interface OcrInput {
  descricao: string
  valor: number
  data: string
  tipo: string
}

// POST /api/reconciliacao — Executar reconciliação
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (auth.error) return auth.error

    const body = await request.json()
    const { transactions: ocrInputs, accountId, mesFatura } = body as {
      transactions: OcrInput[]
      accountId: string
      mesFatura?: string // YYYY-MM-01
    }

    if (!ocrInputs || !Array.isArray(ocrInputs) || ocrInputs.length === 0) {
      return ErrorResponses.badRequest("Transações OCR são obrigatórias")
    }

    if (ocrInputs.length > 500) {
      return ErrorResponses.badRequest("Máximo de 500 transações por reconciliação")
    }

    // Validar campos obrigatórios de cada transação
    for (let i = 0; i < ocrInputs.length; i++) {
      const t = ocrInputs[i]
      if (!t || typeof t.descricao !== "string" || typeof t.valor !== "number" || typeof t.data !== "string") {
        return ErrorResponses.badRequest(`Transação ${i}: campos descricao (string), valor (number) e data (string) são obrigatórios`)
      }
      if (!Number.isFinite(t.valor) || t.valor <= 0) {
        return ErrorResponses.badRequest(`Transação ${i}: valor deve ser um número positivo`)
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t.data)) {
        return ErrorResponses.badRequest(`Transação ${i}: data deve estar no formato YYYY-MM-DD`)
      }
    }

    if (!accountId) {
      return ErrorResponses.badRequest("Conta (accountId) é obrigatória")
    }

    const supabase = await getSupabaseClient()

    // Verificar se a conta pertence ao usuário
    const { data: account } = await supabase
      .from("contas")
      .select("id, tipo")
      .eq("id", accountId)
      .eq("user_id", auth.user.id)
      .single()

    if (!account) {
      return ErrorResponses.notFound("Conta", true)
    }

    // Buscar transações existentes do usuário para a mesma conta
    let existingQuery = supabase
      .from("transacoes")
      .select("id, descricao, valor, data, origem")
      .eq("user_id", auth.user.id)
      .eq("account_id", accountId)

    // Se temos mesFatura, filtrar por ele para reduzir escopo
    if (mesFatura) {
      existingQuery = existingQuery.eq("mes_fatura", mesFatura)
    } else {
      // Sem mesFatura, usar range de datas das transações OCR
      const dates = ocrInputs.map((t) => t.data).filter(Boolean).sort()
      if (dates.length > 0) {
        const minDate = new Date(dates[0] + "T00:00:00")
        minDate.setDate(minDate.getDate() - 30)
        const maxDate = new Date(dates[dates.length - 1] + "T00:00:00")
        maxDate.setDate(maxDate.getDate() + 30)
        const fmt = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        existingQuery = existingQuery.gte("data", fmt(minDate)).lte("data", fmt(maxDate))
      }
    }

    const { data: existingRows, error: fetchError } = await existingQuery

    if (fetchError) {
      logger.error("Erro ao buscar transações existentes para reconciliação", fetchError, {
        action: "fetch",
        resource: "reconciliation",
      })
      return ErrorResponses.serverError("Erro ao buscar transações existentes")
    }

    // Mapear para tipos do scorer
    const ocrTransactions: OcrTransaction[] = ocrInputs.map((t, i) => ({
      index: i,
      descricao: t.descricao,
      valor: t.valor,
      data: t.data,
      tipo: t.tipo,
    }))

    const existingTransactions: ExistingTransaction[] = (existingRows || []).map((t) => ({
      id: t.id,
      descricao: t.descricao,
      valor: t.valor,
      data: t.data,
      origem: t.origem || "manual",
    }))

    // Fase 1: Matching determinístico
    const matchResult = matchTransactions(ocrTransactions, existingTransactions)

    // Fase 2: AI resolver para ambíguos
    const aiResult = await resolveAmbiguous(
      matchResult.ambiguous,
      ocrTransactions,
      existingTransactions
    )

    // Combinar resultados
    const allMatched = [...matchResult.matched, ...aiResult.resolved]
    const allNew = [...matchResult.newTransactions, ...aiResult.unresolved]

    // Montar resposta com detalhes das transações
    const ocrMap = new Map(ocrTransactions.map((t) => [t.index, t]))
    const existingMap = new Map(existingTransactions.map((t) => [t.id, t]))

    const matchedDetails = allMatched.map((m) => ({
      ocrIndex: m.ocrIndex,
      ocr: ocrMap.get(m.ocrIndex),
      existing: existingMap.get(m.existingId),
      existingId: m.existingId,
      score: m.score,
      source: m.source,
    }))

    const newDetails = allNew.map((idx) => ({
      ocrIndex: idx,
      ocr: ocrMap.get(idx),
    }))

    const conflictDetails = matchResult.conflicts.map((c) => ({
      ocrIndex: c.ocrIndex,
      ocr: ocrMap.get(c.ocrIndex),
      candidates: c.candidates.map((cand) => ({
        existingId: cand.existingId,
        existing: existingMap.get(cand.existingId),
        score: cand.score,
      })),
    }))

    logger.info("Reconciliação concluída", {
      matched: allMatched.length,
      new: allNew.length,
      conflicts: matchResult.conflicts.length,
      total: ocrTransactions.length,
    })

    return SuccessResponses.ok({
      matched: matchedDetails,
      new: newDetails,
      conflicts: conflictDetails,
      summary: {
        total: ocrTransactions.length,
        matched: allMatched.length,
        new: allNew.length,
        conflicts: matchResult.conflicts.length,
      },
    })
  } catch (error) {
    logger.error("Erro na reconciliação", error, {
      action: "reconcile",
      resource: "reconciliation",
    })
    return ErrorResponses.serverError("Erro ao processar reconciliação")
  }
}
