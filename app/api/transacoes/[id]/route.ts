import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import type { DbTransactionType, DbOwnershipType } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

// GET - Buscar transação específica
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const { id } = await params;
    const supabase = await getSupabaseClient();

    const { data: transaction, error } = await supabase
      .from("transacoes")
      .select("*, categorias(*), contas(*)")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (error || !transaction) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...transaction,
      category: transaction.categorias,
      account: transaction.contas,
    });
  } catch (error) {
    console.error("Erro ao buscar transação:", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar transação
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const supabase = await getSupabaseClient();

    // Verificar se transação pertence ao usuário
    const { data: existing } = await supabase
      .from("transacoes")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      );
    }

    const { descricao, valor, tipo, data, recorrente, categoryId, accountId, tags, notas, ownership } = body;

    // Verificar se a conta pertence ao usuário (se fornecida)
    if (accountId) {
      const { data: account } = await supabase
        .from("contas")
        .select("id")
        .eq("id", accountId)
        .eq("user_id", auth.user.id)
        .single();

      if (!account) {
        return NextResponse.json(
          { error: "Conta não encontrada" },
          { status: 404 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (descricao !== undefined) updateData.descricao = descricao;
    if (valor !== undefined) updateData.valor = valor;
    if (tipo !== undefined) updateData.tipo = tipo as DbTransactionType;
    if (data !== undefined) updateData.data = new Date(data).toISOString();
    if (recorrente !== undefined) updateData.recorrente = recorrente;
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (accountId !== undefined) updateData.account_id = accountId;
    if (tags !== undefined) updateData.tags = tags;
    if (notas !== undefined) updateData.notas = notas;
    if (ownership !== undefined) updateData.ownership = ownership as DbOwnershipType;

    const { data: transaction, error } = await supabase
      .from("transacoes")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .select("*, categorias(*), contas(*)")
      .single();

    if (error) throw error;

    return NextResponse.json({
      ...transaction,
      category: transaction.categorias,
      account: transaction.contas,
    });
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar transação
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const { id } = await params;
    const supabase = await getSupabaseClient();

    // Verificar se transação pertence ao usuário
    const { data: existing } = await supabase
      .from("transacoes")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("transacoes")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar transação:", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
