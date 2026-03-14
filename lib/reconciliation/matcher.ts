/**
 * Reconciliation Matcher — Story 3.1
 * Classifica transações em: matched, ambiguous, new, conflict
 * Threshold: score ≥ 70 = matched, 40-69 = ambiguous, < 40 = new
 */

import { scoreAllPairs, type OcrTransaction, type ExistingTransaction, type ScoredMatch } from "./scorer"

export interface MatchedPair {
  ocrIndex: number
  existingId: string
  score: number
  source: "deterministic" | "ai"
}

export interface ReconciliationResult {
  matched: MatchedPair[]
  ambiguous: { ocrIndex: number; candidates: ScoredMatch[] }[]
  newTransactions: number[] // OCR indices without matches
  conflicts: { ocrIndex: number; candidates: ScoredMatch[] }[] // Multiple high-score matches
}

const MATCH_THRESHOLD = 70
const AMBIGUOUS_THRESHOLD = 40

/**
 * Executa matching determinístico entre transações OCR e existentes
 */
export function matchTransactions(
  ocrTransactions: OcrTransaction[],
  existingTransactions: ExistingTransaction[]
): ReconciliationResult {
  const allScores = scoreAllPairs(ocrTransactions, existingTransactions)

  const matched: MatchedPair[] = []
  const ambiguous: ReconciliationResult["ambiguous"] = []
  const conflicts: ReconciliationResult["conflicts"] = []
  const processedOcrIndices = new Set<number>()
  const usedExistingIds = new Set<string>()

  // Agrupar scores por OCR index
  const scoresByOcr = new Map<number, ScoredMatch[]>()
  for (const score of allScores) {
    const existing = scoresByOcr.get(score.ocrIndex) || []
    existing.push(score)
    scoresByOcr.set(score.ocrIndex, existing)
  }

  // Processar cada transação OCR
  for (const ocr of ocrTransactions) {
    const candidates = scoresByOcr.get(ocr.index) || []

    // Filtrar candidatos cujo existingId já foi usado
    const availableCandidates = candidates.filter((c) => !usedExistingIds.has(c.existingId))

    if (availableCandidates.length === 0) {
      // Sem candidatos — transação nova
      processedOcrIndices.add(ocr.index)
      continue
    }

    // Candidatos com score >= MATCH_THRESHOLD
    const highScoreCandidates = availableCandidates.filter((c) => c.score >= MATCH_THRESHOLD)

    if (highScoreCandidates.length === 1) {
      // Match único e confiante
      const best = highScoreCandidates[0]!
      matched.push({
        ocrIndex: ocr.index,
        existingId: best.existingId,
        score: best.score,
        source: "deterministic",
      })
      usedExistingIds.add(best.existingId)
      processedOcrIndices.add(ocr.index)
    } else if (highScoreCandidates.length > 1) {
      // Múltiplos matches com score alto — conflito
      conflicts.push({ ocrIndex: ocr.index, candidates: highScoreCandidates })
      processedOcrIndices.add(ocr.index)
    } else {
      // Verificar candidatos ambíguos (score 40-69)
      const ambiguousCandidates = availableCandidates.filter(
        (c) => c.score >= AMBIGUOUS_THRESHOLD && c.score < MATCH_THRESHOLD
      )

      if (ambiguousCandidates.length > 0) {
        ambiguous.push({ ocrIndex: ocr.index, candidates: ambiguousCandidates })
        processedOcrIndices.add(ocr.index)
      }
    }
  }

  // Transações OCR sem nenhum match
  const newTransactions = ocrTransactions
    .filter((ocr) => !processedOcrIndices.has(ocr.index))
    .map((ocr) => ocr.index)

  return { matched, ambiguous, newTransactions, conflicts }
}
