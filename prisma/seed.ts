import "dotenv/config"
import { PrismaClient } from ".prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...")

  // Limpar dados existentes
  await prisma.budget.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.investment.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.account.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  console.log("🗑️  Dados anteriores removidos")

  // ============================================
  // USUÁRIOS
  // ============================================
  const alison = await prisma.user.create({
    data: {
      nome: "Alison",
      email: "alison@familia.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alison",
    },
  })

  const esposa = await prisma.user.create({
    data: {
      nome: "Esposa",
      email: "esposa@familia.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    },
  })

  console.log("👥 Usuários criados:", alison.nome, esposa.nome)

  // ============================================
  // CATEGORIAS
  // ============================================
  const categorias = await Promise.all([
    // RECEITAS
    prisma.category.create({
      data: {
        nome: "Salário",
        tipo: "RECEITA",
        cor: "#22c55e",
        icone: "Briefcase",
        grupo: "ESSENCIAL",
      },
    }),
    prisma.category.create({
      data: {
        nome: "Freelance",
        tipo: "RECEITA",
        cor: "#10b981",
        icone: "Laptop",
        grupo: "LIVRE",
      },
    }),
    prisma.category.create({
      data: {
        nome: "Rendimentos",
        tipo: "RECEITA",
        cor: "#3b82f6",
        icone: "TrendingUp",
        grupo: "INVESTIMENTO",
      },
    }),
    prisma.category.create({
      data: {
        nome: "Outros Receitas",
        tipo: "RECEITA",
        cor: "#8b5cf6",
        icone: "Plus",
        grupo: "LIVRE",
      },
    }),

    // DESPESAS - ESSENCIAIS
    prisma.category.create({
      data: {
        nome: "Moradia",
        tipo: "DESPESA",
        cor: "#ef4444",
        icone: "Home",
        grupo: "ESSENCIAL",
        orcamentoMensal: 2500,
      },
    }),
    prisma.category.create({
      data: {
        nome: "Alimentação",
        tipo: "DESPESA",
        cor: "#f97316",
        icone: "UtensilsCrossed",
        grupo: "ESSENCIAL",
        orcamentoMensal: 1500,
      },
    }),
    prisma.category.create({
      data: {
        nome: "Transporte",
        tipo: "DESPESA",
        cor: "#eab308",
        icone: "Car",
        grupo: "ESSENCIAL",
        orcamentoMensal: 800,
      },
    }),
    prisma.category.create({
      data: {
        nome: "Saúde",
        tipo: "DESPESA",
        cor: "#ec4899",
        icone: "Heart",
        grupo: "ESSENCIAL",
        orcamentoMensal: 500,
      },
    }),
    prisma.category.create({
      data: {
        nome: "Educação",
        tipo: "DESPESA",
        cor: "#8b5cf6",
        icone: "GraduationCap",
        grupo: "ESSENCIAL",
        orcamentoMensal: 300,
      },
    }),

    // DESPESAS - LIVRE
    prisma.category.create({
      data: {
        nome: "Lazer",
        tipo: "DESPESA",
        cor: "#06b6d4",
        icone: "Gamepad2",
        grupo: "LIVRE",
        orcamentoMensal: 600,
      },
    }),
    prisma.category.create({
      data: {
        nome: "Compras",
        tipo: "DESPESA",
        cor: "#d946ef",
        icone: "ShoppingBag",
        grupo: "LIVRE",
        orcamentoMensal: 400,
      },
    }),
    prisma.category.create({
      data: {
        nome: "Assinaturas",
        tipo: "DESPESA",
        cor: "#6366f1",
        icone: "CreditCard",
        grupo: "LIVRE",
        orcamentoMensal: 200,
      },
    }),
    prisma.category.create({
      data: {
        nome: "Restaurantes",
        tipo: "DESPESA",
        cor: "#f43f5e",
        icone: "Coffee",
        grupo: "LIVRE",
        orcamentoMensal: 500,
      },
    }),
    prisma.category.create({
      data: {
        nome: "Outros Despesas",
        tipo: "DESPESA",
        cor: "#64748b",
        icone: "MoreHorizontal",
        grupo: "LIVRE",
      },
    }),

    // INVESTIMENTOS
    prisma.category.create({
      data: {
        nome: "Renda Fixa",
        tipo: "INVESTIMENTO",
        cor: "#0ea5e9",
        icone: "Landmark",
        grupo: "INVESTIMENTO",
      },
    }),
    prisma.category.create({
      data: {
        nome: "Ações",
        tipo: "INVESTIMENTO",
        cor: "#22c55e",
        icone: "LineChart",
        grupo: "INVESTIMENTO",
      },
    }),
    prisma.category.create({
      data: {
        nome: "Fundos",
        tipo: "INVESTIMENTO",
        cor: "#a855f7",
        icone: "PieChart",
        grupo: "INVESTIMENTO",
      },
    }),
    prisma.category.create({
      data: {
        nome: "Cripto",
        tipo: "INVESTIMENTO",
        cor: "#f59e0b",
        icone: "Bitcoin",
        grupo: "INVESTIMENTO",
      },
    }),
  ])

  const categoriaMap = categorias.reduce(
    (acc, cat) => ({ ...acc, [cat.nome]: cat }),
    {} as Record<string, (typeof categorias)[0]>
  )

  console.log("📁 Categorias criadas:", categorias.length)

  // ============================================
  // CONTAS BANCÁRIAS
  // ============================================
  const contaNubank = await prisma.account.create({
    data: {
      nome: "Nubank",
      tipo: "CORRENTE",
      banco: "Nubank",
      saldoInicial: 5000,
      cor: "#8b5cf6",
      icone: "Wallet",
      userId: alison.id,
    },
  })

  const contaItau = await prisma.account.create({
    data: {
      nome: "Itaú",
      tipo: "CORRENTE",
      banco: "Itaú",
      saldoInicial: 3000,
      cor: "#f97316",
      icone: "Wallet",
      userId: esposa.id,
    },
  })

  const cartaoNubank = await prisma.account.create({
    data: {
      nome: "Cartão Nubank",
      tipo: "CARTAO_CREDITO",
      banco: "Nubank",
      saldoInicial: 0,
      cor: "#8b5cf6",
      icone: "CreditCard",
      userId: alison.id,
    },
  })

  const poupanca = await prisma.account.create({
    data: {
      nome: "Poupança Família",
      tipo: "POUPANCA",
      banco: "Nubank",
      saldoInicial: 15000,
      cor: "#22c55e",
      icone: "PiggyBank",
      userId: alison.id,
    },
  })

  const contaInvestimento = await prisma.account.create({
    data: {
      nome: "XP Investimentos",
      tipo: "INVESTIMENTO",
      banco: "XP",
      saldoInicial: 50000,
      cor: "#3b82f6",
      icone: "TrendingUp",
      userId: alison.id,
    },
  })

  console.log("🏦 Contas criadas: 5")

  // ============================================
  // TRANSAÇÕES
  // ============================================
  const hoje = new Date()
  const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)

  // Função auxiliar para criar data no mês
  const dataNoMes = (mes: Date, dia: number) =>
    new Date(mes.getFullYear(), mes.getMonth(), dia)

  const transacoes = await Promise.all([
    // RECEITAS - Mês Atual
    prisma.transaction.create({
      data: {
        descricao: "Salário Alison",
        valor: 8500,
        tipo: "ENTRADA",
        data: dataNoMes(mesAtual, 5),
        categoryId: categoriaMap["Salário"].id,
        accountId: contaNubank.id,
        userId: alison.id,
        recorrente: true,
        tags: ["salário", "mensal"],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Salário Esposa",
        valor: 6000,
        tipo: "ENTRADA",
        data: dataNoMes(mesAtual, 10),
        categoryId: categoriaMap["Salário"].id,
        accountId: contaItau.id,
        userId: esposa.id,
        recorrente: true,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Projeto Freelance",
        valor: 2500,
        tipo: "ENTRADA",
        data: dataNoMes(mesAtual, 15),
        categoryId: categoriaMap["Freelance"].id,
        accountId: contaNubank.id,
        userId: alison.id,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Dividendos ITSA4",
        valor: 350,
        tipo: "ENTRADA",
        data: dataNoMes(mesAtual, 20),
        categoryId: categoriaMap["Rendimentos"].id,
        accountId: contaInvestimento.id,
        userId: alison.id,
        tags: ["dividendos", "ações"],
      },
    }),

    // DESPESAS - Mês Atual - ESSENCIAIS
    prisma.transaction.create({
      data: {
        descricao: "Aluguel Apartamento",
        valor: 2200,
        tipo: "SAIDA",
        data: dataNoMes(mesAtual, 5),
        categoryId: categoriaMap["Moradia"].id,
        accountId: contaNubank.id,
        userId: alison.id,
        recorrente: true,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Condomínio",
        valor: 450,
        tipo: "SAIDA",
        data: dataNoMes(mesAtual, 10),
        categoryId: categoriaMap["Moradia"].id,
        accountId: contaNubank.id,
        userId: alison.id,
        recorrente: true,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Supermercado Semanal",
        valor: 380,
        tipo: "SAIDA",
        data: dataNoMes(mesAtual, 7),
        categoryId: categoriaMap["Alimentação"].id,
        accountId: cartaoNubank.id,
        userId: esposa.id,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Supermercado",
        valor: 420,
        tipo: "SAIDA",
        data: dataNoMes(mesAtual, 14),
        categoryId: categoriaMap["Alimentação"].id,
        accountId: cartaoNubank.id,
        userId: esposa.id,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Supermercado",
        valor: 350,
        tipo: "SAIDA",
        data: dataNoMes(mesAtual, 21),
        categoryId: categoriaMap["Alimentação"].id,
        accountId: cartaoNubank.id,
        userId: esposa.id,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Combustível",
        valor: 280,
        tipo: "SAIDA",
        data: dataNoMes(mesAtual, 8),
        categoryId: categoriaMap["Transporte"].id,
        accountId: cartaoNubank.id,
        userId: alison.id,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Combustível",
        valor: 250,
        tipo: "SAIDA",
        data: dataNoMes(mesAtual, 18),
        categoryId: categoriaMap["Transporte"].id,
        accountId: cartaoNubank.id,
        userId: alison.id,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Plano de Saúde",
        valor: 890,
        tipo: "SAIDA",
        data: dataNoMes(mesAtual, 15),
        categoryId: categoriaMap["Saúde"].id,
        accountId: contaNubank.id,
        userId: alison.id,
        recorrente: true,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Curso Udemy",
        valor: 27.9,
        tipo: "SAIDA",
        data: dataNoMes(mesAtual, 12),
        categoryId: categoriaMap["Educação"].id,
        accountId: cartaoNubank.id,
        userId: alison.id,
        tags: [],
      },
    }),

    // DESPESAS - Mês Atual - LIVRE
    prisma.transaction.create({
      data: {
        descricao: "Cinema",
        valor: 85,
        tipo: "SAIDA",
        data: dataNoMes(mesAtual, 16),
        categoryId: categoriaMap["Lazer"].id,
        accountId: cartaoNubank.id,
        userId: esposa.id,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Jantar Restaurante",
        valor: 180,
        tipo: "SAIDA",
        data: dataNoMes(mesAtual, 13),
        categoryId: categoriaMap["Restaurantes"].id,
        accountId: cartaoNubank.id,
        userId: alison.id,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Netflix",
        valor: 55.9,
        tipo: "SAIDA",
        data: dataNoMes(mesAtual, 1),
        categoryId: categoriaMap["Assinaturas"].id,
        accountId: cartaoNubank.id,
        userId: alison.id,
        recorrente: true,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Spotify Família",
        valor: 34.9,
        tipo: "SAIDA",
        data: dataNoMes(mesAtual, 1),
        categoryId: categoriaMap["Assinaturas"].id,
        accountId: cartaoNubank.id,
        userId: alison.id,
        recorrente: true,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Amazon Prime",
        valor: 19.9,
        tipo: "SAIDA",
        data: dataNoMes(mesAtual, 1),
        categoryId: categoriaMap["Assinaturas"].id,
        accountId: cartaoNubank.id,
        userId: alison.id,
        recorrente: true,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Roupa Nova",
        valor: 189,
        tipo: "SAIDA",
        data: dataNoMes(mesAtual, 19),
        categoryId: categoriaMap["Compras"].id,
        accountId: cartaoNubank.id,
        userId: esposa.id,
        tags: [],
      },
    }),

    // INVESTIMENTOS - Mês Atual
    prisma.transaction.create({
      data: {
        descricao: "Aporte CDB",
        valor: 1000,
        tipo: "INVESTIMENTO",
        data: dataNoMes(mesAtual, 6),
        categoryId: categoriaMap["Renda Fixa"].id,
        accountId: contaInvestimento.id,
        userId: alison.id,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Compra ITSA4",
        valor: 500,
        tipo: "INVESTIMENTO",
        data: dataNoMes(mesAtual, 6),
        categoryId: categoriaMap["Ações"].id,
        accountId: contaInvestimento.id,
        userId: alison.id,
        tags: ["ações", "dividendos"],
      },
    }),

    // RECEITAS - Mês Passado
    prisma.transaction.create({
      data: {
        descricao: "Salário Alison",
        valor: 8500,
        tipo: "ENTRADA",
        data: dataNoMes(mesPassado, 5),
        categoryId: categoriaMap["Salário"].id,
        accountId: contaNubank.id,
        userId: alison.id,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Salário Esposa",
        valor: 6000,
        tipo: "ENTRADA",
        data: dataNoMes(mesPassado, 10),
        categoryId: categoriaMap["Salário"].id,
        accountId: contaItau.id,
        userId: esposa.id,
        tags: [],
      },
    }),

    // DESPESAS - Mês Passado
    prisma.transaction.create({
      data: {
        descricao: "Aluguel Apartamento",
        valor: 2200,
        tipo: "SAIDA",
        data: dataNoMes(mesPassado, 5),
        categoryId: categoriaMap["Moradia"].id,
        accountId: contaNubank.id,
        userId: alison.id,
        tags: [],
      },
    }),
    prisma.transaction.create({
      data: {
        descricao: "Supermercado Mensal",
        valor: 1200,
        tipo: "SAIDA",
        data: dataNoMes(mesPassado, 10),
        categoryId: categoriaMap["Alimentação"].id,
        accountId: cartaoNubank.id,
        userId: esposa.id,
        tags: [],
      },
    }),
  ])

  console.log("💳 Transações criadas:", transacoes.length)

  // ============================================
  // INVESTIMENTOS
  // ============================================
  const investimentos = await Promise.all([
    prisma.investment.create({
      data: {
        nome: "CDB Banco Inter 120%",
        tipo: "RENDA_FIXA",
        instituicao: "Banco Inter",
        valorAplicado: 10000,
        valorAtual: 10850,
        rentabilidade: 8.5,
        dataAplicacao: new Date("2024-01-15"),
        dataVencimento: new Date("2025-01-15"),
        userId: alison.id,
      },
    }),
    prisma.investment.create({
      data: {
        nome: "Tesouro Selic 2029",
        tipo: "RENDA_FIXA",
        instituicao: "Tesouro Direto",
        valorAplicado: 15000,
        valorAtual: 16200,
        rentabilidade: 8.0,
        dataAplicacao: new Date("2023-06-01"),
        dataVencimento: new Date("2029-03-01"),
        userId: alison.id,
      },
    }),
    prisma.investment.create({
      data: {
        nome: "ITSA4 - Itaúsa",
        tipo: "RENDA_VARIAVEL",
        instituicao: "XP Investimentos",
        valorAplicado: 8000,
        valorAtual: 9200,
        rentabilidade: 15.0,
        dataAplicacao: new Date("2023-03-15"),
        userId: alison.id,
      },
    }),
    prisma.investment.create({
      data: {
        nome: "PETR4 - Petrobras",
        tipo: "RENDA_VARIAVEL",
        instituicao: "XP Investimentos",
        valorAplicado: 5000,
        valorAtual: 6500,
        rentabilidade: 30.0,
        dataAplicacao: new Date("2023-08-20"),
        userId: alison.id,
      },
    }),
    prisma.investment.create({
      data: {
        nome: "Fundo Imobiliário HGLG11",
        tipo: "FUNDO",
        instituicao: "XP Investimentos",
        valorAplicado: 7000,
        valorAtual: 7350,
        rentabilidade: 5.0,
        dataAplicacao: new Date("2024-02-10"),
        userId: alison.id,
      },
    }),
    prisma.investment.create({
      data: {
        nome: "Bitcoin",
        tipo: "CRIPTO",
        instituicao: "Binance",
        valorAplicado: 3000,
        valorAtual: 4500,
        rentabilidade: 50.0,
        dataAplicacao: new Date("2023-10-01"),
        userId: alison.id,
      },
    }),
    prisma.investment.create({
      data: {
        nome: "CDB Nubank",
        tipo: "RENDA_FIXA",
        instituicao: "Nubank",
        valorAplicado: 5000,
        valorAtual: 5250,
        rentabilidade: 5.0,
        dataAplicacao: new Date("2024-06-01"),
        userId: esposa.id,
      },
    }),
  ])

  console.log("📈 Investimentos criados:", investimentos.length)

  // ============================================
  // METAS
  // ============================================
  const metas = await Promise.all([
    prisma.goal.create({
      data: {
        nome: "Reserva de Emergência",
        tipo: "PATRIMONIO",
        valorMeta: 50000,
        valorAtual: 25000,
        prazo: new Date("2025-12-31"),
        userId: alison.id,
      },
    }),
    prisma.goal.create({
      data: {
        nome: "Viagem Europa 2025",
        tipo: "PATRIMONIO",
        valorMeta: 30000,
        valorAtual: 8500,
        prazo: new Date("2025-06-01"),
        userId: alison.id,
      },
    }),
    prisma.goal.create({
      data: {
        nome: "Investir 20% da Renda",
        tipo: "REGRA_PERCENTUAL",
        valorMeta: 2900, // 20% de 14500 (renda total)
        valorAtual: 1500,
        prazo: new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0),
        userId: alison.id,
      },
    }),
    prisma.goal.create({
      data: {
        nome: "Reduzir Gastos com Alimentação",
        tipo: "ECONOMIA_CATEGORIA",
        valorMeta: 1200,
        valorAtual: 1150,
        categoryId: categoriaMap["Alimentação"].id,
        prazo: new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0),
        userId: esposa.id,
      },
    }),
    prisma.goal.create({
      data: {
        nome: "Carro Novo",
        tipo: "PATRIMONIO",
        valorMeta: 80000,
        valorAtual: 15000,
        prazo: new Date("2026-12-31"),
        userId: alison.id,
      },
    }),
  ])

  console.log("🎯 Metas criadas:", metas.length)

  // ============================================
  // ORÇAMENTOS (BUDGET)
  // ============================================
  const mesAnoAtual = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, "0")}`
  const mesAnoPassado = `${mesPassado.getFullYear()}-${String(mesPassado.getMonth() + 1).padStart(2, "0")}`

  // Renda total família: 14500 + 2500 (freelance) = 17000
  // 50% = 8500 (Essenciais)
  // 30% = 5100 (Livre)
  // 20% = 3400 (Investimentos)

  const budgets = await Promise.all([
    prisma.budget.create({
      data: {
        mesAno: mesAnoAtual,
        projetado50: 8500,
        projetado30: 5100,
        projetado20: 3400,
        realizado50: 5027.9, // moradia + alimentação + transporte + saúde + educação
        realizado30: 564.7, // lazer + restaurantes + assinaturas + compras
        realizado20: 1500, // investimentos
        userId: alison.id,
      },
    }),
    prisma.budget.create({
      data: {
        mesAno: mesAnoPassado,
        projetado50: 8500,
        projetado30: 5100,
        projetado20: 3400,
        realizado50: 4200,
        realizado30: 1800,
        realizado20: 2500,
        userId: alison.id,
      },
    }),
  ])

  console.log("📊 Orçamentos criados:", budgets.length)

  console.log("")
  console.log("✅ Seed concluído com sucesso!")
  console.log("")
  console.log("📋 Resumo:")
  console.log(`   - Usuários: 2`)
  console.log(`   - Categorias: ${categorias.length}`)
  console.log(`   - Contas: 5`)
  console.log(`   - Transações: ${transacoes.length}`)
  console.log(`   - Investimentos: ${investimentos.length}`)
  console.log(`   - Metas: ${metas.length}`)
  console.log(`   - Orçamentos: ${budgets.length}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("❌ Erro ao executar seed:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
