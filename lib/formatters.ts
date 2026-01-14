/**
 * Formatters for currency, dates, and other common display formats
 */

// Currency formatting
export function formatCurrency(value: number, options?: Intl.NumberFormatOptions): string {
  // Garantir que o valor seja um número válido
  const numValue = Number.isFinite(value) ? value : 0
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(numValue)
}

export function formatCurrencyCompact(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`
  }
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}K`
  }
  return formatCurrency(value)
}

export function formatCurrencyWithSign(value: number): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${formatCurrency(value)}`
}

// Percentage formatting
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatPercentageWithSign(value: number, decimals = 1): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(decimals)}%`
}

// Date formatting
export function formatDate(date: Date | string, format: "short" | "medium" | "long" = "medium"): string {
  const d = typeof date === "string" ? new Date(date) : date

  const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
    short: { day: "2-digit", month: "2-digit" },
    medium: { day: "2-digit", month: "short", year: "numeric" },
    long: { day: "2-digit", month: "long", year: "numeric" },
  }

  return new Intl.DateTimeFormat("pt-BR", optionsMap[format]).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return "Hoje"
  } else if (diffDays === 1) {
    return "Ontem"
  } else if (diffDays < 7) {
    return `${diffDays} dias atrás`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} semana${weeks > 1 ? "s" : ""} atrás`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} mês${months > 1 ? "es" : ""} atrás`
  } else {
    const years = Math.floor(diffDays / 365)
    return `${years} ano${years > 1 ? "s" : ""} atrás`
  }
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(d)
}

export function formatMesAno(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export function parseMesAno(mesAno: string): Date {
  const parts = mesAno.split("-").map(Number)
  const year = parts[0] ?? 2024
  const month = parts[1] ?? 1
  return new Date(year, month - 1, 1)
}

// Number formatting
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return formatNumber(value)
}

// Transaction type labels
export function formatTransactionType(type: string): string {
  const labels: Record<string, string> = {
    ENTRADA: "Receita",
    SAIDA: "Despesa",
    TRANSFERENCIA: "Transferência",
    INVESTIMENTO: "Investimento",
  }
  return labels[type] || type
}

// Investment type labels
export function formatInvestmentType(type: string): string {
  const labels: Record<string, string> = {
    RENDA_FIXA: "Renda Fixa",
    RENDA_VARIAVEL: "Renda Variável",
    CRIPTO: "Criptomoedas",
    FUNDO: "Fundos",
  }
  return labels[type] || type
}

// Account type labels
export function formatAccountType(type: string): string {
  const labels: Record<string, string> = {
    CORRENTE: "Conta Corrente",
    CARTAO_CREDITO: "Cartão de Crédito",
    INVESTIMENTO: "Investimento",
  }
  return labels[type] || type
}

// Category group labels
export function formatCategoryGroup(group: string): string {
  const labels: Record<string, string> = {
    ESSENCIAL: "Essencial (50%)",
    LIVRE: "Livre (30%)",
    INVESTIMENTO: "Investimento (20%)",
  }
  return labels[group] || group
}

// Goal type labels
export function formatGoalType(type: string): string {
  const labels: Record<string, string> = {
    ECONOMIA_CATEGORIA: "Economia por Categoria",
    INVESTIMENTO_MENSAL: "Investimento Mensal",
    PATRIMONIO: "Patrimônio Total",
    REGRA_PERCENTUAL: "Regra de Percentual",
  }
  return labels[type] || type
}
