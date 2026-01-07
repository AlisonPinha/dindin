import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/investimentos - List investments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const tipo = searchParams.get("tipo")

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { userId }
    if (tipo) where.tipo = tipo

    const investments = await prisma.investment.findMany({
      where,
      orderBy: { valorAtual: "desc" },
    })

    // Calculate totals
    const totals = investments.reduce(
      (acc, inv) => ({
        valorAplicado: acc.valorAplicado + inv.valorAplicado,
        valorAtual: acc.valorAtual + inv.valorAtual,
      }),
      { valorAplicado: 0, valorAtual: 0 }
    )

    const rentabilidadeTotal =
      totals.valorAplicado > 0
        ? ((totals.valorAtual - totals.valorAplicado) / totals.valorAplicado) * 100
        : 0

    return NextResponse.json({
      investments,
      totals: {
        ...totals,
        rentabilidade: rentabilidadeTotal,
        lucro: totals.valorAtual - totals.valorAplicado,
      },
    })
  } catch (error) {
    console.error("Error fetching investments:", error)
    return NextResponse.json(
      { error: "Erro ao buscar investimentos" },
      { status: 500 }
    )
  }
}

// POST /api/investimentos - Create investment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      nome,
      tipo,
      instituicao,
      valorAplicado,
      valorAtual,
      dataAplicacao,
      dataVencimento,
      userId,
    } = body

    if (!nome || !tipo || !valorAplicado || !dataAplicacao || !userId) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      )
    }

    const rentabilidade =
      valorAplicado > 0
        ? (((valorAtual || valorAplicado) - valorAplicado) / valorAplicado) * 100
        : 0

    const investment = await prisma.investment.create({
      data: {
        nome,
        tipo,
        instituicao,
        valorAplicado,
        valorAtual: valorAtual || valorAplicado,
        rentabilidade,
        dataAplicacao: new Date(dataAplicacao),
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
        userId,
      },
    })

    return NextResponse.json(investment, { status: 201 })
  } catch (error) {
    console.error("Error creating investment:", error)
    return NextResponse.json(
      { error: "Erro ao criar investimento" },
      { status: 500 }
    )
  }
}

// PUT /api/investimentos - Update investment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID do investimento é obrigatório" },
        { status: 400 }
      )
    }

    // Calculate new rentabilidade if values changed
    if (data.valorAplicado || data.valorAtual) {
      const current = await prisma.investment.findUnique({ where: { id } })
      if (current) {
        const valorAplicado = data.valorAplicado || current.valorAplicado
        const valorAtual = data.valorAtual || current.valorAtual
        data.rentabilidade =
          valorAplicado > 0
            ? ((valorAtual - valorAplicado) / valorAplicado) * 100
            : 0
      }
    }

    if (data.dataAplicacao) data.dataAplicacao = new Date(data.dataAplicacao)
    if (data.dataVencimento) data.dataVencimento = new Date(data.dataVencimento)

    const investment = await prisma.investment.update({
      where: { id },
      data,
    })

    return NextResponse.json(investment)
  } catch (error) {
    console.error("Error updating investment:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar investimento" },
      { status: 500 }
    )
  }
}

// DELETE /api/investimentos - Delete investment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID do investimento é obrigatório" },
        { status: 400 }
      )
    }

    await prisma.investment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting investment:", error)
    return NextResponse.json(
      { error: "Erro ao deletar investimento" },
      { status: 500 }
    )
  }
}
