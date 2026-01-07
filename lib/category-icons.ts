/**
 * Mapeamento de ícones para categorias
 * Cada categoria tem um ícone associado além da cor
 * para garantir acessibilidade para daltônicos
 */

import {
  Briefcase,
  Code,
  TrendingUp,
  HelpCircle,
  Home,
  ShoppingCart,
  Car,
  Heart,
  GraduationCap,
  Gamepad2,
  ShoppingBag,
  Tv,
  Landmark,
  BarChart3,
  Wallet,
  Bitcoin,
  type LucideIcon,
} from "lucide-react"

// Mapeamento de nome de categoria para ícone
export const categoryIconMap: Record<string, LucideIcon> = {
  // Receitas
  "Salário": Briefcase,
  "Freelance": Code,
  "Rendimentos": TrendingUp,
  "Outros": HelpCircle,

  // Despesas
  "Moradia": Home,
  "Alimentação": ShoppingCart,
  "Transporte": Car,
  "Saúde": Heart,
  "Educação": GraduationCap,
  "Lazer": Gamepad2,
  "Compras": ShoppingBag,
  "Assinaturas": Tv,

  // Investimentos
  "Renda Fixa": Landmark,
  "Ações": BarChart3,
  "Fundos": Wallet,
  "Cripto": Bitcoin,
}

// Ícone padrão caso a categoria não esteja mapeada
export const defaultCategoryIcon: LucideIcon = HelpCircle

/**
 * Retorna o ícone para uma categoria
 * @param categoryName Nome da categoria
 * @returns Componente de ícone Lucide
 */
export function getCategoryIcon(categoryName: string): LucideIcon {
  return categoryIconMap[categoryName] || defaultCategoryIcon
}

// Mapeamento de tipo de categoria para ícone padrão
export const categoryTypeIconMap: Record<string, LucideIcon> = {
  income: TrendingUp,
  expense: ShoppingCart,
  investment: BarChart3,
}

/**
 * Retorna o ícone padrão para um tipo de categoria
 * @param type Tipo da categoria (income, expense, investment)
 * @returns Componente de ícone Lucide
 */
export function getCategoryTypeIcon(type: string): LucideIcon {
  return categoryTypeIconMap[type] || defaultCategoryIcon
}
