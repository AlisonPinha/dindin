import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/metas - List goals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const ativo = searchParams.get("ativo")
    const tipo = searchParams.get("tipo")

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { userId }
    if (ativo !== null) where.ativo = ativo === "true"
    if (tipo) where.tipo = tipo

    const goals = await prisma.goal.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [{ ativo: "desc" }, { createdAt: "desc" }],
    })

    // Add progress calculation to each goal
    const goalsWithProgress = goals.map((goal) => ({
      ...goal,
      progresso: goal.valorMeta > 0 ? (goal.valorAtual / goal.valorMeta) * 100 : 0,
      restante: Math.max(0, goal.valorMeta - goal.valorAtual),
      atingida: goal.valorAtual >= goal.valorMeta,
    }))

    return NextResponse.json(goalsWithProgress)
  } catch (error) {
    console.error("Error fetching goals:", error)
    return NextResponse.json(
      { error: "Erro ao buscar metas" },
      { status: 500 }
    )
  }
}

// POST /api/metas - Create goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { nome, tipo, valorMeta, valorAtual, prazo, categoryId, userId } = body

    if (!nome || !tipo || !valorMeta || !userId) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      )
    }

    const goal = await prisma.goal.create({
      data: {
        nome,
        tipo,
        valorMeta,
        valorAtual: valorAtual || 0,
        prazo: prazo ? new Date(prazo) : null,
        categoryId,
        userId,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error("Error creating goal:", error)
    return NextResponse.json(
      { error: "Erro ao criar meta" },
      { status: 500 }
    )
  }
}

// PUT /api/metas - Update goal
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID da meta é obrigatório" },
        { status: 400 }
      )
    }

    if (data.prazo) data.prazo = new Date(data.prazo)

    const goal = await prisma.goal.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    })

    return NextResponse.json(goal)
  } catch (error) {
    console.error("Error updating goal:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar meta" },
      { status: 500 }
    )
  }
}

// DELETE /api/metas - Delete goal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID da meta é obrigatório" },
        { status: 400 }
      )
    }

    await prisma.goal.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting goal:", error)
    return NextResponse.json(
      { error: "Erro ao deletar meta" },
      { status: 500 }
    )
  }
}

// PATCH /api/metas - Update goal progress
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, valorAtual, incremento } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID da meta é obrigatório" },
        { status: 400 }
      )
    }

    let newValorAtual = valorAtual

    // If incremento is provided, add to current value
    if (incremento !== undefined) {
      const current = await prisma.goal.findUnique({ where: { id } })
      if (current) {
        newValorAtual = current.valorAtual + incremento
      }
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: { valorAtual: newValorAtual },
      include: { category: true },
    })

    return NextResponse.json({
      ...goal,
      progresso: goal.valorMeta > 0 ? (goal.valorAtual / goal.valorMeta) * 100 : 0,
      atingida: goal.valorAtual >= goal.valorMeta,
    })
  } catch (error) {
    console.error("Error updating goal progress:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar progresso da meta" },
      { status: 500 }
    )
  }
}
