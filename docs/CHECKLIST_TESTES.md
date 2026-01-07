# Checklist de Testes Manuais - FamFinance

> Execute cada item e marque com ✅ ou ❌
> Data do teste: ____/____/____
> Testador: ________________

---

## 🔐 Autenticação (se implementado)

| Status | Funcionalidade |
|--------|----------------|
| [ ] | Login funciona |
| [ ] | Logout funciona |
| [ ] | Sessão persiste após refresh |
| [ ] | Redirect para login quando não autenticado |
| [ ] | Recuperação de senha funciona |
| [ ] | Registro de novo usuário funciona |

---

## 📊 Dashboard

| Status | Funcionalidade |
|--------|----------------|
| [ ] | Cards de resumo carregam com valores corretos |
| [ ] | Card "Total Receitas" mostra valor correto |
| [ ] | Card "Total Despesas" mostra valor correto |
| [ ] | Card "Saldo" mostra diferença correta |
| [ ] | Card "Investimentos" mostra total correto |
| [ ] | Gráfico 50/30/20 renderiza |
| [ ] | Gráfico 50/30/20 mostra porcentagens corretas |
| [ ] | Gráfico de fluxo mensal funciona |
| [ ] | Gráfico de fluxo mostra 12 meses |
| [ ] | Últimas transações aparecem |
| [ ] | Últimas transações limitadas a 5-10 itens |
| [ ] | Widget de contas mostra saldos |
| [ ] | Widget de contas mostra todas as contas ativas |
| [ ] | Troca de período (mês/ano) atualiza dados |
| [ ] | Toggle visão consolidada/individual funciona |
| [ ] | Loading skeleton aparece enquanto carrega |

---

## 💸 Transações

### Listagem
| Status | Funcionalidade |
|--------|----------------|
| [ ] | Lista carrega corretamente |
| [ ] | Filtro por período funciona |
| [ ] | Filtro por tipo (Receita/Despesa) funciona |
| [ ] | Filtro por categoria funciona |
| [ ] | Filtro por conta funciona |
| [ ] | Busca por descrição funciona |
| [ ] | Paginação funciona |
| [ ] | Ordenação por data funciona |
| [ ] | Ordenação por valor funciona |
| [ ] | Valores de entrada em verde |
| [ ] | Valores de saída em vermelho |
| [ ] | Parcelas mostram "X/Y" |

### Criar Transação
| Status | Funcionalidade |
|--------|----------------|
| [ ] | Modal de criação abre corretamente |
| [ ] | Campos obrigatórios são validados |
| [ ] | Criar transação simples (Receita) |
| [ ] | Criar transação simples (Despesa) |
| [ ] | Criar transação parcelada |
| [ ] | Verifica se cria todas as parcelas |
| [ ] | Valores das parcelas são calculados corretamente |
| [ ] | Datas das parcelas são incrementadas mensalmente |
| [ ] | Criar transação recorrente |
| [ ] | Selecionar categoria funciona |
| [ ] | Selecionar conta funciona |
| [ ] | Campo de data funciona (datepicker) |
| [ ] | Upload de anexo funciona |
| [ ] | Tags funcionam (adicionar/remover) |
| [ ] | Campo de notas funciona |
| [ ] | Toast de sucesso aparece após criar |

### Editar/Excluir
| Status | Funcionalidade |
|--------|----------------|
| [ ] | Botão editar abre modal com dados preenchidos |
| [ ] | Editar transação salva alterações |
| [ ] | Excluir transação exibe confirmação |
| [ ] | Excluir transação remove da lista |
| [ ] | Toast de sucesso aparece após editar/excluir |

---

## 🏦 Contas Bancárias

| Status | Funcionalidade |
|--------|----------------|
| [ ] | Lista de contas carrega |
| [ ] | Criar conta corrente |
| [ ] | Criar conta poupança |
| [ ] | Criar cartão de crédito |
| [ ] | Criar conta investimento |
| [ ] | Saldo inicial é salvo corretamente |
| [ ] | Saldo atual é calculado (inicial + transações) |
| [ ] | Editar conta funciona |
| [ ] | Desativar conta funciona (soft delete) |
| [ ] | Excluir conta sem transações funciona |
| [ ] | Conta com transações não pode ser excluída |
| [ ] | Cores das contas são exibidas |
| [ ] | Ícones das contas são exibidos |

---

## 📁 Categorias

