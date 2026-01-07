# FamFinance - Segurança do Banco de Dados

## Row Level Security (RLS)

O Supabase utiliza PostgreSQL Row Level Security para controlar acesso aos dados em nível de linha.

### Status das Tabelas

| Tabela | RLS Habilitado | Policies |
|--------|----------------|----------|
| User | Sim | Service role + próprio perfil |
| Account | Sim | Service role + próprio usuário |
| Category | Sim | Service role + leitura pública |
| Transaction | Sim | Service role + próprio usuário |
| Investment | Sim | Service role + próprio usuário |
| Goal | Sim | Service role + próprio usuário |
| Budget | Sim | Service role + próprio usuário |

---

## Políticas Implementadas

### 1. Service Role (Backend/Prisma)

Todas as tabelas possuem policy para `service_role`:

```sql
CREATE POLICY "Service role full access on [Table]" ON "[Table]"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

**Uso:** Conexões via `SUPABASE_SERVICE_ROLE_KEY` (lib/supabase.ts - adminClient)

---

### 2. User

| Policy | Operação | Condição |
|--------|----------|----------|
| Users can view own profile | SELECT | `auth.uid()::text = id` |
| Users can update own profile | UPDATE | `auth.uid()::text = id` |

**Nota:** Usuários não podem criar ou deletar seus próprios perfis via RLS (apenas admin).

---

### 3. Account

| Policy | Operação | Condição |
|--------|----------|----------|
| Users can view own accounts | SELECT | `auth.uid()::text = "userId"` |
| Users can insert own accounts | INSERT | `auth.uid()::text = "userId"` |
| Users can update own accounts | UPDATE | `auth.uid()::text = "userId"` |
| Users can delete own accounts | DELETE | `auth.uid()::text = "userId"` |

---

### 4. Category

| Policy | Operação | Condição |
|--------|----------|----------|
| Anyone can view categories | SELECT | `true` |
| Authenticated users can insert | INSERT | `auth.role() = 'authenticated'` |
| Authenticated users can update | UPDATE | `auth.role() = 'authenticated'` |

**Nota:** Categorias são compartilhadas entre todos os usuários da família.

---

### 5. Transaction

| Policy | Operação | Condição |
|--------|----------|----------|
| Users can view own transactions | SELECT | `auth.uid()::text = "userId"` |
| Users can insert own transactions | INSERT | `auth.uid()::text = "userId"` |
| Users can update own transactions | UPDATE | `auth.uid()::text = "userId"` |
| Users can delete own transactions | DELETE | `auth.uid()::text = "userId"` |

---

### 6. Investment

| Policy | Operação | Condição |
|--------|----------|----------|
| Users can view own investments | SELECT | `auth.uid()::text = "userId"` |
| Users can insert own investments | INSERT | `auth.uid()::text = "userId"` |
| Users can update own investments | UPDATE | `auth.uid()::text = "userId"` |
| Users can delete own investments | DELETE | `auth.uid()::text = "userId"` |

---

### 7. Goal

| Policy | Operação | Condição |
|--------|----------|----------|
| Users can view own goals | SELECT | `auth.uid()::text = "userId"` |
| Users can insert own goals | INSERT | `auth.uid()::text = "userId"` |
| Users can update own goals | UPDATE | `auth.uid()::text = "userId"` |
| Users can delete own goals | DELETE | `auth.uid()::text = "userId"` |

---

### 8. Budget

| Policy | Operação | Condição |
|--------|----------|----------|
| Users can view own budgets | SELECT | `auth.uid()::text = "userId"` |
| Users can insert own budgets | INSERT | `auth.uid()::text = "userId"` |
| Users can update own budgets | UPDATE | `auth.uid()::text = "userId"` |
| Users can delete own budgets | DELETE | `auth.uid()::text = "userId"` |

---

## Configuração de Clientes

### 1. Browser Client (anon key)
- **Arquivo:** `lib/supabase.ts` → `createSupabaseBrowserClient()`
- **Uso:** Componentes client-side
- **Acesso:** Limitado por RLS (apenas dados do próprio usuário)

### 2. Server Client (anon key)
- **Arquivo:** `lib/supabase.ts` → `createSupabaseServerClient()`
- **Uso:** Server Components, Route Handlers
- **Acesso:** Limitado por RLS

### 3. Admin Client (service role key)
- **Arquivo:** `lib/supabase.ts` → `createSupabaseAdminClient()`
- **Uso:** Operações administrativas, seeds, migrations
- **Acesso:** Bypassa RLS completamente

### 4. Prisma Client
- **Arquivo:** `lib/prisma.ts`
- **Conexão:** Via `DATABASE_URL` (connection pooler)
- **Acesso:** Bypassa RLS (conexão direta ao PostgreSQL)

---

## Como Aplicar as Policies

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o script: `supabase/migrations/001_enable_rls.sql`
4. Verifique em **Authentication > Policies**

---

## Considerações de Segurança

### Ambiente de Desenvolvimento
- Use `service_role` key apenas no backend
- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no client-side
- O Prisma usa conexão direta e bypassa RLS

### Ambiente de Produção
- Habilite RLS em todas as tabelas
- Use connection pooler para Prisma
- Configure políticas específicas por ambiente
- Monitore logs de acesso no Supabase Dashboard

### Variáveis de Ambiente

```env
# Públicas (podem ser expostas no client)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Privadas (apenas server-side)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

---

## Comandos Úteis

```bash
# Verificar policies existentes
SELECT * FROM pg_policies;

# Verificar RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

# Testar policy como usuário específico
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "user-id-here"}';
SELECT * FROM "Transaction";
RESET ROLE;
```

---

## Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Prisma + Supabase](https://www.prisma.io/docs/guides/database/supabase)
