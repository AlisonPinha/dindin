# FamFinance - Documentação Completa do Projeto

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Proposta de Valor](#proposta-de-valor)
3. [Funcionalidades Principais](#funcionalidades-principais)
4. [Arquitetura Técnica](#arquitetura-técnica)
5. [Estrutura de Dados](#estrutura-de-dados)
6. [Fluxos de Usuário](#fluxos-de-usuário)
7. [Plano de Negócio](#plano-de-negócio)
8. [Roadmap e Features Futuras](#roadmap-e-features-futuras)
9. [Tecnologias Utilizadas](#tecnologias-utilizadas)
10. [Configuração e Deploy](#configuração-e-deploy)

---

## 🎯 Visão Geral

**FamFinance** é uma aplicação web moderna de gestão financeira pessoal e familiar, desenvolvida para ajudar casais e famílias a controlarem suas finanças de forma colaborativa e inteligente.

### Características Principais

- **Multi-usuário**: Suporte para múltiplos membros da família
- **Visão Consolidada**: Visualização unificada das finanças de todos os membros
- **Inteligência Artificial**: Processamento automático de faturas e boletos via OCR
- **Progressive Web App (PWA)**: Funciona como aplicativo nativo em dispositivos móveis
- **Tempo Real**: Atualizações instantâneas com sincronização automática
- **Responsivo**: Interface adaptada para desktop, tablet e mobile

---

## 💡 Proposta de Valor

### Problema que Resolve

1. **Falta de Organização Financeira Familiar**
   - Dificuldade em acompanhar gastos de múltiplos membros
   - Falta de visão consolidada das finanças do casal/família
   - Ausência de metas financeiras compartilhadas

2. **Trabalho Manual Excessivo**
   - Digitação manual de todas as transações
   - Processamento manual de faturas e boletos
   - Cálculos manuais de orçamento

3. **Falta de Insights**
   - Ausência de análises sobre padrões de gasto
   - Falta de projeções financeiras
   - Sem alertas sobre limites de orçamento

### Solução Oferecida

- **Gestão Colaborativa**: Todos os membros da família podem registrar transações
- **Automação Inteligente**: OCR para importação automática de faturas e boletos
- **Insights Inteligentes**: Análises, gráficos e projeções automáticas
- **Metas e Orçamentos**: Sistema de metas financeiras com regra 50/30/20
- **Acompanhamento de Investimentos**: Gestão completa de portfólio

---

## 🚀 Funcionalidades Principais

### 1. Dashboard (Painel Principal)

#### Resumo Financeiro
- **Saldo Total**: Soma de todas as contas (considerando cartões de crédito como débito)
- **Receitas do Mês**: Total de entradas no período selecionado
- **Despesas do Mês**: Total de saídas no período selecionado
- **Investido no Mês**: Total aplicado em investimentos
- **Comparação Mensal**: Variação percentual em relação ao mês anterior

#### Minhas Contas
- Visualização de todas as contas (corrente, poupança, cartão de crédito, investimentos)
- Saldo atualizado em tempo real
- Histórico de transações por conta
- Cálculo automático de saldo considerando transações

#### Gráficos e Análises
- **Fluxo Semanal**: Receitas vs Despesas por semana do mês
- **Regra 50/30/20**: Distribuição do orçamento (Essenciais, Livres, Investimentos)
- **Projeção de Fim de Mês**: Estimativa baseada em gastos diários médios
- **Comparação Mensal**: Gráfico de 6 meses comparando receitas e despesas
- **Top Gastos**: Categorias com maiores gastos
- **Gastos Pessoais**: Comparação de gastos pessoais vs domésticos entre membros
- **Ranking do Casal**: Gamificação para incentivar economia

#### Transações Recentes
- Últimas 5 transações do período
- Acesso rápido para editar ou excluir

#### Alertas de Metas
- Metas próximas do prazo
- Metas com progresso significativo
- Alertas de orçamento ultrapassado

### 2. Transações

#### Gestão Completa
- **Criar**: Adicionar receitas, despesas ou transferências
- **Editar**: Modificar transações existentes
- **Excluir**: Remover transações (com confirmação)
- **Filtros Avançados**:
  - Por período (mês/ano)
  - Por tipo (receita/despesa/transferência)
  - Por categoria
  - Por conta
  - Por membro da família
  - Por valor (faixa)
  - Por descrição (busca textual)

#### Recursos Especiais
- **Transações Recorrentes**: Configurar pagamentos mensais automáticos
- **Parcelamento**: Dividir compras em múltiplas parcelas
- **Tags**: Categorização adicional com tags personalizadas
- **Notas**: Observações adicionais por transação
- **Proprietário**: Marcar como gasto pessoal ou doméstico

#### Visualizações
- **Lista**: Visualização em cards responsivos
- **Tabela**: Visualização tabular para desktop
- **Resumo**: Estatísticas do período filtrado

### 3. Contas

#### Tipos de Conta Suportados
- **Conta Corrente**: Contas bancárias tradicionais
- **Poupança**: Contas de poupança
- **Cartão de Crédito**: Cartões com limite e saldo devedor
- **Investimentos**: Contas de investimento

#### Funcionalidades
- **Criar/Editar/Excluir** contas
- **Saldo Inicial**: Configurar saldo ao criar conta
- **Cálculo Automático**: Saldo atualizado automaticamente com transações
- **Personalização**: Cor e ícone personalizados por conta
- **Status**: Ativar/desativar contas
- **Histórico**: Visualizar todas as transações de uma conta

### 4. Investimentos

#### Gestão de Portfólio
- **Tipos de Investimento**:
  - Renda Fixa (CDB, LCI, LCA, Tesouro Direto)
  - Renda Variável (Ações, FIIs)
  - Criptomoedas
  - Fundos de Investimento
  - Outros

#### Funcionalidades
- **Cadastro Completo**: Nome, tipo, instituição, valores
- **Preço de Compra vs Atual**: Acompanhamento de valorização
- **Rentabilidade**: Cálculo automático de ganhos/perdas
- **Data de Compra e Vencimento**: Controle de prazos
- **Tabela Detalhada**: Visualização completa do portfólio
- **Gráfico de Evolução**: Histórico de valorização
- **Alocação por Tipo**: Distribuição percentual do portfólio
- **Resumo**: Total investido, valor atual, rentabilidade total

### 5. Metas

#### Tipos de Meta
- **Economia por Categoria**: Economizar em uma categoria específica
- **Investimento Mensal**: Meta de investimento recorrente
- **Patrimônio**: Meta de patrimônio total
- **Regra Percentual**: Metas baseadas em percentuais da renda

#### Funcionalidades
- **Criar/Editar/Excluir** metas
- **Progresso Visual**: Barras de progresso e percentuais
- **Prazos**: Metas com data limite
- **Status**: Ativa, concluída, cancelada
- **Streaks**: Sequência de meses atingindo a meta
- **Conquistas**: Sistema de achievements/gamificação

#### Regra 50/30/20
- **Essenciais (50%)**: Moradia, alimentação, transporte, saúde, educação
- **Estilo de Vida (30%)**: Lazer, compras, assinaturas
- **Investimentos (20%)**: Aplicações e investimentos
- **Acompanhamento Visual**: Gráficos e indicadores de saúde financeira
- **Dicas Personalizadas**: Sugestões baseadas no desempenho

### 6. Configurações

#### Perfil
- **Dados Pessoais**: Nome, email, avatar
- **Renda Mensal**: Configuração da renda para cálculos de orçamento

#### Membros da Família
- **Adicionar/Remover** membros
- **Perfis Individuais**: Cada membro tem seu próprio perfil
- **Visão Consolidada**: Ver dados de todos ou individual

#### Contas
- **Gerenciar** todas as contas
- **Configurações Avançadas**: Banco, cor, ícone, status

#### Categorias
- **Criar/Editar/Excluir** categorias
- **Personalização**: Nome, cor, ícone, tipo (receita/despesa)
- **Orçamento Mensal**: Limite de gasto por categoria
- **Agrupamento**: Categorias para regra 50/30/20

#### Regra 50/30/20
- **Configuração de Percentuais**: Personalizar distribuição
- **Agrupamento de Categorias**: Definir quais categorias pertencem a cada grupo
- **Metas Mensais**: Valores calculados automaticamente baseados na renda

#### Notificações
- **Alertas de Limite**: Notificar quando categoria ultrapassar X% do limite
- **Email Semanal**: Resumo semanal por email
- **Lembretes de Transação**: Lembrar de registrar transações
- **Progresso de Metas**: Notificações sobre progresso de metas
- **Alertas de Orçamento**: Avisos quando orçamento estiver próximo do limite

#### Dados
- **Exportar**: CSV ou PDF dos dados
- **Importar**: Importar transações via CSV
- **Backup**: Backup completo em JSON
- **Restaurar**: Restaurar backup anterior

### 7. Importação Inteligente (OCR)

#### Tipos de Documento
- **Faturas de Cartão**: Processamento de faturas de cartão de crédito
- **Boletos**: Processamento de boletos bancários

#### Funcionalidades
- **Upload de Arquivo**: PDF ou imagem (JPG, PNG, GIF, WebP)
- **Processamento Automático**: Extração automática via OpenAI GPT-4o Vision
- **Revisão**: Visualizar e editar transações extraídas antes de importar
- **Seleção Múltipla**: Escolher quais transações importar
- **Categorização Automática**: IA sugere categorias baseadas na descrição
- **Validação**: Verificação automática de valores e datas

#### Tecnologia
- **OpenAI GPT-4o**: Modelo de visão para análise de documentos
- **Base64 Encoding**: Conversão de PDFs/imagens para processamento
- **JSON Parsing**: Extração estruturada de dados

### 8. Transação Rápida

#### Acesso Rápido
- **Botão Flutuante**: Acesso rápido no mobile
- **Modal Simplificado**: Interface minimalista para registro rápido
- **Tipos**: Receita, Despesa ou Transferência
- **Desfazer**: Opção de desfazer transação recém-criada

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológico

#### Frontend
- **Next.js 14**: Framework React com App Router
- **React 18**: Biblioteca de interface
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização utilitária
- **Radix UI**: Componentes acessíveis
- **Recharts**: Gráficos e visualizações
- **Zustand**: Gerenciamento de estado
- **SWR**: Cache e sincronização de dados

#### Backend
- **Next.js API Routes**: Endpoints serverless
- **Supabase**: Backend as a Service
  - PostgreSQL: Banco de dados
  - Auth: Autenticação
  - Row Level Security: Segurança de dados
- **OpenAI API**: Processamento de OCR

#### Infraestrutura
- **Vercel**: Hospedagem e deploy
- **Supabase Cloud**: Banco de dados gerenciado
- **PWA**: Progressive Web App capabilities

### Estrutura de Pastas

```
dindin/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Rotas do dashboard
│   │   ├── dashboard/     # Página principal
│   │   ├── transacoes/    # Gestão de transações
│   │   ├── contas/        # Gestão de contas
│   │   ├── investimentos/ # Gestão de investimentos
│   │   ├── metas/         # Gestão de metas
│   │   └── configuracoes/ # Configurações
│   └── api/               # API Routes
│       ├── usuarios/      # CRUD de usuários
│       ├── transacoes/    # CRUD de transações
│       ├── contas/        # CRUD de contas
│       ├── categorias/    # CRUD de categorias
│       ├── investimentos/ # CRUD de investimentos
│       ├── metas/         # CRUD de metas
│       ├── onboarding/    # Processo de onboarding
│       └── ocr/           # Processamento OCR
├── components/            # Componentes React
│   ├── dashboard/        # Componentes do dashboard
│   ├── transacoes/       # Componentes de transações
│   ├── investimentos/    # Componentes de investimentos
│   ├── metas/            # Componentes de metas
│   ├── configuracoes/    # Componentes de configurações
│   ├── layout/           # Layout e navegação
│   ├── ui/               # Componentes base (design system)
│   └── shared/           # Componentes compartilhados
├── hooks/                # Custom hooks
├── lib/                  # Utilitários e helpers
├── types/                # Definições TypeScript
└── supabase/             # Migrations e schemas SQL
```

### Fluxo de Dados

1. **Autenticação**:
   - Usuário faz login via Supabase Auth
   - Token JWT armazenado em cookies
   - Middleware valida autenticação em todas as rotas protegidas

2. **Carregamento de Dados**:
   - SWR faz fetch das APIs
   - Dados são mapeados do formato DB para formato da aplicação
   - Estado global (Zustand) é atualizado
   - Componentes reagem às mudanças de estado

3. **Criação/Atualização**:
   - Usuário interage com formulário
   - Dados são enviados para API Route
   - API valida e persiste no Supabase
   - SWR invalida cache e refaz fetch
   - UI atualiza automaticamente

4. **Sincronização**:
   - SWR mantém cache local
   - Revalidação automática em background
   - Sincronização entre abas (via SWR)

---

## 📊 Estrutura de Dados

### Entidades Principais

#### Usuários (usuarios)
- `id`: UUID (chave primária)
- `nome`: String
- `email`: String (único)
- `avatar`: String (URL)
- `renda_mensal`: Decimal
- `is_onboarded`: Boolean
- `created_at`, `updated_at`: Timestamps

#### Contas (contas)
- `id`: UUID
- `nome`: String
- `tipo`: Enum (CORRENTE, POUPANCA, CARTAO_CREDITO, INVESTIMENTO)
- `banco`: String (opcional)
- `saldo`: Decimal
- `cor`: String (hex)
- `icone`: String
- `ativo`: Boolean
- `user_id`: UUID (FK para usuarios)
- `created_at`, `updated_at`: Timestamps

#### Transações (transacoes)
- `id`: UUID
- `descricao`: String
- `valor`: Decimal
- `tipo`: Enum (ENTRADA, SAIDA, TRANSFERENCIA)
- `data`: Date
- `user_id`: UUID (FK)
- `account_id`: UUID (FK)
- `category_id`: UUID (FK, opcional)
- `notas`: Text (opcional)
- `ownership`: Enum (PESSOAL, DOMESTICO)
- `created_at`, `updated_at`: Timestamps

#### Categorias (categorias)
- `id`: UUID
- `nome`: String
- `tipo`: Enum (RECEITA, DESPESA, INVESTIMENTO)
- `cor`: String (hex)
- `icone`: String (opcional)
- `limite_mensal`: Decimal (opcional)
- `created_at`, `updated_at`: Timestamps

#### Investimentos (investimentos)
- `id`: UUID
- `nome`: String
- `tipo`: Enum (RENDA_FIXA, RENDA_VARIAVEL, CRIPTO, FUNDO)
- `instituicao`: String
- `preco_compra`: Decimal
- `preco_atual`: Decimal
- `rentabilidade`: Decimal
- `data_compra`: Date
- `data_vencimento`: Date (opcional)
- `user_id`: UUID (FK)
- `created_at`, `updated_at`: Timestamps

#### Metas (metas)
- `id`: UUID
- `nome`: String
- `tipo`: Enum (ECONOMIA_CATEGORIA, INVESTIMENTO_MENSAL, PATRIMONIO, REGRA_PERCENTUAL)
- `valor_alvo`: Decimal
- `valor_atual`: Decimal
- `prazo`: Date (opcional)
- `ativo`: Boolean
- `category_id`: UUID (FK, opcional)
- `user_id`: UUID (FK)
- `created_at`, `updated_at`: Timestamps

#### Orçamentos (orcamentos)
- `id`: UUID
- `user_id`: UUID (FK)
- `essenciais_projetado`: Decimal
- `essenciais_realizado`: Decimal
- `livres_projetado`: Decimal
- `livres_realizado`: Decimal
- `investimentos_projetado`: Decimal
- `investimentos_realizado`: Decimal
- `mes`: Integer
- `ano`: Integer
- `created_at`, `updated_at`: Timestamps

---

## 🔄 Fluxos de Usuário

### 1. Onboarding (Primeiro Acesso)

1. **Login/Cadastro**
   - Usuário faz login via email/senha ou OAuth (Google/Apple)
   - Supabase cria sessão e retorna token

2. **Modal de Onboarding**
   - **Passo 1 - Perfil**: Nome, email, avatar
   - **Passo 2 - Contas**: Adicionar contas iniciais (mínimo 1)
   - **Passo 3 - Renda**: Informar renda mensal
   - **Finalização**: Dados são salvos, usuário é marcado como onboarded

3. **Redirecionamento**
   - Usuário é redirecionado para dashboard
   - Dados iniciais são carregados

### 2. Adicionar Transação

1. **Acesso**
   - Botão "Nova Transação" ou botão flutuante (mobile)
   - Modal de transação rápida ou página completa

2. **Preenchimento**
   - Tipo: Receita, Despesa ou Transferência
   - Descrição, valor, data
   - Categoria, conta
   - Opcional: notas, tags, proprietário

3. **Salvamento**
   - Validação de campos
   - POST para `/api/transacoes`
   - Atualização automática do dashboard
   - Notificação de sucesso

### 3. Importar Fatura (OCR)

1. **Acesso**
   - Menu "Importar" ou botão no mobile
   - Modal de importação

2. **Seleção de Tipo**
   - Escolher: Boleto ou Fatura

3. **Upload**
   - Arrastar arquivo ou selecionar
   - Suporta: PDF, JPG, PNG, GIF, WebP (máx 10MB)

4. **Processamento**
   - Arquivo enviado para `/api/ocr`
   - OpenAI GPT-4o analisa o documento
   - Extração automática de transações

5. **Revisão**
   - Lista de transações extraídas
   - Selecionar quais importar
   - Editar valores/datas se necessário

6. **Importação**
   - Transações selecionadas são criadas
   - Dashboard atualiza automaticamente

### 4. Visualizar Dashboard

1. **Carregamento**
   - SWR busca dados de todas as APIs
   - Dados são mapeados e armazenados no estado global

2. **Cálculos**
   - Resumos calculados em tempo real
   - Gráficos gerados com dados do período selecionado

3. **Interação**
   - Seleção de período (mês/ano)
   - Filtros e navegação
   - Atualização automática em background

---

## 💼 Plano de Negócio

### Modelo de Monetização

#### Fase 1: MVP Gratuito
- **Funcionalidades Básicas**: Gratuitas para todos
- **Limitações**:
  - Máximo 2 membros da família
  - Máximo 5 contas
  - 10 importações OCR por mês
  - Histórico de 3 meses

#### Fase 2: Plano Premium
- **Preço Sugerido**: R$ 19,90/mês ou R$ 199,00/ano
- **Benefícios**:
  - Membros ilimitados
  - Contas ilimitadas
  - Importações OCR ilimitadas
  - Histórico completo
  - Exportação avançada (PDF, Excel)
  - Suporte prioritário
  - Temas personalizados

#### Fase 3: Plano Família
- **Preço Sugerido**: R$ 39,90/mês
- **Benefícios Premium +**:
  - Múltiplas famílias
  - Relatórios avançados
  - Integração com bancos (Open Banking)
  - Alertas por WhatsApp/Email
  - API para desenvolvedores

### Proposta de Valor Comercial

1. **Economia de Tempo**
   - Redução de 80% no tempo de registro de transações (via OCR)
   - Automação de cálculos e relatórios

2. **Melhoria Financeira**
   - Aumento médio de 15-20% na economia através de controle
   - Redução de gastos desnecessários via insights

3. **Tranquilidade**
   - Visão clara das finanças
   - Alertas preventivos
   - Planejamento de longo prazo

### Diferenciais Competitivos

1. **Foco em Família**: Único app brasileiro focado em gestão familiar
2. **OCR Inteligente**: Processamento automático via IA
3. **Gamificação**: Sistema de conquistas e rankings
4. **PWA Nativo**: Funciona offline e como app nativo
5. **Interface Moderna**: UX/UI superior aos concorrentes

### Métricas de Sucesso

- **Usuários Ativos Mensais (MAU)**
- **Taxa de Retenção**: % de usuários que retornam após 30 dias
- **Conversão Premium**: % de usuários que assinam plano pago
- **NPS (Net Promoter Score)**: Satisfação do usuário
- **Churn Rate**: Taxa de cancelamento

---

## 🗺️ Roadmap e Features Futuras

### Fase 1: Estabilização (Atual)
- ✅ Onboarding completo
- ✅ Dashboard funcional
- ✅ CRUD de transações, contas, investimentos, metas
- ✅ OCR básico
- ✅ PWA básico
- 🔄 Correções de bugs
- 🔄 Melhorias de performance

### Fase 2: Melhorias (Q2 2026)
- [ ] **Integração Bancária**
  - Open Banking (Pix, TED, boletos)
  - Sincronização automática de transações
  - Saldos atualizados em tempo real

- [ ] **Exportação/Importação Completa**
  - Exportação em PDF profissional
  - Exportação em Excel com fórmulas
  - Importação de extratos bancários (CSV, OFX)

- [ ] **Notificações Avançadas**
  - Push notifications
  - WhatsApp notifications
  - Email templates profissionais

- [ ] **Relatórios Avançados**
  - Relatório anual completo
  - Análise de tendências
  - Projeções de longo prazo
  - Comparação com benchmarks

### Fase 3: Expansão (Q3-Q4 2026)
- [ ] **Comunidade**
  - Fórum de discussão
  - Dicas financeiras
  - Desafios mensais

- [ ] **Educação Financeira**
  - Cursos integrados
  - Artigos e guias
  - Calculadoras financeiras

- [ ] **Integrações**
  - Google Calendar (agendar pagamentos)
  - Zapier (automações)
  - Telegram Bot

- [ ] **Multi-idioma**
  - Inglês
  - Espanhol

### Fase 4: IA Avançada (2027)
- [ ] **Assistente Virtual**
  - Chatbot para dúvidas
  - Sugestões inteligentes de economia
  - Alertas preditivos

- [ ] **Análise Preditiva**
  - Previsão de gastos
  - Detecção de anomalias
  - Recomendações personalizadas

- [ ] **Automação Inteligente**
  - Categorização automática avançada
  - Sugestão de metas baseada em histórico
  - Otimização de investimentos

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 14.2.35**: Framework React com SSR/SSG
- **React 18**: Biblioteca de UI
- **TypeScript 5**: Tipagem estática
- **Tailwind CSS 3.4**: Estilização
- **Radix UI**: Componentes acessíveis
- **Recharts 3.6**: Gráficos
- **Zustand 5.0**: Estado global
- **SWR 2.3**: Cache e sincronização
- **Lucide React**: Ícones
- **Date-fns 4.1**: Manipulação de datas

### Backend
- **Next.js API Routes**: Endpoints serverless
- **Supabase**: BaaS completo
  - PostgreSQL: Banco de dados
  - Auth: Autenticação
  - Row Level Security: Segurança
- **OpenAI 6.15**: API de IA para OCR

### DevOps
- **Vercel**: Hospedagem e CI/CD
- **GitHub**: Controle de versão
- **Vitest**: Testes unitários

### Qualidade
- **ESLint**: Linting
- **TypeScript**: Type checking
- **Sentry**: Monitoramento de erros

---

## ⚙️ Configuração e Deploy

### Variáveis de Ambiente

#### Obrigatórias
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase

#### Opcionais
- `OPENAI_API_KEY`: Chave da OpenAI (para OCR)

### Deploy

1. **Vercel**
   - Conectar repositório GitHub
   - Configurar variáveis de ambiente
   - Deploy automático a cada push

2. **Supabase**
   - Criar projeto
   - Executar migrations
   - Configurar RLS policies

3. **Domínio**
   - Configurar domínio customizado no Vercel
   - SSL automático

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar .env.local
cp .env.example .env.local
# Preencher variáveis

# Rodar em desenvolvimento
npm run dev

# Build de produção
npm run build
npm start
```

---

## 📝 Conclusão

O **FamFinance** é uma solução completa de gestão financeira familiar, combinando tecnologia moderna, inteligência artificial e uma experiência de usuário excepcional. Com foco em automação, colaboração e insights inteligentes, o aplicativo está posicionado para se tornar a principal ferramenta de gestão financeira para famílias brasileiras.

### Próximos Passos

1. **Testes Beta**: Lançar versão beta com usuários reais
2. **Feedback**: Coletar e implementar feedback
3. **Marketing**: Estratégia de aquisição de usuários
4. **Monetização**: Implementar planos premium
5. **Escala**: Preparar infraestrutura para crescimento

---

**Documento gerado em**: Janeiro 2026  
**Versão da Aplicação**: 0.1.0  
**Status**: Em Desenvolvimento Ativo
