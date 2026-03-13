# Ralph Fix Plan

## Stories to Implement

### Fundação de Dados — Migration & Rastreabilidade
> Goal: O casal consegue ver a origem de cada transação (manual, quick-add, apple_pay, ocr_import), e o banco está preparado para reconciliação e alertas.

- [x] Story 1.1: Migration de Banco — Campos de Rastreabilidade e Tabela Alertas
  > As a desenvolvedor
  > I want executar a migration 009 que adiciona campos de rastreabilidade em transações e cria a tabela de alertas
  > So that o banco esteja preparado para Apple Pay, reconciliação e alertas WhatsApp.
  > AC: Given o banco de dados atual sem campo `origem` em transações, When a migration 009 é executada, Then a tabela `transacoes` tem o campo `origem` (enum `manual | quick_add | apple_pay | ocr_import`, NOT NULL, default `manual`), And a tabela `transacoes` tem o campo `fatura_referencia` (text nullable), And a tabela `transacoes` tem o campo `matched_transacao_id` (UUID nullable, FK para `transacoes.id`), And existe índice em `transacoes.origem`, And a tabela `alertas` existe com campos: id, user_id, categoria_id, threshold, mensagem, canal, enviado_em, created_at, And RLS está ativo na tabela `alertas` com policy de isolamento por `user_id`, And transações existentes têm `origem = 'manual'` como valor default
  > Spec: specs/planning-artifacts/epics.md#story-1-1
- [x] Story 1.2: Types, Mappers e Suporte a Origem no Sistema
  > As a usuário do DinDin
  > I want que o sistema reconheça e exiba a origem de cada transação
  > So that eu saiba se uma transação foi digitada manualmente, veio do Apple Pay, do quick-add ou de importação OCR.
  > AC: Given a migration 009 já executada (Story 1.1), When os tipos TypeScript são atualizados, Then o type `Transaction` (UI) inclui campo `origin` com tipo `TransactionOrigin`, And o type DB inclui `origem` com tipo `DbTransactionOrigin`, And os mappers DB↔UI convertem `origem` ↔ `origin` corretamente, And o type `Alert` (UI) e seu mapper DB↔UI existem para a tabela `alertas`
  > AC: Given o filtro de transações existente, When o usuário filtra por origem, Then a UI exibe opção de filtro por origem (manual, quick-add, apple_pay, ocr_import), And a API `/api/transacoes` aceita query param `origem` para filtrar, And testes unitários cobrem os novos types, mappers e filtro
  > Spec: specs/planning-artifacts/epics.md#story-1-2
### Captura Automática via Apple Pay
> Goal: Fernanda compra via Apple Pay e a transação entra automaticamente no DinDin — sem digitação, com categorização por IA.

- [x] Story 2.1: Quick-Add com Origem Apple Pay
  > As a Fernanda
  > I want que compras feitas via Apple Pay sejam registradas automaticamente no DinDin através do iOS Shortcuts
  > So that 99% das minhas compras entrem no sistema sem digitação.
  > AC: Given o endpoint `/api/quick-add` existente, When um POST é recebido com header `X-API-Key` válido e campo `origem: "apple_pay"`, Then a transação é criada com `origem = 'apple_pay'` no banco, And a resposta retorna em menos de 500ms (excluindo rede)
  > AC: Given um POST para `/api/quick-add` sem campo `origem`, When a transação é criada, Then o campo `origem` recebe o valor `quick_add` (comportamento existente preservado)
  > AC: Given um POST com `origem` inválido (ex: `"foo"`), When a validação é executada, Then retorna `400 Bad Request` com mensagem de erro apropriada
  > AC: Given uma transação criada via Apple Pay, When o usuário visualiza a transação na lista, Then a origem é exibida como badge/indicador visual (ex: ícone Apple Pay)
  > Spec: specs/planning-artifacts/epics.md#story-2-1
