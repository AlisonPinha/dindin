CREATE TABLE patrimonio_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mes_ano DATE NOT NULL,
  saldo_contas NUMERIC(15,2) DEFAULT 0,
  saldo_investimentos NUMERIC(15,2) DEFAULT 0,
  dividas NUMERIC(15,2) DEFAULT 0,
  patrimonio_liquido NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mes_ano)
);

CREATE INDEX idx_patrimonio_snapshots_user_mes ON patrimonio_snapshots(user_id, mes_ano);
