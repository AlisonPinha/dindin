import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import type { DbAccountType } from "@/lib/supabase";
import { logger } from "@/lib/logger";

interface OnboardingAccount {
  nome: string;
  tipo: DbAccountType;
  banco: string;
  saldoInicial: number;
  cor: string;
}

interface OnboardingBody {
  nome: string;
  email: string;
  avatar?: string;
  accounts: OnboardingAccount[];
  rendaMensal: number;
}

// POST /api/onboarding - Complete onboarding process
export async function POST(request: NextRequest) {
  try {
    // Autenticação obrigatória
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const body: OnboardingBody = await request.json();
    const { nome, email, avatar, accounts, rendaMensal } = body;

    // O userId vem da autenticação, não do body
    const userId = auth.user.id;

    // Validações básicas
    if (!nome?.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: "Pelo menos uma conta é obrigatória" },
        { status: 400 }
      );
    }

    if (!rendaMensal || rendaMensal <= 0) {
      return NextResponse.json(
        { error: "Renda mensal deve ser maior que zero" },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const { data: existingUser, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .single();

    let updatedUser;

    if (userError || !existingUser) {
      // Usuário não existe - criar novo
      const { data: newUser, error: createUserError } = await supabase
        .from("usuarios")
        .insert({
          id: userId,
          nome: nome.trim(),
          email: email.trim(),
          avatar: avatar || null,
          renda_mensal: rendaMensal,
          is_onboarded: true,
        })
        .select()
        .single();

      if (createUserError) {
        logger.error("Failed to create user during onboarding", createUserError, { action: "create", resource: "onboarding" });
        return NextResponse.json(
          { error: "Erro ao criar usuário" },
          { status: 500 }
        );
      }

      updatedUser = newUser;
    } else {
      // Usuário existe - verificar email e atualizar
      // Verificar se email já está em uso por outro usuário
      const { data: emailInUse } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", email)
        .neq("id", userId)
        .single();

      if (emailInUse) {
        return NextResponse.json(
          { error: "Este email já está em uso" },
          { status: 400 }
        );
      }

      // Atualizar usuário com dados do perfil + marcar como onboarded
      const { data: user, error: updateUserError } = await supabase
        .from("usuarios")
        .update({
          nome: nome.trim(),
          email: email.trim(),
          avatar: avatar || existingUser.avatar,
          renda_mensal: rendaMensal,
          is_onboarded: true,
        })
        .eq("id", userId)
        .select()
        .single();

      if (updateUserError) throw updateUserError;
      updatedUser = user;
    }

    // 2. Deletar contas existentes do usuário (se houver do seed)
    await supabase
      .from("contas")
      .delete()
      .eq("user_id", userId);

    // 3. Criar novas contas
    const accountsToInsert = accounts.map((account) => ({
      nome: account.nome,
      tipo: account.tipo,
      banco: account.banco,
      saldo: account.saldoInicial,
      cor: account.cor,
      icone: getIconForAccountType(account.tipo),
      ativo: true,
      user_id: userId,
    }));

    const { data: createdAccounts, error: accountsError } = await supabase
      .from("contas")
      .insert(accountsToInsert)
      .select();

    if (accountsError) throw accountsError;

    // 4. Criar orçamento inicial baseado na regra 50/30/20
    const mesAno = getCurrentMonthYear();

    // Verificar se já existe orçamento para este mês
    const { data: existingBudget } = await supabase
      .from("orcamentos")
      .select("*")
      .eq("mes_ano", mesAno)
      .eq("user_id", userId)
      .single();

    let budget;
    if (existingBudget) {
      const { data: updatedBudget, error: budgetUpdateError } = await supabase
        .from("orcamentos")
        .update({
          essenciais_projetado: rendaMensal * 0.5,
          lifestyle_projetado: rendaMensal * 0.3,
          investimentos_projetado: rendaMensal * 0.2,
        })
        .eq("id", existingBudget.id)
        .select()
        .single();

      if (budgetUpdateError) throw budgetUpdateError;
      budget = updatedBudget;
    } else {
      const { data: newBudget, error: budgetCreateError } = await supabase
        .from("orcamentos")
        .insert({
          mes_ano: mesAno,
          essenciais_projetado: rendaMensal * 0.5,
          lifestyle_projetado: rendaMensal * 0.3,
          investimentos_projetado: rendaMensal * 0.2,
          essenciais_realizado: 0,
          lifestyle_realizado: 0,
          investimentos_realizado: 0,
          user_id: userId,
        })
        .select()
        .single();

      if (budgetCreateError) throw budgetCreateError;
      budget = newBudget;
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding concluído com sucesso!",
      data: {
        user: updatedUser,
        accounts: createdAccounts,
        budget,
      },
    });
  } catch (error) {
    logger.error("Onboarding process failed", error, { action: "onboarding", resource: "onboarding" });
    return NextResponse.json(
      { error: "Erro ao processar onboarding" },
      { status: 500 }
    );
  }
}

// Helper: Get icon based on account type
function getIconForAccountType(tipo: string): string {
  switch (tipo) {
    case "CORRENTE":
      return "Wallet";
    case "CARTAO_CREDITO":
      return "CreditCard";
    case "INVESTIMENTO":
      return "TrendingUp";
    default:
      return "Wallet";
  }
}

// Helper: Get current month/year in format YYYY-MM
function getCurrentMonthYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
