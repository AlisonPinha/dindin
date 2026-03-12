import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import { logger } from "@/lib/logger";
import { ErrorResponses, SuccessResponses } from "@/lib/api";

// GET - List challenges
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("desafios")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ desafios: data || [] });
  } catch (error) {
    logger.error("Failed to fetch challenges", error, { action: "fetch", resource: "desafios" });
    return ErrorResponses.serverError("Erro ao buscar desafios");
  }
}

// POST - Create challenge
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const body = await request.json();

    const { nome, descricao, tipo, template, dataInicio, dataFim, metaValor } = body;

    if (!nome?.trim()) return ErrorResponses.badRequest("Nome é obrigatório");
    if (!tipo) return ErrorResponses.badRequest("Tipo é obrigatório");
    if (!dataInicio || !dataFim) return ErrorResponses.badRequest("Datas são obrigatórias");

    const { data, error } = await supabase
      .from("desafios")
      .insert({
        user_id: auth.user.id,
        nome: nome.trim(),
        descricao: descricao || null,
        tipo,
        template: template || null,
        data_inicio: dataInicio,
        data_fim: dataFim,
        meta_valor: metaValor || null,
        valor_atual: 0,
        status: "ATIVO",
        streak_conjunto: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return SuccessResponses.created(data);
  } catch (error) {
    logger.error("Failed to create challenge", error, { action: "create", resource: "desafios" });
    return ErrorResponses.serverError("Erro ao criar desafio");
  }
}

// PUT - Update challenge
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return ErrorResponses.badRequest("ID é obrigatório");

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.nome !== undefined) updateData.nome = updates.nome;
    if (updates.descricao !== undefined) updateData.descricao = updates.descricao;
    if (updates.valorAtual !== undefined) updateData.valor_atual = updates.valorAtual;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.streakConjunto !== undefined) updateData.streak_conjunto = updates.streakConjunto;

    const { data, error } = await supabase
      .from("desafios")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .select()
      .single();

    if (error) throw error;

    return SuccessResponses.ok(data);
  } catch (error) {
    logger.error("Failed to update challenge", error, { action: "update", resource: "desafios" });
    return ErrorResponses.serverError("Erro ao atualizar desafio");
  }
}

// DELETE - Delete challenge
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return ErrorResponses.badRequest("ID é obrigatório");

    const supabase = await getSupabaseClient();

    const { error } = await supabase
      .from("desafios")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return SuccessResponses.deleted();
  } catch (error) {
    logger.error("Failed to delete challenge", error, { action: "delete", resource: "desafios" });
    return ErrorResponses.serverError("Erro ao excluir desafio");
  }
}
