import { createBrowserClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

// ===========================================
// Database Types (matching Prisma schema)
// ===========================================

export type DbAccountType = "CORRENTE" | "CARTAO_CREDITO" | "INVESTIMENTO"
export type DbCategoryType = "RECEITA" | "DESPESA" | "INVESTIMENTO"
export type DbCategoryGroup = "ESSENCIAL" | "INVESTIMENTO" | "LIVRE"
export type DbTransactionType = "ENTRADA" | "SAIDA" | "TRANSFERENCIA" | "INVESTIMENTO"
export type DbInvestmentType = "RENDA_FIXA" | "RENDA_VARIAVEL" | "CRIPTO" | "FUNDO"
export type DbGoalType = "ECONOMIA_CATEGORIA" | "INVESTIMENTO_MENSAL" | "PATRIMONIO" | "REGRA_PERCENTUAL"
export type DbOwnershipType = "CASA" | "PESSOAL"

export interface DbUser {
  id: string
  nome: string
  email: string
  avatar: string | null
  is_onboarded: boolean
  renda_mensal: number | null
  created_at: string
  updated_at: string
}

export interface DbAccount {
  id: string
  nome: string
  tipo: DbAccountType
  banco: string | null
  saldo: number
  cor: string | null
  icone: string | null
  ativo: boolean
  user_id: string
  created_at: string
  updated_at: string
  // Campo calculado retornado pela API
  saldoAtual?: number
}

export interface DbCategory {
  id: string
  nome: string
  tipo: DbCategoryType
  cor: string
  icone: string | null
  grupo: DbCategoryGroup
  limite_mensal: number | null // Campo real no banco
  orcamento_mensal?: number | null // Alias legado
  created_at: string
  updated_at: string
}

export interface DbTransaction {
  id: string
  descricao: string
  valor: number
  tipo: DbTransactionType
  data: string
  mes_fatura: string // Primeiro dia do mês da fatura (YYYY-MM-01)
  recorrente: boolean
  parcelas: number | null
  parcela_atual: number | null
  transacao_pai_id: string | null
  tags: string[]
  anexo_url: string | null
  notas: string | null
  ownership: DbOwnershipType
  category_id: string | null
  account_id: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface DbInvestment {
  id: string
  nome: string
  tipo: DbInvestmentType
  instituicao: string | null
  preco_compra: number
  preco_atual: number
  rentabilidade: number
  data_compra: string
  data_vencimento: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface DbGoal {
  id: string
  nome: string
  tipo: DbGoalType
  valor_alvo: number
  valor_atual: number
  prazo: string | null
  ativo: boolean
  category_id: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface DbBudget {
  id: string
  mes_ano: string
  projetado_50: number
  projetado_30: number
  projetado_20: number
  realizado_50: number
  realizado_30: number
  realizado_20: number
  user_id: string
  created_at: string
  updated_at: string
}

// ===========================================
// Environment Variables
// ===========================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ===========================================
// Browser Client (Client Components)
// ===========================================

/**
 * Creates a Supabase client for use in browser/client components
 * Uses the anon key and handles auth state automatically
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// ===========================================
// Server Client (Server Components, API Routes)
// ===========================================

/**
 * Creates a Supabase client for use in server components and API routes
 * This client respects RLS policies and uses the anon key
 */
export function createSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ===========================================
// Admin Client (Server-side only, bypasses RLS)
// ===========================================

/**
 * Creates an admin Supabase client that bypasses RLS
 * ONLY use this on the server for administrative tasks
 * NEVER expose this client to the browser
 */
export function createSupabaseAdminClient() {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ===========================================
// Server Action Client
// ===========================================

/**
 * Creates a Supabase client for use in Server Actions
 * Handles cookie-based auth for server actions
 */
export function createSupabaseServerActionClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ===========================================
// Singleton instance for simple use cases
// ===========================================

let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null

/**
 * Get a singleton instance of the browser client
 * Useful for simple use cases where you don't need a new client each time
 */
export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowserClient can only be used in browser environment")
  }

  if (!browserClient) {
    browserClient = createSupabaseBrowserClient()
  }

  return browserClient
}

// ===========================================
// Type exports
// ===========================================

export type { User as SupabaseUser, Session as SupabaseSession } from "@supabase/auth-js"