- [ ] Story 2.2: Categorização Automática via IA para Apple Pay
  > As a Fernanda
  > I want que transações do Apple Pay sejam categorizadas automaticamente pela IA
  > So that eu não precise abrir o app para escolher categoria manualmente.
  > AC: Given uma transação recebida via Apple Pay com descrição do estabelecimento (ex: "iFood", "Uber", "Posto Shell"), When o quick-add processa a transação, Then a IA (Claude) categoriza automaticamente baseada na descrição e categorias existentes do usuário, And a transação é salva com a categoria sugerida pela IA
  > AC: Given a IA não consegue determinar a categoria com confiança, When a categorização falha ou timeout (60s), Then a transação é salva sem categoria (nullable) para revisão posterior, And o processamento não é bloqueado — transação registrada mesmo sem categoria
  > AC: Given uma descrição de estabelecimento já vista anteriormente (ex: "iFood" → "Delivery"), When a IA categoriza, Then utiliza o histórico de categorizações anteriores do mesmo estabelecimento como contexto, And a latência total (registro + categorização) permanece abaixo de 5 segundos
  > AC: Given a API da Claude está indisponível, When uma transação Apple Pay chega, Then a transação é registrada normalmente sem categoria, And um log de erro é registrado via `logger.error()`, And o usuário não é impactado — registro continua funcionando
  > Spec: specs/planning-artifacts/epics.md#story-2-2
### Reconciliação Inteligente de Faturas
> Goal: Fernanda importa a fatura do cartão e o sistema cruza automaticamente com transações já registradas via Apple Pay — zero duplicatas, 30 segundos do início ao fim.

- [ ] Story 3.1: Engine de Matching Determinístico
  > As a sistema DinDin
  > I want comparar transações extraídas da fatura com transações já registradas usando scoring por valor e data
  > So that matches óbvios sejam identificados automaticamente sem depender de IA.
  > AC: Given uma lista de transações extraídas via OCR e transações existentes com `origem = 'apple_pay'` ou `'quick_add'`, When o scorer processa um par de transações, Then atribui pontuação: valor exato = 50pts, data exata = 30pts, data ± 1 dia = 20pts, data ± 3 dias = 10pts
  > AC: Given um par de transações com score ≥ 70, When o matcher classifica o resultado, Then marca como `matched` (auto-confirmado)
  > AC: Given um par com score entre 40-69, When o matcher classifica, Then marca como `ambiguous` (pendente resolução IA — Story 3.2)
  > AC: Given uma transação da fatura sem nenhum match com score ≥ 40, When o matcher classifica, Then marca como `new` (transação nova a ser confirmada pelo usuário)
  > AC: Given uma transação da fatura que matcha com múltiplas existentes (score ≥ 70 para mais de uma), When o matcher classifica, Then marca como `conflict` (usuário precisa resolver)
  > AC: Given o matcher recebe a lista completa de transações, When processa todas, Then retorna objeto com 4 listas: `matched`, `ambiguous`, `new`, `conflict`, And testes unitários cobrem todos os cenários de scoring e classificação, And testes usam fixtures em `__tests__/fixtures/reconciliation.ts`
  > Spec: specs/planning-artifacts/epics.md#story-3-1
- [ ] Story 3.2: Resolução IA para Transações Ambíguas
  > As a sistema DinDin
  > I want usar Claude AI para resolver transações com score ambíguo (40-69)
  > So that o casal tenha menos itens para revisar manualmente.
  > AC: Given transações classificadas como `ambiguous` pelo matcher (Story 3.1), When o ai-resolver envia para Claude AI com contexto (descrição, valor, data de ambos), Then Claude retorna `matched` ou `not_matched` com justificativa para cada par, And transações matched pela IA são reclassificadas para `matched_ai`, And transações not_matched são reclassificadas para `new`
  > AC: Given a API Claude está indisponível ou timeout (60s), When o ai-resolver tenta processar, Then mantém as transações como `ambiguous` para revisão manual pelo usuário, And registra erro via `logger.error()`, And o fluxo de reconciliação não é bloqueado
  > AC: Given que ~90% das transações são resolvidas deterministicamente (Story 3.1), When apenas ~10% restantes vão para IA, Then o custo de tokens Claude é otimizado — batch de ambíguos em uma única chamada, And testes unitários cobrem sucesso, falha e timeout da IA
  > Spec: specs/planning-artifacts/epics.md#story-3-2
