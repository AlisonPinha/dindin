import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import type { DbInvestmentType } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { ErrorResponses, SuccessResponses } from "@/lib/api";

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

    query = query.order("preco_atual", { ascending: false });

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
        valorAplicado: acc.valorAplicado + (inv.preco_compra || 0),
        valorAtual: acc.valorAtual + (inv.preco_atual || 0),
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
    logger.error("Failed to fetch investments", error, { action: "fetch", resource: "investimentos" });
    return ErrorResponses.serverError("Erro ao buscar investimentos");
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
      return ErrorResponses.badRequest("Nome é obrigatório");
    }

    if (!tipo) {
      return ErrorResponses.badRequest("Tipo é obrigatório");
    }

    if (!valorAplicado || valorAplicado <= 0) {
      return ErrorResponses.badRequest("Valor aplicado deve ser maior que zero");
    }

    if (!dataAplicacao) {
      return ErrorResponses.badRequest("Data de aplicação é obrigatória");
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
        preco_compra: valorAplicado,
        preco_atual: valorAtual || valorAplicado,
        rentabilidade,
        data_compra: (() => {
          const d = new Date(dataAplicacao);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        })(),
        data_vencimento: dataVencimento ? (() => {
          const d = new Date(dataVencimento);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        })() : null,
        user_id: auth.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return SuccessResponses.created(investment);
  } catch (error) {
    logger.error("Failed to create investment", error, { action: "create", resource: "investimentos" });
    return ErrorResponses.serverError("Erro ao criar investimento");
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
      return ErrorResponses.badRequest("ID do investimento é obrigatório");
    }

    // Verificar se investimento pertence ao usuário
    const { data: existing } = await supabase
      .from("investimentos")
      .select("id, preco_compra, preco_atual")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!existing) {
      return ErrorResponses.notFound("Investimento");
    }

    const updateData: Record<string, unknown> = {};
    if (nome !== undefined) updateData.nome = nome;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (instituicao !== undefined) updateData.instituicao = instituicao;
    if (valorAplicado !== undefined) updateData.preco_compra = valorAplicado;
    if (valorAtual !== undefined) updateData.preco_atual = valorAtual;
    if (dataAplicacao !== undefined) {
      const d = new Date(dataAplicacao);
      updateData.data_compra = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    if (dataVencimento !== undefined) {
      updateData.data_vencimento = dataVencimento ? (() => {
        const d = new Date(dataVencimento);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })() : null;
    }

    // Calculate new rentabilidade if values changed
    if (valorAplicado !== undefined || valorAtual !== undefined) {
      const newValorAplicado = valorAplicado ?? existing.preco_compra;
      const newValorAtual = valorAtual ?? existing.preco_atual;
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

    return SuccessResponses.ok(investment);
  } catch (error) {
    logger.error("Failed to update investment", error, { action: "update", resource: "investimentos" });
    return ErrorResponses.serverError("Erro ao atualizar investimento");
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
      return ErrorResponses.badRequest("ID do investimento é obrigatório");
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
      return ErrorResponses.notFound("Investimento");
    }

    const { error } = await supabase
      .from("investimentos")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return SuccessResponses.deleted();
  } catch (error) {
    logger.error("Failed to delete investment", error, { action: "delete", resource: "investimentos" });
    return ErrorResponses.serverError("Erro ao deletar investimento");
  }
}
