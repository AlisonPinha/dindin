import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import { logger } from "@/lib/logger";

// GET - Obter dados do usuário logado (retorna array para compatibilidade com SWR)
export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();

    // Buscar usuário no banco
    const { data: user, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", auth.user.id)
      .single();

    // Se usuário não existe na tabela users, retorna array vazio
    // (usuário novo que ainda não completou onboarding)
    if (error || !user) {
      return NextResponse.json([]);
    }

    // Get counts
    const [accountsCount, transactionsCount, investmentsCount, goalsCount] = await Promise.all([
      supabase.from("contas").select("id", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("ativo", true),
      supabase.from("transacoes").select("id", { count: "exact", head: true }).eq("user_id", auth.user.id),
      supabase.from("investimentos").select("id", { count: "exact", head: true }).eq("user_id", auth.user.id),
      supabase.from("metas").select("id", { count: "exact", head: true }).eq("user_id", auth.user.id),
    ]);

    // Retorna array com o usuário para compatibilidade com SWR
    return NextResponse.json([{
      ...user,
      _count: {
        accounts: accountsCount.count || 0,
        transactions: transactionsCount.count || 0,
        investments: investmentsCount.count || 0,
        goals: goalsCount.count || 0,
      },
    }]);
  } catch (error) {
    logger.error("Failed to fetch user", error, { action: "fetch", resource: "usuarios" });
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: 500 }
    );
  }
}

// POST - Criar usuário (chamado pelo auth callback)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const body = await request.json();
    const supabase = await getSupabaseClient();

    const { nome, avatar, isOnboarded } = body;

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", auth.user.id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Usuário já cadastrado" },
        { status: 400 }
      );
    }

    // Criar usuário com o ID do Supabase Auth
    const { data: user, error } = await supabase
      .from("usuarios")
      .insert({
        id: auth.user.id,
        nome: nome || auth.user.email.split("@")[0],
        email: auth.user.email,
        avatar: avatar || null,
        is_onboarded: isOnboarded ?? false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    logger.error("Failed to create user", error, { action: "create", resource: "usuarios" });
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar dados do usuário logado
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const body = await request.json();
    const supabase = await getSupabaseClient();

    const { nome, avatar, isOnboarded, rendaMensal } = body;

    // Verificar se usuário existe
    const { data: existingUser } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", auth.user.id)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (nome !== undefined) updateData.nome = nome;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (isOnboarded !== undefined) updateData.is_onboarded = isOnboarded;
    if (rendaMensal !== undefined) updateData.renda_mensal = rendaMensal;

    const { data: user, error } = await supabase
      .from("usuarios")
      .update(updateData)
      .eq("id", auth.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(user);
  } catch (error) {
    logger.error("Failed to update user", error, { action: "update", resource: "usuarios" });
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar conta do usuário logado (e todos os dados)
export async function DELETE() {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();

    // Get counts before deleting
    const [accountsCount, transactionsCount, investmentsCount, goalsCount] = await Promise.all([
      supabase.from("contas").select("id", { count: "exact", head: true }).eq("user_id", auth.user.id),
      supabase.from("transacoes").select("id", { count: "exact", head: true }).eq("user_id", auth.user.id),
      supabase.from("investimentos").select("id", { count: "exact", head: true }).eq("user_id", auth.user.id),
      supabase.from("metas").select("id", { count: "exact", head: true }).eq("user_id", auth.user.id),
    ]);

    // Delete user (cascade should handle related data)
    const { error } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      deletedData: {
        accounts: accountsCount.count || 0,
        transactions: transactionsCount.count || 0,
        investments: investmentsCount.count || 0,
        goals: goalsCount.count || 0,
      },
    });
  } catch (error) {
    logger.error("Failed to delete user", error, { action: "delete", resource: "usuarios" });
    return NextResponse.json(
      { error: "Erro ao deletar usuário" },
      { status: 500 }
    );
  }
}
