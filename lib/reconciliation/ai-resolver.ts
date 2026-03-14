/**
 * AI Resolver — Story 3.2
 * Usa Claude AI para resolver transações ambíguas (score 40-69)
 */

import Anthropic from "@anthropic-ai/sdk"
import { logger } from "@/lib/logger"
import type { OcrTransaction, ExistingTransaction, ScoredMatch } from "./scorer"
import type { MatchedPair } from "./matcher"

interface AmbiguousItem {
  ocrIndex: number
  candidates: ScoredMatch[]
}

interface AiResolverResult {
  resolved: MatchedPair[]
  unresolved: number[] // OCR indices that AI couldn't resolve → become "new"
}

/**
 * Resolve transações ambíguas usando Claude AI
 * Envia batch de ambíguos em uma única chamada para economizar tokens
 */
export async function resolveAmbiguous(
  ambiguousItems: AmbiguousItem[],
  ocrTransactions: OcrTransaction[],
  existingTransactions: ExistingTransaction[]
): Promise<AiResolverResult> {
  if (ambiguousItems.length === 0) {
    return { resolved: [], unresolved: [] }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    logger.warn("ANTHROPIC_API_KEY não configurada — ambíguos ficam para revisão manual")
    return {
      resolved: [],
      unresolved: ambiguousItems.map((item) => item.ocrIndex),
    }
  }

  try {
    const client = new Anthropic({ apiKey })

    // Construir contexto para a IA
    const existingMap = new Map(existingTransactions.map((t) => [t.id, t]))

    const pairs = ambiguousItems.map((item) => {
      const ocr = ocrTransactions.find((t) => t.index === item.ocrIndex)!
      const candidates = item.candidates.map((c) => {
        const existing = existingMap.get(c.existingId)!
        return {
          existingId: c.existingId,
          descricao: existing.descricao,
          valor: existing.valor,
          data: existing.data,
          score: c.score,
        }
      })

      return {
        ocrIndex: item.ocrIndex,
        ocr: { descricao: ocr.descricao, valor: ocr.valor, data: ocr.data },
        candidates,
      }
    })

    const prompt = `Você é um sistema de reconciliação financeira. Compare transações de uma fatura de cartão de crédito (OCR) com transações já registradas no sistema.

Para cada par abaixo, determine se a transação da fatura (OCR) é a MESMA transação já registrada. Considere que:
- Valores devem ser iguais ou muito próximos
- Datas podem variar em até 3 dias (data de compra vs data de processamento)
- Descrições podem ser diferentes (nome do estabelecimento vs descrição no cartão)

Responda APENAS com um JSON array no formato:
[{"ocrIndex": number, "matchedExistingId": string | null, "reason": string}]

Se matchedExistingId for null, significa que NÃO é match.

Pares para análise:
${JSON.stringify(pairs, null, 2)}`

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const firstBlock = response.content[0]
    const text = firstBlock?.type === "text" ? firstBlock.text : ""

    // Extrair JSON da resposta
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      logger.warn("AI resolver retornou resposta sem JSON válido")
      return {
        resolved: [],
        unresolved: ambiguousItems.map((item) => item.ocrIndex),
      }
    }

    const results: { ocrIndex: number; matchedExistingId: string | null; reason: string }[] =
      JSON.parse(jsonMatch[0])

    const resolved: MatchedPair[] = []
    const unresolved: number[] = []

    for (const result of results) {
      if (result.matchedExistingId) {
        const ambItem = ambiguousItems.find((a) => a.ocrIndex === result.ocrIndex)
        const candidate = ambItem?.candidates.find((c) => c.existingId === result.matchedExistingId)

        resolved.push({
          ocrIndex: result.ocrIndex,
          existingId: result.matchedExistingId,
          score: candidate?.score || 50,
          source: "ai",
        })
      } else {
        unresolved.push(result.ocrIndex)
      }
    }

    // Itens que não foram retornados pela IA → unresolved
    for (const item of ambiguousItems) {
      if (!results.find((r) => r.ocrIndex === item.ocrIndex)) {
        unresolved.push(item.ocrIndex)
      }
    }

    logger.info(`AI resolver: ${resolved.length} resolvidos, ${unresolved.length} não resolvidos`)

    return { resolved, unresolved }
  } catch (error) {
    logger.error("Erro no AI resolver de reconciliação", error, {
      action: "ai-resolve",
      resource: "reconciliation",
    })

    return {
      resolved: [],
      unresolved: ambiguousItems.map((item) => item.ocrIndex),
    }
  }
}
