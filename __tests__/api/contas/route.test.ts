import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"
import { GET, POST, PUT, DELETE } from "@/app/api/contas/route"
import { createMockSupabaseClient } from "../../mocks/supabase.mock"
import {
  createGetRequest,
  createPostRequest,
  createPutRequest,
  createDeleteRequest,
} from "../../mocks/next-api.mock"
import {
  mockAccountsList,
  mockContaCorrente,
  mockAccountInput,
} from "../../fixtures/accounts"

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
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  }

  builder.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)

  return builder
}

describe("GET /api/contas", () => {
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

    const request = createGetRequest("/api/contas")
    const response = await GET(request as any)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe("Não autorizado")
  })

  it("deve retornar contas vazias quando não houver contas", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const accountsBuilder = createResolvedQueryBuilder([])
    mockSupabase.from.mockReturnValue(accountsBuilder)

    const request = createGetRequest("/api/contas")
    const response = await GET(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.accounts).toEqual([])
    expect(data.totals.totalDisponivel).toBe(0)
    expect(data.totals.totalCredito).toBe(0)
    expect(data.totals.saldoLiquido).toBe(0)
  })

  it("deve retornar contas com saldo calculado", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // First query: accounts
    const accountsBuilder = createResolvedQueryBuilder(mockAccountsList)

    // Second query: transactions
    const transactionsBuilder = createResolvedQueryBuilder([
      { account_id: "conta-corrente-123", valor: 1000, tipo: "ENTRADA" },
      { account_id: "conta-corrente-123", valor: 500, tipo: "SAIDA" },
    ])

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      return callCount === 1 ? accountsBuilder : transactionsBuilder
    })

    const request = createGetRequest("/api/contas")
    const response = await GET(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.accounts).toBeDefined()
    expect(data.accounts.length).toBe(mockAccountsList.length)
    expect(data.totals).toBeDefined()
  })

  it("deve aplicar filtro de tipo", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const accountsBuilder = createResolvedQueryBuilder([mockContaCorrente])
    const transactionsBuilder = createResolvedQueryBuilder([])

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      return callCount === 1 ? accountsBuilder : transactionsBuilder
    })

    const request = createGetRequest("/api/contas", { tipo: "CORRENTE" })
    await GET(request as any)

    expect(accountsBuilder.eq).toHaveBeenCalledWith("tipo", "CORRENTE")
  })

  it("deve aplicar filtro de ativo", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const accountsBuilder = createResolvedQueryBuilder([mockContaCorrente])
    const transactionsBuilder = createResolvedQueryBuilder([])

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      return callCount === 1 ? accountsBuilder : transactionsBuilder
    })

    const request = createGetRequest("/api/contas", { ativo: "true" })
    await GET(request as any)

    expect(accountsBuilder.eq).toHaveBeenCalledWith("ativo", true)
  })
})

describe("POST /api/contas", () => {
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

    const request = createPostRequest("/api/contas", mockAccountInput)
    const response = await POST(request as any)

    expect(response.status).toBe(401)
  })

  it("deve criar conta com sucesso", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const insertBuilder = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockContaCorrente, error: null }),
        }),
      }),
    }

    mockSupabase.from.mockReturnValue(insertBuilder)

    const request = createPostRequest("/api/contas", mockAccountInput)
    const response = await POST(request as any)

    expect(response.status).toBe(201)
  })

  it("deve rejeitar sem nome", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/contas", { ...mockAccountInput, nome: "" })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("Nome é obrigatório")
  })

  it("deve rejeitar sem tipo", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/contas", { nome: "Conta Teste" })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("Tipo é obrigatório")
  })
})

describe("PUT /api/contas", () => {
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

    const request = createPutRequest("/api/contas", { id: "conta-123" })
    const response = await PUT(request as any)

    expect(response.status).toBe(401)
  })

  it("deve rejeitar sem ID", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPutRequest("/api/contas", { nome: "Novo Nome" })
    const response = await PUT(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("ID da conta é obrigatório")
  })

  it("deve retornar 404 para conta não encontrada", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const selectBuilder = createResolvedQueryBuilder(null)
    mockSupabase.from.mockReturnValue(selectBuilder)

    const request = createPutRequest("/api/contas", { id: "conta-inexistente", nome: "Novo" })
    const response = await PUT(request as any)

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe("Conta não encontrada")
  })

  it("deve atualizar conta existente", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // First call: check if exists
    const existsBuilder = createResolvedQueryBuilder({ id: "conta-123" })

    // Second call: update (chain: update -> eq -> eq -> select -> single)
    const updatedData = { ...mockContaCorrente, nome: "Conta Atualizada" }
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

    const request = createPutRequest("/api/contas", { id: "conta-123", nome: "Conta Atualizada" })
    const response = await PUT(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.nome).toBe("Conta Atualizada")
  })
})

describe("DELETE /api/contas", () => {
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

    const request = createDeleteRequest("/api/contas", { id: "conta-123" })
    const response = await DELETE(request as any)

    expect(response.status).toBe(401)
  })

  it("deve rejeitar sem ID", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createDeleteRequest("/api/contas")
    const response = await DELETE(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("ID da conta é obrigatório")
  })

  it("deve retornar 404 para conta não encontrada", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const selectBuilder = createResolvedQueryBuilder(null)
    mockSupabase.from.mockReturnValue(selectBuilder)

    const request = createDeleteRequest("/api/contas", { id: "conta-inexistente" })
    const response = await DELETE(request as any)

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe("Conta não encontrada")
  })

  it("deve desativar conta com transações (soft delete)", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // First call: check if exists
    const existsBuilder = createResolvedQueryBuilder({ id: "conta-123" })

    // Second call: count transactions
    const countBuilder = createResolvedQueryBuilder(null, 5)

    // Third call: soft delete (update ativo = false)
    const updateBuilder = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return existsBuilder
      if (callCount === 2) return countBuilder
      return updateBuilder
    })

    const request = createDeleteRequest("/api/contas", { id: "conta-123" })
    const response = await DELETE(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.action).toBe("deactivated")
    expect(data.transactionCount).toBe(5)
  })

  it("deve deletar conta sem transações (hard delete)", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // First call: check if exists
    const existsBuilder = createResolvedQueryBuilder({ id: "conta-123" })

    // Second call: count transactions (0)
    const countBuilder = createResolvedQueryBuilder(null, 0)

    // Third call: hard delete
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
      if (callCount === 1) return existsBuilder
      if (callCount === 2) return countBuilder
      return deleteBuilder
    })

    const request = createDeleteRequest("/api/contas", { id: "conta-123" })
    const response = await DELETE(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.action).toBe("deleted")
  })

  it("deve forçar hard delete com force=true", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // First call: check if exists
    const existsBuilder = createResolvedQueryBuilder({ id: "conta-123" })

    // Second call: count transactions (has some)
    const countBuilder = createResolvedQueryBuilder(null, 5)

    // Third call: hard delete
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
      if (callCount === 1) return existsBuilder
      if (callCount === 2) return countBuilder
      return deleteBuilder
    })

    const request = createDeleteRequest("/api/contas", { id: "conta-123", force: "true" })
    const response = await DELETE(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.action).toBe("deleted")
  })
})
