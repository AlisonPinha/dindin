# Configuração de Variáveis de Ambiente

Este projeto requer as seguintes variáveis de ambiente para funcionar corretamente:

## Variáveis Obrigatórias

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - URL do seu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço do Supabase (para operações administrativas)

### Anthropic Claude (Opcional - apenas para OCR/importação de documentos)
- `ANTHROPIC_API_KEY` - Chave da API da Anthropic (Claude) para processamento de imagens/faturas

## Como Configurar

### No Vercel (Produção)

1. Acesse seu projeto no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável:
   - Nome: `NOME_DA_VARIAVEL`
   - Valor: `valor_da_variavel`
   - Ambiente: Selecione Production, Preview e/ou Development conforme necessário
4. Salve e faça um novo deploy

### Localmente (Desenvolvimento)

1. Crie um arquivo `.env.local` na raiz do projeto
2. Adicione as variáveis no formato:
   ```
   NEXT_PUBLIC_SUPABASE_URL=seu_valor_aqui
   NEXT_PUBLIC_SUPABASE_ANON_KEY=seu_valor_aqui
   SUPABASE_SERVICE_ROLE_KEY=seu_valor_aqui
   OPENAI_API_KEY=sk-sua-chave-aqui
   ```
3. Reinicie o servidor de desenvolvimento

## Obter Chaves

### Supabase
- Acesse https://supabase.com
- Crie um projeto ou use um existente
- Vá em **Settings** → **API** para encontrar as chaves

### Anthropic Claude
- Acesse https://console.anthropic.com/
- Crie uma nova chave de API
- **Nota**: O serviço de OCR usa o modelo `claude-3-5-sonnet`, que tem custos por uso

## Notas Importantes

- ⚠️ **Nunca commite** arquivos `.env.local` ou `.env` no Git
- 🔒 Mantenha suas chaves seguras e não as compartilhe publicamente
- 💰 O uso da API da Anthropic gera custos - monitore seu uso em https://console.anthropic.com/
