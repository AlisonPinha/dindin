"use client"

import { useMemo } from "react"
import { useStore } from "./use-store"
import {
  getTransacoesDoMes,
  safePercentage,
  type TransactionWithInstallment,
} from "@/lib/calculations"
import type { Category } from "@/types"

// ================================
// Types
// ================================

export interface TotaisDoMes {
  receitas: number
  despesas: number
  saldo: number
  totalTransacoes: number
}

export interface DespesasPorCategoria {
  [categoriaId: string]: {
    nome: string
    cor: string
    valor: number
    percentual: number
  }
}

export interface DespesasPorMembro {
  [membroId: string]: {
    nome: string
    avatar: string
    total: number
  }
}

export interface DespesasPorContexto {
  casa: number
  pessoal: number
}

export interface VariacaoPercentual {
  percentual: number | null
  texto: string
  tipo: "aumento" | "reducao" | "neutro"
}

export interface FluxoSemanal {
  semana: number
  inicio: number
  fim: number
  receitas: number
  despesas: number
  saldo: number
}

export interface Regra503020 {
  essenciais: {
    valor: number
    percentual: number
    meta: number
    metaPercentual: number
    status: "dentro" | "acima"
  }
  livres: {
    valor: number
    percentual: number
    meta: number
    metaPercentual: number
    status: "dentro" | "acima"
  }
  investimentos: {
    valor: number
    percentual: number
    meta: number
    metaPercentual: number
    status: "dentro" | "abaixo"
  }
  totalGasto: number
}

export interface RankingMembro {
  id: string
  nome: string
  avatar: string
  total: number
  posicao: number
}

export interface ProjecaoFimMes {
  gastosAtuais: number
  gastosProjetados: number
  gastosRestantesProjetados: number
  saldoProjetado: number
  mediaDiariaGastos: number
  diaAtual: number
  diasNoMes: number
  diasRestantes: number
  percentualGasto: number | null
  percentualGastoTexto: string
  status: "positivo" | "negativo"
}

export interface DadosDoMes {
  // Período
  mesVis: number
  anoVis: number
  mesAnterior: number
  anoAnterior: number

  // Transações filtradas
  transacoes: TransactionWithInstallment[]
  transacoesAnteriores: TransactionWithInstallment[]

  // Totais
  totais: TotaisDoMes
  totaisAnteriores: TotaisDoMes

  // Agrupamentos
  despesasPorCategoria: DespesasPorCategoria
  despesasPorMembro: DespesasPorMembro
  despesasPorContexto: DespesasPorContexto
  receitasPorCategoria: DespesasPorCategoria
  receitasPorMembro: DespesasPorMembro

  // Variações
  variacoes: {
    receitas: VariacaoPercentual
    despesas: VariacaoPercentual
    saldo: VariacaoPercentual
  }

  // Dados derivados
  fluxoSemanal: FluxoSemanal[]
  regra503020: Regra503020
  rankingMembros: RankingMembro[]
  projecao: ProjecaoFimMes

  // Funções de navegação
  navegarMes: (direcao: "anterior" | "proximo") => void
  irParaMes: (mes: number, ano: number) => void
}

// ================================
// Helper Functions
// ================================

/**
 * Calcula variação percentual de forma segura
 */
function calcularVariacaoPercentual(
  valorAtual: number,
  valorAnterior: number
): VariacaoPercentual {
  // Caso 1: Ambos zero
  if (valorAtual === 0 && valorAnterior === 0) {
    return { percentual: 0, texto: "0%", tipo: "neutro" }
  }

  // Caso 2: Valor anterior é zero
  if (valorAnterior === 0) {
    return {
      percentual: null,
      texto: valorAtual > 0 ? "Novo" : "—",
      tipo: valorAtual > 0 ? "aumento" : "neutro",
    }
  }

  // Caso 3: Cálculo normal
  const variacao = ((valorAtual - valorAnterior) / valorAnterior) * 100
  const variacaoLimitada = Math.max(-9999, Math.min(9999, variacao))

  return {
    percentual: variacaoLimitada,
    texto: `${variacao >= 0 ? "+" : ""}${variacaoLimitada.toFixed(1)}%`,
    tipo: variacao > 0 ? "aumento" : variacao < 0 ? "reducao" : "neutro",
  }
}

