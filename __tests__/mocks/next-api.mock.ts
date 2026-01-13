import { vi } from "vitest"

// Mock de NextRequest
export function createMockNextRequest(
  url: string = "http://localhost:3000/api/test",
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
    searchParams?: Record<string, string>
  } = {}
) {
  const { method = "GET", body, headers = {}, searchParams = {} } = options

  const urlObj = new URL(url)
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value)
  })

  return {
    url: urlObj.toString(),
    method,
    headers: new Headers(headers),
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    formData: vi.fn().mockResolvedValue(new FormData()),
    nextUrl: urlObj,
  }
}

// Helper para criar request GET
export function createGetRequest(
  path: string,
  searchParams: Record<string, string> = {}
) {
  return createMockNextRequest(`http://localhost:3000${path}`, {
    method: "GET",
    searchParams,
  })
}

// Helper para criar request POST
export function createPostRequest<T>(path: string, body: T) {
  return createMockNextRequest(`http://localhost:3000${path}`, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  })
}

// Helper para criar request PUT
export function createPutRequest<T>(path: string, body: T) {
  return createMockNextRequest(`http://localhost:3000${path}`, {
    method: "PUT",
    body,
    headers: { "Content-Type": "application/json" },
  })
}

// Helper para criar request DELETE
export function createDeleteRequest(
  path: string,
  searchParams: Record<string, string> = {}
) {
  return createMockNextRequest(`http://localhost:3000${path}`, {
    method: "DELETE",
    searchParams,
  })
}

// Helper para extrair dados de NextResponse
export async function parseNextResponse<T>(response: Response): Promise<{
  data: T
  status: number
  headers: Headers
}> {
  const data = await response.json() as T
  return {
    data,
    status: response.status,
    headers: response.headers,
  }
}

// Mock de params para rotas dinâmicas [id]
export function createMockRouteParams(params: Record<string, string>) {
  return {
    params: Promise.resolve(params),
  }
}
