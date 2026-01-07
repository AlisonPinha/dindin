// Color utilities and constants for the application
// Based on the design system defined in globals.css

export const semanticColors = {
  income: {
    DEFAULT: "hsl(160, 84%, 39%)", // Emerald 500
    light: "hsl(160, 84%, 45%)",
    dark: "hsl(161, 94%, 30%)",
    bg: "hsl(160, 84%, 39%, 0.1)",
  },
  expense: {
    DEFAULT: "hsl(0, 84%, 60%)", // Red 500
    light: "hsl(0, 84%, 65%)",
    dark: "hsl(0, 84%, 50%)",
    bg: "hsl(0, 84%, 60%, 0.1)",
  },
  investment: {
    DEFAULT: "hsl(217, 91%, 60%)", // Blue 500
    light: "hsl(217, 91%, 65%)",
    dark: "hsl(217, 91%, 50%)",
    bg: "hsl(217, 91%, 60%, 0.1)",
  },
  success: {
    DEFAULT: "hsl(142, 71%, 45%)", // Green 500
    light: "hsl(142, 71%, 50%)",
    dark: "hsl(142, 71%, 40%)",
    bg: "hsl(142, 71%, 45%, 0.1)",
  },
  warning: {
    DEFAULT: "hsl(38, 92%, 50%)", // Amber 500
    light: "hsl(38, 92%, 55%)",
    dark: "hsl(38, 92%, 45%)",
    bg: "hsl(38, 92%, 50%, 0.1)",
  },
  danger: {
    DEFAULT: "hsl(0, 84%, 60%)", // Red 500
    light: "hsl(0, 84%, 65%)",
    dark: "hsl(0, 84%, 50%)",
    bg: "hsl(0, 84%, 60%, 0.1)",
  },
} as const

// Chart color palette - ensuring good contrast and accessibility
export const chartColors = {
  primary: [
    "hsl(160, 84%, 39%)", // Emerald (primary)
    "hsl(217, 91%, 60%)", // Blue
    "hsl(38, 92%, 50%)",  // Amber
    "hsl(0, 84%, 60%)",   // Red
    "hsl(142, 71%, 45%)", // Green
    "hsl(270, 70%, 60%)", // Purple
    "hsl(180, 70%, 45%)", // Cyan
    "hsl(330, 80%, 55%)", // Pink
  ],
  sequential: {
    green: [
      "hsl(160, 84%, 25%)",
      "hsl(160, 84%, 35%)",
      "hsl(160, 84%, 45%)",
      "hsl(160, 84%, 55%)",
      "hsl(160, 84%, 65%)",
    ],
    blue: [
      "hsl(217, 91%, 30%)",
      "hsl(217, 91%, 40%)",
      "hsl(217, 91%, 50%)",
      "hsl(217, 91%, 60%)",
      "hsl(217, 91%, 70%)",
    ],
    red: [
      "hsl(0, 84%, 35%)",
      "hsl(0, 84%, 45%)",
      "hsl(0, 84%, 55%)",
      "hsl(0, 84%, 65%)",
      "hsl(0, 84%, 75%)",
    ],
  },
  diverging: [
    "hsl(0, 84%, 50%)",   // Red (negative)
    "hsl(0, 84%, 65%)",
    "hsl(0, 0%, 70%)",    // Neutral
    "hsl(160, 84%, 55%)",
    "hsl(160, 84%, 40%)", // Green (positive)
  ],
} as const

// Category colors - distinct colors for different expense categories
export const categoryColors: Record<string, string> = {
  // Essenciais
  moradia: "hsl(217, 91%, 60%)",      // Blue
  alimentacao: "hsl(38, 92%, 50%)",   // Amber
  transporte: "hsl(270, 70%, 60%)",   // Purple
  saude: "hsl(0, 84%, 60%)",          // Red
  educacao: "hsl(180, 70%, 45%)",     // Cyan

  // Livres
  lazer: "hsl(330, 80%, 55%)",        // Pink
  compras: "hsl(160, 84%, 39%)",      // Emerald
  assinaturas: "hsl(200, 90%, 50%)",  // Light Blue

  // Investimentos
  rendaFixa: "hsl(142, 71%, 45%)",    // Green
  acoes: "hsl(217, 91%, 60%)",        // Blue
  fundos: "hsl(38, 92%, 50%)",        // Amber
  cripto: "hsl(270, 70%, 60%)",       // Purple

  // Default
  outros: "hsl(215, 16%, 47%)",       // Gray
}

// Get color by transaction type
export function getTransactionColor(type: "RECEITA" | "DESPESA" | "INVESTIMENTO"): string {
  switch (type) {
    case "RECEITA":
      return semanticColors.income.DEFAULT
    case "DESPESA":
      return semanticColors.expense.DEFAULT
    case "INVESTIMENTO":
      return semanticColors.investment.DEFAULT
    default:
      return "hsl(215, 16%, 47%)"
  }
}

// Get background color by transaction type
export function getTransactionBgColor(type: "RECEITA" | "DESPESA" | "INVESTIMENTO"): string {
  switch (type) {
    case "RECEITA":
      return semanticColors.income.bg
    case "DESPESA":
      return semanticColors.expense.bg
    case "INVESTIMENTO":
      return semanticColors.investment.bg
    default:
      return "hsl(215, 16%, 47%, 0.1)"
  }
}

// Get CSS class by transaction type
export function getTransactionColorClass(type: "RECEITA" | "DESPESA" | "INVESTIMENTO"): string {
  switch (type) {
    case "RECEITA":
      return "text-income"
    case "DESPESA":
      return "text-expense"
    case "INVESTIMENTO":
      return "text-investment"
    default:
      return "text-muted-foreground"
  }
}

// Get background CSS class by transaction type
export function getTransactionBgClass(type: "RECEITA" | "DESPESA" | "INVESTIMENTO"): string {
  switch (type) {
    case "RECEITA":
      return "income-bg"
    case "DESPESA":
      return "expense-bg"
    case "INVESTIMENTO":
      return "investment-bg"
    default:
      return "bg-muted"
  }
}

// Get indicator CSS class by transaction type
export function getIndicatorClass(type: "RECEITA" | "DESPESA" | "INVESTIMENTO"): string {
  switch (type) {
    case "RECEITA":
      return "indicator-income"
    case "DESPESA":
      return "indicator-expense"
    case "INVESTIMENTO":
      return "indicator-investment"
    default:
      return ""
  }
}

// Color contrast checker (simplified WCAG contrast calculation)
export function getContrastRatio(color1: string, color2: string): number {
  // This is a simplified version - for production, use a proper library
  // Returns approximate contrast ratio
  const getLuminance = (hslString: string): number => {
    // Extract lightness from HSL
    const match = hslString.match(/(\d+(?:\.\d+)?)\s*%\s*\)/)
    if (!match) return 0.5
    return parseFloat(match[1]) / 100
  }

  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

// Check if text on background meets WCAG AA (4.5:1 for normal text)
export function meetsContrastAA(textColor: string, bgColor: string): boolean {
  return getContrastRatio(textColor, bgColor) >= 4.5
}
