import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/transacoes - List transactions with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const userId = searchParams.get("userId")
    const categoryId = searchParams.get("categoryId")
    const accountId = searchParams.get("accountId")
    const tipo = searchParams.get("tipo")
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { userId }

    if (categoryId) where.categoryId = categoryId
    if (accountId) where.accountId = accountId
    if (tipo) where.tipo = tipo

    if (dataInicio || dataFim) {
      where.data = {}
      if (dataInicio) (where.data as Record<string, Date>).gte = new Date(dataInicio)
      if (dataFim) (where.data as Record<string, Date>).lte = new Date(dataFim)
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        account: true,
      },
      orderBy: { data: "desc" },
      take: limit ? parseInt(limit) : 50,
      skip: offset ? parseInt(offset) : 0,
    })

    const total = await prisma.transaction.count({ where })

    return NextResponse.json({ transactions, total })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json(
      { error: "Erro ao buscar transações" },
      { status: 500 }
    )
  }
}

// POST /api/transacoes - Create transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      descricao,
      valor,
      tipo,
      data,
      recorrente,
      parcelas,
      categoryId,
      accountId,
      userId,
      tags,
      notas,
    } = body

    if (!descricao || !valor || !tipo || !data || !userId) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      )
    }

    // If it's an installment transaction, create all installments
    if (parcelas && parcelas > 1) {
      const transactions = []
      const valorParcela = valor / parcelas
      const dataBase = new Date(data)

      for (let i = 0; i < parcelas; i++) {
        const dataParcela = new Date(dataBase)
        dataParcela.setMonth(dataParcela.getMonth() + i)

        transactions.push({
          descricao: `${descricao} (${i + 1}/${parcelas})`,
          valor: valorParcela,
          tipo,
          data: dataParcela,
          recorrente: false,
          parcelas,
          parcelaAtual: i + 1,
          categoryId,
          accountId,
          userId,
          tags: tags || [],
          notas,
        })
      }

      const createdTransactions = await prisma.transaction.createMany({
        data: transactions,
      })

      return NextResponse.json(
        { count: createdTransactions.count },
        { status: 201 }
      )
    }

    // Single transaction
    const transaction = await prisma.transaction.create({
      data: {
        descricao,
        valor,
        tipo,
        data: new Date(data),
        recorrente: recorrente || false,
        categoryId,
        accountId,
        userId,
        tags: tags || [],
        notas,
      },
      include: {
        category: true,
        account: true,
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json(
      { error: "Erro ao criar transação" },
      { status: 500 }
    )
  }
}

// PUT /api/transacoes - Update transaction
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID da transação é obrigatório" },
        { status: 400 }
      )
    }

    if (data.data) {
      data.data = new Date(data.data)
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data,
      include: {
        category: true,
        account: true,
      },
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error updating transaction:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar transação" },
      { status: 500 }
    )
  }
}

// DELETE /api/transacoes - Delete transaction
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID da transação é obrigatório" },
        { status: 400 }
      )
    }

    await prisma.transaction.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting transaction:", error)
    return NextResponse.json(
      { error: "Erro ao deletar transação" },
      { status: 500 }
    )
  }
}
