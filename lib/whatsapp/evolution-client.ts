/**
 * Evolution API Client — Story 4.1
 * Envia mensagens WhatsApp via Evolution API v2
 */

import { logger } from "@/lib/logger"

interface SendTextParams {
  phone: string // formato: 5511999999999
  message: string
}

interface EvolutionResponse {
  key?: { id: string }
  status?: string
  message?: string
}

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "dindin"

/**
 * Verifica se Evolution API está configurada
 */
export function isEvolutionConfigured(): boolean {
  return !!(EVOLUTION_API_URL && EVOLUTION_API_KEY)
}

/**
 * Envia mensagem de texto via WhatsApp (Evolution API)
 */
export async function sendTextMessage({ phone, message }: SendTextParams): Promise<boolean> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    logger.warn("Evolution API não configurada — mensagem não enviada", {
      action: "send",
      resource: "whatsapp",
    })
    return false
  }

  // Limpar número (remover +, espaços, traços)
  const cleanPhone = phone.replace(/[\s+\-()]/g, "")

  try {
    const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: cleanPhone,
        text: message,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "")
      logger.error("Evolution API retornou erro", undefined, {
        action: "send",
        resource: "whatsapp",
        status: res.status,
        body: errorBody.substring(0, 200),
      })
      return false
    }

    const data: EvolutionResponse = await res.json()

    logger.info("WhatsApp enviado com sucesso", {
      action: "send",
      resource: "whatsapp",
      messageId: data.key?.id,
      phone: `${cleanPhone.substring(0, 4)}****`,
    })

    return true
  } catch (error) {
    logger.error("Erro ao enviar WhatsApp", error, {
      action: "send",
      resource: "whatsapp",
    })
    return false
  }
}
