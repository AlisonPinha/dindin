-- Migration 001: Schema inicial do DinDin
-- =============================================
-- Este arquivo documenta o schema esperado do banco de dados.
-- Execute apenas se as tabelas ainda não existirem.
-- =============================================

-- ========== TIPOS ENUM ==========

-- Tipo de conta
DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('CORRENTE', 'CARTAO_CREDITO', 'INVESTIMENTO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de categoria
DO $$ BEGIN
  CREATE TYPE category_type AS ENUM ('RECEITA', 'DESPESA', 'INVESTIMENTO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Grupo de categoria (50/30/20)
DO $$ BEGIN
  CREATE TYPE category_group AS ENUM ('ESSENCIAL', 'LIVRE', 'INVESTIMENTO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de transação
DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('ENTRADA', 'SAIDA', 'TRANSFERENCIA', 'INVESTIMENTO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de investimento
DO $$ BEGIN
  CREATE TYPE investment_type AS ENUM ('RENDA_FIXA', 'RENDA_VARIAVEL', 'CRIPTO', 'FUNDO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de meta
DO $$ BEGIN
  CREATE TYPE goal_type AS ENUM ('ECONOMIA_CATEGORIA', 'INVESTIMENTO_MENSAL', 'PATRIMONIO', 'REGRA_PERCENTUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de ownership
DO $$ BEGIN
  CREATE TYPE ownership_type AS ENUM ('CASA', 'PESSOAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========== TABELA USUARIOS ==========
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  avatar VARCHAR(500),
  is_onboarded BOOLEAN DEFAULT FALSE,
  renda_mensal DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== TABELA CATEGORIAS ==========
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'DESPESA',
  cor VARCHAR(20) NOT NULL DEFAULT '#6366f1',
  icone VARCHAR(50),
  grupo VARCHAR(20) NOT NULL DEFAULT 'LIVRE',
  orcamento_mensal DECIMAL(15, 2),
  user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== TABELA CONTAS ==========
CREATE TABLE IF NOT EXISTS contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'CORRENTE',
  banco VARCHAR(100),
  saldo DECIMAL(15, 2) NOT NULL DEFAULT 0,
  cor VARCHAR(20) DEFAULT '#6366f1',
  icone VARCHAR(50),
  ativo BOOLEAN DEFAULT TRUE,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== TABELA TRANSACOES ==========
CREATE TABLE IF NOT EXISTS transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'SAIDA',
  data DATE NOT NULL,
  mes_fatura DATE NOT NULL, -- Primeiro dia do mês da fatura (YYYY-MM-01)
  recorrente BOOLEAN DEFAULT FALSE,
  parcelas INTEGER,
  parcela_atual INTEGER,
  transacao_pai_id UUID REFERENCES transacoes(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  anexo_url VARCHAR(500),
  notas TEXT,
  ownership VARCHAR(20) NOT NULL DEFAULT 'CASA',
  category_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  account_id UUID REFERENCES contas(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== TABELA INVESTIMENTOS ==========
CREATE TABLE IF NOT EXISTS investimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'RENDA_FIXA',
  instituicao VARCHAR(100),
  preco_compra DECIMAL(15, 2) NOT NULL,
  preco_atual DECIMAL(15, 2) NOT NULL,
  rentabilidade DECIMAL(10, 4) DEFAULT 0,
  data_compra DATE NOT NULL,
  data_vencimento DATE,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== TABELA METAS ==========
CREATE TABLE IF NOT EXISTS metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(30) NOT NULL DEFAULT 'ECONOMIA_CATEGORIA',
  valor_alvo DECIMAL(15, 2) NOT NULL,
  valor_atual DECIMAL(15, 2) DEFAULT 0,
  prazo DATE,
  ativo BOOLEAN DEFAULT TRUE,
  category_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== TABELA ORCAMENTOS ==========
CREATE TABLE IF NOT EXISTS orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_ano VARCHAR(7) NOT NULL, -- YYYY-MM
  projetado_50 DECIMAL(15, 2) DEFAULT 0, -- Essenciais
  projetado_30 DECIMAL(15, 2) DEFAULT 0, -- Lifestyle
  projetado_20 DECIMAL(15, 2) DEFAULT 0, -- Investimentos
  realizado_50 DECIMAL(15, 2) DEFAULT 0,
  realizado_30 DECIMAL(15, 2) DEFAULT 0,
  realizado_20 DECIMAL(15, 2) DEFAULT 0,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, mes_ano)
);

-- ========== TRIGGERS PARA UPDATED_AT ==========
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('usuarios', 'categorias', 'contas', 'transacoes', 'investimentos', 'metas', 'orcamentos')
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END $$;

-- ========== RLS (Row Level Security) ==========
-- Habilitar RLS em todas as tabelas com user_id
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE investimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios (próprio usuário ou service role)
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON usuarios
  FOR UPDATE USING (auth.uid() = id);

-- Políticas genéricas para tabelas com user_id
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('categorias', 'contas', 'transacoes', 'investimentos', 'metas', 'orcamentos')
  LOOP
    -- Select: próprio usuário ou categorias do sistema (user_id IS NULL)
    EXECUTE format('
      DROP POLICY IF EXISTS "%I_select_policy" ON %I;
      CREATE POLICY "%I_select_policy" ON %I
        FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
    ', t, t, t, t);

    -- Insert: próprio usuário
    EXECUTE format('
      DROP POLICY IF EXISTS "%I_insert_policy" ON %I;
      CREATE POLICY "%I_insert_policy" ON %I
        FOR INSERT WITH CHECK (user_id = auth.uid());
    ', t, t, t, t);

    -- Update: próprio usuário
    EXECUTE format('
      DROP POLICY IF EXISTS "%I_update_policy" ON %I;
      CREATE POLICY "%I_update_policy" ON %I
        FOR UPDATE USING (user_id = auth.uid());
    ', t, t, t, t);

    -- Delete: próprio usuário
    EXECUTE format('
      DROP POLICY IF EXISTS "%I_delete_policy" ON %I;
      CREATE POLICY "%I_delete_policy" ON %I
        FOR DELETE USING (user_id = auth.uid());
    ', t, t, t, t);
  END LOOP;
END $$;

-- ========== COMENTÁRIOS ==========
COMMENT ON TABLE usuarios IS 'Usuários do sistema';
COMMENT ON TABLE categorias IS 'Categorias de receitas e despesas';
COMMENT ON TABLE contas IS 'Contas bancárias e cartões';
COMMENT ON TABLE transacoes IS 'Transações financeiras';
COMMENT ON TABLE investimentos IS 'Investimentos do usuário';
COMMENT ON TABLE metas IS 'Metas financeiras';
COMMENT ON TABLE orcamentos IS 'Orçamentos mensais (regra 50/30/20)';

COMMENT ON COLUMN transacoes.mes_fatura IS 'Primeiro dia do mês em que a transação aparece (para cartão = mês da fatura)';
COMMENT ON COLUMN transacoes.ownership IS 'CASA = despesa da casa, PESSOAL = despesa pessoal';
COMMENT ON COLUMN categorias.grupo IS 'Grupo para regra 50/30/20: ESSENCIAL, LIVRE, INVESTIMENTO';
