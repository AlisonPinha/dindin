import "@testing-library/jest-dom"
import { vi, afterEach } from "vitest"

// Mock das variáveis de ambiente
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co")
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key")

// Mock do módulo next/headers (usado em server components)
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn().mockReturnValue([]),
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
  })),
  headers: vi.fn(() => new Headers()),
}))

// Mock do módulo next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks()
})
