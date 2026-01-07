import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/contas - List accounts
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

    const accounts = await prisma.account.findMany({
      where,
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    })

    // Calculate current balance for each account
    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        const transactions = await prisma.transaction.aggregate({
          where: { accountId: account.id },
          _sum: { valor: true },
        })

        // Calculate balance based on transaction types
        const transactionsList = await prisma.transaction.findMany({
          where: { accountId: account.id },
          select: { valor: true, tipo: true },
        })

        let saldoTransacoes = 0
        transactionsList.forEach((t) => {
          if (t.tipo === "ENTRADA") {
            saldoTransacoes += t.valor
          } else if (t.tipo === "SAIDA") {
            saldoTransacoes -= t.valor
          }
          // TRANSFERENCIA and INVESTIMENTO may need special handling
        })

        return {
          ...account,
          saldoAtual: account.saldoInicial + saldoTransacoes,
          totalTransacoes: transactions._sum.valor || 0,
        }
      })
    )

    // Calculate totals
    const totals = accountsWithBalance.reduce(
      (acc, account) => {
        if (account.ativo) {
          if (account.tipo === "CARTAO_CREDITO") {
            acc.totalCredito += account.saldoAtual
          } else {
            acc.totalDisponivel += account.saldoAtual
          }
        }
        return acc
      },
      { totalDisponivel: 0, totalCredito: 0 }
    )

    return NextResponse.json({
      accounts: accountsWithBalance,
      totals: {
        ...totals,
        saldoLiquido: totals.totalDisponivel - totals.totalCredito,
      },
    })
  } catch (error) {
    console.error("Error fetching accounts:", error)
    return NextResponse.json(
      { error: "Erro ao buscar contas" },
      { status: 500 }
    )
  }
}

// POST /api/contas - Create account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { nome, tipo, banco, saldoInicial, cor, icone, userId } = body

    if (!nome || !tipo || !userId) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      )
    }

    const account = await prisma.account.create({
      data: {
        nome,
        tipo,
        banco,
        saldoInicial: saldoInicial || 0,
        cor,
        icone,
        userId,
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error("Error creating account:", error)
    return NextResponse.json(
      { error: "Erro ao criar conta" },
      { status: 500 }
    )
  }
}

// PUT /api/contas - Update account
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID da conta é obrigatório" },
        { status: 400 }
      )
    }

    const account = await prisma.account.update({
      where: { id },
      data,
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error("Error updating account:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar conta" },
      { status: 500 }
    )
  }
}

// DELETE /api/contas - Delete account (soft delete by deactivating)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const force = searchParams.get("force") === "true"

    if (!id) {
      return NextResponse.json(
        { error: "ID da conta é obrigatório" },
        { status: 400 }
      )
    }

    // Check if account has transactions
    const transactionCount = await prisma.transaction.count({
      where: { accountId: id },
    })

    if (transactionCount > 0 && !force) {
      // Soft delete - just deactivate
      await prisma.account.update({
        where: { id },
        data: { ativo: false },
      })

      return NextResponse.json({
        success: true,
        action: "deactivated",
        transactionCount,
      })
    }

    // Hard delete if no transactions or force=true
    await prisma.account.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, action: "deleted" })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json(
      { error: "Erro ao deletar conta" },
      { status: 500 }
    )
  }
}
