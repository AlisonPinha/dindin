import { NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import { randomBytes } from "crypto";
import { logger } from "@/lib/logger";
import { hashApiKey } from "@/lib/api-key";

/**
 * Mask an API key hash for display (not reversible).
 * Shows first 8 chars + "..." + last 4 chars of the hash portion.
 */
function maskApiKeyHash(hashedKey: string): string {
  // For hashed keys, show a masked placeholder
  const hashPart = hashedKey.startsWith("sha256:") ? hashedKey.slice(7) : hashedKey;
  if (hashPart.length < 12) return "****";
  return hashPart.slice(0, 8) + "..." + hashPart.slice(-4);
}

// GET /api/usuarios/api-key - Get current API key (masked)
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

    // Never return the full key/hash - only a masked version
    return NextResponse.json({
      apiKey: user?.api_key ? maskApiKeyHash(user.api_key) : null,
      hasKey: !!user?.api_key,
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
    const rawApiKey = `dd_${randomBytes(32).toString("hex")}`;
    const hashedKey = hashApiKey(rawApiKey);

    const { error } = await supabase
      .from("usuarios")
      .update({ api_key: hashedKey })
      .eq("id", auth.user.id);

    if (error) throw error;

    // Return the raw key ONLY this one time - it cannot be retrieved again
    return NextResponse.json({ apiKey: rawApiKey });
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
