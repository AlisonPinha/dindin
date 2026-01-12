import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import type { DbCategoryType, DbCategoryGroup } from "@/lib/supabase";

// GET - Listar categorias (do sistema + do usuário)
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const grupo = searchParams.get("grupo");

    // Buscar categorias do sistema (user_id = null) E do usuário logado
    let query = supabase
      .from("categorias")
      .select("*")
      .or(`user_id.is.null,user_id.eq.${auth.user.id}`);

    if (tipo) query = query.eq("tipo", tipo);
    if (grupo) query = query.eq("grupo", grupo);

    query = query.order("tipo", { ascending: true }).order("nome", { ascending: true });

    const { data: categories, error } = await query;

    if (error) throw error;

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );
  }
}

// POST - Criar categoria (sempre associada ao usuário)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const body = await request.json();
    const supabase = await getSupabaseClient();

    const { nome, tipo, cor, icone, grupo, orcamentoMensal } = body;

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

    if (!cor) {
      return NextResponse.json(
        { error: "Cor é obrigatória" },
        { status: 400 }
      );
    }

    if (!grupo) {
      return NextResponse.json(
        { error: "Grupo é obrigatório" },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from("categorias")
      .insert({
        user_id: auth.user.id, // SEMPRE associar ao usuário
        nome: nome.trim(),
        tipo: tipo as DbCategoryType,
        cor,
        icone: icone || null,
        grupo: grupo as DbCategoryGroup,
        limite_mensal: orcamentoMensal || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar categoria (somente do próprio usuário, não do sistema)
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const body = await request.json();
    const supabase = await getSupabaseClient();

    const { id, nome, tipo, cor, icone, grupo, orcamentoMensal } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID da categoria é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se categoria existe e pertence ao usuário
    const { data: existing } = await supabase
      .from("categorias")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    // Não permite editar categorias do sistema (user_id = null)
    if (existing.user_id === null) {
      return NextResponse.json(
        { error: "Não é possível editar categorias do sistema" },
        { status: 403 }
      );
    }

    // Não permite editar categorias de outros usuários
    if (existing.user_id !== auth.user.id) {
      return NextResponse.json(
        { error: "Categoria não pertence ao usuário" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (nome !== undefined) updateData.nome = nome;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (cor !== undefined) updateData.cor = cor;
    if (icone !== undefined) updateData.icone = icone;
    if (grupo !== undefined) updateData.grupo = grupo;
    if (orcamentoMensal !== undefined) updateData.limite_mensal = orcamentoMensal;

    const { data: category, error } = await supabase
      .from("categorias")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", auth.user.id) // Garantir que só atualiza do próprio usuário
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(category);
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar categoria" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar categoria (somente do próprio usuário, não do sistema)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID da categoria é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();

    // Verificar se categoria existe e pertence ao usuário
    const { data: existing } = await supabase
      .from("categorias")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    // Não permite deletar categorias do sistema
    if (existing.user_id === null) {
      return NextResponse.json(
        { error: "Não é possível excluir categorias do sistema" },
        { status: 403 }
      );
    }

    // Não permite deletar categorias de outros usuários
    if (existing.user_id !== auth.user.id) {
      return NextResponse.json(
        { error: "Categoria não pertence ao usuário" },
        { status: 403 }
      );
    }

    // Verificar se categoria tem transações vinculadas
    const { count } = await supabase
      .from("transacoes")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: "Categoria possui transações vinculadas",
          transactionCount: count,
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("categorias")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id); // Garantir que só deleta do próprio usuário

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao deletar categoria" },
      { status: 500 }
    );
  }
}
