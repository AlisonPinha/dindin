import type { DbCategory, DbCategoryType, DbCategoryGroup } from "@/lib/supabase"

// Categoria de receita
export const mockCategoriaReceita: DbCategory = {
  id: "cat-salario-123",
  nome: "Salário",
  tipo: "RECEITA" as DbCategoryType,
  cor: "#10B981",
  icone: "Briefcase",
  grupo: "LIVRE" as DbCategoryGroup,
  orcamento_mensal: null,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
}

// Categoria essencial
export const mockCategoriaAlimentacao: DbCategory = {
  id: "cat-alimentacao-123",
  nome: "Alimentação",
  tipo: "DESPESA" as DbCategoryType,
  cor: "#EF4444",
  icone: "Utensils",
  grupo: "ESSENCIAL" as DbCategoryGroup,
  orcamento_mensal: 800,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
}

// Categoria moradia (essencial)
export const mockCategoriaMoradia: DbCategory = {
  id: "cat-moradia-123",
  nome: "Moradia",
  tipo: "DESPESA" as DbCategoryType,
  cor: "#8B5CF6",
  icone: "Home",
  grupo: "ESSENCIAL" as DbCategoryGroup,
  orcamento_mensal: 1500,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
}

// Categoria lifestyle (livre)
export const mockCategoriaLazer: DbCategory = {
  id: "cat-lazer-123",
  nome: "Lazer",
  tipo: "DESPESA" as DbCategoryType,
  cor: "#F59E0B",
  icone: "Gamepad2",
  grupo: "LIVRE" as DbCategoryGroup,
  orcamento_mensal: 500,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
}

// Categoria de investimentos
export const mockCategoriaInvestimentos: DbCategory = {
  id: "cat-investimentos-123",
  nome: "Investimentos",
  tipo: "INVESTIMENTO" as DbCategoryType,
  cor: "#3B82F6",
  icone: "TrendingUp",
  grupo: "INVESTIMENTO" as DbCategoryGroup,
  orcamento_mensal: 1000,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
}

// Categoria de saúde
export const mockCategoriaSaude: DbCategory = {
  id: "cat-saude-123",
  nome: "Saúde",
  tipo: "DESPESA" as DbCategoryType,
  cor: "#EC4899",
  icone: "Heart",
  grupo: "ESSENCIAL" as DbCategoryGroup,
  orcamento_mensal: 300,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
}

// Lista de categorias para testes
export const mockCategoriesList: DbCategory[] = [
  mockCategoriaReceita,
  mockCategoriaAlimentacao,
  mockCategoriaMoradia,
  mockCategoriaLazer,
  mockCategoriaInvestimentos,
  mockCategoriaSaude,
]

// Categorias agrupadas por tipo
export const mockCategoriesByType = {
  receitas: [mockCategoriaReceita],
  despesas: [
    mockCategoriaAlimentacao,
    mockCategoriaMoradia,
    mockCategoriaLazer,
    mockCategoriaSaude,
  ],
  investimentos: [mockCategoriaInvestimentos],
}

// Categorias agrupadas por grupo
export const mockCategoriesByGroup = {
  essencial: [mockCategoriaAlimentacao, mockCategoriaMoradia, mockCategoriaSaude],
  livre: [mockCategoriaReceita, mockCategoriaLazer],
  investimento: [mockCategoriaInvestimentos],
}

// Helper para criar categoria customizada
export function createMockCategory(
  overrides: Partial<DbCategory> = {}
): DbCategory {
  return {
    ...mockCategoriaAlimentacao,
    id: `cat-${Date.now()}`,
    ...overrides,
  }
}

// Dados de entrada para criar categoria
export const mockCategoryInput = {
  nome: "Nova Categoria",
  tipo: "DESPESA" as DbCategoryType,
  cor: "#8B5CF6",
  icone: "Tag",
  grupo: "LIVRE" as DbCategoryGroup,
  orcamento_mensal: 200,
}

// Dados de atualização de categoria
export const mockCategoryUpdate = {
  nome: "Categoria Atualizada",
  cor: "#10B981",
}
