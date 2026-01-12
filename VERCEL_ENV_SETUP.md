# Configuração de Variáveis de Ambiente no Vercel

## Variáveis Obrigatórias

Adicione estas variáveis na seção "Environment Variables" do Vercel:

### 1. NEXT_PUBLIC_SUPABASE_URL
- **Valor:** URL do seu projeto Supabase
- **Exemplo:** `https://axxbryrcfisxmjizloik.supabase.co`
- **Onde encontrar:** Dashboard do Supabase > Settings > API > Project URL

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Valor:** Chave anon (pública) do Supabase
- **Exemplo:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Onde encontrar:** Dashboard do Supabase > Settings > API > Project API keys > anon public

## Variáveis Opcionais (Recomendadas)

### 3. SUPABASE_SERVICE_ROLE_KEY
- **Valor:** Chave de service role do Supabase (mantenha em segredo!)
- **Onde encontrar:** Dashboard do Supabase > Settings > API > Project API keys > service_role
- **Importante:** Esta chave bypassa RLS - use apenas para operações administrativas

### 4. OPENAI_API_KEY
- **Valor:** Sua chave da API OpenAI
- **Onde encontrar:** https://platform.openai.com/api-keys
- **Nota:** Necessária apenas se você quiser usar a funcionalidade de OCR (leitura de boletos/faturas)

## Como Adicionar no Vercel

1. Na tela de configuração do projeto, role até "Environment Variables"
2. Clique em "+ Add More" para cada variável
3. Digite o nome da variável (ex: `NEXT_PUBLIC_SUPABASE_URL`)
4. Cole o valor correspondente
5. Repita para todas as variáveis necessárias
6. Clique em "Deploy"

## Importar do .env.local

Se você tem um arquivo `.env.local` local, pode usar o botão "Import .env" no Vercel para importar todas as variáveis de uma vez.
