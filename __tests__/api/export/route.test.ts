import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"
import { GET } from "@/app/api/export/route"
import { createMockSupabaseClient } from "../../mocks/supabase.mock"
import { createGetRequest } from "../../mocks/next-api.mock"
import { mockTransactionsList } from "../../fixtures/transactions"
import { mockAccountsList } from "../../fixtures/accounts"
import { mockCategoriesList } from "../../fixtures/categories"

// Mock do auth-helper
const mockGetAuthenticatedUser = vi.fn()
const mockGetSupabaseClient = vi.fn()

vi.mock("@/lib/supabase/auth-helper", () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
  getSupabaseClient: () => mockGetSupabaseClient(),
}))

// Mock do logger
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

// Helper para criar mock builder que resolve como Promise
function createResolvedQueryBuilder(data: unknown) {
  const result = { data, error: null }

  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  }

  builder.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)

  return builder
}

describe("GET /api/export", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    mockGetSupabaseClient.mockResolvedValue(mockSupabase)
  })

  it("deve retornar 401 para usuário não autenticado", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: null,
      error: NextResponse.json({ error: "Não autorizado" }, { status: 401 }),
    })

    const request = createGetRequest("/api/export")
    const response = await GET(request as any)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe("Não autorizado")
  })

  it("deve rejeitar formato inválido", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createGetRequest("/api/export", { format: "xml" })
    const response = await GET(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain("Formato inválido")
  })

  it("deve rejeitar recurso inválido", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createGetRequest("/api/export", { resource: "usuarios" })
    const response = await GET(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain("Recurso inválido")
  })

  it("deve exportar transações em JSON", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const transacoesBuilder = createResolvedQueryBuilder(mockTransactionsList)
    mockSupabase.from.mockReturnValue(transacoesBuilder)

    const request = createGetRequest("/api/export", { format: "json", resource: "transacoes" })
    const response = await GET(request as any)

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("application/json")
    expect(response.headers.get("Content-Disposition")).toContain("attachment")
    expect(response.headers.get("Content-Disposition")).toContain(".json")

    const data = await response.json()
    expect(data.transacoes).toBeDefined()
    expect(Array.isArray(data.transacoes)).toBe(true)
  })

  it("deve exportar contas em JSON", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const contasBuilder = createResolvedQueryBuilder(mockAccountsList)
    mockSupabase.from.mockReturnValue(contasBuilder)

    const request = createGetRequest("/api/export", { format: "json", resource: "contas" })
    const response = await GET(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.contas).toBeDefined()
    expect(Array.isArray(data.contas)).toBe(true)
  })

  it("deve exportar categorias em JSON", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const categoriasBuilder = createResolvedQueryBuilder(mockCategoriesList)
    mockSupabase.from.mockReturnValue(categoriasBuilder)

    const request = createGetRequest("/api/export", { format: "json", resource: "categorias" })
    const response = await GET(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.categorias).toBeDefined()
    expect(Array.isArray(data.categorias)).toBe(true)
  })

  it("deve exportar todos os recursos em JSON", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const transacoesBuilder = createResolvedQueryBuilder(mockTransactionsList)
    const contasBuilder = createResolvedQueryBuilder(mockAccountsList)
    const categoriasBuilder = createResolvedQueryBuilder(mockCategoriesList)

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return transacoesBuilder
      if (callCount === 2) return contasBuilder
      return categoriasBuilder
    })

    const request = createGetRequest("/api/export", { format: "json", resource: "all" })
    const response = await GET(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.transacoes).toBeDefined()
    expect(data.contas).toBeDefined()
    expect(data.categorias).toBeDefined()
  })

  it("deve exportar transações em CSV", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const transacoesBuilder = createResolvedQueryBuilder(mockTransactionsList)
    mockSupabase.from.mockReturnValue(transacoesBuilder)

    const request = createGetRequest("/api/export", { format: "csv", resource: "transacoes" })
    const response = await GET(request as any)

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toContain("text/csv")
    expect(response.headers.get("Content-Disposition")).toContain(".csv")
  })

  it("deve exportar todos os recursos em CSV como objeto JSON", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const transacoesBuilder = createResolvedQueryBuilder(mockTransactionsList)
    const contasBuilder = createResolvedQueryBuilder(mockAccountsList)
    const categoriasBuilder = createResolvedQueryBuilder(mockCategoriesList)

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return transacoesBuilder
      if (callCount === 2) return contasBuilder
      return categoriasBuilder
    })

    const request = createGetRequest("/api/export", { format: "csv", resource: "all" })
    const response = await GET(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.format).toBe("csv")
    expect(data.files).toBeDefined()
  })

  it("deve aplicar filtro de data", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const transacoesBuilder = createResolvedQueryBuilder([])
    mockSupabase.from.mockReturnValue(transacoesBuilder)

    const request = createGetRequest("/api/export", {
      resource: "transacoes",
      dataInicio: "2024-01-01",
      dataFim: "2024-12-31",
    })
    await GET(request as any)

    expect(transacoesBuilder.gte).toHaveBeenCalledWith("data", "2024-01-01")
    expect(transacoesBuilder.lte).toHaveBeenCalledWith("data", "2024-12-31")
  })

  it("deve retornar dados vazios quando não houver registros", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const emptyBuilder = createResolvedQueryBuilder([])
    mockSupabase.from.mockReturnValue(emptyBuilder)

    const request = createGetRequest("/api/export", { resource: "transacoes" })
    const response = await GET(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.transacoes).toEqual([])
  })
})
