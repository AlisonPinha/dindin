import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"
import { GET, POST } from "@/app/api/usuarios/api-key/route"
import { createMockSupabaseClient } from "../../../mocks/supabase.mock"

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

// Mock do api-key helper
vi.mock("@/lib/api-key", () => ({
  hashApiKey: vi.fn((key: string) => `sha256:hashed_${key.slice(0, 16)}`),
}))

// Helper para criar mock builder que resolve como Promise
function createResolvedQueryBuilder(data: unknown) {
  const result = { data, error: null }

  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  }

  builder.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)

  return builder
}

describe("GET /api/usuarios/api-key", () => {
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

  it("deve retornar chave mascarada quando existe", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const userBuilder = createResolvedQueryBuilder({
      api_key: "sha256:abcdefgh12345678901234567890abcdefgh12345678901234567890abcdef",
    })
    mockSupabase.from.mockReturnValue(userBuilder)

    const response = await GET()

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.hasKey).toBe(true)
    expect(data.apiKey).toBeDefined()
    // A chave deve estar mascarada (contém "...")
    expect(data.apiKey).toContain("...")
  })

  it("deve retornar hasKey false quando não existe chave", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const userBuilder = createResolvedQueryBuilder({ api_key: null })
    mockSupabase.from.mockReturnValue(userBuilder)

    const response = await GET()

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.hasKey).toBe(false)
    expect(data.apiKey).toBeNull()
  })
})

describe("POST /api/usuarios/api-key", () => {
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

    const response = await POST()

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe("Não autorizado")
  })

  it("deve gerar e retornar nova API key", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // Mock update call
    const updateBuilder = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }
    mockSupabase.from.mockReturnValue(updateBuilder)

    const response = await POST()

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.apiKey).toBeDefined()
    // A chave bruta começa com dd_
    expect(data.apiKey).toMatch(/^dd_/)
  })

  it("deve retornar chave bruta apenas uma vez (POST armazena o hash)", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // Mock update call
    const updateBuilder = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }
    mockSupabase.from.mockReturnValue(updateBuilder)

    const response = await POST()
    const data = await response.json()

    // A chave bruta é retornada na resposta do POST
    expect(data.apiKey).toBeDefined()
    expect(data.apiKey.length).toBeGreaterThan(3) // dd_ + hex chars

    // O banco armazena o hash via update, não a chave bruta
    expect(updateBuilder.update).toHaveBeenCalled()
  })
})
