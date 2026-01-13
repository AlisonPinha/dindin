import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"
import { GET, POST, PUT, DELETE } from "@/app/api/usuarios/route"
import { createMockSupabaseClient } from "../../mocks/supabase.mock"
import { createPostRequest, createPutRequest } from "../../mocks/next-api.mock"
import { mockUser, mockUserInput } from "../../fixtures/users"

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
    single: vi.fn().mockResolvedValue(result),
  }

  builder.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)

  return builder
}

describe("GET /api/usuarios", () => {
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

    const response = await GET()

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe("Não autorizado")
  })

  it("deve retornar array vazio para usuário não cadastrado", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const userBuilder = createResolvedQueryBuilder(null)
    mockSupabase.from.mockReturnValue(userBuilder)

    const response = await GET()

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toEqual([])
  })

  it("deve retornar dados do usuário com contagens", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // First call: get user
    const userBuilder = createResolvedQueryBuilder(mockUser)

    // Count queries (4 parallel queries)
    const countBuilder = createResolvedQueryBuilder(null, 5)

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return userBuilder
      return countBuilder
    })

    const response = await GET()

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(1)
    expect(data[0].id).toBe(mockUser.id)
    expect(data[0]._count).toBeDefined()
  })
})

describe("POST /api/usuarios", () => {
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

    const request = createPostRequest("/api/usuarios", mockUserInput)
    const response = await POST(request as any)

    expect(response.status).toBe(401)
  })

  it("deve criar usuário com sucesso", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // First call: check if exists (should return null)
    const existsBuilder = createResolvedQueryBuilder(null)

    // Second call: insert
    const insertBuilder = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
        }),
      }),
    }

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      return callCount === 1 ? existsBuilder : insertBuilder
    })

    const request = createPostRequest("/api/usuarios", { nome: "Novo Usuário" })
    const response = await POST(request as any)

    expect(response.status).toBe(201)
  })

  it("deve rejeitar se usuário já existe", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // User already exists
    const existsBuilder = createResolvedQueryBuilder({ id: "test-user-123" })
    mockSupabase.from.mockReturnValue(existsBuilder)

    const request = createPostRequest("/api/usuarios", { nome: "Novo Usuário" })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("Usuário já cadastrado")
  })
})

describe("PUT /api/usuarios", () => {
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

    const request = createPutRequest("/api/usuarios", { nome: "Novo Nome" })
    const response = await PUT(request as any)

    expect(response.status).toBe(401)
  })

  it("deve retornar 404 se usuário não existe", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const existsBuilder = createResolvedQueryBuilder(null)
    mockSupabase.from.mockReturnValue(existsBuilder)

    const request = createPutRequest("/api/usuarios", { nome: "Novo Nome" })
    const response = await PUT(request as any)

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe("Usuário não encontrado")
  })

  it("deve atualizar usuário existente", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // First call: check if exists
    const existsBuilder = createResolvedQueryBuilder({ id: "test-user-123" })

    // Second call: update
    const updatedUser = { ...mockUser, nome: "Nome Atualizado" }
    const updateBuilder = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedUser, error: null }),
          }),
        }),
      }),
    }

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      return callCount === 1 ? existsBuilder : updateBuilder
    })

    const request = createPutRequest("/api/usuarios", { nome: "Nome Atualizado" })
    const response = await PUT(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.nome).toBe("Nome Atualizado")
  })

  it("deve atualizar renda mensal", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const existsBuilder = createResolvedQueryBuilder({ id: "test-user-123" })

    const updatedUser = { ...mockUser, renda_mensal: 8000 }
    const updateBuilder = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedUser, error: null }),
          }),
        }),
      }),
    }

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      return callCount === 1 ? existsBuilder : updateBuilder
    })

    const request = createPutRequest("/api/usuarios", { rendaMensal: 8000 })
    const response = await PUT(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.renda_mensal).toBe(8000)
  })
})

describe("DELETE /api/usuarios", () => {
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

    const response = await DELETE()

    expect(response.status).toBe(401)
  })

  it("deve deletar usuário e retornar contagens", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // Count queries (4 parallel queries)
    const countBuilder = createResolvedQueryBuilder(null, 3)

    // Delete query
    const deleteBuilder = {
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      // First 4 calls are counts, 5th is delete
      if (callCount <= 4) return countBuilder
      return deleteBuilder
    })

    const response = await DELETE()

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.deletedData).toBeDefined()
    expect(data.deletedData.accounts).toBe(3)
    expect(data.deletedData.transactions).toBe(3)
    expect(data.deletedData.investments).toBe(3)
    expect(data.deletedData.goals).toBe(3)
  })
})
