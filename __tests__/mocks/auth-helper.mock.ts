import { vi } from "vitest"
import { NextResponse } from "next/server"
import type { AuthResult } from "@/lib/supabase/auth-helper"
import { createMockSupabaseClient } from "./supabase.mock"

// Mock de usuário autenticado
export function mockAuthenticatedUser(
  userId: string = "test-user-123",
  email: string = "test@example.com"
): AuthResult {
  return {
    user: { id: userId, email },
    error: null,
  }
}

// Mock de usuário não autenticado
export function mockUnauthenticated(): AuthResult {
  return {
    user: null,
    error: NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    ),
  }
}

// Mock da função getAuthenticatedUser
export function createMockGetAuthenticatedUser(
  authenticated: boolean = true,
  userId: string = "test-user-123",
  email: string = "test@example.com"
) {
  return vi.fn().mockResolvedValue(
    authenticated
      ? mockAuthenticatedUser(userId, email)
      : mockUnauthenticated()
  )
}

// Mock da função getSupabaseClient
export function createMockGetSupabaseClient(
  overrides: Parameters<typeof createMockSupabaseClient>[0] = {}
) {
  const mockClient = createMockSupabaseClient(overrides)
  return vi.fn().mockResolvedValue(mockClient)
}

// Helper para configurar módulo de auth-helper completo
export function setupAuthHelperMocks(
  authenticated: boolean = true,
  userId: string = "test-user-123",
  email: string = "test@example.com"
) {
  const mockSupabaseClient = createMockSupabaseClient()

  return {
    getAuthenticatedUser: createMockGetAuthenticatedUser(authenticated, userId, email),
    getSupabaseClient: vi.fn().mockResolvedValue(mockSupabaseClient),
    mockSupabaseClient,
  }
}

// Tipo para vi.mock do módulo auth-helper
export type AuthHelperMock = {
  getAuthenticatedUser: ReturnType<typeof createMockGetAuthenticatedUser>
  getSupabaseClient: ReturnType<typeof createMockGetSupabaseClient>
}
