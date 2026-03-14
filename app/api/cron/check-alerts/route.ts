/**
 * Cron Job — Verificar Alertas de Orçamento — Story 4.2
 * GET /api/cron/check-alerts
 * Executado diariamente às 9h BRT (12h UTC) via Vercel Cron
 */

import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { checkAllUsersBudgets } from "@/lib/alerts/budget-checker"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  // Verificar authorization header (Vercel Cron envia CRON_SECRET)
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  // CRON_SECRET obrigatório — sem ele, negar acesso
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await checkAllUsersBudgets()

    logger.info("Cron check-alerts executado", result)

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Erro no cron check-alerts", error, {
      action: "cron",
      resource: "alertas",
    })
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
