import { NextResponse } from "next/server"

/**
 * Respostas de sucesso padronizadas para APIs
 */
export const SuccessResponses = {
  /**
   * Recurso criado com sucesso (201)
   */
  created: <T>(data: T) => NextResponse.json(data, { status: 201 }),

  /**
   * Requisição bem-sucedida (200)
   */
  ok: <T>(data: T) => NextResponse.json(data),

  /**
   * Recurso deletado com sucesso (200)
   */
  deleted: (details?: Record<string, unknown>) =>
    NextResponse.json({ success: true, ...details }),

  /**
   * Resposta paginada (200)
   */
  paginated: <T>(data: T[], total: number, hasMore: boolean) =>
    NextResponse.json({ data, total, hasMore }),
}
