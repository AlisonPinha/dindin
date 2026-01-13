import type { DbUser } from "@/lib/supabase"

// Usuário padrão para testes
export const mockUser: DbUser = {
  id: "test-user-123",
  nome: "Usuário Teste",
  email: "teste@exemplo.com",
  avatar: null,
  renda_mensal: 5000,
  is_onboarded: true,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
}

// Usuário não onboarded
export const mockNewUser: DbUser = {
  id: "new-user-456",
  nome: "Novo Usuário",
  email: "novo@exemplo.com",
  avatar: null,
  renda_mensal: null,
  is_onboarded: false,
  created_at: "2025-01-15T00:00:00.000Z",
  updated_at: "2025-01-15T00:00:00.000Z",
}

// Usuário com avatar
export const mockUserWithAvatar: DbUser = {
  id: "avatar-user-789",
  nome: "Usuário com Avatar",
  email: "avatar@exemplo.com",
  avatar: "https://example.com/avatar.jpg",
  renda_mensal: 8000,
  is_onboarded: true,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-10T00:00:00.000Z",
}

// Lista de usuários para testes de listagem
export const mockUsersList: DbUser[] = [
  mockUser,
  mockNewUser,
  mockUserWithAvatar,
]

// Helper para criar usuário customizado
export function createMockUser(overrides: Partial<DbUser> = {}): DbUser {
  return {
    ...mockUser,
    id: `user-${Date.now()}`,
    ...overrides,
  }
}

// Dados de entrada para criação de usuário
export const mockUserInput = {
  nome: "Novo Usuário",
  email: "novo@exemplo.com",
  avatar: null,
  renda_mensal: 5000,
  is_onboarded: false,
}

// Dados de atualização de usuário
export const mockUserUpdate = {
  nome: "Usuário Atualizado",
  renda_mensal: 7500,
}
