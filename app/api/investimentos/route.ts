import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import type { DbInvestmentType } from "@/lib/supabase";

// GET - Listar investimentos do usuário logado
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    let query = supabase
      .from("investimentos")
      .select("*")
      .eq("user_id", auth.user.id);

    if (tipo) query = query.eq("tipo", tipo);

    query = query.order("valor_atual", { ascending: false });

    // Apply pagination
    const currentLimit = limit ? parseInt(limit) : 100;
    const currentOffset = offset ? parseInt(offset) : 0;
    query = query.range(currentOffset, currentOffset + currentLimit - 1);

    const { data: investments, error } = await query;

    if (error) throw error;

    // Get total count
    let countQuery = supabase
      .from("investimentos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.user.id);

    if (tipo) countQuery = countQuery.eq("tipo", tipo);

    const { count } = await countQuery;
    const totalCount = count ?? 0;

    // Calculate totals
    const totals = (investments || []).reduce(
      (acc, inv) => ({
        valorAplicado: acc.valorAplicado + (inv.valor_aplicado || 0),
        valorAtual: acc.valorAtual + (inv.valor_atual || 0),
      }),
      { valorAplicado: 0, valorAtual: 0 }
    );

    const rentabilidadeTotal =
      totals.valorAplicado > 0
        ? ((totals.valorAtual - totals.valorAplicado) / totals.valorAplicado) * 100
        : 0;

    return NextResponse.json({
      investments,
      totals: {
        ...totals,
        rentabilidade: rentabilidadeTotal,
        lucro: totals.valorAtual - totals.valorAplicado,
      },
      total: totalCount,
      pagination: {
        limit: currentLimit,
        offset: currentOffset,
        hasMore: currentOffset + currentLimit < totalCount,
        totalPages: Math.ceil(totalCount / currentLimit),
        currentPage: Math.floor(currentOffset / currentLimit) + 1,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar investimentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar investimentos" },
      { status: 500 }
    );
  }
}

// POST - Criar investimento
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const body = await request.json();
    const supabase = await getSupabaseClient();

    const {
      nome,
      tipo,
      instituicao,
      valorAplicado,
      valorAtual,
      dataAplicacao,
      dataVencimento,
    } = body;

    // Validações
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

    if (!valorAplicado || valorAplicado <= 0) {
      return NextResponse.json(
        { error: "Valor aplicado deve ser maior que zero" },
        { status: 400 }
      );
    }

    if (!dataAplicacao) {
      return NextResponse.json(
        { error: "Data de aplicação é obrigatória" },
        { status: 400 }
      );
    }

    const rentabilidade =
      valorAplicado > 0
        ? (((valorAtual || valorAplicado) - valorAplicado) / valorAplicado) * 100
        : 0;

    const { data: investment, error } = await supabase
      .from("investimentos")
      .insert({
        nome: nome.trim(),
        tipo: tipo as DbInvestmentType,
        instituicao: instituicao || null,
        valor_aplicado: valorAplicado,
        valor_atual: valorAtual || valorAplicado,
        rentabilidade,
        data_aplicacao: new Date(dataAplicacao).toISOString(),
        data_vencimento: dataVencimento ? new Date(dataVencimento).toISOString() : null,
        user_id: auth.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(investment, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar investimento:", error);
    return NextResponse.json(
      { error: "Erro ao criar investimento" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar investimento
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const body = await request.json();
    const supabase = await getSupabaseClient();

    const { id, nome, tipo, instituicao, valorAplicado, valorAtual, dataAplicacao, dataVencimento } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID do investimento é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se investimento pertence ao usuário
    const { data: existing } = await supabase
      .from("investimentos")
      .select("id, valor_aplicado, valor_atual")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Investimento não encontrado" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (nome !== undefined) updateData.nome = nome;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (instituicao !== undefined) updateData.instituicao = instituicao;
    if (valorAplicado !== undefined) updateData.valor_aplicado = valorAplicado;
    if (valorAtual !== undefined) updateData.valor_atual = valorAtual;
    if (dataAplicacao !== undefined) updateData.data_aplicacao = new Date(dataAplicacao).toISOString();
    if (dataVencimento !== undefined) updateData.data_vencimento = dataVencimento ? new Date(dataVencimento).toISOString() : null;

    // Calculate new rentabilidade if values changed
    if (valorAplicado !== undefined || valorAtual !== undefined) {
      const newValorAplicado = valorAplicado ?? existing.valor_aplicado;
      const newValorAtual = valorAtual ?? existing.valor_atual;
      updateData.rentabilidade =
        newValorAplicado > 0
          ? ((newValorAtual - newValorAplicado) / newValorAplicado) * 100
          : 0;
    }

    const { data: investment, error } = await supabase
      .from("investimentos")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(investment);
  } catch (error) {
    console.error("Erro ao atualizar investimento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar investimento" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar investimento
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do investimento é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();

    // Verificar se investimento pertence ao usuário
    const { data: existing } = await supabase
      .from("investimentos")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Investimento não encontrado" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("investimentos")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar investimento:", error);
    return NextResponse.json(
      { error: "Erro ao deletar investimento" },
      { status: 500 }
    );
  }
}
