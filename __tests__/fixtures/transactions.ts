import type { DbTransaction, DbTransactionType, DbOwnershipType } from "@/lib/supabase"

// Transação de entrada (salário)
export const mockTransacaoEntrada: DbTransaction = {
  id: "tx-entrada-123",
  descricao: "Salário",
  valor: 5000.00,
  tipo: "ENTRADA" as DbTransactionType,
  data: "2025-01-05T00:00:00.000Z",
  recorrente: true,
  parcelas: null,
  parcela_atual: null,
  transacao_pai_id: null,
  tags: ["renda", "fixo"],
  anexo_url: null,
  notas: "Salário mensal",
  ownership: "CASA" as DbOwnershipType,
  category_id: "cat-salario-123",
  account_id: "conta-corrente-123",
  user_id: "test-user-123",
  created_at: "2025-01-05T00:00:00.000Z",
  updated_at: "2025-01-05T00:00:00.000Z",
}

// Transação de saída (despesa)
export const mockTransacaoSaida: DbTransaction = {
  id: "tx-saida-456",
  descricao: "Supermercado",
  valor: 450.00,
  tipo: "SAIDA" as DbTransactionType,
  data: "2025-01-10T00:00:00.000Z",
  recorrente: false,
  parcelas: null,
  parcela_atual: null,
  transacao_pai_id: null,
  tags: ["alimentação", "essencial"],
  anexo_url: null,
  notas: null,
  ownership: "CASA" as DbOwnershipType,
  category_id: "cat-alimentacao-123",
  account_id: "conta-corrente-123",
  user_id: "test-user-123",
  created_at: "2025-01-10T00:00:00.000Z",
  updated_at: "2025-01-10T00:00:00.000Z",
}

// Transação de transferência
export const mockTransacaoTransferencia: DbTransaction = {
  id: "tx-transf-789",
  descricao: "Transferência entre contas",
  valor: 1000.00,
  tipo: "TRANSFERENCIA" as DbTransactionType,
  data: "2025-01-15T00:00:00.000Z",
  recorrente: true,
  parcelas: null,
  parcela_atual: null,
  transacao_pai_id: null,
  tags: ["economia"],
  anexo_url: null,
  notas: "Reserva mensal",
  ownership: "CASA" as DbOwnershipType,
  category_id: null,
  account_id: "conta-corrente-123",
  user_id: "test-user-123",
  created_at: "2025-01-15T00:00:00.000Z",
  updated_at: "2025-01-15T00:00:00.000Z",
}

// Transação de investimento
export const mockTransacaoInvestimento: DbTransaction = {
  id: "tx-invest-101",
  descricao: "Aporte Tesouro Direto",
  valor: 500.00,
  tipo: "INVESTIMENTO" as DbTransactionType,
  data: "2025-01-20T00:00:00.000Z",
  recorrente: true,
  parcelas: null,
  parcela_atual: null,
  transacao_pai_id: null,
  tags: ["investimento", "renda fixa"],
  anexo_url: null,
  notas: null,
  ownership: "PESSOAL" as DbOwnershipType,
  category_id: "cat-investimentos-123",
  account_id: "invest-101",
  user_id: "test-user-123",
  created_at: "2025-01-20T00:00:00.000Z",
  updated_at: "2025-01-20T00:00:00.000Z",
}

// Transação parcelada
export const mockTransacaoParcelada: DbTransaction = {
  id: "tx-parcela-303",
  descricao: "Compra Parcelada 1/6",
  valor: 100.00,
  tipo: "SAIDA" as DbTransactionType,
  data: "2025-01-25T00:00:00.000Z",
  recorrente: false,
  parcelas: 6,
  parcela_atual: 1,
  transacao_pai_id: null,
  tags: ["parcelado"],
  anexo_url: null,
  notas: "Compra em 6x",
  ownership: "PESSOAL" as DbOwnershipType,
  category_id: "cat-lazer-123",
  account_id: "cartao-789",
  user_id: "test-user-123",
  created_at: "2025-01-25T00:00:00.000Z",
  updated_at: "2025-01-25T00:00:00.000Z",
}

// Transação pessoal
export const mockTransacaoPessoal: DbTransaction = {
  id: "tx-pessoal-202",
  descricao: "Academia",
  valor: 150.00,
  tipo: "SAIDA" as DbTransactionType,
  data: "2025-01-02T00:00:00.000Z",
  recorrente: true,
  parcelas: null,
  parcela_atual: null,
  transacao_pai_id: null,
  tags: ["saúde", "pessoal"],
  anexo_url: null,
  notas: null,
  ownership: "PESSOAL" as DbOwnershipType,
  category_id: "cat-saude-123",
  account_id: "conta-corrente-123",
  user_id: "test-user-123",
  created_at: "2025-01-02T00:00:00.000Z",
  updated_at: "2025-01-02T00:00:00.000Z",
}

// Lista de transações para testes
export const mockTransactionsList: DbTransaction[] = [
  mockTransacaoEntrada,
  mockTransacaoSaida,
  mockTransacaoTransferencia,
  mockTransacaoInvestimento,
  mockTransacaoPessoal,
]

// Helper para criar transação customizada
export function createMockTransaction(
  overrides: Partial<DbTransaction> = {}
): DbTransaction {
  return {
    ...mockTransacaoSaida,
    id: `tx-${Date.now()}`,
    data: new Date().toISOString(),
    ...overrides,
  }
}

// Dados de entrada para criar transação simples
export const mockTransactionInput = {
  descricao: "Nova Transação",
  valor: 100.00,
  tipo: "SAIDA" as DbTransactionType,
  data: "2025-01-25",
  conta_id: "conta-corrente-123",
  categoria_id: "cat-lazer-123",
  recorrente: false,
  ownership: "CASA" as DbOwnershipType,
}

// Dados de entrada para criar transação parcelada
export const mockInstallmentInput = {
  ...mockTransactionInput,
  descricao: "Compra Parcelada",
  valor: 600.00,
  parcelas: 6,
}

// Dados de atualização de transação
export const mockTransactionUpdate = {
  descricao: "Transação Atualizada",
  valor: 200.00,
}

// Resposta da API com paginação
export const mockTransactionsApiResponse = {
  transactions: mockTransactionsList,
  total: 5,
  hasMore: false,
}

// Transação com relacionamentos expandidos (como retornada pela API)
export const mockTransactionWithRelations = {
  ...mockTransacaoSaida,
  categorias: {
    id: "cat-alimentacao-123",
    nome: "Alimentação",
    tipo: "DESPESA",
    cor: "#EF4444",
    icone: "Utensils",
  },
  contas: {
    id: "conta-corrente-123",
    nome: "Conta Corrente Principal",
    tipo: "CORRENTE",
    banco: "Nubank",
  },
}
