-- Migration: Adicionar campo mes_fatura para lógica de cartão de crédito
-- =============================================
-- CONCEITO: mes_fatura indica em qual mês a transação deve aparecer
-- - Conta Corrente/Poupança: mes_fatura = mês da transação
-- - Cartão de Crédito: mes_fatura = mês da fatura (quando será pago)
-- =============================================

-- Adicionar campo mes_fatura (primeiro dia do mês para facilitar comparações)
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS mes_fatura DATE;

-- Adicionar campo transacao_pai_id para agrupar parcelas
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS transacao_pai_id UUID REFERENCES transacoes(id);

-- Para transações existentes de contas NÃO cartão de crédito,
-- mes_fatura = primeiro dia do mês da transação
UPDATE transacoes t
SET mes_fatura = DATE_TRUNC('month', t.data)::DATE
WHERE mes_fatura IS NULL
  AND conta_id IN (
    SELECT id FROM contas WHERE tipo != 'CARTAO_CREDITO'
  );

-- Para transações de cartão existentes SEM mes_fatura definido,
-- usar o mês da transação como fallback (usuário pode ajustar depois)
UPDATE transacoes t
SET mes_fatura = DATE_TRUNC('month', t.data)::DATE
WHERE mes_fatura IS NULL;

-- Tornar mes_fatura NOT NULL após preencher dados existentes
ALTER TABLE transacoes ALTER COLUMN mes_fatura SET NOT NULL;

-- Index para busca eficiente por mês da fatura
CREATE INDEX IF NOT EXISTS idx_transacoes_mes_fatura
ON transacoes(mes_fatura);

-- Index composto para queries comuns (user + mes_fatura)
CREATE INDEX IF NOT EXISTS idx_transacoes_user_mes_fatura
ON transacoes(user_id, mes_fatura);

-- Comentários para documentação
COMMENT ON COLUMN transacoes.mes_fatura IS 'Primeiro dia do mês em que a transação aparece (para cartão = mês da fatura)';
COMMENT ON COLUMN transacoes.transacao_pai_id IS 'Referência à transação original para agrupar parcelas';

-- Atualizar estatísticas
ANALYZE transacoes;
