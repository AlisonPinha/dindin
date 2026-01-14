import type { DbAccount, DbAccountType } from "@/lib/supabase"

// Conta corrente padrão
export const mockContaCorrente: DbAccount = {
  id: "conta-corrente-123",
  nome: "Conta Corrente Principal",
  tipo: "CORRENTE" as DbAccountType,
  banco: "Nubank",
  saldo: 2500.00,
  cor: "#8B5CF6",
  icone: "Wallet",
  ativo: true,
  user_id: "test-user-123",
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
}

// Cartão de crédito
export const mockCartaoCredito: DbAccount = {
  id: "cartao-789",
  nome: "Cartão Nubank",
  tipo: "CARTAO_CREDITO" as DbAccountType,
  banco: "Nubank",
  saldo: -1500.00,
  cor: "#EF4444",
  icone: "CreditCard",
  ativo: true,
  user_id: "test-user-123",
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
}

// Investimentos
export const mockContaInvestimento: DbAccount = {
  id: "invest-101",
  nome: "Conta Investimentos",
  tipo: "INVESTIMENTO" as DbAccountType,
  banco: "XP",
  saldo: 25000.00,
  cor: "#3B82F6",
  icone: "TrendingUp",
  ativo: true,
  user_id: "test-user-123",
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
}

// Conta inativa
export const mockContaInativa: DbAccount = {
  id: "inativa-202",
  nome: "Conta Antiga",
  tipo: "CORRENTE" as DbAccountType,
  banco: "Bradesco",
  saldo: 0,
  cor: "#6B7280",
  icone: "Wallet",
  ativo: false,
  user_id: "test-user-123",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-12-01T00:00:00.000Z",
}

// Lista de contas para testes
export const mockAccountsList: DbAccount[] = [
  mockContaCorrente,
  mockCartaoCredito,
  mockContaInvestimento,
]

// Helper para criar conta customizada
export function createMockAccount(overrides: Partial<DbAccount> = {}): DbAccount {
  return {
    ...mockContaCorrente,
    id: `conta-${Date.now()}`,
    ...overrides,
  }
}

// Dados de entrada para criar conta
export const mockAccountInput = {
  nome: "Nova Conta",
  tipo: "CORRENTE" as DbAccountType,
  banco: "Inter",
  saldoInicial: 1000,
  cor: "#8B5CF6",
}

// Dados de atualização de conta
export const mockAccountUpdate = {
  nome: "Conta Atualizada",
  saldo: 5000,
  cor: "#10B981",
}

// Resposta da API com saldoAtual calculado
export interface AccountWithCalculatedBalance extends DbAccount {
  saldoAtual: number
}

export const mockAccountWithBalance: AccountWithCalculatedBalance = {
  ...mockContaCorrente,
  saldoAtual: 3500.00, // saldo inicial + transações
}

// Resposta completa da API de contas
export const mockAccountsApiResponse = {
  accounts: mockAccountsList,
  totals: {
    totalDisponivel: 12500.00,
    totalCredito: 1500.00,
    saldoLiquido: 36000.00,
  },
}
