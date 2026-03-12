import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { hashApiKey } from "@/lib/api-key";

const ALLOWED_TIPOS = ["ENTRADA", "SAIDA", "TRANSFERENCIA", "INVESTIMENTO"] as const;
const MAX_DESC_LENGTH = 255;
// dd_ prefix (3 chars) + 64 hex chars = 67 total
const API_KEY_LENGTH = 67;

// Supabase admin client (bypasses RLS) - used ONLY for API key lookup
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
  if (!apiKey || apiKey.length !== API_KEY_LENGTH) return null;

  // Hash the incoming key and compare against stored hash
  const hashedKey = hashApiKey(apiKey);

  // Use admin client ONLY for key lookup (no RLS on usuarios table for this query)
  const adminClient = getAdminClient();
  const { data: user } = await adminClient
    .from("usuarios")
    .select("id")
    .eq("api_key", hashedKey)
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
        { error: "Autenticação falhou" },
        { status: 401 }
      );
    }

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

    // Input validation
    if (!descricao?.trim()) {
      return NextResponse.json({ error: "descricao é obrigatório" }, { status: 400 });
    }
    if (typeof descricao !== "string" || descricao.trim().length > MAX_DESC_LENGTH) {
      return NextResponse.json({ error: `descricao deve ter no máximo ${MAX_DESC_LENGTH} caracteres` }, { status: 400 });
    }
    if (typeof valor !== "number" || !isFinite(valor) || valor <= 0) {
      return NextResponse.json({ error: "valor deve ser um número positivo" }, { status: 400 });
    }
    if (!ALLOWED_TIPOS.includes(tipo as typeof ALLOWED_TIPOS[number])) {
      return NextResponse.json({ error: `tipo deve ser um dos: ${ALLOWED_TIPOS.join(", ")}` }, { status: 400 });
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
    // Admin client is required since this route uses API key auth (no session cookies)
    let accountData: { id: string; tipo: string; dia_fechamento: number | null } | null = null;
    if (accountId) {
      const supabase = getAdminClient();
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

    // Admin client required since this route uses API key auth (no session cookies)
    // user_id is always set in insertData to scope to the authenticated user
    const supabase = getAdminClient();
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