/**
 * Calcula totais das transações filtradas
 */
function calcularTotais(transacoes: TransactionWithInstallment[]): TotaisDoMes {
  let receitas = 0
  let despesas = 0

  transacoes.forEach((t) => {
    if (t.type === "income") {
      receitas += t.amount
    } else if (t.type === "expense") {
      despesas += t.amount
    }
  })

  return {
    receitas,
    despesas,
    saldo: receitas - despesas,
    totalTransacoes: transacoes.length,
  }
}

/**
 * Agrupa despesas por categoria
 */
function agruparPorCategoria(
  transacoes: TransactionWithInstallment[],
  tipo: "income" | "expense",
  categories: Category[],
  total: number
): DespesasPorCategoria {
  const resultado: DespesasPorCategoria = {}

  transacoes
    .filter((t) => t.type === tipo)
    .forEach((t) => {
      const categoria = categories.find((c) => c.id === t.categoryId)
      const catId = t.categoryId || "sem-categoria"
      const catNome = categoria?.name || "Sem Categoria"
      const catCor = categoria?.color || "#8E8E93"

      if (!resultado[catId]) {
        resultado[catId] = {
          nome: catNome,
          cor: catCor,
          valor: 0,
          percentual: 0,
        }
      }

      resultado[catId].valor += t.amount
    })

  // Calcula percentuais
  Object.values(resultado).forEach((cat) => {
    cat.percentual = safePercentage(cat.valor, total)
  })

  return resultado
}

/**
 * Agrupa por membro
 */
function agruparPorMembro(
  transacoes: TransactionWithInstallment[],
  tipo: "income" | "expense"
): DespesasPorMembro {
  const resultado: DespesasPorMembro = {}

  transacoes
    .filter((t) => t.type === tipo)
    .forEach((t) => {
      const membroId = t.userId || "desconhecido"
      const membroNome = t.user?.name || "Desconhecido"
      const membroAvatar = t.user?.avatar || ""

      if (!resultado[membroId]) {
        resultado[membroId] = {
          nome: membroNome,
          avatar: membroAvatar,
          total: 0,
        }
      }

      resultado[membroId].total += t.amount
    })

  return resultado
}

/**
 * Agrupa por contexto (casa/pessoal)
 */
function agruparPorContexto(
  transacoes: TransactionWithInstallment[]
): DespesasPorContexto {
  let casa = 0
  let pessoal = 0

  transacoes
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      if (t.ownership === "personal") {
        pessoal += t.amount
      } else {
        casa += t.amount
      }
    })

  return { casa, pessoal }
}

/**
 * Calcula fluxo semanal
 */
function calcularFluxoSemanal(
  transacoes: TransactionWithInstallment[],
  mes: number,
  ano: number
): FluxoSemanal[] {
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()

  const semanas: FluxoSemanal[] = [
    { semana: 1, inicio: 1, fim: 7, receitas: 0, despesas: 0, saldo: 0 },
    { semana: 2, inicio: 8, fim: 14, receitas: 0, despesas: 0, saldo: 0 },
    { semana: 3, inicio: 15, fim: 21, receitas: 0, despesas: 0, saldo: 0 },
    { semana: 4, inicio: 22, fim: diasNoMes, receitas: 0, despesas: 0, saldo: 0 },
  ]

  transacoes.forEach((t) => {
    const dataTransacao = new Date(t.date)
    const diaTransacao = dataTransacao.getDate()

    const semanaIndex = semanas.findIndex(
      (s) => diaTransacao >= s.inicio && diaTransacao <= s.fim
    )

    if (semanaIndex !== -1) {
      const semana = semanas[semanaIndex]
      if (semana) {
        if (t.type === "income") {
          semana.receitas += t.amount
        } else if (t.type === "expense") {
          semana.despesas += t.amount
        }
      }
    }
  })

  // Calcula saldo acumulado
  let saldoAcumulado = 0
  semanas.forEach((s) => {
    saldoAcumulado += s.receitas - s.despesas
    s.saldo = saldoAcumulado
  })

  return semanas
}

/**
 * Calcula regra 50/30/20
 */
