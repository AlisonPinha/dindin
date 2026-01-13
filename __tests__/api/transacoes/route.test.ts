import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"
import { GET, POST, PUT, DELETE } from "@/app/api/transacoes/route"
import { createMockSupabaseClient } from "../../mocks/supabase.mock"
import {
  createGetRequest,
  createPostRequest,
  createPutRequest,
  createDeleteRequest,
} from "../../mocks/next-api.mock"
import {
  mockTransactionsList,
  mockTransacaoSaida,
  mockInstallmentInput,
} from "../../fixtures/transactions"
import { mockContaCorrente } from "../../fixtures/accounts"

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
function createResolvedQueryBuilder(data: unknown, count?: number) {
  const result = { data, error: null, count }

  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  }

  // Make it thenable
  builder.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)

  return builder
}

describe("GET /api/transacoes", () => {
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

    const request = createGetRequest("/api/transacoes")
    const response = await GET(request as any)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe("Não autorizado")
  })

  it("deve retornar transações do usuário autenticado", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // Mock for main query (transactions)
    const transactionsBuilder = createResolvedQueryBuilder(
      mockTransactionsList.map(t => ({ ...t, categorias: null, contas: null }))
    )

    // Mock for count query
    const countBuilder = createResolvedQueryBuilder(null, mockTransactionsList.length)

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      return callCount === 1 ? transactionsBuilder : countBuilder
    })

    const request = createGetRequest("/api/transacoes")
    const response = await GET(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.transactions).toBeDefined()
    expect(data.total).toBe(mockTransactionsList.length)
    expect(data.pagination).toBeDefined()
  })

  it("deve aplicar filtro de categoryId", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const transactionsBuilder = createResolvedQueryBuilder([])
    const countBuilder = createResolvedQueryBuilder(null, 0)

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      return callCount === 1 ? transactionsBuilder : countBuilder
    })

    const request = createGetRequest("/api/transacoes", { categoryId: "cat-123" })
    await GET(request as any)

    // Verify eq was called with category_id
    expect(transactionsBuilder.eq).toHaveBeenCalledWith("category_id", "cat-123")
  })

  it("deve aplicar filtro de tipo", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const transactionsBuilder = createResolvedQueryBuilder([])
    const countBuilder = createResolvedQueryBuilder(null, 0)

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      return callCount === 1 ? transactionsBuilder : countBuilder
    })

    const request = createGetRequest("/api/transacoes", { tipo: "SAIDA" })
    await GET(request as any)

    expect(transactionsBuilder.eq).toHaveBeenCalledWith("tipo", "SAIDA")
  })

  it("deve respeitar paginação", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const transactionsBuilder = createResolvedQueryBuilder([])
    const countBuilder = createResolvedQueryBuilder(null, 100)

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      return callCount === 1 ? transactionsBuilder : countBuilder
    })

    const request = createGetRequest("/api/transacoes", {
      limit: "10",
      offset: "20",
    })
    const response = await GET(request as any)

    expect(transactionsBuilder.limit).toHaveBeenCalledWith(10)
    expect(transactionsBuilder.range).toHaveBeenCalledWith(20, 29)

    const data = await response.json()
    expect(data.pagination.limit).toBe(10)
    expect(data.pagination.offset).toBe(20)
    expect(data.pagination.hasMore).toBe(true)
  })
})

