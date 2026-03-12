export interface ChallengeTemplate {
  id: string
  name: string
  description: string
  type: string // DB type: SEMANAL, MENSAL, ANUAL, CUSTOM
  durationDays: number
  suggestedTarget?: number
  icon: string
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: "sem-delivery",
    name: "Semana sem delivery",
    description: "Passe uma semana inteira sem pedir delivery. Cozinhem juntos!",
    type: "SEMANAL",
    durationDays: 7,
    icon: "utensils",
  },
  {
    id: "investimento-extra",
    name: "Mês do investimento extra",
    description: "Invistam um valor extra além do habitual neste mês.",
    type: "MENSAL",
    durationDays: 30,
    suggestedTarget: 500,
    icon: "trending-up",
  },
  {
    id: "52-semanas",
    name: "Desafio 52 semanas",
    description: "Economizem R$1 na semana 1, R$2 na semana 2... R$52 na semana 52. Total: R$1.378!",
    type: "ANUAL",
    durationDays: 365,
    suggestedTarget: 1378,
    icon: "calendar",
  },
  {
    id: "sem-cartao",
    name: "Mês sem cartão de crédito",
    description: "Usem apenas dinheiro/débito por um mês inteiro.",
    type: "MENSAL",
    durationDays: 30,
    icon: "credit-card",
  },
  {
    id: "economizar-10",
    name: "Economizar 10% a mais",
    description: "Economizem 10% a mais do que o mês anterior.",
    type: "MENSAL",
    durationDays: 30,
    icon: "piggy-bank",
  },
]
