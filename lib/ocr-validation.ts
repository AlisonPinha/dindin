/**
 * Validação da resposta do OCR sem dependência externa (Zod não instalado).
 */

const VALID_DOCUMENT_TYPES = ["boleto", "fatura", "nota_fiscal", "recibo", "extrato", "outro"] as const;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

interface ValidationError {
  valid: false;
  message: string;
}

interface ValidationSuccess {
  valid: true;
  data: ValidatedOcrResponse;
}

export interface ValidatedTransaction {
  descricao: string;
  valor: number;
  data: string;
  tipo?: string;
  categoria?: string;
  parcela?: number;
  totalParcelas?: number;
}

export interface ValidatedOcrResponse {
  type: (typeof VALID_DOCUMENT_TYPES)[number];
  transactions: ValidatedTransaction[];
  mesFatura?: string;
}

export type OcrValidationResult = ValidationError | ValidationSuccess;

export function validateOcrResponse(data: unknown): OcrValidationResult {
  if (!data || typeof data !== "object") {
    return { valid: false, message: "Resposta do OCR em formato inválido" };
  }

  const obj = data as Record<string, unknown>;

  // Validate type
  if (typeof obj.type !== "string" || !VALID_DOCUMENT_TYPES.includes(obj.type as typeof VALID_DOCUMENT_TYPES[number])) {
    return { valid: false, message: "Resposta do OCR em formato inválido" };
  }

  // Validate transactions
  if (!Array.isArray(obj.transactions)) {
    return { valid: false, message: "Resposta do OCR em formato inválido" };
  }

  for (const t of obj.transactions) {
    if (!t || typeof t !== "object") {
      return { valid: false, message: "Resposta do OCR em formato inválido" };
    }

    const tx = t as Record<string, unknown>;

    if (typeof tx.descricao !== "string" || tx.descricao.trim() === "") {
      return { valid: false, message: "Resposta do OCR em formato inválido" };
    }

    const valor = typeof tx.valor === "string" ? parseFloat(tx.valor) : tx.valor;
    if (typeof valor !== "number" || isNaN(valor) || valor <= 0) {
      return { valid: false, message: "Resposta do OCR em formato inválido" };
    }

    if (typeof tx.data !== "string" || !DATE_REGEX.test(tx.data)) {
      return { valid: false, message: "Resposta do OCR em formato inválido" };
    }
  }

  // Validate mesFatura (optional)
  if (obj.mesFatura !== undefined && obj.mesFatura !== null && typeof obj.mesFatura !== "string") {
    return { valid: false, message: "Resposta do OCR em formato inválido" };
  }

  return {
    valid: true,
    data: obj as unknown as ValidatedOcrResponse,
  };
}
