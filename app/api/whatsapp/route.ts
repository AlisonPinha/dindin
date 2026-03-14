/**
 * WhatsApp Send Endpoint — Story 4.1
 * POST /api/whatsapp/send — Envia mensagem WhatsApp via Evolution API
 */

import { NextRequest } from "next/server"
import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { ErrorResponses, SuccessResponses } from "@/lib/api"
import { logger } from "@/lib/logger"
import { sendTextMessage, isEvolutionConfigured } from "@/lib/whatsapp/evolution-client"

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (auth.error) return auth.error

    if (!isEvolutionConfigured()) {
      return ErrorResponses.serverError("Servico WhatsApp nao configurado")
    }

    const body = await request.json()
    const { phone, message } = body as { phone?: string; message?: string }

    if (!phone?.trim()) {
      return ErrorResponses.badRequest("Numero de telefone e obrigatorio")
    }

    if (!message?.trim()) {
      return ErrorResponses.badRequest("Mensagem e obrigatoria")
    }

    const sent = await sendTextMessage({ phone, message })

    if (!sent) {
      return ErrorResponses.serverError("Falha ao enviar mensagem WhatsApp")
    }

    logger.action("whatsapp_sent", auth.user.id, {
      phone: `${phone.substring(0, 4)}****`,
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
