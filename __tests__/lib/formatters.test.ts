import { describe, it, expect } from "vitest"
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPercentage,
  formatDate,
  formatRelativeDate,
  formatMesAno,
  parseMesAno,
  formatNumber,
  formatTransactionType,
  formatAccountType,
} from "@/lib/formatters"

describe("formatCurrency", () => {
  it("should format positive values", () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain("1.234,56")
    expect(result).toContain("R$")
  })

  it("should format negative values", () => {
    const result = formatCurrency(-1234.56)
    expect(result).toContain("1.234,56")
    expect(result).toContain("-")
  })

  it("should format zero", () => {
    const result = formatCurrency(0)
    expect(result).toContain("0,00")
    expect(result).toContain("R$")
  })

  it("should format large values", () => {
    const result = formatCurrency(1234567.89)
    expect(result).toContain("1.234.567,89")
  })
})

describe("formatCurrencyCompact", () => {
  it("should format values below 1000 normally", () => {
    const result = formatCurrencyCompact(500)
    expect(result).toContain("500,00")
    expect(result).toContain("R$")
  })

  it("should format thousands with K", () => {
    expect(formatCurrencyCompact(5000)).toBe("R$ 5.0K")
    expect(formatCurrencyCompact(12500)).toBe("R$ 12.5K")
  })

  it("should format millions with M", () => {
    expect(formatCurrencyCompact(1000000)).toBe("R$ 1.0M")
    expect(formatCurrencyCompact(2500000)).toBe("R$ 2.5M")
  })
})

describe("formatPercentage", () => {
  it("should format with default decimals", () => {
    expect(formatPercentage(75.5)).toBe("75.5%")
  })

  it("should format with specified decimals", () => {
    expect(formatPercentage(75.555, 2)).toBe("75.56%")
    expect(formatPercentage(75, 0)).toBe("75%")
  })

  it("should handle negative values", () => {
    expect(formatPercentage(-10.5)).toBe("-10.5%")
  })
})

describe("formatDate", () => {
  it("should format with medium style by default", () => {
    const date = new Date(2024, 0, 15) // Jan 15, 2024
    const result = formatDate(date)
    expect(result).toContain("15")
    expect(result).toContain("2024")
  })

  it("should accept string dates", () => {
    const result = formatDate("2024-01-15T12:00:00")
    expect(result).toContain("2024")
  })
})

describe("formatRelativeDate", () => {
  it("should return 'Hoje' for today", () => {
    expect(formatRelativeDate(new Date())).toBe("Hoje")
  })

  it("should return 'Ontem' for yesterday", () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(formatRelativeDate(yesterday)).toBe("Ontem")
  })

  it("should return days ago for recent dates", () => {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    expect(formatRelativeDate(threeDaysAgo)).toBe("3 dias atrás")
  })

  it("should return weeks for older dates", () => {
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    expect(formatRelativeDate(twoWeeksAgo)).toBe("2 semanas atrás")
  })
})

describe("formatMesAno / parseMesAno", () => {
  it("should format date to YYYY-MM", () => {
    const date = new Date(2024, 5, 15) // June 2024
    expect(formatMesAno(date)).toBe("2024-06")
  })

  it("should parse YYYY-MM to date", () => {
    const result = parseMesAno("2024-06")
    expect(result.getFullYear()).toBe(2024)
    expect(result.getMonth()).toBe(5) // June = 5
    expect(result.getDate()).toBe(1)
  })

  it("should be reversible", () => {
    const original = new Date(2024, 11, 1) // December 2024
    const formatted = formatMesAno(original)
    const parsed = parseMesAno(formatted)

    expect(parsed.getFullYear()).toBe(original.getFullYear())
    expect(parsed.getMonth()).toBe(original.getMonth())
  })
})

describe("formatNumber", () => {
  it("should format with thousand separators", () => {
    expect(formatNumber(1234567)).toBe("1.234.567")
  })

  it("should format with decimals", () => {
    expect(formatNumber(1234.567, 2)).toBe("1.234,57")
  })
})

describe("formatTransactionType", () => {
  it("should translate transaction types", () => {
    expect(formatTransactionType("ENTRADA")).toBe("Receita")
    expect(formatTransactionType("SAIDA")).toBe("Despesa")
    expect(formatTransactionType("TRANSFERENCIA")).toBe("Transferência")
  })

  it("should return original for unknown types", () => {
    expect(formatTransactionType("UNKNOWN")).toBe("UNKNOWN")
  })
})

describe("formatAccountType", () => {
  it("should translate account types", () => {
    expect(formatAccountType("CORRENTE")).toBe("Conta Corrente")
    expect(formatAccountType("CARTAO_CREDITO")).toBe("Cartão de Crédito")
    expect(formatAccountType("INVESTIMENTO")).toBe("Investimento")
  })

  it("should return original for unknown types", () => {
    expect(formatAccountType("UNKNOWN")).toBe("UNKNOWN")
  })
})