function calcularRegra503020(
  transacoes: TransactionWithInstallment[],
  categories: Category[],
  receitaTotal: number
): Regra503020 {
  const base = receitaTotal > 0 ? receitaTotal : 1

  const categoriasEssenciais = ["moradia", "alimentação", "saúde", "transporte", "contas", "educação"]
  const categoriasInvestimentos = ["investimento", "renda fixa", "ações", "fundos", "cripto", "reserva"]

  let essenciais = 0
  let investimentos = 0
  let livres = 0

  transacoes
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const categoria = categories.find((c) => c.id === t.categoryId)
      const catNome = categoria?.name?.toLowerCase() || ""

      if (categoriasEssenciais.some((e) => catNome.includes(e))) {
        essenciais += t.amount
      } else if (categoriasInvestimentos.some((i) => catNome.includes(i))) {
        investimentos += t.amount
      } else {
        livres += t.amount
      }
    })

  return {
    essenciais: {
      valor: essenciais,
      percentual: safePercentage(essenciais, base),
      meta: base * 0.5,
      metaPercentual: 50,
      status: essenciais <= base * 0.5 ? "dentro" : "acima",
    },
    livres: {
      valor: livres,
      percentual: safePercentage(livres, base),
      meta: base * 0.3,
      metaPercentual: 30,
      status: livres <= base * 0.3 ? "dentro" : "acima",
    },
    investimentos: {
      valor: investimentos,
      percentual: safePercentage(investimentos, base),
      meta: base * 0.2,
      metaPercentual: 20,
      status: investimentos >= base * 0.2 ? "dentro" : "abaixo",
    },
    totalGasto: essenciais + livres + investimentos,
  }
}

/**
 * Gera ranking de membros
 */
function gerarRankingMembros(despesasPorMembro: DespesasPorMembro): RankingMembro[] {
  return Object.entries(despesasPorMembro)
    .map(([id, dados]) => ({
      id,
      nome: dados.nome,
      avatar: dados.avatar,
      total: dados.total,
      posicao: 0,
    }))
    .sort((a, b) => b.total - a.total)
    .map((membro, index) => ({
      ...membro,
      posicao: index + 1,
    }))
}

/**
 * Calcula projeção de fim de mês
 */
function calcularProjecaoFimMes(
  totais: TotaisDoMes,
  mes: number,
  ano: number
): ProjecaoFimMes {
  const hoje = new Date()
  const diaAtual = hoje.getMonth() === mes && hoje.getFullYear() === ano
    ? hoje.getDate()
    : new Date(ano, mes + 1, 0).getDate() // Se não é o mês atual, usa último dia

  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const diasRestantes = Math.max(0, diasNoMes - diaAtual)

  const mediaDiariaGastos = diaAtual > 0 ? totais.despesas / diaAtual : 0
  const gastosProjetados = mediaDiariaGastos * diasNoMes
  const gastosRestantesProjetados = mediaDiariaGastos * diasRestantes
  const saldoProjetado = totais.receitas - gastosProjetados

  const percentualGasto = totais.receitas > 0
    ? safePercentage(totais.despesas, totais.receitas)
    : null

  return {
    gastosAtuais: totais.despesas,
    gastosProjetados,
    gastosRestantesProjetados,
    saldoProjetado,
    mediaDiariaGastos,
    diaAtual,
    diasNoMes,
    diasRestantes,
    percentualGasto,
    percentualGastoTexto: percentualGasto !== null ? `${percentualGasto.toFixed(1)}%` : "—",
    status: saldoProjetado >= 0 ? "positivo" : "negativo",
  }
}

// ================================
// Main Hook
// ================================

/**
 * Hook centralizado para dados de transações do mês
 *
 * Este hook DEVE ser usado por TODOS os componentes que precisam de dados
 * de transações filtradas por mês. Isso garante consistência em todo o app.
 *
 * Exemplo de uso:
 * ```tsx
 * const { totais, transacoes, variacoes, fluxoSemanal } = useTransacoesDoMes()
 * ```
 */
