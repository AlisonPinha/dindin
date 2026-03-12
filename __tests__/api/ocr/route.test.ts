import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"

// Mock do auth-helper
const mockGetAuthenticatedUser = vi.fn()

vi.mock("@/lib/supabase/auth-helper", () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
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

// Helper para criar mock de request com formData
function createMockFormDataRequest(
  file: { name: string; type: string; size: number } | null,
  options: { type?: string } = {}
) {
  const mockFormData = {
    get: vi.fn((key: string) => {
      if (key === "file" && file) {
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(file.size)),
        } as unknown as File
      }
      if (key === "type") return options.type || null
      return null
    }),
  }

  return {
    headers: new Headers({ "Content-Type": "multipart/form-data" }),
    formData: vi.fn().mockResolvedValue(mockFormData),
  } as unknown as Request
}

// Helper para criar mocks comuns
function createCommonMocks() {
  return {
    "@/lib/supabase/auth-helper": {
      getAuthenticatedUser: () => mockGetAuthenticatedUser(),
    },
    "@/lib/logger": {
      logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
      },
    },
  }
}

describe("POST /api/ocr", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it("deve retornar 503 quando ANTHROPIC_API_KEY não está configurada", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "")

    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const mocks = createCommonMocks()
    vi.doMock("@/lib/supabase/auth-helper", () => mocks["@/lib/supabase/auth-helper"])
    vi.doMock("@/lib/logger", () => mocks["@/lib/logger"])
    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class MockAnthropic {
        constructor() { /* noop */ }
        messages = { create: vi.fn() }
      },
    }))

    const { POST } = await import("@/app/api/ocr/route")

    const request = createMockFormDataRequest(
      { name: "fatura.jpg", type: "image/jpeg", size: 1024 }
    )
    const response = await POST(request as any)

    expect(response.status).toBe(503)
    const data = await response.json()
    expect(data.error).toContain("OCR não configurado")
  })

  it("deve retornar 401 para usuário não autenticado", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: null,
      error: NextResponse.json({ error: "Não autorizado" }, { status: 401 }),
    })

    const mocks = createCommonMocks()
    vi.doMock("@/lib/supabase/auth-helper", () => mocks["@/lib/supabase/auth-helper"])
    vi.doMock("@/lib/logger", () => mocks["@/lib/logger"])
    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class MockAnthropic {
        constructor() { /* noop */ }
        messages = { create: vi.fn() }
      },
    }))

    const { POST } = await import("@/app/api/ocr/route")

    const request = createMockFormDataRequest(
      { name: "fatura.jpg", type: "image/jpeg", size: 1024 }
    )
    const response = await POST(request as any)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe("Não autorizado")
  })

  it("deve retornar 400 quando nenhum arquivo é enviado", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key")

    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const mocks = createCommonMocks()
    vi.doMock("@/lib/supabase/auth-helper", () => mocks["@/lib/supabase/auth-helper"])
    vi.doMock("@/lib/logger", () => mocks["@/lib/logger"])
    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class MockAnthropic {
        constructor() { /* noop */ }
        messages = { create: vi.fn() }
      },
    }))

    const { POST } = await import("@/app/api/ocr/route")

    const request = createMockFormDataRequest(null)
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe("Arquivo não enviado")
  })

  it("deve retornar 400 para tipo de arquivo inválido", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key")

    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const mocks = createCommonMocks()
    vi.doMock("@/lib/supabase/auth-helper", () => mocks["@/lib/supabase/auth-helper"])
    vi.doMock("@/lib/logger", () => mocks["@/lib/logger"])
    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class MockAnthropic {
        constructor() { /* noop */ }
        messages = { create: vi.fn() }
      },
    }))

    const { POST } = await import("@/app/api/ocr/route")

    const request = createMockFormDataRequest(
      { name: "document.txt", type: "text/plain", size: 1024 }
    )
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain("Tipo de arquivo não suportado")
  })

  it("deve retornar 400 para arquivo muito grande", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key")

    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: "test-user-123", email: "test@example.com" },
      error: null,
    })

    const mocks = createCommonMocks()
    vi.doMock("@/lib/supabase/auth-helper", () => mocks["@/lib/supabase/auth-helper"])
    vi.doMock("@/lib/logger", () => mocks["@/lib/logger"])
    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class MockAnthropic {
        constructor() { /* noop */ }
        messages = { create: vi.fn() }
      },
    }))

    const { POST } = await import("@/app/api/ocr/route")

    // 15MB image - exceeds 10MB limit
    const request = createMockFormDataRequest(
      { name: "huge.jpg", type: "image/jpeg", size: 15 * 1024 * 1024 }
    )
    const response = await POST(request as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain("Arquivo muito grande")
  })
})