- [ ] Story 3.3: API de Reconciliação, UI de Revisão e Integração no Fluxo de Importação
  > As a Fernanda
  > I want revisar o resultado da reconciliação em uma tela clara e confirmar transações novas em lote
  > So that a fatura do cartão seja importada sem duplicatas em 30 segundos.
  > AC: Given o usuário importou um PDF de fatura via OCR (fluxo existente), When as transações são extraídas pela IA, Then o sistema automaticamente executa a reconciliação (matcher + ai-resolver) antes de apresentar ao usuário, And o endpoint `POST /api/reconciliacao` recebe transações OCR, busca existentes no período, e retorna resultado classificado
  > AC: Given o resultado da reconciliação, When a tela de reconciliação é exibida, Then mostra 4 seções: "Já Registradas ✓" (matched + matched_ai), "Novas Transações" (new), "Conflitos" (conflict), "Ambíguas" (ambiguous restantes), And matched mostra contagem e valor total (não editável), And matched_ai mostra sugestão da IA com opção de rejeitar, And novas mostra lista com checkbox para confirmação em lote, And conflitos mostra opções de resolução (qual transação existente é o match correto)
  > AC: Given o usuário confirma as transações novas, When clica em "Confirmar Importação", Then transações novas são salvas com `origem = 'ocr_import'` e `fatura_referencia` preenchido, And transações matched recebem `matched_transacao_id` linkando fatura ↔ Apple Pay, And usa `apiFetch()` com CSRF token para a mutação
  > AC: Given o usuário rejeita uma sugestão da IA (matched_ai), When marca como "não é match", Then a transação é movida para a lista de "Novas Transações" para inclusão
  > AC: Given todo o fluxo de importação, When medido end-to-end (upload PDF → confirmação), Then completa em menos de 30 segundos (NFR4), And o hook `useReconciliation` gerencia o estado da UI (loading, resultado, confirmação), And testes cobrem API route, componentes de UI e integração
  > Spec: specs/planning-artifacts/epics.md#story-3-3
### Alertas Proativos via WhatsApp
> Goal: O casal recebe mensagem no WhatsApp ANTES de estourar o orçamento de qualquer categoria — prevenção, não reação.

- [ ] Story 4.1: Evolution API Client e Templates de Mensagem
  > As a sistema DinDin
  > I want integrar com a Evolution API para enviar mensagens WhatsApp
  > So that o casal receba alertas de orçamento diretamente no WhatsApp.
  > AC: Given as env vars `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE` e `WHATSAPP_NUMBERS` configuradas, When o evolution-client envia uma mensagem, Then faz POST para `{EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE}` com número e texto, And retorna sucesso se status 2xx
  > AC: Given a Evolution API retorna erro ou timeout, When o client tenta enviar, Then faz 1 retry após 5 segundos de delay, And se falhar novamente, retorna erro sem lançar exceção (graceful failure), And registra erro via `logger.error()`
  > AC: Given `WHATSAPP_NUMBERS` contém múltiplos números (comma-separated), When um alerta é disparado, Then a mensagem é enviada para todos os números configurados (Alison + Fernanda)
  > AC: Given um alerta de orçamento de categoria "Delivery" a 90% (R$ 450/R$ 500), When o template de mensagem é renderizado, Then produz texto formatado: "⚠️ Vocês já usaram 90% do orçamento de Delivery (R$ 450/R$ 500). Restam X dias no mês.", And endpoint `POST /api/whatsapp/send` expõe o envio (uso interno, protegido por auth), And evolution-client é server-only — nunca importado no frontend, And testes cobrem envio, retry, falha e templates
  > Spec: specs/planning-artifacts/epics.md#story-4-1
