import { describe, it, expect } from "vitest"
import { mapDbTransactionToTransaction, mapDbAlertToAlert } from "@/lib/mappers"
import { createMockTransaction } from "@/__tests__/fixtures/transactions"
import type { DbAlert } from "@/lib/supabase"

describe("mapDbTransactionToTransaction - campos de origem", () => {
  it("deve mapear origem 'manual' corretamente", () => {
    const dbTx = createMockTransaction({ origem: "manual" })
    const result = mapDbTransactionToTransaction(dbTx, [], [], [])
    expect(result.origin).toBe("manual")
  })

  it("deve mapear origem 'apple_pay' corretamente", () => {
    const dbTx = createMockTransaction({ origem: "apple_pay" })
    const result = mapDbTransactionToTransaction(dbTx, [], [], [])
    expect(result.origin).toBe("apple_pay")
  })

  it("deve mapear origem 'quick_add' corretamente", () => {
    const dbTx = createMockTransaction({ origem: "quick_add" })
    const result = mapDbTransactionToTransaction(dbTx, [], [], [])
    expect(result.origin).toBe("quick_add")
  })

  it("deve mapear origem 'ocr_import' corretamente", () => {
    const dbTx = createMockTransaction({ origem: "ocr_import" })
    const result = mapDbTransactionToTransaction(dbTx, [], [], [])
    expect(result.origin).toBe("ocr_import")
  })

  it("deve mapear fatura_referencia quando presente", () => {
    const dbTx = createMockTransaction({ fatura_referencia: "fatura-jan-2025.pdf" })
    const result = mapDbTransactionToTransaction(dbTx, [], [], [])
    expect(result.invoiceReference).toBe("fatura-jan-2025.pdf")
  })

  it("deve mapear fatura_referencia como undefined quando null", () => {
    const dbTx = createMockTransaction({ fatura_referencia: null })
    const result = mapDbTransactionToTransaction(dbTx, [], [], [])
    expect(result.invoiceReference).toBeUndefined()
  })

  it("deve mapear matched_transacao_id quando presente", () => {
    const dbTx = createMockTransaction({ matched_transacao_id: "tx-apple-pay-123" })
    const result = mapDbTransactionToTransaction(dbTx, [], [], [])
    expect(result.matchedTransactionId).toBe("tx-apple-pay-123")
  })

  it("deve mapear matched_transacao_id como undefined quando null", () => {
    const dbTx = createMockTransaction({ matched_transacao_id: null })
    const result = mapDbTransactionToTransaction(dbTx, [], [], [])
    expect(result.matchedTransactionId).toBeUndefined()
  })
})

describe("mapDbAlertToAlert", () => {
  const mockDbAlert: DbAlert = {
    id: "alert-123",
    user_id: "user-123",
    categoria_id: "cat-delivery-123",
    threshold: 90,
    mensagem: "⚠️ Vocês já usaram 90% do orçamento de Delivery (R$ 450/R$ 500).",
    canal: "whatsapp",
    enviado_em: "2025-01-15T09:00:00.000Z",
    created_at: "2025-01-15T09:00:00.000Z",
  }

  it("deve mapear alerta DB para UI corretamente", () => {
    const result = mapDbAlertToAlert(mockDbAlert)
    expect(result.id).toBe("alert-123")
    expect(result.userId).toBe("user-123")
    expect(result.categoryId).toBe("cat-delivery-123")
    expect(result.threshold).toBe(90)
    expect(result.message).toBe("⚠️ Vocês já usaram 90% do orçamento de Delivery (R$ 450/R$ 500).")
    expect(result.channel).toBe("whatsapp")
    expect(result.sentAt).toBeInstanceOf(Date)
    expect(result.createdAt).toBeInstanceOf(Date)
  })

  it("deve mapear canal 'dashboard' corretamente", () => {
    const dbAlert: DbAlert = { ...mockDbAlert, canal: "dashboard" }
    const result = mapDbAlertToAlert(dbAlert)
    expect(result.channel).toBe("dashboard")
  })

  it("deve mapear categoria_id null como undefined", () => {
    const dbAlert: DbAlert = { ...mockDbAlert, categoria_id: null }
    const result = mapDbAlertToAlert(dbAlert)
    expect(result.categoryId).toBeUndefined()
  })
})
