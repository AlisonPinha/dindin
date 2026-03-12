import { NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import { randomBytes } from "crypto";
import { logger } from "@/lib/logger";

// GET /api/usuarios/api-key - Get current API key
export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const { data: user } = await supabase
      .from("usuarios")
      .select("api_key")
      .eq("id", auth.user.id)
      .single();

    return NextResponse.json({
      apiKey: user?.api_key || null,
    });
  } catch (error) {
    logger.error("Failed to get API key", error, { action: "get", resource: "api-key" });
    return NextResponse.json({ error: "Erro ao buscar API key" }, { status: 500 });
  }
}

// POST /api/usuarios/api-key - Generate new API key
export async function POST() {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const apiKey = `dd_${randomBytes(32).toString("hex")}`;

    const { error } = await supabase
      .from("usuarios")
      .update({ api_key: apiKey })
      .eq("id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ apiKey });
  } catch (error) {
    logger.error("Failed to generate API key", error, { action: "create", resource: "api-key" });
    return NextResponse.json({ error: "Erro ao gerar API key" }, { status: 500 });
  }
}

// DELETE /api/usuarios/api-key - Revoke API key
export async function DELETE() {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("usuarios")
      .update({ api_key: null })
      .eq("id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to revoke API key", error, { action: "delete", resource: "api-key" });
    return NextResponse.json({ error: "Erro ao revogar API key" }, { status: 500 });
  }
}
