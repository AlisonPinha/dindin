-- ============================================
-- FamFinance - Row Level Security (RLS)
-- ============================================
-- Execute este script no Supabase Dashboard > SQL Editor
-- ============================================

-- ============================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Investment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Budget" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. POLICIES PARA SERVICE_ROLE (PRISMA/BACKEND)
-- ============================================
-- O service_role bypassa RLS por padrão no Supabase,
-- mas é boa prática criar policies explícitas

-- User
CREATE POLICY "Service role full access on User" ON "User"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Account
CREATE POLICY "Service role full access on Account" ON "Account"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Category
CREATE POLICY "Service role full access on Category" ON "Category"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Transaction
CREATE POLICY "Service role full access on Transaction" ON "Transaction"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Investment
CREATE POLICY "Service role full access on Investment" ON "Investment"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Goal
CREATE POLICY "Service role full access on Goal" ON "Goal"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Budget
CREATE POLICY "Service role full access on Budget" ON "Budget"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 3. POLICIES PARA USUÁRIOS AUTENTICADOS
-- ============================================
-- Use estas policies quando implementar Supabase Auth

-- User: usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (auth.uid()::text = id);

-- Account: usuários podem gerenciar suas próprias contas
CREATE POLICY "Users can view own accounts" ON "Account"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own accounts" ON "Account"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own accounts" ON "Account"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own accounts" ON "Account"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Category: categorias são públicas (compartilhadas)
CREATE POLICY "Anyone can view categories" ON "Category"
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert categories" ON "Category"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update categories" ON "Category"
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Transaction: usuários podem gerenciar suas próprias transações
CREATE POLICY "Users can view own transactions" ON "Transaction"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own transactions" ON "Transaction"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own transactions" ON "Transaction"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own transactions" ON "Transaction"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Investment: usuários podem gerenciar seus próprios investimentos
CREATE POLICY "Users can view own investments" ON "Investment"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own investments" ON "Investment"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own investments" ON "Investment"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own investments" ON "Investment"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Goal: usuários podem gerenciar suas próprias metas
CREATE POLICY "Users can view own goals" ON "Goal"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own goals" ON "Goal"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own goals" ON "Goal"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own goals" ON "Goal"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Budget: usuários podem gerenciar seus próprios orçamentos
CREATE POLICY "Users can view own budgets" ON "Budget"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own budgets" ON "Budget"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own budgets" ON "Budget"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own budgets" ON "Budget"
  FOR DELETE USING (auth.uid()::text = "userId");

-- ============================================
-- 4. ÍNDICES PARA PERFORMANCE
-- ============================================
-- Os índices já estão definidos no schema.prisma, mas
-- caso precise adicionar manualmente:

-- CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
-- CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction"("userId");
-- CREATE INDEX IF NOT EXISTS "Transaction_categoryId_idx" ON "Transaction"("categoryId");
-- CREATE INDEX IF NOT EXISTS "Transaction_accountId_idx" ON "Transaction"("accountId");
-- CREATE INDEX IF NOT EXISTS "Transaction_data_idx" ON "Transaction"("data");
-- CREATE INDEX IF NOT EXISTS "Investment_userId_idx" ON "Investment"("userId");
-- CREATE INDEX IF NOT EXISTS "Goal_userId_idx" ON "Goal"("userId");
-- CREATE INDEX IF NOT EXISTS "Budget_userId_idx" ON "Budget"("userId");
