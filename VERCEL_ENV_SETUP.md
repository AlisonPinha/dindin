# Como Configurar Variáveis de Ambiente no Vercel

## 📋 Passo a Passo Detalhado

### 1. Acessar o Dashboard do Vercel

1. Acesse https://vercel.com
2. Faça login na sua conta
3. Selecione o projeto **dindin** (ou o nome do seu projeto)

### 2. Navegar até as Configurações

1. No menu superior, clique em **Settings** (Configurações)
2. No menu lateral esquerdo, clique em **Environment Variables** (Variáveis de Ambiente)

### 3. Adicionar a Variável ANTHROPIC_API_KEY

#### Opção A: Adicionar Nova Variável

1. Na seção **Environment Variables**, você verá uma lista de variáveis existentes
2. Clique no botão **Add New** (Adicionar Nova) ou **+ Add** (Adicionar)

3. Preencha os campos:
   - **Name** (Nome): `ANTHROPIC_API_KEY`
   - **Value** (Valor): Cole sua chave da API Anthropic (formato: `sk-ant-...`)
   - **Environment** (Ambiente): Selecione onde aplicar:
     - ✅ **Production** (Produção) - obrigatório
     - ✅ **Preview** (Preview) - recomendado para testar
     - ✅ **Development** (Desenvolvimento) - opcional

4. Clique em **Save** (Salvar)

#### Opção B: Editar Variável Existente (se já existe)

1. Encontre `ANTHROPIC_API_KEY` na lista
2. Clique nos três pontos (⋯) ao lado da variável
3. Selecione **Edit** (Editar)
4. Atualize o **Value** (Valor) se necessário
5. Verifique os ambientes selecionados
6. Clique em **Save** (Salvar)

### 4. Remover OPENAI_API_KEY (se existir)

Se você ainda tiver a variável `OPENAI_API_KEY` configurada:

1. Encontre `OPENAI_API_KEY` na lista
2. Clique nos três pontos (⋯) ao lado da variável
3. Selecione **Delete** (Excluir)
4. Confirme a exclusão

### 5. Fazer Deploy

Após adicionar/atualizar as variáveis:

1. **Opção Automática**: Se você tem auto-deploy configurado, o Vercel detectará mudanças e fará deploy automaticamente
2. **Opção Manual**: 
   - Vá para a aba **Deployments**
   - Clique nos três pontos (⋯) do último deployment
   - Selecione **Redeploy** (Reimplantar)
   - Ou faça um novo commit/push para o repositório

### 6. Verificar se Funcionou

1. Após o deploy, acesse sua aplicação
2. Tente importar uma imagem de fatura/boleto
3. Se funcionar, a configuração está correta!
4. Se der erro, verifique os logs:
   - Vá em **Deployments** → Clique no deployment → **Functions** → `/api/ocr` → **View Function Logs**

## 🔑 Como Obter a Chave da API Anthropic

1. Acesse https://console.anthropic.com/
2. Faça login (ou crie uma conta se não tiver)
3. Vá em **API Keys** (Chaves de API)
4. Clique em **Create Key** (Criar Chave)
5. Dê um nome para a chave (ex: "dindin-ocr")
6. Copie a chave (formato: `sk-ant-...`)
   - ⚠️ **IMPORTANTE**: Copie imediatamente, pois ela só aparece uma vez!
7. Cole no campo **Value** do Vercel

## 📸 Visualização das Etapas

### Tela de Environment Variables no Vercel

```
┌─────────────────────────────────────────────────┐
│ Settings > Environment Variables                │
├─────────────────────────────────────────────────┤
│                                                  │
│  Environment Variables                          │
│  ┌──────────────────────────────────────────┐  │
│  │ Name              Value        Environment │  │
│  ├──────────────────────────────────────────┤  │
│  │ NEXT_PUBLIC_...   ********     All        │  │
│  │ SUPABASE_...      ********     All        │  │
│  │ ANTHROPIC_API_KEY [Add New]              │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  [+ Add New]                                     │
└─────────────────────────────────────────────────┘
```

### Formulário de Adição

```
┌─────────────────────────────────────────────────┐
│ Add Environment Variable                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  Name:                                          │
│  ┌──────────────────────────────────────────┐  │
│  │ ANTHROPIC_API_KEY                        │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Value:                                         │
│  ┌──────────────────────────────────────────┐  │
│  │ sk-ant-api03-...                         │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Environment:                                   │
│  ☑ Production                                   │
│  ☑ Preview                                      │
│  ☐ Development                                  │
│                                                  │
│  [Cancel]  [Save]                               │
└─────────────────────────────────────────────────┘
```

## ⚠️ Dicas Importantes

1. **Segurança**: Nunca compartilhe sua chave de API publicamente
2. **Ambientes**: Configure para Production e Preview pelo menos
3. **Validação**: Após adicionar, sempre faça um novo deploy
4. **Logs**: Se algo der errado, verifique os logs do Vercel
5. **Custos**: Monitore o uso em https://console.anthropic.com/

## 🔍 Verificar se a Variável Está Configurada

### Via Dashboard
1. Vá em **Settings** → **Environment Variables**
2. Procure por `ANTHROPIC_API_KEY` na lista
3. Se aparecer, está configurada ✅

### Via Logs (após deploy)
1. Vá em **Deployments** → Selecione um deployment
2. Clique em **Functions** → `/api/ocr`
3. Veja os logs - se aparecer "Serviço de OCR não configurado", a variável não está sendo lida

## 🐛 Troubleshooting

### Problema: "Serviço de OCR não configurado"
**Solução**: 
- Verifique se `ANTHROPIC_API_KEY` está configurada
- Verifique se está nos ambientes corretos (Production/Preview)
- Faça um novo deploy após adicionar a variável

### Problema: "Chave da API Claude inválida"
**Solução**:
- Verifique se copiou a chave completa
- Verifique se não há espaços extras
- Gere uma nova chave no console da Anthropic

### Problema: Variável não aparece nos logs
**Solução**:
- Variáveis de ambiente não aparecem nos logs por segurança
- Teste fazendo uma requisição ao endpoint `/api/ocr`
- Se funcionar, a variável está configurada corretamente

## 📞 Precisa de Ajuda?

- Documentação Vercel: https://vercel.com/docs/environment-variables
- Documentação Anthropic: https://docs.anthropic.com/
- Logs do Vercel: Dashboard → Deployments → [Seu Deployment] → Functions
