/**
 * API Routes Tests - FamFinance
 *
 * Tests for all API endpoints covering:
 * - Success responses (200/201)
 * - Validation errors (400)
 * - Not found errors (404)
 * - Response format validation
 */

import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    investment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    goal: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    budget: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

// Helper to create mock NextRequest
function createMockRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>
): NextRequest {
  const request = new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    ...(body && {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  })
  return request
}

// ============================================
// TRANSAÇÕES TESTS
// ============================================
describe("API /api/transacoes", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/transacoes", () => {
    it("should return 400 if userId is missing", async () => {
      const { GET } = await import("@/app/api/transacoes/route")
      const request = createMockRequest("GET", "/api/transacoes")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("userId é obrigatório")
    })

    it("should return transactions list with userId", async () => {
      const mockTransactions = [
        {
          id: "1",
          descricao: "Salário",
          valor: 5000,
          tipo: "ENTRADA",
          data: new Date(),
          userId: "user1",
          category: { id: "cat1", nome: "Salário" },
          account: { id: "acc1", nome: "Nubank" },
        },
      ]

      ;(prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions)
      ;(prisma.transaction.count as jest.Mock).mockResolvedValue(1)

      const { GET } = await import("@/app/api/transacoes/route")
      const request = createMockRequest("GET", "/api/transacoes?userId=user1")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.transactions).toHaveLength(1)
      expect(data.total).toBe(1)
    })

    it("should filter by date range", async () => {
      ;(prisma.transaction.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.transaction.count as jest.Mock).mockResolvedValue(0)

      const { GET } = await import("@/app/api/transacoes/route")
      const request = createMockRequest(
        "GET",
        "/api/transacoes?userId=user1&dataInicio=2025-01-01&dataFim=2025-01-31"
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user1",
            data: expect.any(Object),
          }),
        })
      )
    })
  })

  describe("POST /api/transacoes", () => {
    it("should return 400 if required fields are missing", async () => {
      const { POST } = await import("@/app/api/transacoes/route")
      const request = createMockRequest("POST", "/api/transacoes", {
        descricao: "Test",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Campos obrigatórios faltando")
    })

    it("should create a single transaction", async () => {
      const mockTransaction = {
        id: "1",
        descricao: "Almoço",
        valor: 50,
        tipo: "SAIDA",
        data: new Date(),
        userId: "user1",
      }

      ;(prisma.transaction.create as jest.Mock).mockResolvedValue(mockTransaction)

      const { POST } = await import("@/app/api/transacoes/route")
      const request = createMockRequest("POST", "/api/transacoes", {
        descricao: "Almoço",
        valor: 50,
        tipo: "SAIDA",
        data: "2025-01-07",
        userId: "user1",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.descricao).toBe("Almoço")
    })

    it("should create installment transactions", async () => {
      ;(prisma.transaction.createMany as jest.Mock).mockResolvedValue({ count: 3 })

      const { POST } = await import("@/app/api/transacoes/route")
      const request = createMockRequest("POST", "/api/transacoes", {
        descricao: "TV",
        valor: 3000,
        tipo: "SAIDA",
        data: "2025-01-07",
        userId: "user1",
        parcelas: 3,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.count).toBe(3)
    })
  })

  describe("PUT /api/transacoes", () => {
    it("should return 400 if id is missing", async () => {
      const { PUT } = await import("@/app/api/transacoes/route")
      const request = createMockRequest("PUT", "/api/transacoes", {
        descricao: "Updated",
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("ID da transação é obrigatório")
    })

    it("should update transaction", async () => {
      const mockTransaction = {
        id: "1",
        descricao: "Updated",
        valor: 100,
      }

      ;(prisma.transaction.update as jest.Mock).mockResolvedValue(mockTransaction)

      const { PUT } = await import("@/app/api/transacoes/route")
      const request = createMockRequest("PUT", "/api/transacoes", {
        id: "1",
        descricao: "Updated",
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.descricao).toBe("Updated")
    })
  })

  describe("DELETE /api/transacoes", () => {
    it("should return 400 if id is missing", async () => {
      const { DELETE } = await import("@/app/api/transacoes/route")
      const request = createMockRequest("DELETE", "/api/transacoes")

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("ID da transação é obrigatório")
    })

    it("should delete transaction", async () => {
      ;(prisma.transaction.delete as jest.Mock).mockResolvedValue({})

      const { DELETE } = await import("@/app/api/transacoes/route")
      const request = createMockRequest("DELETE", "/api/transacoes?id=1")

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})

// ============================================
// CATEGORIAS TESTS
// ============================================
describe("API /api/categorias", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/categorias", () => {
    it("should return categories list", async () => {
      const mockCategories = [
        { id: "1", nome: "Alimentação", tipo: "DESPESA", cor: "#FF0000", grupo: "ESSENCIAL" },
        { id: "2", nome: "Salário", tipo: "RECEITA", cor: "#00FF00", grupo: "ESSENCIAL" },
      ]

      ;(prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories)

      const { GET } = await import("@/app/api/categorias/route")
      const request = createMockRequest("GET", "/api/categorias")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
    })

    it("should filter by tipo", async () => {
      ;(prisma.category.findMany as jest.Mock).mockResolvedValue([])

      const { GET } = await import("@/app/api/categorias/route")
      const request = createMockRequest("GET", "/api/categorias?tipo=DESPESA")

      await GET(request)

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tipo: "DESPESA" },
        })
      )
    })
  })

  describe("POST /api/categorias", () => {
    it("should return 400 if required fields are missing", async () => {
      const { POST } = await import("@/app/api/categorias/route")
      const request = createMockRequest("POST", "/api/categorias", {
        nome: "Test",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Campos obrigatórios faltando")
    })

    it("should create category", async () => {
      const mockCategory = {
        id: "1",
        nome: "Nova Categoria",
        tipo: "DESPESA",
        cor: "#FF0000",
        grupo: "LIVRE",
      }

      ;(prisma.category.create as jest.Mock).mockResolvedValue(mockCategory)

      const { POST } = await import("@/app/api/categorias/route")
      const request = createMockRequest("POST", "/api/categorias", {
        nome: "Nova Categoria",
        tipo: "DESPESA",
        cor: "#FF0000",
        grupo: "LIVRE",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.nome).toBe("Nova Categoria")
    })
  })

  describe("PUT /api/categorias", () => {
    it("should return 400 if id is missing", async () => {
      const { PUT } = await import("@/app/api/categorias/route")
      const request = createMockRequest("PUT", "/api/categorias", {
        nome: "Updated",
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("ID da categoria é obrigatório")
    })

    it("should update category", async () => {
      const mockCategory = { id: "1", nome: "Updated" }
      ;(prisma.category.update as jest.Mock).mockResolvedValue(mockCategory)

      const { PUT } = await import("@/app/api/categorias/route")
      const request = createMockRequest("PUT", "/api/categorias", {
        id: "1",
        nome: "Updated",
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.nome).toBe("Updated")
    })
  })

  describe("DELETE /api/categorias", () => {
    it("should return 400 if id is missing", async () => {
      const { DELETE } = await import("@/app/api/categorias/route")
      const request = createMockRequest("DELETE", "/api/categorias")

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("ID da categoria é obrigatório")
    })

    it("should return 400 if category has transactions", async () => {
      ;(prisma.transaction.count as jest.Mock).mockResolvedValue(5)

      const { DELETE } = await import("@/app/api/categorias/route")
      const request = createMockRequest("DELETE", "/api/categorias?id=1")

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Categoria possui transações vinculadas")
      expect(data.transactionCount).toBe(5)
    })

    it("should delete category without transactions", async () => {
      ;(prisma.transaction.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.category.delete as jest.Mock).mockResolvedValue({})

      const { DELETE } = await import("@/app/api/categorias/route")
      const request = createMockRequest("DELETE", "/api/categorias?id=1")

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})

// ============================================
// CONTAS TESTS
// ============================================
describe("API /api/contas", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/contas", () => {
    it("should return 400 if userId is missing", async () => {
      const { GET } = await import("@/app/api/contas/route")
      const request = createMockRequest("GET", "/api/contas")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("userId é obrigatório")
    })

    it("should return accounts with balance", async () => {
      const mockAccounts = [
        {
          id: "1",
          nome: "Nubank",
          tipo: "CORRENTE",
          saldoInicial: 1000,
          ativo: true,
          userId: "user1",
        },
      ]

      ;(prisma.account.findMany as jest.Mock).mockResolvedValue(mockAccounts)
      ;(prisma.transaction.aggregate as jest.Mock).mockResolvedValue({ _sum: { valor: 500 } })
      ;(prisma.transaction.findMany as jest.Mock).mockResolvedValue([
        { valor: 500, tipo: "ENTRADA" },
      ])

      const { GET } = await import("@/app/api/contas/route")
      const request = createMockRequest("GET", "/api/contas?userId=user1")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.accounts).toHaveLength(1)
      expect(data.accounts[0].saldoAtual).toBe(1500)
      expect(data.totals).toBeDefined()
    })
  })

  describe("POST /api/contas", () => {
    it("should return 400 if required fields are missing", async () => {
      const { POST } = await import("@/app/api/contas/route")
      const request = createMockRequest("POST", "/api/contas", {
        nome: "Test",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Campos obrigatórios faltando")
    })

    it("should create account", async () => {
      const mockAccount = {
        id: "1",
        nome: "Nova Conta",
        tipo: "CORRENTE",
        userId: "user1",
      }

      ;(prisma.account.create as jest.Mock).mockResolvedValue(mockAccount)

      const { POST } = await import("@/app/api/contas/route")
      const request = createMockRequest("POST", "/api/contas", {
        nome: "Nova Conta",
        tipo: "CORRENTE",
        userId: "user1",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.nome).toBe("Nova Conta")
    })
  })

  describe("PUT /api/contas", () => {
    it("should return 400 if id is missing", async () => {
      const { PUT } = await import("@/app/api/contas/route")
      const request = createMockRequest("PUT", "/api/contas", {
        nome: "Updated",
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("ID da conta é obrigatório")
    })

    it("should update account", async () => {
      const mockAccount = { id: "1", nome: "Updated" }
      ;(prisma.account.update as jest.Mock).mockResolvedValue(mockAccount)

      const { PUT } = await import("@/app/api/contas/route")
      const request = createMockRequest("PUT", "/api/contas", {
        id: "1",
        nome: "Updated",
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.nome).toBe("Updated")
    })
  })

  describe("DELETE /api/contas", () => {
    it("should return 400 if id is missing", async () => {
      const { DELETE } = await import("@/app/api/contas/route")
      const request = createMockRequest("DELETE", "/api/contas")

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("ID da conta é obrigatório")
    })

    it("should soft delete account with transactions", async () => {
      ;(prisma.transaction.count as jest.Mock).mockResolvedValue(5)
      ;(prisma.account.update as jest.Mock).mockResolvedValue({ ativo: false })

      const { DELETE } = await import("@/app/api/contas/route")
      const request = createMockRequest("DELETE", "/api/contas?id=1")

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.action).toBe("deactivated")
    })

    it("should hard delete account without transactions", async () => {
      ;(prisma.transaction.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.account.delete as jest.Mock).mockResolvedValue({})

      const { DELETE } = await import("@/app/api/contas/route")
      const request = createMockRequest("DELETE", "/api/contas?id=1")

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.action).toBe("deleted")
    })
  })
})

// ============================================
// METAS TESTS
// ============================================
describe("API /api/metas", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/metas", () => {
    it("should return 400 if userId is missing", async () => {
      const { GET } = await import("@/app/api/metas/route")
      const request = createMockRequest("GET", "/api/metas")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("userId é obrigatório")
    })

    it("should return goals with progress", async () => {
      const mockGoals = [
        {
          id: "1",
          nome: "Reserva de Emergência",
          tipo: "PATRIMONIO",
          valorMeta: 10000,
          valorAtual: 5000,
          ativo: true,
          userId: "user1",
          category: null,
        },
      ]

      ;(prisma.goal.findMany as jest.Mock).mockResolvedValue(mockGoals)

      const { GET } = await import("@/app/api/metas/route")
      const request = createMockRequest("GET", "/api/metas?userId=user1")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].progresso).toBe(50)
      expect(data[0].restante).toBe(5000)
      expect(data[0].atingida).toBe(false)
    })
  })

  describe("POST /api/metas", () => {
    it("should return 400 if required fields are missing", async () => {
      const { POST } = await import("@/app/api/metas/route")
      const request = createMockRequest("POST", "/api/metas", {
        nome: "Test",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Campos obrigatórios faltando")
    })

    it("should create goal", async () => {
      const mockGoal = {
        id: "1",
        nome: "Nova Meta",
        tipo: "PATRIMONIO",
        valorMeta: 10000,
        valorAtual: 0,
        userId: "user1",
      }

      ;(prisma.goal.create as jest.Mock).mockResolvedValue(mockGoal)

      const { POST } = await import("@/app/api/metas/route")
      const request = createMockRequest("POST", "/api/metas", {
        nome: "Nova Meta",
        tipo: "PATRIMONIO",
        valorMeta: 10000,
        userId: "user1",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.nome).toBe("Nova Meta")
    })
  })

  describe("PUT /api/metas", () => {
    it("should return 400 if id is missing", async () => {
      const { PUT } = await import("@/app/api/metas/route")
      const request = createMockRequest("PUT", "/api/metas", {
        nome: "Updated",
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("ID da meta é obrigatório")
    })

    it("should update goal", async () => {
      const mockGoal = { id: "1", nome: "Updated" }
      ;(prisma.goal.update as jest.Mock).mockResolvedValue(mockGoal)

      const { PUT } = await import("@/app/api/metas/route")
      const request = createMockRequest("PUT", "/api/metas", {
        id: "1",
        nome: "Updated",
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.nome).toBe("Updated")
    })
  })

  describe("DELETE /api/metas", () => {
    it("should return 400 if id is missing", async () => {
      const { DELETE } = await import("@/app/api/metas/route")
      const request = createMockRequest("DELETE", "/api/metas")

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("ID da meta é obrigatório")
    })

    it("should delete goal", async () => {
      ;(prisma.goal.delete as jest.Mock).mockResolvedValue({})

      const { DELETE } = await import("@/app/api/metas/route")
      const request = createMockRequest("DELETE", "/api/metas?id=1")

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe("PATCH /api/metas (progress update)", () => {
    it("should return 400 if id is missing", async () => {
      const { PATCH } = await import("@/app/api/metas/route")
      const request = createMockRequest("PATCH", "/api/metas", {
        valorAtual: 1000,
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("ID da meta é obrigatório")
    })

    it("should update goal progress with increment", async () => {
      const currentGoal = { id: "1", valorAtual: 5000, valorMeta: 10000 }
      const updatedGoal = { id: "1", valorAtual: 6000, valorMeta: 10000 }

      ;(prisma.goal.findUnique as jest.Mock).mockResolvedValue(currentGoal)
      ;(prisma.goal.update as jest.Mock).mockResolvedValue(updatedGoal)

      const { PATCH } = await import("@/app/api/metas/route")
      const request = createMockRequest("PATCH", "/api/metas", {
        id: "1",
        incremento: 1000,
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.progresso).toBe(60)
    })
  })
})

// ============================================
// INVESTIMENTOS TESTS
// ============================================
describe("API /api/investimentos", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/investimentos", () => {
    it("should return 400 if userId is missing", async () => {
      const { GET } = await import("@/app/api/investimentos/route")
      const request = createMockRequest("GET", "/api/investimentos")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("userId é obrigatório")
    })

    it("should return investments with totals", async () => {
      const mockInvestments = [
        {
          id: "1",
          nome: "CDB",
          tipo: "RENDA_FIXA",
          valorAplicado: 10000,
          valorAtual: 10500,
          userId: "user1",
        },
        {
          id: "2",
          nome: "Ações",
          tipo: "RENDA_VARIAVEL",
          valorAplicado: 5000,
          valorAtual: 5500,
          userId: "user1",
        },
      ]

      ;(prisma.investment.findMany as jest.Mock).mockResolvedValue(mockInvestments)

      const { GET } = await import("@/app/api/investimentos/route")
      const request = createMockRequest("GET", "/api/investimentos?userId=user1")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.investments).toHaveLength(2)
      expect(data.totals.valorAplicado).toBe(15000)
      expect(data.totals.valorAtual).toBe(16000)
      expect(data.totals.lucro).toBe(1000)
    })
  })

  describe("POST /api/investimentos", () => {
    it("should return 400 if required fields are missing", async () => {
      const { POST } = await import("@/app/api/investimentos/route")
      const request = createMockRequest("POST", "/api/investimentos", {
        nome: "Test",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Campos obrigatórios faltando")
    })

    it("should create investment", async () => {
      const mockInvestment = {
        id: "1",
        nome: "Tesouro Direto",
        tipo: "RENDA_FIXA",
        valorAplicado: 10000,
        valorAtual: 10000,
        rentabilidade: 0,
        userId: "user1",
      }

      ;(prisma.investment.create as jest.Mock).mockResolvedValue(mockInvestment)

      const { POST } = await import("@/app/api/investimentos/route")
      const request = createMockRequest("POST", "/api/investimentos", {
        nome: "Tesouro Direto",
        tipo: "RENDA_FIXA",
        valorAplicado: 10000,
        dataAplicacao: "2025-01-07",
        userId: "user1",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.nome).toBe("Tesouro Direto")
    })
  })

  describe("PUT /api/investimentos", () => {
    it("should return 400 if id is missing", async () => {
      const { PUT } = await import("@/app/api/investimentos/route")
      const request = createMockRequest("PUT", "/api/investimentos", {
        nome: "Updated",
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("ID do investimento é obrigatório")
    })

    it("should update investment and recalculate rentabilidade", async () => {
      const currentInvestment = { id: "1", valorAplicado: 10000, valorAtual: 10000 }
      const updatedInvestment = { id: "1", valorAplicado: 10000, valorAtual: 11000, rentabilidade: 10 }

      ;(prisma.investment.findUnique as jest.Mock).mockResolvedValue(currentInvestment)
      ;(prisma.investment.update as jest.Mock).mockResolvedValue(updatedInvestment)

      const { PUT } = await import("@/app/api/investimentos/route")
      const request = createMockRequest("PUT", "/api/investimentos", {
        id: "1",
        valorAtual: 11000,
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.rentabilidade).toBe(10)
    })
  })

  describe("DELETE /api/investimentos", () => {
    it("should return 400 if id is missing", async () => {
      const { DELETE } = await import("@/app/api/investimentos/route")
      const request = createMockRequest("DELETE", "/api/investimentos")

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("ID do investimento é obrigatório")
    })

    it("should delete investment", async () => {
      ;(prisma.investment.delete as jest.Mock).mockResolvedValue({})

      const { DELETE } = await import("@/app/api/investimentos/route")
      const request = createMockRequest("DELETE", "/api/investimentos?id=1")

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
