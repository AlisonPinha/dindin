# Migração OpenAI → Claude (Anthropic)

## ✅ Alterações Realizadas

### 1. Dependências
- ❌ Removido: `openai` package
- ✅ Adicionado: `@anthropic-ai/sdk` package

### 2. Código (`app/api/ocr/route.ts`)
- ✅ Substituído `OpenAI` por `Anthropic`
- ✅ Atualizado `getOpenAIClient()` → `getClaudeClient()`
- ✅ Atualizado estrutura da requisição para formato Claude
- ✅ Atualizado leitura da resposta (`response.content[0].text`)
- ✅ Mapeamento de MIME types para tipos aceitos pelo Claude
- ✅ Tratamento de erros específico do Claude

### 3. Variáveis de Ambiente
- ❌ Removido: `OPENAI_API_KEY`
- ✅ Adicionado: `ANTHROPIC_API_KEY`

### 4. Configurações
- ✅ `next.config.mjs`: CSP atualizado para `api.anthropic.com`
- ✅ `scripts/test-ocr.js`: Atualizado para usar `ANTHROPIC_API_KEY`

### 5. Documentação
- ✅ `ENV_SETUP.md`: Atualizado com instruções do Claude
- ✅ `DOCUMENTACAO_COMPLETA.md`: Referências atualizadas

## 🔍 Verificações Realizadas

### ✅ Build
- Build do Next.js compila sem erros
- Apenas warnings de ESLint (console.log) - não críticos

### ✅ Imports
- Nenhum import do OpenAI encontrado
- Todos os imports do Anthropic estão corretos

### ✅ TypeScript
- Tipos corrigidos para `media_type`
- Estrutura de resposta do Claude validada

### ✅ Referências
- Todas as referências ao OpenAI foram removidas ou atualizadas
- Documentação atualizada

## 📝 Próximos Passos

1. **Configurar no Vercel**:
   - Remover `OPENAI_API_KEY` (se existir)
   - Adicionar `ANTHROPIC_API_KEY` com sua chave do Claude

2. **Testar OCR**:
   - Após deploy, testar importação de imagem
   - Verificar logs no Vercel se houver problemas

3. **Monitorar**:
   - Verificar uso e custos em https://console.anthropic.com/

## ⚠️ Observações

- **PDFs**: Claude também não aceita PDFs diretamente (apenas imagens)
- **Modelo**: Usando `claude-3-5-sonnet-20241022` (pode mudar para `claude-3-opus` para melhor qualidade)
- **Limites**: Verificar limites de rate limit da API Anthropic

## 🔄 Rollback (se necessário)

Se precisar voltar para OpenAI:

1. Reverter commits relacionados à migração
2. Reinstalar `openai` package: `npm install openai`
3. Restaurar código original do `app/api/ocr/route.ts`
4. Configurar `OPENAI_API_KEY` no Vercel
