import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/quick-add/route"

// Mock do logger
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock do api-key helper
vi.mock("@/lib/api-key", () => ({
  hashApiKey: vi.fn((key: string) => `sha256:hashed_${key}`),
}))

// Mock do Supabase createClient
const mockFrom = vi.fn()
const mockSupabaseClient = {
  from: mockFrom,
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

// Helper para criar mock builder que resolve como Promise
function createResolvedQueryBuilder(data: unknown) {
  const result = { data, error: null }

  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  }

  builder.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)

  return builder
}

// Helper para criar NextRequest com headers
function createQuickAddRequest(
  body: Record<string, unknown>,
  apiKey?: string
) {
  const headers = new Headers({ "Content-Type": "application/json" })
  if (apiKey) {
    headers.set("authorization", `Bearer ${apiKey}`)
  }

  return {
    headers,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Request
}

// Gerar uma API key com o formato correto: dd_ + 64 hex chars = 67 chars total
const VALID_API_KEY = "dd_" + "a".repeat(64)

describe("POST /api/quick-add", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deve criar transação com request válido", async () => {
    // Mock: lookup user by hashed API key
    const userBuilder = createResolvedQueryBuilder({ id: "test-user-123" })

    // Mock: insert transaction
    const insertResult = {
      id: "tx-new-123",
      descricao: "Café",
      valor: 15.50,
      tipo: "SAIDA",
      data: "2025-01-15",
      mes_fatura: "2025-01-01",
    }
    const insertBuilder = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: insertResult, error: null }),
        }),
      }),
    }

    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      callCount++
      if (table === "usuarios") return userBuilder
      return insertBuilder
    })

    const request = createQuickAddRequest(
      { descricao: "Café", valor: 15.50 },
      VALID_API_KEY
    )
    const response = await POST(request as any)

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.transaction).toBeDefined()
  })

  it("deve retornar 401 quando API key está ausente", async () => {
    const request = createQuickAddRequest({ descricao: "Café", valor: 15.50 })
    const response = await POST(request as any)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe("Autenticação falhou")
  })

  it("deve retornar 401 quando API key é inválida", async () => {
    // Mock: user not found for this key
    const userBuilder = createResolvedQueryBuilder(null)
    mockFrom.mockReturnValue(userBuilder)

    const request = createQuickAddRequest(
      { descricao: "Café", valor: 15.50 },
      VALID_API_KEY
    )
    const response = await POST(request as any)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe("Autenticação falhou")
  })

  it("deve retornar 400 quando descricao está ausente", async () => {
    // Mock: valid user
    const userBuilder = createResolvedQueryBuilder({ id: "test-user-123" })
    mockFrom.mockReturnValue(userBuilder)

    const request = createQuickAddRequest(
      { valor: 15.50 },
      VALID_API_KEY
    )
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("descricao é obrigatório")
  })

  it("deve retornar 400 quando valor está ausente", async () => {
    // Mock: valid user
    const userBuilder = createResolvedQueryBuilder({ id: "test-user-123" })
    mockFrom.mockReturnValue(userBuilder)

    const request = createQuickAddRequest(
      { descricao: "Café" },
      VALID_API_KEY
    )
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("valor deve ser um número positivo")
  })

  it("deve retornar 400 quando tipo é inválido", async () => {
    // Mock: valid user
    const userBuilder = createResolvedQueryBuilder({ id: "test-user-123" })
    mockFrom.mockReturnValue(userBuilder)

    const request = createQuickAddRequest(
      { descricao: "Café", valor: 15.50, tipo: "INVALIDO" },
      VALID_API_KEY
    )
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain("tipo deve ser um dos")
  })

  it("deve retornar 400 quando valor é negativo", async () => {
    // Mock: valid user
    const userBuilder = createResolvedQueryBuilder({ id: "test-user-123" })
    mockFrom.mockReturnValue(userBuilder)

    const request = createQuickAddRequest(
      { descricao: "Café", valor: -10 },
      VALID_API_KEY
    )
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("valor deve ser um número positivo")
  })

  it("deve retornar 400 quando valor é zero", async () => {
    // Mock: valid user
    const userBuilder = createResolvedQueryBuilder({ id: "test-user-123" })
    mockFrom.mockReturnValue(userBuilder)

    const request = createQuickAddRequest(
      { descricao: "Café", valor: 0 },
      VALID_API_KEY
    )
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("valor deve ser um número positivo")
  })

  it("deve retornar 400 quando valor é NaN", async () => {
    // Mock: valid user
    const userBuilder = createResolvedQueryBuilder({ id: "test-user-123" })
    mockFrom.mockReturnValue(userBuilder)

    const request = createQuickAddRequest(
      { descricao: "Café", valor: NaN },
      VALID_API_KEY
    )
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("valor deve ser um número positivo")
  })

  it("deve retornar 400 quando descricao é muito longa", async () => {
    // Mock: valid user
    const userBuilder = createResolvedQueryBuilder({ id: "test-user-123" })
    mockFrom.mockReturnValue(userBuilder)

    const longDesc = "a".repeat(256)
    const request = createQuickAddRequest(
      { descricao: longDesc, valor: 10 },
      VALID_API_KEY
    )
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain("255 caracteres")
  })
})
