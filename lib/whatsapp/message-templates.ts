/**
 * WhatsApp Message Templates — Story 4.1
 * Templates de mensagens para alertas financeiros
 */

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

/**
 * Alerta de orçamento de categoria atingindo threshold
 */
export function budgetAlert(params: {
  categoryName: string
  spent: number
  budget: number
  threshold: number
}): string {
  const { categoryName, spent, budget, threshold } = params
  const percent = budget > 0 ? Math.round((spent / budget) * 100) : 0

  return [
    `*DinDin - Alerta de Orcamento*`,
    ``,
    `A categoria *${categoryName}* atingiu *${formatPercent(percent)}* do orcamento mensal.`,
    ``,
    `Gasto: ${formatCurrency(spent)}`,
    `Orcamento: ${formatCurrency(budget)}`,
    `Limite configurado: ${formatPercent(threshold)}`,
    ``,
    `_Fique de olho nos seus gastos!_`,
  ].join("\n")
}

/**
 * Resumo diário de gastos
 */
export function dailySummary(params: {
  totalToday: number
  totalMonth: number
  budgetMonth: number
}): string {
  const { totalToday, totalMonth, budgetMonth } = params
  const percentMonth = budgetMonth > 0 ? Math.round((totalMonth / budgetMonth) * 100) : 0

  return [
    `*DinDin - Resumo do Dia*`,
    ``,
    `Gastos hoje: ${formatCurrency(totalToday)}`,
    `Total do mes: ${formatCurrency(totalMonth)} (${formatPercent(percentMonth)} do orcamento)`,
    `Restante: ${formatCurrency(Math.max(0, budgetMonth - totalMonth))}`,
  ].join("\n")
}

/**
 * Alerta de meta atingida
 */
export function goalReached(params: {
  goalName: string
  targetAmount: number
}): string {
  return [
    `*DinDin - Meta Atingida!*`,
    ``,
    `Parabens! Voce atingiu a meta *${params.goalName}* de ${formatCurrency(params.targetAmount)}.`,
    ``,
    `_Continue assim!_`,
  ].join("\n")
}
