import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Re-export formatters for convenience
export {
  formatCurrency,
  formatCurrencyCompact,
  formatCurrencyWithSign,
  formatPercentage,
  formatPercentageWithSign,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  formatMonthYear,
  formatMesAno,
  parseMesAno,
  formatNumber,
  formatCompactNumber,
  formatTransactionType,
  formatInvestmentType,
  formatAccountType,
  formatCategoryGroup,
  formatGoalType,
} from "./formatters"

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate percentage with bounds checking
 */
export function calculatePercentage(current: number, target: number): number {
  if (target === 0) return 0
  return Math.min((current / target) * 100, 100)
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}
