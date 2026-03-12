import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// Supabase admin client (bypasses RLS) for API key auth
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Authenticate via API key (Bearer token)
async function authenticateByApiKey(request: NextRequest): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey || apiKey.length < 32) return null;

  const supabase = getAdminClient();
  const { data: user } = await supabase
    .from("usuarios")
    .select("id")
    .eq("api_key", apiKey)
    .single();

  if (!user) return null;
  return { userId: user.id };
}

// POST /api/quick-add - Add transaction via API key (iOS Shortcuts)
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateByApiKey(request);
    if (!auth) {
      return NextResponse.json(
        { error: "API key inválida ou ausente. Use: Authorization: Bearer <sua-api-key>" },
        { status: 401 }
      );
    }

    const supabase = getAdminClient();
    const body = await request.json();

    const {
      descricao,
      valor,
      tipo = "SAIDA",
      data: dataStr,
      accountId,
      categoryId,
      tags,
    } = body;

    // Validações mínimas
    if (!descricao?.trim()) {
      return NextResponse.json({ error: "descricao é obrigatório" }, { status: 400 });
    }
    if (!valor || valor <= 0) {
      return NextResponse.json({ error: "valor deve ser maior que zero" }, { status: 400 });
    }

    // Data: usar hoje se não informada
    let dataTransacao: string;
    if (dataStr) {
      const d = new Date(dataStr);
      dataTransacao = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } else {
      const now = new Date();
      dataTransacao = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    }

    // Buscar conta (se informada) para calcular mes_fatura
    let accountData: { id: string; tipo: string; dia_fechamento: number | null } | null = null;
    if (accountId) {
      const { data: account } = await supabase
        .from("contas")
        .select("id, tipo, dia_fechamento")
        .eq("id", accountId)
        .eq("user_id", auth.userId)
        .single();

      if (!account) {
        return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
      }
      accountData = account;
    }

    // Calcular mes_fatura
    const date = new Date(dataTransacao + "T00:00:00");
    const day = date.getDate();
    let mesFatura: string;

    if (accountData?.tipo === "CARTAO_CREDITO" && accountData.dia_fechamento) {
      if (day > accountData.dia_fechamento) {
        const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        mesFatura = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
      } else {
        mesFatura = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
      }
    } else {
      mesFatura = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
    }

    // Inserir transação
    const insertData: Record<string, unknown> = {
      descricao: descricao.trim(),
      valor: Math.abs(valor),
      tipo,
      data: dataTransacao,
      mes_fatura: mesFatura,
      recorrente: false,
      category_id: categoryId || null,
      account_id: accountId || null,
      user_id: auth.userId,
      tags: tags || [],
    };

    const { data: transaction, error } = await supabase
      .from("transacoes")
      .insert(insertData)
      .select("id, descricao, valor, tipo, data, mes_fatura")
      .single();

    if (error) {
      logger.error("Quick-add failed", error, { action: "quick-add", resource: "transacoes" });
      return NextResponse.json({ error: "Erro ao criar transação" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      transaction,
    }, { status: 201 });
  } catch (error) {
    logger.error("Quick-add error", error, { action: "quick-add", resource: "transacoes" });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
