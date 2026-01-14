import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import { logger } from "@/lib/logger";
import { ErrorResponses, SuccessResponses } from "@/lib/api";
import type { DbTransactionType, DbOwnershipType, DbAccountType, DbCategoryType, DbCategoryGroup } from "@/lib/supabase";

interface ImportTransaction {
  descricao: string;
  valor: number;
  tipo: DbTransactionType;
  data: string;
  recorrente?: boolean;
  parcelas?: number;
  parcela_atual?: number;
  tags?: string[];
  notas?: string;
  ownership?: DbOwnershipType;
  category_id?: string;
  account_id?: string;
}

interface ImportAccount {
  nome: string;
  tipo: DbAccountType;
  banco?: string;
  saldo?: number;
  cor?: string;
  icone?: string;
  ativo?: boolean;
}

interface ImportCategory {
  nome: string;
  tipo: DbCategoryType;
  cor: string;
  icone?: string;
  grupo: DbCategoryGroup;
  limite_mensal?: number;
}

interface ImportData {
  transacoes?: ImportTransaction[];
  contas?: ImportAccount[];
  categorias?: ImportCategory[];
}

interface ValidationError {
  index: number;
  field: string;
  message: string;
}

// Validar transação
function validateTransaction(tx: ImportTransaction, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!tx.descricao?.trim()) {
    errors.push({ index, field: "descricao", message: "Descrição é obrigatória" });
  }

  if (!tx.valor || tx.valor <= 0) {
    errors.push({ index, field: "valor", message: "Valor deve ser maior que zero" });
  }

  if (!tx.tipo || !["ENTRADA", "SAIDA", "TRANSFERENCIA", "INVESTIMENTO"].includes(tx.tipo)) {
    errors.push({ index, field: "tipo", message: "Tipo inválido" });
  }

  if (!tx.data) {
    errors.push({ index, field: "data", message: "Data é obrigatória" });
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    if (!dateRegex.test(tx.data)) {
      errors.push({ index, field: "data", message: "Data deve estar no formato YYYY-MM-DD" });
    }
  }

  if (tx.ownership && !["CASA", "PESSOAL"].includes(tx.ownership)) {
    errors.push({ index, field: "ownership", message: "Ownership inválido" });
  }

  return errors;
}

// Validar conta
function validateAccount(acc: ImportAccount, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!acc.nome?.trim()) {
    errors.push({ index, field: "nome", message: "Nome é obrigatório" });
  }

  if (!acc.tipo || !["CORRENTE", "CARTAO_CREDITO", "INVESTIMENTO", "DINHEIRO", "OUTRO"].includes(acc.tipo)) {
    errors.push({ index, field: "tipo", message: "Tipo inválido" });
  }

  return errors;
}

// Validar categoria
function validateCategory(cat: ImportCategory, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!cat.nome?.trim()) {
    errors.push({ index, field: "nome", message: "Nome é obrigatório" });
  }

  if (!cat.tipo || !["ENTRADA", "SAIDA"].includes(cat.tipo)) {
    errors.push({ index, field: "tipo", message: "Tipo inválido" });
  }

  if (!cat.cor) {
    errors.push({ index, field: "cor", message: "Cor é obrigatória" });
  }

  if (!cat.grupo || !["ESSENCIAL", "NAO_ESSENCIAL", "INVESTIMENTO", "DIVIDA", "RENDA"].includes(cat.grupo)) {
    errors.push({ index, field: "grupo", message: "Grupo inválido" });
  }

  return errors;
}

// Detectar duplicatas de transações
function detectDuplicateTransactions(
  newTx: ImportTransaction[],
  existingTx: { descricao: string; valor: number; data: string }[]
): number[] {
  const duplicateIndices: number[] = [];
  const existingSet = new Set(
    existingTx.map((tx) => `${tx.descricao}|${tx.valor}|${tx.data.split("T")[0]}`)
  );

  newTx.forEach((tx, index) => {
    const key = `${tx.descricao}|${tx.valor}|${tx.data.split("T")[0]}`;
    if (existingSet.has(key)) {
      duplicateIndices.push(index);
    }
  });

  return duplicateIndices;
}

