/**
 * Alertas CRUD API — Story 4.2
 * GET /api/alertas — Lista alertas do usuário
 * POST /api/alertas — Cria configuração de alerta
 * DELETE /api/alertas?id=xxx — Remove configuração de alerta
 */

import { NextRequest } from "next/server"
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper"
import { ErrorResponses, SuccessResponses } from "@/lib/api"
import { logger } from "@/lib/logger"

// GET — Listar alertas
export async function GET() {
  try {
    const auth = await getAuthenticatedUser()
    if (auth.error) return auth.error

    const supabase = await getSupabaseClient()

    const { data: alertas, error } = await supabase
      .from("alertas")
      .select("*, categorias(nome, cor)")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return SuccessResponses.ok(alertas || [])
  } catch (error) {
    logger.error("Erro ao buscar alertas", error, { action: "fetch", resource: "alertas" })
    return ErrorResponses.serverError("Erro ao buscar alertas")
  }
}

// POST — Criar configuração de alerta
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (auth.error) return auth.error

    const body = await request.json()
    const { categoryId, threshold, channel } = body as {
      categoryId?: string
      threshold?: number
      channel?: string
    }

    if (!threshold || ![70, 80, 90].includes(threshold)) {
      return ErrorResponses.badRequest("Threshold deve ser 70, 80 ou 90")
    }

    if (channel && !["whatsapp", "dashboard"].includes(channel)) {
      return ErrorResponses.badRequest("Canal deve ser whatsapp ou dashboard")
    }

    const supabase = await getSupabaseClient()

    // Se categoryId fornecido, verificar se pertence ao usuário
    if (categoryId) {
      const { data: cat } = await supabase
        .from("categorias")
        .select("id")
        .eq("id", categoryId)
        .eq("user_id", auth.user.id)
        .single()

      if (!cat) {
        return ErrorResponses.notFound("Categoria", true)
      }
    }

    const { data: alerta, error } = await supabase
      .from("alertas")
      .insert({
        user_id: auth.user.id,
        categoria_id: categoryId || null,
        threshold,
        mensagem: "",
        canal: channel || "dashboard",
        enviado_em: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return SuccessResponses.created(alerta)
  } catch (error) {
    logger.error("Erro ao criar alerta", error, { action: "create", resource: "alertas" })
    return ErrorResponses.serverError("Erro ao criar alerta")
  }
}

// DELETE — Remover alerta
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return ErrorResponses.badRequest("ID do alerta e obrigatorio")
    }

    const supabase = await getSupabaseClient()

    const { data: existing } = await supabase
      .from("alertas")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single()

    if (!existing) {
      return ErrorResponses.notFound("Alerta")
    }

    const { error } = await supabase
      .from("alertas")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id)

    if (error) throw error

    return SuccessResponses.deleted()
  } catch (error) {
    logger.error("Erro ao deletar alerta", error, { action: "delete", resource: "alertas" })
    return ErrorResponses.serverError("Erro ao deletar alerta")
  }
}
