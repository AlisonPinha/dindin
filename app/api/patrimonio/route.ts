import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import { logger } from "@/lib/logger";
import { ErrorResponses, SuccessResponses } from "@/lib/api";

// GET - List patrimonio snapshots (last 12 months)
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "12");

    const { data, error } = await supabase
      .from("patrimonio_snapshots")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("mes_ano", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ snapshots: data || [] });
  } catch (error) {
    logger.error("Failed to fetch patrimonio snapshots", error, { action: "fetch", resource: "patrimonio_snapshots" });
    return ErrorResponses.serverError("Erro ao buscar snapshots de patrimônio");
  }
}

// POST - Create/upsert snapshot for current month
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const body = await request.json();

    const now = new Date();
    const mesAno = body.mesAno || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // Calculate balances from accounts
    const { data: accounts } = await supabase
      .from("contas")
      .select("tipo, saldo")
      .eq("user_id", auth.user.id)
      .eq("ativo", true);

    let saldoContas = 0;
    let dividas = 0;

    (accounts || []).forEach((acc) => {
      if (acc.tipo === "CARTAO_CREDITO") {
        dividas += Number(acc.saldo) || 0;
      } else {
        saldoContas += Number(acc.saldo) || 0;
      }
    });

    // Calculate investments total
    const { data: investments } = await supabase
      .from("investimentos")
      .select("preco_atual")
      .eq("user_id", auth.user.id);

    const saldoInvestimentos = (investments || []).reduce(
      (sum, inv) => sum + (Number(inv.preco_atual) || 0),
      0
    );

    const patrimonioLiquido = saldoContas + saldoInvestimentos - dividas;

    // Upsert snapshot
    const { data: snapshot, error } = await supabase
      .from("patrimonio_snapshots")
      .upsert(
        {
          user_id: auth.user.id,
          mes_ano: mesAno,
          saldo_contas: saldoContas,
          saldo_investimentos: saldoInvestimentos,
          dividas,
          patrimonio_liquido: patrimonioLiquido,
        },
        { onConflict: "user_id,mes_ano" }
      )
      .select()
      .single();

    if (error) throw error;

    return SuccessResponses.created(snapshot);
  } catch (error) {
    logger.error("Failed to create patrimonio snapshot", error, { action: "create", resource: "patrimonio_snapshots" });
    return ErrorResponses.serverError("Erro ao criar snapshot de patrimônio");
  }
}
