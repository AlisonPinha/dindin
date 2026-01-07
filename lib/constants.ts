export const TRANSACTION_TYPES = {
  INCOME: "income",
  EXPENSE: "expense",
  TRANSFER: "transfer",
} as const

export const ACCOUNT_TYPES = {
  CHECKING: "checking",
  SAVINGS: "savings",
  CREDIT: "credit",
  INVESTMENT: "investment",
} as const

export const INVESTMENT_TYPES = {
  STOCKS: "stocks",
  BONDS: "bonds",
  CRYPTO: "crypto",
  REAL_ESTATE: "real_estate",
  FUNDS: "funds",
  OTHER: "other",
} as const

export const GOAL_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  PAUSED: "paused",
} as const

export const CATEGORY_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
] as const

export const DEFAULT_CATEGORIES = {
  income: [
    { name: "Salário", color: "#22c55e", icon: "Briefcase" },
    { name: "Freelance", color: "#10b981", icon: "Laptop" },
    { name: "Investimentos", color: "#3b82f6", icon: "TrendingUp" },
    { name: "Outros", color: "#6366f1", icon: "Plus" },
  ],
  expense: [
    { name: "Alimentação", color: "#f97316", icon: "UtensilsCrossed" },
    { name: "Transporte", color: "#eab308", icon: "Car" },
    { name: "Moradia", color: "#ef4444", icon: "Home" },
    { name: "Saúde", color: "#ec4899", icon: "Heart" },
    { name: "Educação", color: "#8b5cf6", icon: "GraduationCap" },
    { name: "Lazer", color: "#06b6d4", icon: "Gamepad2" },
    { name: "Compras", color: "#d946ef", icon: "ShoppingBag" },
    { name: "Contas", color: "#f43f5e", icon: "Receipt" },
    { name: "Outros", color: "#64748b", icon: "MoreHorizontal" },
  ],
} as const

export const CURRENCY_OPTIONS = {
  locale: "pt-BR",
  currency: "BRL",
} as const

export const DATE_FORMAT = {
  short: "dd/MM/yyyy",
  long: "dd 'de' MMMM 'de' yyyy",
  monthYear: "MMMM yyyy",
} as const