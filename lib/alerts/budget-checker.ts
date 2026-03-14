/**
 * Budget Checker — Story 4.2
 * Verifica orçamentos de todas as categorias de um usuário e dispara alertas
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { sendTextMessage, isEvolutionConfigured } from "@/lib/whatsapp/evolution-client"
import { budgetAlert } from "@/lib/whatsapp/message-templates"

/**
 * Cria Supabase client com service role key (bypass RLS)
 * Lança erro se env vars não estão configuradas
 */
function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para o budget checker")
  }

  return createClient(url, key)
}

/**
 * Executa verificação de orçamento para um usuário específico
 * Retorna número de alertas enviados
 */
export async function checkBudgetsForUser(userId: string): Promise<number> {
  const supabase = getServiceClient()
  let alertsSent = 0

  // 1. Buscar categorias com orçamento definido
  const { data: categories } = await supabase
    .from("categorias")
    .select("id, nome, orcamento_mensal")
    .eq("user_id", userId)
    .not("orcamento_mensal", "is", null)
    .gt("orcamento_mensal", 0)

  if (!categories || categories.length === 0) return 0

  // 2. Período do mês atual
  const now = new Date()
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`

  // Buscar telefone do usuário uma vez (fora do loop)
  let userPhone: string | null = null
  if (isEvolutionConfigured()) {
    const { data: userData } = await supabase
      .from("usuarios")
      .select("telefone")
      .eq("id", userId)
      .single()
    userPhone = userData?.telefone || null
  }

  // 3. Para cada categoria, somar gastos do mês
  for (const cat of categories) {
    const { data: sumResult } = await supabase
      .from("transacoes")
      .select("valor")
      .eq("user_id", userId)
      .eq("category_id", cat.id)
      .eq("mes_fatura", mesAtual)
      .in("tipo", ["SAIDA", "INVESTIMENTO"])

    const totalSpent = (sumResult || []).reduce((sum, t) => sum + t.valor, 0)
    const budget = cat.orcamento_mensal as number
    if (budget <= 0) continue
    const percent = (totalSpent / budget) * 100

    // 4. Verificar thresholds configurados pelo usuário
    const { data: alertConfigs } = await supabase
      .from("alertas")
      .select("id, threshold, canal")
      .eq("user_id", userId)
      .eq("categoria_id", cat.id)

    if (!alertConfigs || alertConfigs.length === 0) continue

    for (const config of alertConfigs) {
      if (percent < config.threshold) continue

      // Verificar se já registrou alerta para este threshold neste mês
      // Busca na tabela alertas por combinação user + categoria + threshold + mês
      const { data: existing } = await supabase
        .from("alertas")
        .select("id")
        .eq("user_id", userId)
        .eq("categoria_id", cat.id)
        .eq("threshold", config.threshold)
        .gte("enviado_em", mesAtual)
        .not("mensagem", "eq", "")
        .limit(1)

      if (existing && existing.length > 0) continue

      // 5. Enviar alerta
      const message = budgetAlert({
        categoryName: cat.nome,
        spent: totalSpent,
        budget,
        threshold: config.threshold,
      })

      if (config.canal === "whatsapp" && isEvolutionConfigured() && userPhone) {
        const sent = await sendTextMessage({ phone: userPhone, message })
        if (sent) alertsSent++
      }

      // 6. Registrar alerta enviado no banco
      await supabase.from("alertas").insert({
        user_id: userId,
        categoria_id: cat.id,
        threshold: config.threshold,
        mensagem: message,
        canal: config.canal || "dashboard",
        enviado_em: new Date().toISOString(),
      })

      alertsSent++
    }
  }

  return alertsSent
}

/**
 * Executa verificação para TODOS os usuários
 * Usado pelo cron job
 */
export async function checkAllUsersBudgets(): Promise<{ usersChecked: number; alertsSent: number }> {
  const supabase = getServiceClient()

  // Buscar todos os usuários ativos
  const { data: users } = await supabase
    .from("usuarios")
    .select("id")
    .eq("is_onboarded", true)

  if (!users || users.length === 0) {
    return { usersChecked: 0, alertsSent: 0 }
  }

  let totalAlerts = 0

  for (const user of users) {
    try {
      const alerts = await checkBudgetsForUser(user.id)
      totalAlerts += alerts
    } catch (error) {
      logger.error(`Erro ao verificar orçamento do usuário ${user.id}`, error, {
        action: "check-budget",
        resource: "alerts",
      })
    }
  }

  logger.info("Verificação de orçamentos concluída", {
    usersChecked: users.length,
    alertsSent: totalAlerts,
  })

  return { usersChecked: users.length, alertsSent: totalAlerts }
}