| Status | Funcionalidade |
|--------|----------------|
| [ ] | Lista de categorias carrega |
| [ ] | Filtro por tipo (Receita/Despesa) funciona |
| [ ] | Criar categoria de receita |
| [ ] | Criar categoria de despesa |
| [ ] | Atribuir grupo (Essencial/Livre/Investimento) |
| [ ] | Definir orçamento mensal funciona |
| [ ] | Cores são exibidas corretamente |
| [ ] | Ícones são exibidos corretamente |
| [ ] | Editar categoria funciona |
| [ ] | Excluir categoria sem transações funciona |
| [ ] | Categoria com transações não pode ser excluída |

---

## 🎯 Metas

### Listagem
| Status | Funcionalidade |
|--------|----------------|
| [ ] | Lista de metas carrega |
| [ ] | Filtro por tipo funciona |
| [ ] | Filtro por status (ativa/concluída) funciona |
| [ ] | Barra de progresso renderiza corretamente |
| [ ] | Porcentagem é calculada corretamente |
| [ ] | Metas atingidas são destacadas |

### Criar Meta
| Status | Funcionalidade |
|--------|----------------|
| [ ] | Criar meta de limite de categoria |
| [ ] | Criar meta de investimento mensal |
| [ ] | Criar meta de patrimônio |
| [ ] | Configurar regra 50/30/20 |
| [ ] | Definir prazo funciona |
| [ ] | Vincular a categoria funciona |

### Progresso
| Status | Funcionalidade |
|--------|----------------|
| [ ] | Barra de progresso atualiza automaticamente |
| [ ] | Valor atual é calculado corretamente |
| [ ] | Alertas aparecem quando próximo do limite (70%) |
| [ ] | Alertas aparecem quando atinge limite (100%) |
| [ ] | Atualizar progresso manualmente funciona |

### Editar/Excluir
| Status | Funcionalidade |
|--------|----------------|
| [ ] | Editar meta funciona |
| [ ] | Desativar meta funciona |
| [ ] | Excluir meta funciona |

---

## 📈 Investimentos

### Listagem
| Status | Funcionalidade |
|--------|----------------|
| [ ] | Lista de investimentos carrega |
| [ ] | Filtro por tipo funciona |
| [ ] | Totais calculados corretamente |
| [ ] | Total aplicado está correto |
| [ ] | Total atual está correto |
| [ ] | Rentabilidade total está correta |
| [ ] | Lucro/prejuízo é calculado corretamente |

### Gráficos
| Status | Funcionalidade |
|--------|----------------|
| [ ] | Gráfico de evolução funciona |
| [ ] | Gráfico de alocação funciona |
| [ ] | Gráfico por tipo de investimento funciona |
| [ ] | Tooltips mostram valores corretos |

### CRUD
| Status | Funcionalidade |
|--------|----------------|
| [ ] | Criar investimento Renda Fixa |
| [ ] | Criar investimento Renda Variável |
| [ ] | Criar investimento Cripto |
| [ ] | Criar investimento Fundo |
| [ ] | Data de aplicação é salva corretamente |
| [ ] | Data de vencimento é salva (quando aplicável) |
| [ ] | Rentabilidade é calculada automaticamente |
| [ ] | Editar investimento funciona |
| [ ] | Excluir investimento funciona |

---

## 📊 Orçamento (Regra 50/30/20)

| Status | Funcionalidade |
|--------|----------------|
| [ ] | Visualização do orçamento mensal |
| [ ] | Essencial (50%) - projetado vs realizado |
| [ ] | Livre (30%) - projetado vs realizado |
| [ ] | Investimento (20%) - projetado vs realizado |
| [ ] | Barras de progresso renderizam |
| [ ] | Cores indicam status (verde/amarelo/vermelho) |
| [ ] | Histórico de meses anteriores |
| [ ] | Comparação entre meses |

---

## ⚙️ Configurações

| Status | Funcionalidade |
|--------|----------------|
| [ ] | Página de configurações carrega |
| [ ] | Gerenciar membros da família |
| [ ] | Adicionar membro funciona |
| [ ] | Remover membro funciona |
| [ ] | Ajustar percentuais da regra 50/30/20 |
| [ ] | Configurar moeda |
| [ ] | Configurar formato de data |
| [ ] | Exportar dados (CSV/JSON) |
| [ ] | Importar dados funciona |
| [ ] | Backup de dados funciona |

---

## 🔔 Notificações/Alertas

| Status | Funcionalidade |
|--------|----------------|
| [ ] | Ícone de sino visível |
| [ ] | Badge contador no sino |
| [ ] | Dropdown de notificações abre |
| [ ] | Alerta ao atingir 70% do orçamento de categoria |
| [ ] | Alerta ao atingir 100% do orçamento de categoria |
| [ ] | Notificação de meta batida |
| [ ] | Notificação de vencimento de investimento |
| [ ] | Marcar notificação como lida |
| [ ] | Marcar todas como lidas |
| [ ] | Notificações antigas são removidas |

