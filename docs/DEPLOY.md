# FamFinance - Guia de Deploy

Este documento descreve como fazer deploy do FamFinance em diferentes plataformas.

## Requisitos

- Node.js 18.x ou superior
- Banco de dados PostgreSQL (recomendado: Supabase)
- Variáveis de ambiente configuradas

## Variáveis de Ambiente

Configure as seguintes variáveis em seu ambiente de produção:

```env
# Obrigatórias
DATABASE_URL="postgresql://..."

# Recomendadas (Supabase Auth)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Opcionais
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
NODE_ENV="production"
```

---

## Deploy na Vercel (Recomendado)

A Vercel é a plataforma recomendada para Next.js.

### Passo a Passo

1. **Conecte o repositório**
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "New Project"
   - Importe seu repositório do GitHub/GitLab/Bitbucket

2. **Configure as variáveis de ambiente**
   - Na página do projeto, vá em "Settings" > "Environment Variables"
   - Adicione todas as variáveis listadas acima
   - Marque os ambientes (Production, Preview, Development)

3. **Configure o build**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Deploy**
   - Clique em "Deploy"
   - A cada push no branch principal, um novo deploy será feito automaticamente

### Domínio Personalizado

1. Vá em "Settings" > "Domains"
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme indicado

---

## Deploy na Railway

### Passo a Passo

1. **Crie um novo projeto**
   - Acesse [railway.app](https://railway.app)
   - Clique em "New Project" > "Deploy from GitHub repo"

2. **Configure o banco de dados**
   - Adicione um serviço PostgreSQL (ou use Supabase externo)
   - Railway cria automaticamente a variável `DATABASE_URL`

3. **Adicione variáveis de ambiente**
   - Vá em "Variables"
   - Adicione todas as variáveis necessárias

4. **Configure o start command**
   - Settings > Deploy > Start Command: `npm run start`

5. **Gere o domínio**
   - Settings > Domains > Generate Domain

---

## Deploy na Render

### Passo a Passo

1. **Crie um Web Service**
   - Acesse [render.com](https://render.com)
   - New > Web Service
   - Conecte seu repositório

2. **Configure o serviço**
   ```
   Name: famfinance
   Environment: Node
   Region: Oregon (ou mais próximo)
   Branch: main
   Build Command: npm install && npm run build
   Start Command: npm run start
   ```

3. **Adicione variáveis de ambiente**
   - Environment > Environment Variables
   - Adicione todas as variáveis

4. **Configure o banco**
   - Use Supabase externo ou crie um PostgreSQL na Render

---

## Deploy com Docker

### Dockerfile

Crie um arquivo `Dockerfile` na raiz do projeto:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: famfinance
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Comandos

```bash
# Build da imagem
docker build -t famfinance .

# Rodar container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  famfinance

# Com docker-compose
docker-compose up -d
```

---

## Deploy VPS/Self-Hosted

### Usando PM2

1. **Instale PM2 globalmente**
   ```bash
   npm install -g pm2
   ```

2. **Configure o ecosystem.config.js**
   ```javascript
   module.exports = {
     apps: [{
       name: 'famfinance',
       script: 'npm',
       args: 'start',
       cwd: '/var/www/famfinance',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   }
   ```

3. **Inicie a aplicação**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Nginx como Reverse Proxy

```nginx
server {
    listen 80;
    server_name famfinance.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Checklist Pré-Deploy

### Banco de Dados
- [ ] PostgreSQL configurado
- [ ] `DATABASE_URL` definida
- [ ] Migrations aplicadas (`npm run db:push`)
- [ ] Seed executado (`npm run db:seed`)
- [ ] RLS configurado no Supabase

### Aplicação
- [ ] Build passa sem erros (`npm run build`)
- [ ] Testes passam (`npm test`)
- [ ] Lint passa (`npm run lint`)
- [ ] Variáveis de ambiente definidas

### Segurança
- [ ] HTTPS habilitado
- [ ] Variáveis sensíveis não expostas
- [ ] RLS ativo em todas as tabelas
- [ ] Service Role Key apenas no servidor

### Performance
- [ ] Imagens otimizadas
- [ ] Cache configurado
- [ ] Compressão habilitada

---

## Checklist Pós-Deploy

### Verificação
- [ ] Página inicial carrega
- [ ] Dashboard carrega dados
- [ ] API routes funcionam
- [ ] Autenticação funciona (se configurada)
- [ ] Criar/editar/deletar transações funciona

### Monitoramento
- [ ] Logs configurados
- [ ] Alertas de erro configurados
- [ ] Métricas de performance ativas

---

## Rollback

### Vercel
```bash
# Lista deploys anteriores
vercel list

# Rollback para deploy específico
vercel rollback [deployment-url]
```

### Docker
```bash
# Lista imagens
docker images

# Roda versão anterior
docker run -p 3000:3000 famfinance:previous-tag
```

### Git
```bash
# Reverte para commit anterior
git revert HEAD
git push origin main
```

---

## Troubleshooting

### Erro: Database connection failed
- Verifique se `DATABASE_URL` está correta
- Verifique se o IP do servidor está liberado no Supabase
- Verifique se o banco está acessível

### Erro: Build failed
- Execute `npm run build` localmente para ver o erro
- Verifique se todas as dependências estão no `package.json`
- Verifique os tipos TypeScript

### Erro: 500 Internal Server Error
- Verifique os logs do servidor
- Verifique se as variáveis de ambiente estão configuradas
- Verifique conexão com o banco de dados

### Erro: Supabase client not configured
- Defina `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ou o middleware irá ignorar autenticação

---

## Suporte

- Documentação Next.js: https://nextjs.org/docs
- Documentação Prisma: https://www.prisma.io/docs
- Documentação Supabase: https://supabase.com/docs
- Issues do projeto: [link do repositório]
