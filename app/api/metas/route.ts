import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import type { DbGoalType } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { ErrorResponses, SuccessResponses } from "@/lib/api";

// GET - Listar metas do usuário logado
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get("ativo");
    const tipo = searchParams.get("tipo");

    let query = supabase
      .from("metas")
      .select("*, categorias(*)")
      .eq("user_id", auth.user.id);

    if (ativo !== null && ativo !== undefined) query = query.eq("ativo", ativo === "true");
    if (tipo) query = query.eq("tipo", tipo);

    query = query
      .order("ativo", { ascending: false })
      .order("created_at", { ascending: false });

    const { data: goals, error } = await query;

    if (error) throw error;

    // Add progress calculation and map to expected format
    const goalsWithProgress = (goals || []).map((goal) => ({
      ...goal,
      category: goal.categorias,
      progresso: goal.valor_alvo > 0 ? (goal.valor_atual / goal.valor_alvo) * 100 : 0,
      restante: Math.max(0, goal.valor_alvo - goal.valor_atual),
      atingida: goal.valor_atual >= goal.valor_alvo,
    }));

    return NextResponse.json(goalsWithProgress);
  } catch (error) {
    logger.error("Failed to fetch goals", error, { action: "fetch", resource: "metas" });
    return ErrorResponses.serverError("Erro ao buscar metas");
  }
}

// POST - Criar meta
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const body = await request.json();
    const supabase = await getSupabaseClient();

    const { nome, tipo, valorMeta, valorAtual, prazo, categoryId } = body;

    // Validações
    if (!nome?.trim()) {
      return ErrorResponses.badRequest("Nome é obrigatório");
    }

    if (!tipo) {
      return ErrorResponses.badRequest("Tipo é obrigatório");
    }

    if (!valorMeta || valorMeta <= 0) {
      return ErrorResponses.badRequest("Valor da meta deve ser maior que zero");
    }

    // Verificar se a categoria pertence ao usuário (se fornecida)
    if (categoryId) {
      const { data: category } = await supabase
        .from("categorias")
        .select("id")
        .eq("id", categoryId)
        .single();

      if (!category) {
        return ErrorResponses.notFound("Categoria", true);
      }
    }

    const { data: goal, error } = await supabase
      .from("metas")
      .insert({
        nome: nome.trim(),
        tipo: tipo as DbGoalType,
        valor_alvo: valorMeta,
        valor_atual: valorAtual || 0,
        prazo: prazo ? (() => {
          const d = new Date(prazo);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        })() : null,
        category_id: categoryId || null,
        user_id: auth.user.id,
        ativo: true,
      })
      .select("*, categorias(*)")
      .single();

    if (error) throw error;

    return SuccessResponses.created({
      ...goal,
      category: goal.categorias,
    });
  } catch (error) {
    logger.error("Failed to create goal", error, { action: "create", resource: "metas" });
    return ErrorResponses.serverError("Erro ao criar meta");
  }
}

// PUT - Atualizar meta
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const body = await request.json();
    const supabase = await getSupabaseClient();

    const { id, nome, tipo, valorMeta, valorAtual, prazo, categoryId, ativo } = body;

    if (!id) {
      return ErrorResponses.badRequest("ID da meta é obrigatório");
    }

    // Verificar se meta pertence ao usuário
    const { data: existing } = await supabase
      .from("metas")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!existing) {
      return ErrorResponses.notFound("Meta", true);
    }

    // Verificar se a categoria pertence ao usuário (se fornecida)
    if (categoryId) {
      const { data: category } = await supabase
        .from("categorias")
        .select("id")
        .eq("id", categoryId)
        .single();

      if (!category) {
        return ErrorResponses.notFound("Categoria", true);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (nome !== undefined) updateData.nome = nome;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (valorMeta !== undefined) updateData.valor_alvo = valorMeta;
    if (valorAtual !== undefined) updateData.valor_atual = valorAtual;
    if (prazo !== undefined) {
      updateData.prazo = prazo ? (() => {
        const d = new Date(prazo);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })() : null;
    }
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (ativo !== undefined) updateData.ativo = ativo;

    const { data: goal, error } = await supabase
      .from("metas")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .select("*, categorias(*)")
      .single();

    if (error) throw error;

    return SuccessResponses.ok({
      ...goal,
      category: goal.categorias,
    });
  } catch (error) {
    logger.error("Failed to update goal", error, { action: "update", resource: "metas" });
    return ErrorResponses.serverError("Erro ao atualizar meta");
  }
}

// PATCH - Atualizar progresso da meta
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const body = await request.json();
    const supabase = await getSupabaseClient();

    const { id, valorAtual, incremento } = body;

    if (!id) {
      return ErrorResponses.badRequest("ID da meta é obrigatório");
    }

    // Verificar se meta pertence ao usuário e obter valor atual
    const { data: current } = await supabase
      .from("metas")
      .select("id, valor_atual")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!current) {
      return ErrorResponses.notFound("Meta", true);
    }

    let newValorAtual = valorAtual;

    // If incremento is provided, add to current value
    if (incremento !== undefined) {
      newValorAtual = current.valor_atual + incremento;
    }

    const { data: goal, error } = await supabase
      .from("metas")
      .update({ valor_atual: newValorAtual })
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .select("*, categorias(*)")
      .single();

    if (error) throw error;

    return SuccessResponses.ok({
      ...goal,
      category: goal.categorias,
      progresso: goal.valor_alvo > 0 ? (goal.valor_atual / goal.valor_alvo) * 100 : 0,
      atingida: goal.valor_atual >= goal.valor_alvo,
    });
  } catch (error) {
    logger.error("Failed to update goal progress", error, { action: "update_progress", resource: "metas" });
    return ErrorResponses.serverError("Erro ao atualizar progresso da meta");
  }
}

// DELETE - Deletar meta
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return ErrorResponses.badRequest("ID da meta é obrigatório");
    }

    const supabase = await getSupabaseClient();

    // Verificar se meta pertence ao usuário
    const { data: existing } = await supabase
      .from("metas")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!existing) {
      return ErrorResponses.notFound("Meta", true);
    }

    const { error } = await supabase
      .from("metas")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return SuccessResponses.deleted();
  } catch (error) {
    logger.error("Failed to delete goal", error, { action: "delete", resource: "metas" });
    return ErrorResponses.serverError("Erro ao deletar meta");
  }
}