// POST - Importar dados
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const body: ImportData & { skipDuplicates?: boolean; preview?: boolean } = await request.json();

    const { transacoes, contas, categorias, skipDuplicates = true, preview = false } = body;

    // Validar que há algo para importar
    if (!transacoes?.length && !contas?.length && !categorias?.length) {
      return ErrorResponses.badRequest("Nenhum dado para importar");
    }

    const validationErrors: { resource: string; errors: ValidationError[] }[] = [];
    const results: Record<string, { imported: number; skipped: number; errors: number }> = {};

    // ========== VALIDAR TRANSAÇÕES ==========
    if (transacoes?.length) {
      const txErrors: ValidationError[] = [];
      transacoes.forEach((tx, index) => {
        txErrors.push(...validateTransaction(tx, index));
      });

      if (txErrors.length > 0) {
        validationErrors.push({ resource: "transacoes", errors: txErrors });
      }
    }

    // ========== VALIDAR CONTAS ==========
    if (contas?.length) {
      const accErrors: ValidationError[] = [];
      contas.forEach((acc, index) => {
        accErrors.push(...validateAccount(acc, index));
      });

      if (accErrors.length > 0) {
        validationErrors.push({ resource: "contas", errors: accErrors });
      }
    }

    // ========== VALIDAR CATEGORIAS ==========
    if (categorias?.length) {
      const catErrors: ValidationError[] = [];
      categorias.forEach((cat, index) => {
        catErrors.push(...validateCategory(cat, index));
      });

      if (catErrors.length > 0) {
        validationErrors.push({ resource: "categorias", errors: catErrors });
      }
    }

    // Se houver erros de validação, retornar
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Erros de validação encontrados",
          validationErrors,
        },
        { status: 400 }
      );
    }

    // Se for preview, verificar duplicatas e retornar
    if (preview) {
      const previewResult: Record<string, { total: number; duplicates: number }> = {};

      if (transacoes?.length) {
        // Buscar transações existentes para detectar duplicatas
        const { data: existingTx } = await supabase
          .from("transacoes")
          .select("descricao, valor, data")
          .eq("user_id", auth.user.id);

        const duplicates = detectDuplicateTransactions(transacoes, existingTx || []);
        previewResult.transacoes = {
          total: transacoes.length,
          duplicates: duplicates.length,
        };
      }

      if (contas?.length) {
        previewResult.contas = { total: contas.length, duplicates: 0 };
      }

      if (categorias?.length) {
        previewResult.categorias = { total: categorias.length, duplicates: 0 };
      }

      return NextResponse.json({
        success: true,
        preview: true,
        data: previewResult,
        message: "Preview da importação",
      });
    }

    // ========== IMPORTAR CONTAS ==========
    if (contas?.length) {
      const accountsToInsert = contas.map((acc) => ({
        user_id: auth.user.id,
        nome: acc.nome.trim(),
        tipo: acc.tipo,
        banco: acc.banco || null,
        saldo: acc.saldo || 0,
        cor: acc.cor || "#6366f1",
        icone: acc.icone || null,
        ativo: acc.ativo !== false,
      }));

      const { data: insertedAccounts, error } = await supabase
        .from("contas")
        .insert(accountsToInsert)
        .select();

      if (error) {
        logger.error("Failed to import accounts", error, { action: "import", resource: "contas" });
        results.contas = { imported: 0, skipped: 0, errors: contas.length };
      } else {
        results.contas = { imported: insertedAccounts?.length || 0, skipped: 0, errors: 0 };
      }
    }

    // ========== IMPORTAR CATEGORIAS ==========
    if (categorias?.length) {
      const categoriesToInsert = categorias.map((cat) => ({
        user_id: auth.user.id,
        nome: cat.nome.trim(),
        tipo: cat.tipo,
        cor: cat.cor,
        icone: cat.icone || null,
        grupo: cat.grupo,
        limite_mensal: cat.limite_mensal || null,
      }));

      const { data: insertedCategories, error } = await supabase
        .from("categorias")
        .insert(categoriesToInsert)
        .select();

      if (error) {
        logger.error("Failed to import categories", error, { action: "import", resource: "categorias" });
        results.categorias = { imported: 0, skipped: 0, errors: categorias.length };
      } else {
        results.categorias = { imported: insertedCategories?.length || 0, skipped: 0, errors: 0 };
      }
    }

    // ========== IMPORTAR TRANSAÇÕES ==========
    if (transacoes?.length) {
      let txToImport = transacoes;
      let skippedCount = 0;

      // Detectar e filtrar duplicatas se necessário
      if (skipDuplicates) {
        const { data: existingTx } = await supabase
          .from("transacoes")
          .select("descricao, valor, data")
          .eq("user_id", auth.user.id);

        const duplicateIndices = new Set(
          detectDuplicateTransactions(transacoes, existingTx || [])
        );

        txToImport = transacoes.filter((_, index) => !duplicateIndices.has(index));
        skippedCount = duplicateIndices.size;
      }

      if (txToImport.length > 0) {
        // Buscar tipos das contas para calcular mes_fatura corretamente
        const accountIds = Array.from(new Set(txToImport.map((tx) => tx.account_id).filter((id): id is string => Boolean(id))));
        const { data: accountsData } = await supabase
          .from("contas")
          .select("id, tipo")
          .in("id", accountIds.length > 0 ? accountIds : ["__none__"]);

        const accountTypeMap = new Map<string, string>();
        (accountsData || []).forEach((acc) => {
          accountTypeMap.set(acc.id, acc.tipo);
        });

        const transactionsToInsert = txToImport.map((tx) => {
          // Calcular mes_fatura baseado no tipo de conta
          const txDate = new Date(tx.data);
          const accountType = tx.account_id ? accountTypeMap.get(tx.account_id) : null;

          // Para cartão de crédito: se mesFatura não foi fornecido, usa mês seguinte
          // Para outras contas: usa o mês da transação
          let mesFatura: string;
          if (accountType === "CARTAO_CREDITO") {
            // Para cartão, se não tem mesFatura, assume que vai para fatura do mês seguinte
            const faturaDate = new Date(txDate.getFullYear(), txDate.getMonth() + 1, 1);
            mesFatura = `${faturaDate.getFullYear()}-${String(faturaDate.getMonth() + 1).padStart(2, "0")}-01`;
          } else {
            // Para outras contas, usa o mês da transação
            mesFatura = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}-01`;
          }

          return {
            user_id: auth.user.id,
            descricao: tx.descricao.trim(),
            valor: tx.valor,
            tipo: tx.tipo,
            data: new Date(tx.data).toISOString(),
            mes_fatura: mesFatura,
            recorrente: tx.recorrente || false,
            parcelas: tx.parcelas || null,
            parcela_atual: tx.parcela_atual || null,
            tags: tx.tags || [],
            notas: tx.notas || null,
            ownership: tx.ownership || "CASA",
            category_id: tx.category_id || null,
            account_id: tx.account_id || null,
          };
        });

        const { data: insertedTx, error } = await supabase
          .from("transacoes")
          .insert(transactionsToInsert)
          .select();

        if (error) {
          logger.error("Failed to import transactions", error, { action: "import", resource: "transacoes" });
          results.transacoes = { imported: 0, skipped: skippedCount, errors: txToImport.length };
        } else {
          results.transacoes = {
            imported: insertedTx?.length || 0,
            skipped: skippedCount,
            errors: 0,
          };
        }
      } else {
        results.transacoes = { imported: 0, skipped: skippedCount, errors: 0 };
      }
    }

    return SuccessResponses.ok({
      success: true,
      message: "Importação concluída",
      results,
    });
  } catch (error) {
    logger.error("Failed to import data", error, { action: "import", resource: "import" });
    return ErrorResponses.serverError("Erro ao importar dados");
  }
}