describe("POST /api/transacoes", () => {
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

    const request = createPostRequest("/api/transacoes", {
      descricao: "Teste",
      valor: 100,
      tipo: "SAIDA",
      data: "2025-01-15",
    })
    const response = await POST(request as any)

    expect(response.status).toBe(401)
  })

  it("deve criar transação simples com sucesso", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // Mock account check
    const accountBuilder = createResolvedQueryBuilder(mockContaCorrente)

    // Mock insert - need special handling for select().single() chain
    const insertResult = { ...mockTransacaoSaida, categorias: null, contas: mockContaCorrente }
    const insertBuilder = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: insertResult, error: null }),
        }),
      }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "contas") return accountBuilder
      return insertBuilder
    })

    const request = createPostRequest("/api/transacoes", {
      descricao: "Teste",
      valor: 100,
      tipo: "SAIDA",
      data: "2025-01-15",
      accountId: "conta-corrente-123",
    })
    const response = await POST(request as any)

    expect(response.status).toBe(201)
  })

  it("deve rejeitar descrição vazia", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/transacoes", {
      descricao: "",
      valor: 100,
      tipo: "SAIDA",
      data: "2025-01-15",
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("Descrição é obrigatória")
  })

  it("deve rejeitar valor zero", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/transacoes", {
      descricao: "Teste",
      valor: 0,
      tipo: "SAIDA",
      data: "2025-01-15",
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("Valor deve ser maior que zero")
  })

  it("deve rejeitar valor negativo", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/transacoes", {
      descricao: "Teste",
      valor: -100,
      tipo: "SAIDA",
      data: "2025-01-15",
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("Valor deve ser maior que zero")
  })

  it("deve rejeitar sem tipo", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/transacoes", {
      descricao: "Teste",
      valor: 100,
      data: "2025-01-15",
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("Tipo é obrigatório")
  })

  it("deve rejeitar sem data", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/transacoes", {
      descricao: "Teste",
      valor: 100,
      tipo: "SAIDA",
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("Data é obrigatória")
  })

  it("deve rejeitar conta de outro usuário", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // Mock account not found (belongs to another user)
    const accountBuilder = createResolvedQueryBuilder(null)

    mockSupabase.from.mockImplementation(() => accountBuilder)

    const request = createPostRequest("/api/transacoes", {
      descricao: "Teste",
      valor: 100,
      tipo: "SAIDA",
      data: "2025-01-15",
      accountId: "conta-outro-usuario",
    })
    const response = await POST(request as any)

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe("Conta não encontrada")
  })

  it("deve criar transação parcelada", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // Mock account check
    const accountBuilder = createResolvedQueryBuilder(mockContaCorrente)

    // Mock insert for installments
    const createdInstallments = Array.from({ length: 6 }, (_, i) => ({
      ...mockTransacaoSaida,
      id: `tx-parcela-${i}`,
      descricao: `Compra Parcelada (${i + 1}/6)`,
      valor: 100,
      parcelas: 6,
      parcela_atual: i + 1,
    }))

    const insertBuilder = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: createdInstallments,
          error: null,
        }),
      }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "contas") return accountBuilder
      return insertBuilder
    })

    const request = createPostRequest("/api/transacoes", {
      ...mockInstallmentInput,
      accountId: "conta-corrente-123",
    })
    const response = await POST(request as any)

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.count).toBe(6)
    expect(data.transactions).toHaveLength(6)
  })

  it("deve rejeitar mais de 48 parcelas", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/transacoes", {
      descricao: "Teste",
      valor: 4900,
      tipo: "SAIDA",
      data: "2025-01-15",
      parcelas: 49,
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("Número máximo de parcelas é 48")
  })
})

describe("PUT /api/transacoes", () => {
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

    const request = createPutRequest("/api/transacoes", { id: "tx-123" })
    const response = await PUT(request as any)

    expect(response.status).toBe(401)
  })

  it("deve rejeitar sem ID", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPutRequest("/api/transacoes", { descricao: "Novo" })
    const response = await PUT(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("ID da transação é obrigatório")
  })

  it("deve retornar 404 para transação não encontrada", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const selectBuilder = createResolvedQueryBuilder(null)
    mockSupabase.from.mockReturnValue(selectBuilder)

    const request = createPutRequest("/api/transacoes", {
      id: "tx-inexistente",
      descricao: "Novo",
    })
    const response = await PUT(request as any)

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe("Transação não encontrada")
  })

  it("deve atualizar transação existente", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // First call: check if exists
    const existsBuilder = createResolvedQueryBuilder({ id: "tx-123" })

    // Second call: update (chain: update -> eq -> eq -> select -> single)
    const updatedData = { ...mockTransacaoSaida, descricao: "Atualizado", categorias: null, contas: null }
    const updateBuilder = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedData, error: null }),
            }),
          }),
        }),
      }),
    }

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      return callCount === 1 ? existsBuilder : updateBuilder
    })

    const request = createPutRequest("/api/transacoes", {
      id: "tx-123",
      descricao: "Atualizado",
    })
    const response = await PUT(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.descricao).toBe("Atualizado")
  })
})

describe("DELETE /api/transacoes", () => {
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

    const request = createDeleteRequest("/api/transacoes", { id: "tx-123" })
    const response = await DELETE(request as any)

    expect(response.status).toBe(401)
  })

  it("deve rejeitar sem ID", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createDeleteRequest("/api/transacoes")
    const response = await DELETE(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("ID da transação é obrigatório")
  })

  it("deve retornar 404 para transação não encontrada", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const selectBuilder = createResolvedQueryBuilder(null)
    mockSupabase.from.mockReturnValue(selectBuilder)

    const request = createDeleteRequest("/api/transacoes", { id: "tx-inexistente" })
    const response = await DELETE(request as any)

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe("Transação não encontrada")
  })

  it("deve deletar transação existente", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // First call: check if exists
    const existsBuilder = createResolvedQueryBuilder({ id: "tx-123" })

    // Second call: delete
    const deleteBuilder = {
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      return callCount === 1 ? existsBuilder : deleteBuilder
    })

    const request = createDeleteRequest("/api/transacoes", { id: "tx-123" })
    const response = await DELETE(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
