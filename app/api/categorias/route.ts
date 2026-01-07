import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/categorias - List categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")
    const grupo = searchParams.get("grupo")

    const where: Record<string, unknown> = {}
    if (tipo) where.tipo = tipo
    if (grupo) where.grupo = grupo

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ tipo: "asc" }, { nome: "asc" }],
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    )
  }
}

// POST /api/categorias - Create category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { nome, tipo, cor, icone, grupo, orcamentoMensal } = body

    if (!nome || !tipo || !cor || !grupo) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        nome,
        tipo,
        cor,
        icone,
        grupo,
        orcamentoMensal,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    )
  }
}

// PUT /api/categorias - Update category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID da categoria é obrigatório" },
        { status: 400 }
      )
    }

    const category = await prisma.category.update({
      where: { id },
      data,
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar categoria" },
      { status: 500 }
    )
  }
}

// DELETE /api/categorias - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID da categoria é obrigatório" },
        { status: 400 }
      )
    }

    // Check if category has transactions
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    })

    if (transactionCount > 0) {
      return NextResponse.json(
        {
          error: "Categoria possui transações vinculadas",
          transactionCount,
        },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { error: "Erro ao deletar categoria" },
      { status: 500 }
    )
  }
}
