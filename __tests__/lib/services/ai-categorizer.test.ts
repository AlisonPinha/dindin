import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock Anthropic SDK with a proper class constructor
const mockCreate = vi.fn()
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate }
    },
  }
})

import { categorizeTransaction, _resetClient } from "@/lib/services/ai-categorizer"

const mockCategories = [
  { id: "cat-alimentacao", nome: "Alimentação", tipo: "DESPESA" },
  { id: "cat-transporte", nome: "Transporte", tipo: "DESPESA" },
  { id: "cat-lazer", nome: "Lazer", tipo: "DESPESA" },
  { id: "cat-saude", nome: "Saúde", tipo: "DESPESA" },
  { id: "cat-salario", nome: "Salário", tipo: "RECEITA" },
]

describe("categorizeTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _resetClient()
    process.env.ANTHROPIC_API_KEY = "test-key"
  })

  it("deve categorizar transação com base na descrição", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: '{"categoryId": "cat-alimentacao", "confidence": "high"}',
        },
      ],
    })

    const result = await categorizeTransaction("iFood", mockCategories, [])

    expect(result.categoryId).toBe("cat-alimentacao")
    expect(result.categoryName).toBe("Alimentação")
    expect(result.confidence).toBe("high")
  })

  it("deve usar histórico de categorizações anteriores", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: '{"categoryId": "cat-alimentacao", "confidence": "high"}',
        },
      ],
    })

    const history = [
      { descricao: "iFood", category_id: "cat-alimentacao", nome: "Alimentação" },
    ]

    const result = await categorizeTransaction("iFood", mockCategories, history)

    expect(result.categoryId).toBe("cat-alimentacao")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callArgs = (mockCreate.mock.calls[0] as any[])[0]
    expect(callArgs.messages[0].content).toContain("iFood")
    expect(callArgs.messages[0].content).toContain("Alimentação")
  })

  it("deve retornar null quando a IA não consegue categorizar", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: '{"categoryId": null, "confidence": "low"}',
        },
      ],
    })

    const result = await categorizeTransaction("XYZ123", mockCategories, [])

    expect(result.categoryId).toBeNull()
    expect(result.categoryName).toBeNull()
    expect(result.confidence).toBe("low")
  })

  it("deve retornar null quando ANTHROPIC_API_KEY não está configurada", async () => {
    delete process.env.ANTHROPIC_API_KEY

    const result = await categorizeTransaction("iFood", mockCategories, [])

    expect(result.categoryId).toBeNull()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("deve retornar null quando não há categorias de despesa", async () => {
    const onlyIncome = [
      { id: "cat-salario", nome: "Salário", tipo: "RECEITA" },
    ]

    const result = await categorizeTransaction("iFood", onlyIncome, [])

    expect(result.categoryId).toBeNull()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("deve retornar null quando Claude API falha", async () => {
    mockCreate.mockRejectedValue(new Error("API Error"))

    const result = await categorizeTransaction("iFood", mockCategories, [])

    expect(result.categoryId).toBeNull()
    expect(result.confidence).toBe("low")
  })

  it("deve retornar null quando Claude retorna resposta vazia", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "" }],
    })

    const result = await categorizeTransaction("iFood", mockCategories, [])

    expect(result.categoryId).toBeNull()
  })

  it("deve retornar null quando categoryId retornado não existe nas categorias", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: '{"categoryId": "cat-inexistente", "confidence": "high"}',
        },
      ],
    })

    const result = await categorizeTransaction("iFood", mockCategories, [])

    expect(result.categoryId).toBeNull()
  })

  it("deve filtrar categorias de receita e usar apenas despesas", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: '{"categoryId": "cat-alimentacao", "confidence": "medium"}',
        },
      ],
    })

    await categorizeTransaction("iFood", mockCategories, [])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callArgs2 = (mockCreate.mock.calls[0] as any[])[0]
    const prompt = callArgs2.messages[0].content
    expect(prompt).not.toContain("Salário")
    expect(prompt).toContain("Alimentação")
    expect(prompt).toContain("Transporte")
  })

  it("deve usar claude-haiku para performance", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: '{"categoryId": "cat-alimentacao", "confidence": "high"}',
        },
      ],
    })

    await categorizeTransaction("iFood", mockCategories, [])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callArgs3 = (mockCreate.mock.calls[0] as any[])[0]
    expect(callArgs3.model).toBe("claude-haiku-4-5-20251001")
    expect(callArgs3.max_tokens).toBe(100)
  })

  it("deve lidar com timeout via AbortController", async () => {
    const abortError = new Error("Aborted")
    abortError.name = "AbortError"
    mockCreate.mockRejectedValue(abortError)

    const result = await categorizeTransaction("iFood", mockCategories, [])

    expect(result.categoryId).toBeNull()
    expect(result.confidence).toBe("low")
  })

  it("deve lidar com JSON inválido na resposta", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: "Não consigo categorizar esta transação",
        },
      ],
    })

    const result = await categorizeTransaction("iFood", mockCategories, [])

    expect(result.categoryId).toBeNull()
  })
})
