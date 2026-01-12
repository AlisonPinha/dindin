import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import type { DbGoalType } from "@/lib/supabase";

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
      .select("*, categories(*)")
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
      category: goal.categories,
      progresso: goal.valor_meta > 0 ? (goal.valor_atual / goal.valor_meta) * 100 : 0,
      restante: Math.max(0, goal.valor_meta - goal.valor_atual),
      atingida: goal.valor_atual >= goal.valor_meta,
    }));

    return NextResponse.json(goalsWithProgress);
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar metas" },
      { status: 500 }
    );
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

    if (!valorMeta || valorMeta <= 0) {
      return NextResponse.json(
        { error: "Valor da meta deve ser maior que zero" },
        { status: 400 }
      );
    }

    // Verificar se a categoria pertence ao usuário (se fornecida)
    if (categoryId) {
      const { data: category } = await supabase
        .from("categorias")
        .select("id")
        .eq("id", categoryId)
        .single();

      if (!category) {
        return NextResponse.json(
          { error: "Categoria não encontrada" },
          { status: 404 }
        );
      }
    }

    const { data: goal, error } = await supabase
      .from("metas")
      .insert({
        nome: nome.trim(),
        tipo: tipo as DbGoalType,
        valor_meta: valorMeta,
        valor_atual: valorAtual || 0,
        prazo: prazo ? new Date(prazo).toISOString() : null,
        category_id: categoryId || null,
        user_id: auth.user.id,
        ativo: true,
      })
      .select("*, categories(*)")
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        ...goal,
        category: goal.categories,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    return NextResponse.json(
      { error: "Erro ao criar meta" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "ID da meta é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se meta pertence ao usuário
    const { data: existing } = await supabase
      .from("metas")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se a categoria pertence ao usuário (se fornecida)
    if (categoryId) {
      const { data: category } = await supabase
        .from("categorias")
        .select("id")
        .eq("id", categoryId)
        .single();

      if (!category) {
        return NextResponse.json(
          { error: "Categoria não encontrada" },
          { status: 404 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (nome !== undefined) updateData.nome = nome;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (valorMeta !== undefined) updateData.valor_meta = valorMeta;
    if (valorAtual !== undefined) updateData.valor_atual = valorAtual;
    if (prazo !== undefined) updateData.prazo = prazo ? new Date(prazo).toISOString() : null;
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (ativo !== undefined) updateData.ativo = ativo;

    const { data: goal, error } = await supabase
      .from("metas")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .select("*, categories(*)")
      .single();

    if (error) throw error;

    return NextResponse.json({
      ...goal,
      category: goal.categories,
    });
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar meta" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "ID da meta é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se meta pertence ao usuário e obter valor atual
    const { data: current } = await supabase
      .from("metas")
      .select("id, valor_atual")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!current) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
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
      .select("*, categories(*)")
      .single();

    if (error) throw error;

    return NextResponse.json({
      ...goal,
      category: goal.categories,
      progresso: goal.valor_meta > 0 ? (goal.valor_atual / goal.valor_meta) * 100 : 0,
      atingida: goal.valor_atual >= goal.valor_meta,
    });
  } catch (error) {
    console.error("Erro ao atualizar progresso da meta:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar progresso da meta" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "ID da meta é obrigatório" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("metas")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar meta:", error);
    return NextResponse.json(
      { error: "Erro ao deletar meta" },
      { status: 500 }
    );
  }
}
