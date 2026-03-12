-- Migration 008: Security & integrity fixes
-- =============================================
-- Fixes: RLS, foreign keys, triggers, constraints, and broken indexes
-- =============================================

-- ========== 1. ENABLE RLS ON patrimonio_snapshots AND desafios ==========

ALTER TABLE patrimonio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE desafios ENABLE ROW LEVEL SECURITY;

-- RLS policies for patrimonio_snapshots
DROP POLICY IF EXISTS "patrimonio_snapshots_select_policy" ON patrimonio_snapshots;
CREATE POLICY "patrimonio_snapshots_select_policy" ON patrimonio_snapshots
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "patrimonio_snapshots_insert_policy" ON patrimonio_snapshots;
CREATE POLICY "patrimonio_snapshots_insert_policy" ON patrimonio_snapshots
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "patrimonio_snapshots_update_policy" ON patrimonio_snapshots;
CREATE POLICY "patrimonio_snapshots_update_policy" ON patrimonio_snapshots
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "patrimonio_snapshots_delete_policy" ON patrimonio_snapshots;
CREATE POLICY "patrimonio_snapshots_delete_policy" ON patrimonio_snapshots
  FOR DELETE USING (user_id = auth.uid());

-- RLS policies for desafios
DROP POLICY IF EXISTS "desafios_select_policy" ON desafios;
CREATE POLICY "desafios_select_policy" ON desafios
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "desafios_insert_policy" ON desafios;
CREATE POLICY "desafios_insert_policy" ON desafios
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "desafios_update_policy" ON desafios;
CREATE POLICY "desafios_update_policy" ON desafios
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "desafios_delete_policy" ON desafios;
CREATE POLICY "desafios_delete_policy" ON desafios
  FOR DELETE USING (user_id = auth.uid());

-- ========== 2. ADD FOREIGN KEY CONSTRAINTS ==========
-- patrimonio_snapshots and desafios are missing FK to usuarios(id)

ALTER TABLE patrimonio_snapshots
  ADD CONSTRAINT fk_patrimonio_snapshots_user
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE desafios
  ADD CONSTRAINT fk_desafios_user
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- ========== 3. ADD updated_at TRIGGERS ==========
-- patrimonio_snapshots needs updated_at column first (missing from 006)

ALTER TABLE patrimonio_snapshots ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Reuse update_updated_at_column() from migration 001
DROP TRIGGER IF EXISTS update_patrimonio_snapshots_updated_at ON patrimonio_snapshots;
CREATE TRIGGER update_patrimonio_snapshots_updated_at
  BEFORE UPDATE ON patrimonio_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_desafios_updated_at ON desafios;
CREATE TRIGGER update_desafios_updated_at
  BEFORE UPDATE ON desafios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========== 4. FIX dia_fechamento CONSTRAINT (1-31 instead of 1-28) ==========
-- Some months have 29, 30, or 31 days

ALTER TABLE contas DROP CONSTRAINT IF EXISTS chk_dia_fechamento;
ALTER TABLE contas ADD CONSTRAINT chk_dia_fechamento
  CHECK (dia_fechamento IS NULL OR (dia_fechamento >= 1 AND dia_fechamento <= 31));

COMMENT ON COLUMN contas.dia_fechamento IS 'Dia de fechamento da fatura (1-31). Apenas para CARTAO_CREDITO.';

-- ========== 5. ADD MISSING INDEXES for patrimonio_snapshots and desafios ==========

CREATE INDEX IF NOT EXISTS idx_patrimonio_snapshots_user
  ON patrimonio_snapshots(user_id);

-- idx_patrimonio_snapshots_user_mes already exists from 006, recreate with IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_patrimonio_snapshots_user_mes
  ON patrimonio_snapshots(user_id, mes_ano);

CREATE INDEX IF NOT EXISTS idx_desafios_user
  ON desafios(user_id);

-- idx_desafios_user_status already exists from 007, recreate with IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_desafios_user_status
  ON desafios(user_id, status);

-- ========== 6. FIX BROKEN INDEXES FROM MIGRATION 002 ==========
-- These indexes reference columns that don't exist in the schema

-- idx_transacoes_categoria uses categoria_id but column is category_id
DROP INDEX IF EXISTS idx_transacoes_categoria;
CREATE INDEX IF NOT EXISTS idx_transacoes_categoria
  ON transacoes(category_id);

-- idx_transacoes_conta uses conta_id but column is account_id
DROP INDEX IF EXISTS idx_transacoes_conta;
CREATE INDEX IF NOT EXISTS idx_transacoes_conta
  ON transacoes(account_id);

-- idx_transacoes_user_mes_ano uses mes_ano but column is mes_fatura
DROP INDEX IF EXISTS idx_transacoes_user_mes_ano;
CREATE INDEX IF NOT EXISTS idx_transacoes_user_mes_ano
  ON transacoes(user_id, mes_fatura);

-- idx_metas_user_status references status column which doesn't exist in metas
DROP INDEX IF EXISTS idx_metas_user_status;

-- idx_usuarios_auth_id references auth_id column which doesn't exist in usuarios
DROP INDEX IF EXISTS idx_usuarios_auth_id;

-- Update statistics on affected tables
ANALYZE patrimonio_snapshots;
ANALYZE desafios;
ANALYZE transacoes;
ANALYZE contas;
ANALYZE metas;
ANALYZE usuarios;