- [ ] Story 4.2: Budget Checker, API de Alertas e Vercel Cron
  > As a casal (Alison e Fernanda)
  > I want que o sistema verifique diariamente se estamos perto de estourar alguma categoria
  > So that recebamos alertas preventivos no WhatsApp antes de ultrapassar o orçamento.
  > AC: Given categorias com limite de orçamento definido (FR22), When o budget-checker calcula o uso mensal, Then compara gastos do mês corrente contra o limite de cada categoria, And identifica categorias que ultrapassaram thresholds configurados (70%, 90%, 100%)
  > AC: Given uma categoria ultrapassou um threshold, When o checker verifica o histórico na tabela `alertas`, Then só dispara alerta se aquele threshold específico para aquela categoria NÃO foi enviado neste mês, And registra o alerta enviado na tabela `alertas` (categoria_id, threshold, mensagem, canal, enviado_em)
  > AC: Given o Vercel Cron dispara às 9h diariamente, When `GET /api/cron/check-alerts` é chamado, Then valida `CRON_SECRET` no header (Vercel injeta automaticamente), And executa budget-checker para o usuário, And envia alertas via Evolution API client (Story 4.1) para cada threshold ultrapassado
  > AC: Given um request para `/api/cron/check-alerts` sem `CRON_SECRET` válido, When o endpoint processa, Then retorna `401 Unauthorized`
  > AC: Given `vercel.json` não existe ainda no projeto, When esta story é implementada, Then cria `vercel.json` com cron config: `{ "crons": [{ "path": "/api/cron/check-alerts", "schedule": "0 12 * * *" }] }` (12h UTC = 9h BRT), And `POST /api/alertas` permite CRUD de configurações de threshold por categoria, And `GET /api/alertas` retorna configurações e histórico de alertas enviados, And testes cobrem budget-checker, cron endpoint e API de alertas
  > Spec: specs/planning-artifacts/epics.md#story-4-2
- [ ] Story 4.3: UI de Configuração de Alertas e Fallback no Dashboard
  > As a Alison ou Fernanda
  > I want configurar quais categorias recebem alertas e em quais thresholds
  > So that eu controle quais avisos o casal recebe no WhatsApp.
  > AC: Given a tela de Configurações existente, When o usuário acessa a aba de Alertas, Then vê lista de categorias com orçamento definido, And para cada categoria, pode ativar/desativar alertas, And pode escolher thresholds (70%, 90%, 100%) com checkboxes
  > AC: Given o usuário ativa alerta de 90% para "Delivery", When salva a configuração, Then a configuração é persistida via `POST /api/alertas` com CSRF token, And feedback visual confirma que foi salvo
  > AC: Given a Evolution API está indisponível, When um alerta não pode ser enviado via WhatsApp, Then o alerta é registrado na tabela `alertas` com `canal = 'dashboard'`, And o dashboard exibe um banner/notificação: "⚠️ Delivery: 90% do orçamento usado"
  > AC: Given existem alertas pendentes (fallback dashboard), When o usuário abre o dashboard, Then os alertas são exibidos de forma visível (banner ou card no topo), And o usuário pode dispensar alertas já visualizados, And componente `AlertConfigPanel` vive dentro de Configurações, And usa `apiFetch()` para mutações, And testes cobrem configuração, fallback e exibição no dashboard
  > Spec: specs/planning-artifacts/epics.md#story-4-3
### Core Financeiro Existente (Manutenção & Polish)
> Goal: Todas as capabilities já construídas — gestão de transações, contas, categorias, orçamento, dashboard, patrimônio, metas, auth, backup, OCR. Já funcionais, precisam apenas de manutenção evolutiva.

- [ ] Story 5.1: Manutenção e Polish do Core Financeiro
  > As a casal (Alison e Fernanda)
  > I want que todas as funcionalidades existentes do DinDin continuem funcionando corretamente após a implementação das novas features
  > So that a base do app permaneça estável enquanto Apple Pay, Reconciliação e Alertas são adicionados.
  > AC: Given as features existentes (transações, contas, categorias, orçamento, dashboard, patrimônio, metas, auth, backup, OCR), When as novas features (Epics 1-4) são implementadas, Then todos os 155+ testes existentes continuam passando, And `npm run lint` passa sem novos warnings, And `npm run typecheck` passa sem erros
  > AC: Given novos campos foram adicionados à tabela `transacoes` (Epic 1), When funcionalidades existentes de CRUD de transações operam, Then os campos novos (`origem`, `fatura_referencia`, `matched_transacao_id`) não quebram fluxos existentes, And transações criadas manualmente recebem `origem = 'manual'` automaticamente
  > AC: Given a tabela `alertas` foi criada (Epic 1), When RLS e policies existentes são verificados, Then nenhuma policy existente foi alterada ou removida
  > Spec: specs/planning-artifacts/epics.md#story-5-1

## Completed

## Notes
- Follow TDD methodology (red-green-refactor)
- One story per Ralph loop iteration
- Update this file after completing each story
