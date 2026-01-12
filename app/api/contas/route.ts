import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import type { DbAccountType } from "@/lib/supabase";

// GET - Listar contas do usuário logado (OTIMIZADO: 2 queries em vez de N+1)
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get("ativo");
    const tipo = searchParams.get("tipo");

    // Query 1: Buscar todas as contas do usuário
    let query = supabase
      .from("contas")
      .select("*")
      .eq("user_id", auth.user.id);

    if (ativo !== null && ativo !== undefined) {
      query = query.eq("ativo", ativo === "true");
    }
    if (tipo) {
      query = query.eq("tipo", tipo);
    }

    query = query
      .order("ativo", { ascending: false })
      .order("nome", { ascending: true });

    const { data: accounts, error } = await query;

    if (error) throw error;

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        accounts: [],
        totals: { totalDisponivel: 0, totalCredito: 0, saldoLiquido: 0 },
      });
    }

    // Query 2: Buscar TODAS as transações das contas do usuário em UMA query
    const accountIds = accounts.map(a => a.id);

    const { data: allTransactions, error: txError } = await supabase
      .from("transacoes")
      .select("account_id, valor, tipo")
      .in("account_id", accountIds);

    if (txError) throw txError;

    // Agrupar transações por conta (no código, sem queries adicionais)
    const transactionsByAccount = (allTransactions || []).reduce((acc, tx) => {
      if (!acc[tx.account_id]) {
        acc[tx.account_id] = [];
      }
      const entry = acc[tx.account_id];
      if (entry) {
        entry.push(tx);
      }
      return acc;
    }, {} as Record<string, Array<{ account_id: string; valor: number; tipo: string }>>);

    // Calcular saldo de cada conta
    const accountsWithBalance = accounts.map((account) => {
      const transactions = transactionsByAccount[account.id] || [];

      let saldoTransacoes = 0;
      transactions.forEach((t) => {
        const valor = Number(t.valor) || 0;
        if (t.tipo === "ENTRADA") {
          saldoTransacoes += valor;
        } else if (t.tipo === "SAIDA") {
          saldoTransacoes -= valor;
        }
      });

      return {
        ...account,
        saldoAtual: (Number(account.saldo) || 0) + saldoTransacoes,
      };
    });

    // Calcular totais
    const totals = accountsWithBalance.reduce(
      (acc, account) => {
        if (account.ativo) {
          if (account.tipo === "CARTAO_CREDITO") {
            acc.totalCredito += account.saldoAtual;
          } else {
            acc.totalDisponivel += account.saldoAtual;
          }
        }
        return acc;
      },
      { totalDisponivel: 0, totalCredito: 0 }
    );

    return NextResponse.json({
      accounts: accountsWithBalance,
      totals: {
        ...totals,
        saldoLiquido: totals.totalDisponivel - totals.totalCredito,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar contas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar contas" },
      { status: 500 }
    );
  }
}

// POST - Criar conta para o usuário logado
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const body = await request.json();
    const supabase = await getSupabaseClient();

    const { nome, tipo, banco, saldoInicial, cor, icone } = body;

    // Validação
    if (!nome?.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo é obrigatório" },
        { status: 400 }
      );
    }

    const { data: account, error } = await supabase
      .from("contas")
      .insert({
        user_id: auth.user.id, // SEMPRE usar o ID do usuário logado
        nome: nome.trim(),
        tipo: tipo as DbAccountType,
        banco: banco || null,
        saldo: saldoInicial || 0,
        cor: cor || "#6366f1",
        icone: icone || null,
        ativo: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar conta:", error);
    return NextResponse.json(
      { error: "Erro ao criar conta" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar conta do usuário logado
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const body = await request.json();
    const supabase = await getSupabaseClient();

    const { id, nome, tipo, banco, saldoInicial, cor, icone, ativo } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID da conta é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a conta pertence ao usuário
    const { data: existingAccount } = await supabase
      .from("contas")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!existingAccount) {
      return NextResponse.json(
        { error: "Conta não encontrada" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (nome !== undefined) updateData.nome = nome;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (banco !== undefined) updateData.banco = banco;
    if (saldoInicial !== undefined) updateData.saldo = saldoInicial;
    if (cor !== undefined) updateData.cor = cor;
    if (icone !== undefined) updateData.icone = icone;
    if (ativo !== undefined) updateData.ativo = ativo;

    const { data: account, error } = await supabase
      .from("contas")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", auth.user.id) // Garantir que só atualiza do próprio usuário
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(account);
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar conta" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar conta do usuário logado
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const force = searchParams.get("force") === "true";

    if (!id) {
      return NextResponse.json(
        { error: "ID da conta é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();

    // Verificar se a conta pertence ao usuário
    const { data: existingAccount } = await supabase
      .from("contas")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!existingAccount) {
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

    if (count && count > 0 && !force) {
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

    // Hard delete if no transactions or force=true
    const { error } = await supabase
      .from("contas")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, action: "deleted" });
  } catch (error) {
    console.error("Erro ao deletar conta:", error);
    return NextResponse.json(
      { error: "Erro ao deletar conta" },
      { status: 500 }
    );
  }
}