---

## 📱 Responsividade

### Mobile (< 768px)
| Status | Funcionalidade |
|--------|----------------|
| [ ] | Dashboard funciona em mobile |
| [ ] | Cards empilham verticalmente |
| [ ] | Menu hamburger aparece |
| [ ] | Menu mobile abre/fecha corretamente |
| [ ] | Navegação mobile funciona |
| [ ] | Tabelas viram cards/lista em mobile |
| [ ] | Modais ocupam tela cheia em mobile |
| [ ] | Formulários são usáveis em mobile |
| [ ] | FAB (botão flutuante) acessível |
| [ ] | Touch funciona corretamente |
| [ ] | Scroll horizontal não existe |
| [ ] | Textos são legíveis |

### Tablet (768px - 1024px)
| Status | Funcionalidade |
|--------|----------------|
| [ ] | Layout adapta para tablet |
| [ ] | Sidebar colapsa ou se adapta |
| [ ] | Gráficos redimensionam |

### Desktop (> 1024px)
| Status | Funcionalidade |
|--------|----------------|
| [ ] | Layout desktop completo |
| [ ] | Sidebar fixa visível |
| [ ] | Hover states funcionam |

---

## 🌙 Dark Mode

| Status | Funcionalidade |
|--------|----------------|
| [ ] | Toggle dark/light mode visível |
| [ ] | Toggle funciona corretamente |
| [ ] | Preferência persiste após refresh |
| [ ] | Respeita preferência do sistema |
| [ ] | Dashboard renderiza corretamente em dark |
| [ ] | Transações renderiza corretamente em dark |
| [ ] | Metas renderiza corretamente em dark |
| [ ] | Investimentos renderiza corretamente em dark |
| [ ] | Modais renderizam corretamente em dark |
| [ ] | Gráficos adaptam cores para dark mode |
| [ ] | Inputs e forms legíveis em dark |
| [ ] | Contraste adequado em todos os textos |

---

## ⚡ Performance

| Status | Funcionalidade |
|--------|----------------|
| [ ] | Página inicial carrega em < 3s |
| [ ] | Dashboard carrega em < 2s |
| [ ] | Lista de transações carrega em < 2s |
| [ ] | Não há layout shift visível (CLS) |
| [ ] | Skeleton loaders aparecem durante carregamento |
| [ ] | Imagens são otimizadas |
| [ ] | Sem erros no console do navegador |
| [ ] | Sem warnings no console |
| [ ] | Memória não cresce indefinidamente |
| [ ] | Navegação entre páginas é fluida |

---

## 🔒 Segurança

| Status | Funcionalidade |
|--------|----------------|
| [ ] | Dados sensíveis não aparecem na URL |
| [ ] | Senhas são mascaradas |
| [ ] | HTTPS está habilitado |
| [ ] | Tokens não são expostos no client |
| [ ] | RLS está funcionando no Supabase |
| [ ] | Usuário só vê seus próprios dados |

---

## 🐛 Cenários de Erro

| Status | Funcionalidade |
|--------|----------------|
| [ ] | Erro de rede mostra mensagem amigável |
| [ ] | 404 - página não encontrada funciona |
| [ ] | Campos inválidos mostram erro |
| [ ] | Retry funciona após erro de rede |
| [ ] | Dados não são perdidos após erro |

---

## 📝 Notas do Teste

### Bugs Encontrados
1.
2.
3.

### Melhorias Sugeridas
1.
2.
3.

### Observações
-
-
-

---

## Resumo

| Categoria | Total | ✅ Passou | ❌ Falhou | ⏭️ Pulado |
|-----------|-------|----------|----------|----------|
| Autenticação | 6 | | | |
| Dashboard | 16 | | | |
| Transações | 29 | | | |
| Contas | 13 | | | |
| Categorias | 12 | | | |
| Metas | 17 | | | |
| Investimentos | 17 | | | |
| Orçamento | 8 | | | |
| Configurações | 10 | | | |
| Notificações | 10 | | | |
| Responsividade | 16 | | | |
| Dark Mode | 12 | | | |
| Performance | 10 | | | |
| Segurança | 6 | | | |
| Erros | 5 | | | |
| **TOTAL** | **177** | | | |

---

> **Aprovação**: [ ] Aprovado para produção | [ ] Requer correções

> **Assinatura**: __________________ Data: ____/____/____
