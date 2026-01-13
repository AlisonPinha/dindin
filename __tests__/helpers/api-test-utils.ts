import { vi, expect, type Mock } from "vitest"
import { NextResponse } from "next/server"
import {
  createMockSupabaseClient,
  createMockQueryBuilder,
  mockQueryResponse,
} from "../mocks/supabase.mock"
import {
  createMockGetAuthenticatedUser,
  createMockGetSupabaseClient,
} from "../mocks/auth-helper.mock"
import {
  createMockNextRequest,
  createPostRequest,
  createPutRequest,
  createDeleteRequest,
  createGetRequest,
  createMockRouteParams,
  parseNextResponse,
} from "../mocks/next-api.mock"

// Tipo para configuração de teste de API
interface ApiTestConfig {
  authenticated?: boolean
  userId?: string
  email?: string
}

// Cria um contexto de teste completo para rotas de API
export function createApiTestContext(config: ApiTestConfig = {}) {
  const { authenticated = true, userId = "test-user-123", email = "test@example.com" } = config

  const mockSupabaseClient = createMockSupabaseClient()
  const mockGetAuthenticatedUser = createMockGetAuthenticatedUser(authenticated, userId, email)
  const mockGetSupabaseClient = vi.fn().mockResolvedValue(mockSupabaseClient)

  return {
    mockSupabaseClient,
    mockGetAuthenticatedUser,
    mockGetSupabaseClient,
    userId,
    email,
  }
}

// Configura os mocks do módulo auth-helper
export function setupApiMocks(context: ReturnType<typeof createApiTestContext>) {
  vi.mock("@/lib/supabase/auth-helper", () => ({
    getAuthenticatedUser: context.mockGetAuthenticatedUser,
    getSupabaseClient: context.mockGetSupabaseClient,
  }))
}

// Verifica se a resposta é um erro de autenticação
export async function expectUnauthorized(response: Response) {
  expect(response.status).toBe(401)
  const data = await response.json()
  expect(data.error).toBe("Não autorizado")
}

// Verifica se a resposta é um erro 404
export async function expectNotFound(response: Response, message?: string) {
  expect(response.status).toBe(404)
  const data = await response.json()
  if (message) {
    expect(data.error).toBe(message)
  } else {
    expect(data.error).toBeDefined()
  }
}

// Verifica se a resposta é um erro de validação (400)
export async function expectBadRequest(response: Response, message?: string) {
  expect(response.status).toBe(400)
  const data = await response.json()
  if (message) {
    expect(data.error).toBe(message)
  } else {
    expect(data.error).toBeDefined()
  }
}

// Verifica se a resposta é um erro interno (500)
export async function expectServerError(response: Response) {
  expect(response.status).toBe(500)
  const data = await response.json()
  expect(data.error).toBeDefined()
}

// Verifica se a resposta é sucesso (200)
export async function expectSuccess<T>(response: Response): Promise<T> {
  expect(response.status).toBe(200)
  return response.json() as Promise<T>
}

// Verifica se a resposta é criação com sucesso (201 ou 200)
export async function expectCreated<T>(response: Response): Promise<T> {
  expect([200, 201]).toContain(response.status)
  return response.json() as Promise<T>
}

// Configura mock para retornar dados específicos em uma query
export function mockTableQuery<T>(
  supabaseClient: ReturnType<typeof createMockSupabaseClient>,
  table: string,
  data: T | T[] | null,
  error: { code: string; message: string } | null = null
) {
  return mockQueryResponse(supabaseClient, table, data, error)
}

// Configura mock para simular operação de insert
export function mockTableInsert<T>(
  supabaseClient: ReturnType<typeof createMockSupabaseClient>,
  table: string,
  returnData: T
) {
  const builder = createMockQueryBuilder({
    data: returnData,
    error: null,
  })

  supabaseClient.from.mockImplementation((t: string) => {
    if (t === table) {
      return {
        ...builder,
        insert: vi.fn().mockReturnValue({
          ...builder,
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: returnData, error: null }),
          }),
        }),
      }
    }
    return createMockQueryBuilder()
  })

  return builder
}

// Configura mock para simular operação de update
export function mockTableUpdate<T>(
  supabaseClient: ReturnType<typeof createMockSupabaseClient>,
  table: string,
  returnData: T
) {
  const builder = createMockQueryBuilder({
    data: returnData,
    error: null,
  })

  supabaseClient.from.mockImplementation((t: string) => {
    if (t === table) {
      return {
        ...builder,
        update: vi.fn().mockReturnValue({
          ...builder,
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: returnData, error: null }),
            }),
          }),
        }),
      }
    }
    return createMockQueryBuilder()
  })

  return builder
}

// Configura mock para simular operação de delete
export function mockTableDelete(
  supabaseClient: ReturnType<typeof createMockSupabaseClient>,
  table: string,
  success: boolean = true
) {
  const builder = createMockQueryBuilder({
    data: null,
    error: success ? null : { code: "ERROR", message: "Delete failed" },
  })

  supabaseClient.from.mockImplementation((t: string) => {
    if (t === table) {
      return {
        ...builder,
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: success ? null : { code: "ERROR", message: "Delete failed" },
          }),
        }),
      }
    }
    return createMockQueryBuilder()
  })

  return builder
}

// Re-export request helpers
export {
  createMockNextRequest,
  createPostRequest,
  createPutRequest,
  createDeleteRequest,
  createGetRequest,
  createMockRouteParams,
  parseNextResponse,
}
