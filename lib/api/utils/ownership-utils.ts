import type { SupabaseClient } from "@supabase/supabase-js"

type OwnershipResult = {
  exists: boolean
  isOwner: boolean
  data?: Record<string, unknown>
}

/**
 * Verifica se um recurso existe e pertence ao usuário
 */
export async function verifyOwnership(
  supabase: SupabaseClient,
  table: string,
  id: string,
  userId: string
): Promise<OwnershipResult> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (error || !data) {
    return { exists: false, isOwner: false }
  }

  return {
    exists: true,
    isOwner: true,
    data: data as Record<string, unknown>,
  }
}

/**
 * Verifica se um recurso existe (sem verificar propriedade)
 */
export async function checkExists(
  supabase: SupabaseClient,
  table: string,
  id: string
): Promise<boolean> {
  const { data } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .single()

  return !!data
}

/**
 * Verifica se múltiplos recursos existem e pertencem ao usuário
 */
export async function verifyMultipleOwnership(
  supabase: SupabaseClient,
  table: string,
  ids: string[],
  userId: string
): Promise<{ allExist: boolean; allOwned: boolean; foundIds: string[] }> {
  const { data } = await supabase
    .from(table)
    .select("id")
    .in("id", ids)
    .eq("user_id", userId)

  const foundIds = (data || []).map((d) => d.id)

  return {
    allExist: foundIds.length === ids.length,
    allOwned: foundIds.length === ids.length,
    foundIds,
  }
}
