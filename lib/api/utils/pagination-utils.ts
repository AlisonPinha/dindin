/**
 * Extrai parâmetros de paginação de uma URL
 */
export function getPaginationParams(searchParams: URLSearchParams) {
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500)
  const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0)
  return { limit, offset }
}

/**
 * Calcula se há mais itens após a página atual
 */
export function calculateHasMore(
  total: number,
  limit: number,
  offset: number
): boolean {
  return offset + limit < total
}

/**
 * Aplica paginação a uma query Supabase
 */
export function applyPagination<T extends { range: (from: number, to: number) => T }>(
  query: T,
  limit: number,
  offset: number
): T {
  return query.range(offset, offset + limit - 1)
}
