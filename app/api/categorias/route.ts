import { NextRequest } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import type { DbCategoryType, DbCategoryGroup } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { ErrorResponses, SuccessResponses } from "@/lib/api";

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

    return SuccessResponses.ok(categories);
  } catch (error) {
    logger.error("Failed to fetch categories", error, { action: "fetch", resource: "categorias" });
    return ErrorResponses.serverError("Erro ao buscar categorias");
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
      return ErrorResponses.badRequest("Nome é obrigatório");
    }

    if (!tipo) {
      return ErrorResponses.badRequest("Tipo é obrigatório");
    }

    if (!cor) {
      return ErrorResponses.badRequest("Cor é obrigatória");
    }

    if (!grupo) {
      return ErrorResponses.badRequest("Grupo é obrigatório");
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

    return SuccessResponses.created(category);
  } catch (error) {
    logger.error("Failed to create category", error, { action: "create", resource: "categorias" });
    return ErrorResponses.serverError("Erro ao criar categoria");
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
      return ErrorResponses.badRequest("ID da categoria é obrigatório");
    }

    // Verificar se categoria existe e pertence ao usuário
    const { data: existing } = await supabase
      .from("categorias")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return ErrorResponses.notFound("Categoria", true);
    }

    // Não permite editar categorias do sistema (user_id = null)
    if (existing.user_id === null) {
      return ErrorResponses.forbidden("Não é possível editar categorias do sistema");
    }

    // Não permite editar categorias de outros usuários
    if (existing.user_id !== auth.user.id) {
      return ErrorResponses.forbidden("Categoria não pertence ao usuário");
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

    return SuccessResponses.ok(category);
  } catch (error) {
    logger.error("Failed to update category", error, { action: "update", resource: "categorias" });
    return ErrorResponses.serverError("Erro ao atualizar categoria");
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
      return ErrorResponses.badRequest("ID da categoria é obrigatório");
    }

    const supabase = await getSupabaseClient();

    // Verificar se categoria existe e pertence ao usuário
    const { data: existing } = await supabase
      .from("categorias")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return ErrorResponses.notFound("Categoria", true);
    }

    // Não permite deletar categorias do sistema
    if (existing.user_id === null) {
      return ErrorResponses.forbidden("Não é possível excluir categorias do sistema");
    }

    // Não permite deletar categorias de outros usuários
    if (existing.user_id !== auth.user.id) {
      return ErrorResponses.forbidden("Categoria não pertence ao usuário");
    }

    // Verificar se categoria tem transações vinculadas
    const { count } = await supabase
      .from("transacoes")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (count && count > 0) {
      return ErrorResponses.badRequest(`Categoria possui ${count} transação(ões) vinculada(s)`);
    }

    const { error } = await supabase
      .from("categorias")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id); // Garantir que só deleta do próprio usuário

    if (error) throw error;

    return SuccessResponses.deleted();
  } catch (error) {
    logger.error("Failed to delete category", error, { action: "delete", resource: "categorias" });
    return ErrorResponses.serverError("Erro ao deletar categoria");
  }
}
