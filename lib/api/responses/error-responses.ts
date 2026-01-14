import { NextResponse } from "next/server"

/**
 * Respostas de erro padronizadas para APIs
 */
export const ErrorResponses = {
  /**
   * Usuário não autenticado (401)
   */
  unauthorized: () =>
    NextResponse.json({ error: "Não autorizado" }, { status: 401 }),

  /**
   * Recurso não encontrado (404)
   * @param resource - Nome do recurso (ex: "Conta", "Transação")
   * @param feminine - Se true, usa "não encontrada" (default: false)
   */
  notFound: (resource: string, feminine = false) =>
    NextResponse.json(
      { error: `${resource} não encontrad${feminine ? "a" : "o"}` },
      { status: 404 }
    ),

  /**
   * Acesso negado (403)
   */
  forbidden: (message: string) =>
    NextResponse.json({ error: message }, { status: 403 }),

  /**
   * Requisição inválida (400)
   */
  badRequest: (message: string) =>
    NextResponse.json({ error: message }, { status: 400 }),

  /**
   * Conflito - recurso já existe (400)
   */
  conflict: (message: string) =>
    NextResponse.json({ error: message }, { status: 400 }),

  /**
   * Erro interno do servidor (500)
   */
  serverError: (message: string) =>
    NextResponse.json({ error: message }, { status: 500 }),

  /**
   * Erro de validação com múltiplos erros (400)
   */
  validationError: (errors: string[]) =>
    NextResponse.json({ error: errors.join(", ") }, { status: 400 }),
}