export function useTransacoesDoMes(): DadosDoMes {
  const {
    transactions,
    categories,
    selectedPeriod,
    setSelectedPeriod,
  } = useStore()

  // Período atual
  const mesVis = selectedPeriod.month
  const anoVis = selectedPeriod.year

  // Período anterior
  const { mesAnterior, anoAnterior } = useMemo(() => {
    const mesAnt = mesVis === 0 ? 11 : mesVis - 1
    const anoAnt = mesVis === 0 ? anoVis - 1 : anoVis
    return { mesAnterior: mesAnt, anoAnterior: anoAnt }
  }, [mesVis, anoVis])

  // Transações filtradas do mês atual
  const transacoes = useMemo(() => {
    return getTransacoesDoMes(transactions, mesVis, anoVis)
  }, [transactions, mesVis, anoVis])

  // Transações filtradas do mês anterior
  const transacoesAnteriores = useMemo(() => {
    return getTransacoesDoMes(transactions, mesAnterior, anoAnterior)
  }, [transactions, mesAnterior, anoAnterior])

  // Totais
  const totais = useMemo(() => calcularTotais(transacoes), [transacoes])
  const totaisAnteriores = useMemo(() => calcularTotais(transacoesAnteriores), [transacoesAnteriores])

  // Agrupamentos
  const despesasPorCategoria = useMemo(
    () => agruparPorCategoria(transacoes, "expense", categories, totais.despesas),
    [transacoes, categories, totais.despesas]
  )

  const receitasPorCategoria = useMemo(
    () => agruparPorCategoria(transacoes, "income", categories, totais.receitas),
    [transacoes, categories, totais.receitas]
  )

  const despesasPorMembro = useMemo(
    () => agruparPorMembro(transacoes, "expense"),
    [transacoes]
  )

  const receitasPorMembro = useMemo(
    () => agruparPorMembro(transacoes, "income"),
    [transacoes]
  )

  const despesasPorContexto = useMemo(
    () => agruparPorContexto(transacoes),
    [transacoes]
  )

  // Variações
  const variacoes = useMemo(
    () => ({
      receitas: calcularVariacaoPercentual(totais.receitas, totaisAnteriores.receitas),
      despesas: calcularVariacaoPercentual(totais.despesas, totaisAnteriores.despesas),
      saldo: calcularVariacaoPercentual(totais.saldo, totaisAnteriores.saldo),
    }),
    [totais, totaisAnteriores]
  )

  // Dados derivados
  const fluxoSemanal = useMemo(
    () => calcularFluxoSemanal(transacoes, mesVis, anoVis),
    [transacoes, mesVis, anoVis]
  )

  const regra503020 = useMemo(
    () => calcularRegra503020(transacoes, categories, totais.receitas),
    [transacoes, categories, totais.receitas]
  )

  const rankingMembros = useMemo(
    () => gerarRankingMembros(despesasPorMembro),
    [despesasPorMembro]
  )

  const projecao = useMemo(
    () => calcularProjecaoFimMes(totais, mesVis, anoVis),
    [totais, mesVis, anoVis]
  )

  // Funções de navegação
  const navegarMes = (direcao: "anterior" | "proximo") => {
    if (direcao === "anterior") {
      if (mesVis === 0) {
        setSelectedPeriod({ month: 11, year: anoVis - 1 })
      } else {
        setSelectedPeriod({ month: mesVis - 1, year: anoVis })
      }
    } else {
      if (mesVis === 11) {
        setSelectedPeriod({ month: 0, year: anoVis + 1 })
      } else {
        setSelectedPeriod({ month: mesVis + 1, year: anoVis })
      }
    }
  }

  const irParaMes = (mes: number, ano: number) => {
    setSelectedPeriod({ month: mes, year: ano })
  }

  return {
    // Período
    mesVis,
    anoVis,
    mesAnterior,
    anoAnterior,

    // Transações
    transacoes,
    transacoesAnteriores,

    // Totais
    totais,
    totaisAnteriores,

    // Agrupamentos
    despesasPorCategoria,
    despesasPorMembro,
    despesasPorContexto,
    receitasPorCategoria,
    receitasPorMembro,

    // Variações
    variacoes,

    // Dados derivados
    fluxoSemanal,
    regra503020,
    rankingMembros,
    projecao,

    // Funções
    navegarMes,
    irParaMes,
  }
}
