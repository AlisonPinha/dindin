# FamFinance

Aplicativo de controle financeiro familiar com a regra 50/30/20.

## Funcionalidades

- Dashboard com resumo financeiro e gráficos
- Gestão de transações (receitas, despesas, transferências)
- Controle de contas bancárias e cartões
- Gestão de investimentos com rentabilidade
- Metas financeiras com acompanhamento de progresso
- Regra 50/30/20 (Essencial/Livre/Investimento)
- Suporte a múltiplos membros da família
- Transações parceladas e recorrentes
- Relatórios e gráficos de evolução

## Tech Stack

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Next.js | 14.2 | Framework React com App Router |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 3.4 | Estilização utilitária |
| Prisma | 7.x | ORM para banco de dados |
| Supabase | - | PostgreSQL + Auth |
| shadcn/ui | - | Componentes UI |
| Recharts | 3.x | Gráficos e visualizações |
| Zustand | 5.x | Gerenciamento de estado |

## Pré-requisitos

- Node.js 18.x ou superior
- npm 9.x ou superior
- Conta no [Supabase](https://supabase.com)

## Setup Local

### 1. Clone o repositório

```bash
git clone <repo-url>
cd famfinance
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Onde encontrar no Supabase Dashboard:**
- `DATABASE_URL`: Settings > Database > Connection String (URI)
- `DIRECT_URL`: Mesmo que DATABASE_URL para conexão direta
- `NEXT_PUBLIC_SUPABASE_URL`: Settings > API > Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Settings > API > anon public
- `SUPABASE_SERVICE_ROLE_KEY`: Settings > API > service_role

### 4. Configure o banco de dados

```bash
# Gera o Prisma Client
npm run db:generate

# Sincroniza o schema com o banco
npm run db:push

# Popula com dados de exemplo
npm run db:seed
```

### 5. Verifique a instalação

```bash
npx tsx scripts/check-setup.ts
```

### 6. Rode o projeto

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run start` | Roda build de produção |
| `npm run lint` | Verifica código com ESLint |
| `npm test` | Roda testes unitários |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:coverage` | Testes com cobertura |
| `npm run db:generate` | Gera Prisma Client |
| `npm run db:push` | Sincroniza schema com banco |
| `npm run db:migrate` | Cria migration |
| `npm run db:seed` | Popula dados iniciais |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:reset` | Reset completo do banco |

## Estrutura do Projeto

```
famfinance/
├── app/                      # Next.js App Router
│   ├── (dashboard)/          # Grupo de rotas do dashboard
│   │   ├── dashboard/        # Página principal
│   │   ├── transacoes/       # Gestão de transações
│   │   ├── investimentos/    # Gestão de investimentos
│   │   ├── metas/            # Metas financeiras
│   │   ├── configuracoes/    # Configurações
│   │   └── layout.tsx        # Layout com sidebar
│   ├── api/                  # API Routes
│   │   ├── transacoes/       # CRUD transações
│   │   ├── categorias/       # CRUD categorias
│   │   ├── contas/           # CRUD contas
│   │   ├── investimentos/    # CRUD investimentos
│   │   ├── metas/            # CRUD metas
│   │   └── usuarios/         # CRUD usuários
│   ├── layout.tsx            # Layout raiz
│   ├── page.tsx              # Página inicial
│   └── globals.css           # Estilos globais
│
├── components/               # Componentes React
│   ├── ui/                   # shadcn/ui components
│   ├── dashboard/            # Componentes do dashboard
│   ├── transacoes/           # Componentes de transações
│   ├── investimentos/        # Componentes de investimentos
│   ├── metas/                # Componentes de metas
│   ├── layout/               # Header, Sidebar, etc
│   ├── shared/               # Componentes compartilhados
│   └── quick-transaction/    # FAB de transação rápida
│
├── lib/                      # Utilitários e configurações
│   ├── prisma.ts             # Cliente Prisma singleton
│   ├── supabase.ts           # Clientes Supabase
│   ├── utils.ts              # Funções utilitárias
│   ├── formatters.ts         # Formatadores (moeda, data)
│   ├── calculations.ts       # Cálculos financeiros
│   ├── constants.ts          # Constantes da aplicação
│   └── services/             # Serviços (alertas, etc)
│
├── hooks/                    # Custom React hooks
│   └── use-toast.ts          # Hook de notificações
│
├── types/                    # Definições TypeScript
│   └── index.ts              # Types globais
│
├── prisma/                   # Configuração Prisma
│   ├── schema.prisma         # Schema do banco
│   └── seed.ts               # Script de seed
│
├── supabase/                 # Configurações Supabase
│   └── migrations/           # Scripts SQL (RLS, etc)
│
├── scripts/                  # Scripts utilitários
│   ├── check-setup.ts        # Verificação de setup
│   └── test-db.ts            # Teste de conexão
│
├── docs/                     # Documentação
│   ├── DATABASE_SECURITY.md  # Docs de segurança
│   └── CHECKLIST_TESTES.md   # Checklist de QA
│
├── __tests__/                # Testes
│   └── api/                  # Testes de API
│       └── routes.test.ts    # Testes das rotas
│
├── .env.example              # Template de variáveis
├── middleware.ts             # Middleware Next.js
├── prisma.config.ts          # Config Prisma 7
├── jest.config.js            # Config Jest
├── tailwind.config.ts        # Config Tailwind
├── tsconfig.json             # Config TypeScript
└── package.json              # Dependências
```

## API Endpoints

### Transações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/transacoes?userId=X` | Lista transações |
| POST | `/api/transacoes` | Cria transação |
| PUT | `/api/transacoes` | Atualiza transação |
| DELETE | `/api/transacoes?id=X` | Remove transação |

### Categorias
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/categorias` | Lista categorias |
| POST | `/api/categorias` | Cria categoria |
| PUT | `/api/categorias` | Atualiza categoria |
| DELETE | `/api/categorias?id=X` | Remove categoria |

### Contas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/contas?userId=X` | Lista contas |
| POST | `/api/contas` | Cria conta |
| PUT | `/api/contas` | Atualiza conta |
| DELETE | `/api/contas?id=X` | Remove/desativa conta |

### Investimentos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/investimentos?userId=X` | Lista investimentos |
| POST | `/api/investimentos` | Cria investimento |
| PUT | `/api/investimentos` | Atualiza investimento |
| DELETE | `/api/investimentos?id=X` | Remove investimento |

### Metas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/metas?userId=X` | Lista metas |
| POST | `/api/metas` | Cria meta |
| PUT | `/api/metas` | Atualiza meta |
| PATCH | `/api/metas` | Atualiza progresso |
| DELETE | `/api/metas?id=X` | Remove meta |

## Modelo de Dados

```
User (Usuário)
├── Account (Contas bancárias)
├── Transaction (Transações)
├── Investment (Investimentos)
├── Goal (Metas)
└── Budget (Orçamento mensal)

Category (Categorias - compartilhadas)
└── Vinculada a Transaction e Goal
```

### Tipos de Transação
- `ENTRADA` - Receitas
- `SAIDA` - Despesas
- `TRANSFERENCIA` - Entre contas
- `INVESTIMENTO` - Aportes

### Grupos de Categoria (Regra 50/30/20)
- `ESSENCIAL` - Necessidades básicas (50%)
- `LIVRE` - Gastos pessoais (30%)
- `INVESTIMENTO` - Poupança e investimentos (20%)

## Deploy

### Vercel (Recomendado)

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Docker

```bash
docker build -t famfinance .
docker run -p 3000:3000 famfinance
```

## Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

Desenvolvido com Next.js e Supabase
