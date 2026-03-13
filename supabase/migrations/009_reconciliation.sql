-- Migration 009: Campos de rastreabilidade e tabela alertas
-- =============================================
-- Story 1.1: Adiciona origem, fatura_referencia, matched_transacao_id em transacoes
-- Cria tabela alertas para histórico e fallback dashboard
-- =============================================

-- ========== 1. ENUM PARA ORIGEM ==========

DO $$ BEGIN
  CREATE TYPE transaction_origin AS ENUM ('manual', 'quick_add', 'apple_pay', 'ocr_import');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========== 2. NOVOS CAMPOS EM TRANSACOES ==========

-- Campo origem: de onde veio a transação
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS origem transaction_origin NOT NULL DEFAULT 'manual';

-- Referência da fatura (ex: nome do PDF importado)
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS fatura_referencia TEXT;

-- Link para transação que foi matched na reconciliação
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS matched_transacao_id UUID REFERENCES transacoes(id) ON DELETE SET NULL;

-- ========== 3. ÍNDICES ==========

CREATE INDEX IF NOT EXISTS idx_transacoes_origem ON transacoes(origem);
CREATE INDEX IF NOT EXISTS idx_transacoes_matched ON transacoes(matched_transacao_id);

-- ========== 4. TABELA ALERTAS ==========

CREATE TABLE IF NOT EXISTS alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  threshold INTEGER NOT NULL,
  mensagem TEXT NOT NULL,
  canal TEXT NOT NULL DEFAULT 'whatsapp',
  enviado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== 5. RLS PARA ALERTAS ==========

ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alertas_select_policy" ON alertas;
CREATE POLICY "alertas_select_policy" ON alertas
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "alertas_insert_policy" ON alertas;
CREATE POLICY "alertas_insert_policy" ON alertas
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "alertas_update_policy" ON alertas;
CREATE POLICY "alertas_update_policy" ON alertas
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "alertas_delete_policy" ON alertas;
CREATE POLICY "alertas_delete_policy" ON alertas
  FOR DELETE USING (user_id = auth.uid());

-- ========== 6. ÍNDICES PARA ALERTAS ==========

CREATE INDEX IF NOT EXISTS idx_alertas_user ON alertas(user_id);
CREATE INDEX IF NOT EXISTS idx_alertas_user_categoria ON alertas(user_id, categoria_id);
CREATE INDEX IF NOT EXISTS idx_alertas_enviado_em ON alertas(enviado_em);

-- ========== 7. COMENTÁRIOS ==========

COMMENT ON COLUMN transacoes.origem IS 'Origem da transação: manual, quick_add, apple_pay, ocr_import';
COMMENT ON COLUMN transacoes.fatura_referencia IS 'Referência da fatura de onde a transação foi importada via OCR';
COMMENT ON COLUMN transacoes.matched_transacao_id IS 'ID da transação existente que foi matched na reconciliação';
COMMENT ON TABLE alertas IS 'Alertas de orçamento enviados via WhatsApp ou exibidos no dashboard';

-- Atualizar estatísticas
ANALYZE transacoes;
ANALYZE alertas;
