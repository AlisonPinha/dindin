-- Adiciona dia_fechamento na tabela contas
-- Usado para calcular automaticamente o mes_fatura de transações em cartão de crédito
-- Exemplo: fechamento dia 5 + compra dia 10 = fatura do mês seguinte

ALTER TABLE contas ADD COLUMN IF NOT EXISTS dia_fechamento INTEGER DEFAULT NULL;

-- Constraint: dia_fechamento entre 1 e 31 (quando preenchido)
ALTER TABLE contas ADD CONSTRAINT chk_dia_fechamento
  CHECK (dia_fechamento IS NULL OR (dia_fechamento >= 1 AND dia_fechamento <= 28));

COMMENT ON COLUMN contas.dia_fechamento IS 'Dia de fechamento da fatura (1-28). Apenas para CARTAO_CREDITO.';
