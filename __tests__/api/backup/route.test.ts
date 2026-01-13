import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"
import { GET, POST } from "@/app/api/backup/route"
import { createMockSupabaseClient } from "../../mocks/supabase.mock"
import { createGetRequest, createPostRequest } from "../../mocks/next-api.mock"
import { mockUser } from "../../fixtures/users"
import { mockAccountsList } from "../../fixtures/accounts"
import { mockCategoriesList } from "../../fixtures/categories"
import { mockTransactionsList } from "../../fixtures/transactions"

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
function createResolvedQueryBuilder(data: unknown, useSingle = false) {
  const result = { data, error: null }

  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  }

  // Se useSingle, o resultado vem do .single(), senão é thenable
  if (!useSingle) {
    builder.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  }

  return builder
}

describe("GET /api/backup", () => {
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

    const request = createGetRequest("/api/backup")
    const response = await GET(request as any)

    expect(response.status).toBe(401)
  })

  it("deve gerar backup completo com sucesso", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // Mock para cada tabela - a rota usa Promise.all então todas as chamadas acontecem "ao mesmo tempo"
    // usuarios usa .single(), as outras são thenable
    mockSupabase.from.mockImplementation((table: string) => {
      const builders: Record<string, unknown> = {
        usuarios: createResolvedQueryBuilder(mockUser, true), // usa .single()
        contas: createResolvedQueryBuilder(mockAccountsList),
        categorias: createResolvedQueryBuilder(mockCategoriesList),
        transacoes: createResolvedQueryBuilder(mockTransactionsList),
        investimentos: createResolvedQueryBuilder([]),
        metas: createResolvedQueryBuilder([]),
      }
      return builders[table] || createResolvedQueryBuilder([])
    })

    const request = createGetRequest("/api/backup")
    const response = await GET(request as any)

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("application/json")
    expect(response.headers.get("Content-Disposition")).toContain("attachment")
    expect(response.headers.get("Content-Disposition")).toContain("backup")

    const data = await response.json()
    expect(data.version).toBeDefined()
    expect(data.createdAt).toBeDefined()
    expect(data.user).toBeDefined()
    expect(data.data).toBeDefined()
    expect(data.checksum).toBeDefined()
  })

  it("deve incluir todos os recursos no backup", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      const builders: Record<string, unknown> = {
        usuarios: createResolvedQueryBuilder(mockUser, true), // usa .single()
        contas: createResolvedQueryBuilder(mockAccountsList),
        categorias: createResolvedQueryBuilder(mockCategoriesList),
        transacoes: createResolvedQueryBuilder(mockTransactionsList),
        investimentos: createResolvedQueryBuilder([{ id: "inv-1" }]),
        metas: createResolvedQueryBuilder([{ id: "meta-1" }]),
      }
      return builders[table] || createResolvedQueryBuilder([])
    })

    const request = createGetRequest("/api/backup")
    const response = await GET(request as any)

    const data = await response.json()
    expect(data.data.usuario).toBeDefined()
    expect(data.data.contas).toBeDefined()
    expect(data.data.categorias).toBeDefined()
    expect(data.data.transacoes).toBeDefined()
    expect(data.data.investimentos).toBeDefined()
    expect(data.data.metas).toBeDefined()
  })
})

describe("POST /api/backup (restore)", () => {
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

    const request = createPostRequest("/api/backup", {})
    const response = await POST(request as any)

    expect(response.status).toBe(401)
  })

  it("deve rejeitar backup sem estrutura válida", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/backup", { invalid: "data" })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain("inválido")
  })

  it("deve rejeitar backup com checksum inválido", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const request = createPostRequest("/api/backup", {
      version: "1.0.0",
      data: { contas: [], categorias: [], transacoes: [] },
      checksum: "invalid-checksum",
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain("checksum")
  })

  it("deve retornar preview sem restaurar", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    // Gerar checksum válido
    const backupData = {
      usuario: null,
      contas: [{ nome: "Conta 1" }],
      categorias: [],
      transacoes: [],
      investimentos: [],
      metas: [],
    }

    // Função de checksum igual à do backup route
    function generateChecksum(data: object): string {
      const str = JSON.stringify(data)
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return Math.abs(hash).toString(16)
    }

    const request = createPostRequest("/api/backup", {
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      user: { id: "old-user", email: "old@test.com" },
      data: backupData,
      checksum: generateChecksum(backupData),
      preview: true,
    })
    const response = await POST(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.preview).toBe(true)
    expect(data.counts).toBeDefined()
    expect(data.warning).toBeDefined()
  })

  it("deve exigir confirmação para restaurar", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const backupData = {
      usuario: null,
      contas: [],
      categorias: [],
      transacoes: [],
      investimentos: [],
      metas: [],
    }

    function generateChecksum(data: object): string {
      const str = JSON.stringify(data)
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return Math.abs(hash).toString(16)
    }

    const request = createPostRequest("/api/backup", {
      version: "1.0.0",
      data: backupData,
      checksum: generateChecksum(backupData),
      // sem confirmDelete: true
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain("confirmDelete")
  })

  it("deve restaurar backup com confirmação", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const backupData = {
      usuario: { nome: "Usuário Teste", renda_mensal: 5000 },
      contas: [{ nome: "Conta 1", tipo: "CORRENTE", saldo: 1000 }],
      categorias: [{ nome: "Cat 1", tipo: "SAIDA", cor: "#ff0000", grupo: "ESSENCIAL" }],
      transacoes: [{ descricao: "Tx 1", valor: 100, tipo: "SAIDA", data: "2024-01-01" }],
      investimentos: [],
      metas: [],
    }

    function generateChecksum(data: object): string {
      const str = JSON.stringify(data)
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return Math.abs(hash).toString(16)
    }

    // Mock para delete e insert operations
    const deleteBuilder = {
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }

    const insertBuilder = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [{ id: "new-1" }], error: null }),
      }),
    }

    const updateBuilder = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }

    mockSupabase.from.mockImplementation(() => {
      return { ...deleteBuilder, ...insertBuilder, ...updateBuilder }
    })

    const request = createPostRequest("/api/backup", {
      version: "1.0.0",
      data: backupData,
      checksum: generateChecksum(backupData),
      confirmDelete: true,
    })
    const response = await POST(request as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.results).toBeDefined()
  })

  it("deve rejeitar versão incompatível", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const backupData = {
      usuario: null,
      contas: [],
      categorias: [],
      transacoes: [],
      investimentos: [],
      metas: [],
    }

    function generateChecksum(data: object): string {
      const str = JSON.stringify(data)
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return Math.abs(hash).toString(16)
    }

    const request = createPostRequest("/api/backup", {
      version: "2.0.0", // versão major diferente
      data: backupData,
      checksum: generateChecksum(backupData),
    })
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain("incompatível")
  })
})
