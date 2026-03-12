CREATE TABLE desafios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL,
  template VARCHAR(100),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  meta_valor NUMERIC(15,2),
  valor_atual NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ATIVO',
  streak_conjunto INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_desafios_user_status ON desafios(user_id, status);
