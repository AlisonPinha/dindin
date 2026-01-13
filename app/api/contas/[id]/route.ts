import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// GET - Buscar conta específica
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const { id } = await params;
    const supabase = await getSupabaseClient();

    const { data: account, error } = await supabase
      .from("contas")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (error || !account) {
      return NextResponse.json(
        { error: "Conta não encontrada" },
        { status: 404 }
      );
    }

    // Calculate current balance
    const { data: transactions } = await supabase
      .from("transacoes")
      .select("valor, tipo")
      .eq("account_id", account.id);

    let saldoTransacoes = 0;
    (transactions || []).forEach((t: { valor: number; tipo: string }) => {
      if (t.tipo === "ENTRADA") {
        saldoTransacoes += t.valor;
      } else if (t.tipo === "SAIDA") {
        saldoTransacoes -= t.valor;
      }
    });

    return NextResponse.json({
      ...account,
      saldoAtual: account.saldo + saldoTransacoes,
    });
  } catch (error) {
    logger.error("Failed to fetch account", error, { action: "fetch", resource: "contas" });
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar conta
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const supabase = await getSupabaseClient();

    // Verificar se conta pertence ao usuário
    const { data: existing } = await supabase
      .from("contas")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Conta não encontrada" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.nome !== undefined) updateData.nome = body.nome;
    if (body.tipo !== undefined) updateData.tipo = body.tipo;
    if (body.banco !== undefined) updateData.banco = body.banco;
    if (body.saldoInicial !== undefined) updateData.saldo = body.saldoInicial;
    if (body.cor !== undefined) updateData.cor = body.cor;
    if (body.icone !== undefined) updateData.icone = body.icone;
    if (body.ativo !== undefined) updateData.ativo = body.ativo;

    const { data: account, error } = await supabase
      .from("contas")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(account);
  } catch (error) {
    logger.error("Failed to update account", error, { action: "update", resource: "contas" });
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar conta
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const { id } = await params;
    const supabase = await getSupabaseClient();

    // Verificar se conta pertence ao usuário
    const { data: existing } = await supabase
      .from("contas")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Conta não encontrada" },
        { status: 404 }
      );
    }

    // Check if account has transactions
    const { count } = await supabase
      .from("transacoes")
      .select("id", { count: "exact", head: true })
      .eq("account_id", id);

    if (count && count > 0) {
      // Soft delete - just deactivate
      const { error } = await supabase
        .from("contas")
        .update({ ativo: false })
        .eq("id", id)
        .eq("user_id", auth.user.id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        action: "deactivated",
        transactionCount: count,
      });
    }

    // Hard delete if no transactions
    const { error } = await supabase
      .from("contas")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, action: "deleted" });
  } catch (error) {
    logger.error("Failed to delete account", error, { action: "delete", resource: "contas" });
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
