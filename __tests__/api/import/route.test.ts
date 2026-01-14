import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"
import { POST } from "@/app/api/import/route"
import { createMockSupabaseClient } from "../../mocks/supabase.mock"
import { createPostRequest } from "../../mocks/next-api.mock"

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
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  }

  builder.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)

  return builder
}

describe("POST /api/import", () => {
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

    const request = createPostRequest("/api/import", { transacoes: [] })
    const response = await POST(request as any)

    expect(response.status).toBe(401)
  })

  it("deve rejeitar quando não houver dados para importar", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/import", {})
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("Nenhum dado para importar")
  })

  it("deve validar transações - descrição obrigatória", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/import", {
      transacoes: [
        { valor: 100, tipo: "ENTRADA", data: "2024-01-01" }, // sem descrição
      ],
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.validationErrors).toBeDefined()
    expect(data.validationErrors[0].errors[0].field).toBe("descricao")
  })

  it("deve validar transações - valor deve ser maior que zero", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/import", {
      transacoes: [
        { descricao: "Teste", valor: 0, tipo: "ENTRADA", data: "2024-01-01" },
      ],
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.validationErrors[0].errors[0].field).toBe("valor")
  })

  it("deve validar transações - tipo inválido", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/import", {
      transacoes: [
        { descricao: "Teste", valor: 100, tipo: "INVALIDO", data: "2024-01-01" },
      ],
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.validationErrors[0].errors[0].field).toBe("tipo")
  })

  it("deve validar transações - data obrigatória", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/import", {
      transacoes: [
        { descricao: "Teste", valor: 100, tipo: "ENTRADA" }, // sem data
      ],
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.validationErrors[0].errors[0].field).toBe("data")
  })

  it("deve validar contas - nome obrigatório", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/import", {
      contas: [
        { tipo: "CORRENTE" }, // sem nome
      ],
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.validationErrors[0].errors[0].field).toBe("nome")
  })

  it("deve validar contas - tipo inválido", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/import", {
      contas: [
        { nome: "Conta Teste", tipo: "INVALIDO" },
      ],
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.validationErrors[0].errors[0].field).toBe("tipo")
  })

  it("deve validar categorias - campos obrigatórios", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/import", {
      categorias: [
        { nome: "Categoria" }, // faltando tipo, cor, grupo
      ],
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.validationErrors[0].errors.length).toBeGreaterThan(0)
  })

  it("deve retornar preview sem importar", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // Mock para buscar transações existentes
    const existingTxBuilder = createResolvedQueryBuilder([])
    mockSupabase.from.mockReturnValue(existingTxBuilder)

    const request = createPostRequest("/api/import", {
      transacoes: [
        { descricao: "Teste", valor: 100, tipo: "ENTRADA", data: "2024-01-01" },
      ],
      preview: true,
    })
    const response = await POST(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.preview).toBe(true)
    expect(data.data.transacoes.total).toBe(1)
  })

  it("deve importar transações com sucesso", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // Mock para buscar transações existentes (detecção de duplicatas)
    const existingTxBuilder = createResolvedQueryBuilder([])

    // Mock para buscar tipos de contas
    const accountTypesBuilder = {
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    }

    // Mock para insert de transações
    const insertBuilder = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "new-tx-1" }],
          error: null,
        }),
      }),
    }

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return existingTxBuilder
      if (callCount === 2) return accountTypesBuilder
      return insertBuilder
    })

    const request = createPostRequest("/api/import", {
      transacoes: [
        { descricao: "Salário", valor: 5000, tipo: "ENTRADA", data: "2024-01-01" },
      ],
    })
    const response = await POST(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.results.transacoes.imported).toBe(1)
  })

  it("deve importar contas com sucesso", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const insertBuilder = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "new-account-1" }],
          error: null,
        }),
      }),
    }

    mockSupabase.from.mockReturnValue(insertBuilder)

    const request = createPostRequest("/api/import", {
      contas: [
        { nome: "Conta Corrente", tipo: "CORRENTE" },
      ],
    })
    const response = await POST(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.results.contas.imported).toBe(1)
  })

  it("deve detectar e pular duplicatas", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // Transação existente igual à que será importada
    const existingTxBuilder = createResolvedQueryBuilder([
      { descricao: "Salário", valor: 5000, data: "2024-01-01" },
    ])

    mockSupabase.from.mockReturnValue(existingTxBuilder)

    const request = createPostRequest("/api/import", {
      transacoes: [
        { descricao: "Salário", valor: 5000, tipo: "ENTRADA", data: "2024-01-01" },
      ],
      skipDuplicates: true,
    })
    const response = await POST(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.results.transacoes.skipped).toBe(1)
    expect(data.results.transacoes.imported).toBe(0)
  })

  it("deve importar categorias com sucesso", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const insertBuilder = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "new-cat-1" }],
          error: null,
        }),
      }),
    }

    mockSupabase.from.mockReturnValue(insertBuilder)

    const request = createPostRequest("/api/import", {
      categorias: [
        { nome: "Alimentação", tipo: "SAIDA", cor: "#ff0000", grupo: "ESSENCIAL" },
      ],
    })
    const response = await POST(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.results.categorias.imported).toBe(1)
  })
})
