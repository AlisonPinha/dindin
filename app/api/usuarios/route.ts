import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/usuarios - List users or get single user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const email = searchParams.get("email")

    // Get single user by id or email
    if (id || email) {
      const user = await prisma.user.findFirst({
        where: id ? { id } : { email: email! },
        include: {
          accounts: {
            where: { ativo: true },
            orderBy: { nome: "asc" },
          },
          _count: {
            select: {
              transactions: true,
              investments: true,
              goals: true,
            },
          },
        },
      })

      if (!user) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        )
      }

      return NextResponse.json(user)
    }

    // List all users (family members)
    const users = await prisma.user.findMany({
      orderBy: { nome: "asc" },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    )
  }
}

// POST /api/usuarios - Create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { nome, email, avatar } = body

    if (!nome || !email) {
      return NextResponse.json(
        { error: "Nome e email são obrigatórios" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: {
        nome,
        email,
        avatar,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    )
  }
}

// PUT /api/usuarios - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      )
    }

    // Check if email is being changed and already exists
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Email já está em uso" },
          { status: 400 }
        )
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    )
  }
}

// DELETE /api/usuarios - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      )
    }

    // Get count of user's data before deleting
    const userData = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
            accounts: true,
            investments: true,
            goals: true,
          },
        },
      },
    })

    if (!userData) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Delete user (cascades to all related data)
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      deletedData: userData._count,
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Erro ao deletar usuário" },
      { status: 500 }
    )
  }
}
