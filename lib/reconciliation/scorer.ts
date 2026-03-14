/**
 * Reconciliation Scorer — Story 3.1
 * Calcula score de matching entre transação da fatura e transação existente
 * Scoring: valor exato = 50pts, data exata = 30pts, data ± 1 dia = 20pts, data ± 3 dias = 10pts
 */

export interface ScoredMatch {
  ocrIndex: number
  existingId: string
  score: number
  breakdown: {
    valor: number
    data: number
  }
}

export interface OcrTransaction {
  index: number
  descricao: string
  valor: number
  data: string // YYYY-MM-DD
  tipo: string
}

export interface ExistingTransaction {
  id: string
  descricao: string
  valor: number
  data: string // YYYY-MM-DD
  origem: string
}

/**
 * Calcula diferença em dias entre duas datas (strings YYYY-MM-DD)
 */
function daysDiff(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00")
  const b = new Date(dateB + "T00:00:00")
  return Math.abs(Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)))
}

/**
 * Calcula score de matching entre uma transação OCR e uma existente
 */
export function calculateScore(ocr: OcrTransaction, existing: ExistingTransaction): ScoredMatch {
  let valorScore = 0
  let dataScore = 0

  // Valor exato = 50 pontos
  if (Math.abs(ocr.valor - existing.valor) < 0.01) {
    valorScore = 50
  }

  // Data scoring
  const diff = daysDiff(ocr.data, existing.data)
  if (diff === 0) {
    dataScore = 30
  } else if (diff === 1) {
    dataScore = 20
  } else if (diff <= 3) {
    dataScore = 10
  }

  return {
    ocrIndex: ocr.index,
    existingId: existing.id,
    score: valorScore + dataScore,
    breakdown: { valor: valorScore, data: dataScore },
  }
}

/**
 * Calcula scores de todos os pares possíveis entre transações OCR e existentes
 */
export function scoreAllPairs(
  ocrTransactions: OcrTransaction[],
  existingTransactions: ExistingTransaction[]
): ScoredMatch[] {
  const scores: ScoredMatch[] = []

  for (const ocr of ocrTransactions) {
    for (const existing of existingTransactions) {
      const match = calculateScore(ocr, existing)
      if (match.score > 0) {
        scores.push(match)
      }
    }
  }

  // Ordenar por score descrescente
  return scores.sort((a, b) => b.score - a.score)
}
