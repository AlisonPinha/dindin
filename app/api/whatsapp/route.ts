/**
 * WhatsApp Send Endpoint — Story 4.1
 * POST /api/whatsapp — Envia mensagem WhatsApp (uso interno, restrito a templates)
 */

import { NextRequest } from "next/server"
import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { ErrorResponses, SuccessResponses } from "@/lib/api"
import { logger } from "@/lib/logger"
import { sendTextMessage, isEvolutionConfigured } from "@/lib/whatsapp/evolution-client"
import { budgetAlert, dailySummary, goalReached } from "@/lib/whatsapp/message-templates"

// Templates permitidos — evita uso como relay de spam
const ALLOWED_TEMPLATES = ["budget_alert", "daily_summary", "goal_reached"] as const
type TemplateType = (typeof ALLOWED_TEMPLATES)[number]

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (auth.error) return auth.error

    if (!isEvolutionConfigured()) {
      return ErrorResponses.serverError("Servico WhatsApp nao configurado")
    }

    const body = await request.json()
    const { template, params } = body as {
      template?: string
      params?: Record<string, unknown>
    }

    if (!template || !ALLOWED_TEMPLATES.includes(template as TemplateType)) {
      return ErrorResponses.badRequest(
        `Template invalido. Permitidos: ${ALLOWED_TEMPLATES.join(", ")}`
      )
    }

    // Buscar telefone do próprio usuário (não aceita telefone arbitrário)
    const { getSupabaseClient } = await import("@/lib/supabase/auth-helper")
    const supabase = await getSupabaseClient()
    const { data: userData } = await supabase
      .from("usuarios")
      .select("telefone")
      .eq("id", auth.user.id)
      .single()

    if (!userData?.telefone) {
      return ErrorResponses.badRequest("Telefone nao cadastrado no perfil")
    }

    // Renderizar template
    let message: string
    switch (template as TemplateType) {
      case "budget_alert":
        message = budgetAlert(params as Parameters<typeof budgetAlert>[0])
        break
      case "daily_summary":
        message = dailySummary(params as Parameters<typeof dailySummary>[0])
        break
      case "goal_reached":
        message = goalReached(params as Parameters<typeof goalReached>[0])
        break
      default:
        return ErrorResponses.badRequest("Template invalido")
    }

    const sent = await sendTextMessage({ phone: userData.telefone, message })

    if (!sent) {
      return ErrorResponses.serverError("Falha ao enviar mensagem WhatsApp")
    }

    logger.action("whatsapp_sent", auth.user.id, {
      template,
    })

    return SuccessResponses.ok({ sent: true })
  } catch (error) {
    logger.error("Erro no endpoint WhatsApp", error, {
      action: "send",
      resource: "whatsapp",
    })
    return ErrorResponses.serverError("Erro ao enviar mensagem")
  }
}
