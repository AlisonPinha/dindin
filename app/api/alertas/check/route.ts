/**
 * Check Alerts Endpoint — Story 4.2
 * POST /api/alertas/check — Verifica orçamento do usuário autenticado
 */

import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { ErrorResponses, SuccessResponses } from "@/lib/api"
import { logger } from "@/lib/logger"
import { checkBudgetsForUser } from "@/lib/alerts/budget-checker"

export async function POST() {
  try {
    const auth = await getAuthenticatedUser()
    if (auth.error) return auth.error

    const alertsSent = await checkBudgetsForUser(auth.user.id)

    return SuccessResponses.ok({ alertsSent })
  } catch (error) {
    logger.error("Erro ao verificar alertas", error, {
      action: "check",
      resource: "alertas",
    })
    return ErrorResponses.serverError("Erro ao verificar alertas")
  }
}
