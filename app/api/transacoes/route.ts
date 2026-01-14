import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import type { DbTransactionType, DbOwnershipType } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { ErrorResponses, SuccessResponses } from "@/lib/api";

// GET - Listar transações com filtros
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Filtros opcionais
    const categoryId = searchParams.get("categoryId");
    const accountId = searchParams.get("accountId");
    const tipo = searchParams.get("tipo");
    const ownership = searchParams.get("ownership");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const mesFatura = searchParams.get("mesFatura"); // NOVO: filtro por mês da fatura (YYYY-MM-01)
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    let query = supabase
      .from("transacoes")
      .select("*, categorias(*), contas(*)")
      .eq("user_id", auth.user.id);

    // Aplicar filtros
    if (categoryId) query = query.eq("category_id", categoryId);
    if (accountId) query = query.eq("account_id", accountId);
    if (tipo) query = query.eq("tipo", tipo);
    if (ownership) query = query.eq("ownership", ownership);
    if (dataInicio) query = query.gte("data", dataInicio);
    if (dataFim) query = query.lte("data", dataFim);
    if (mesFatura) query = query.eq("mes_fatura", mesFatura); // Filtro exato por mês da fatura

    query = query
      .order("data", { ascending: false })
      .limit(limit ? parseInt(limit) : 50);

    if (offset) {
      query = query.range(
        parseInt(offset),
        parseInt(offset) + (limit ? parseInt(limit) : 50) - 1
      );
    }

    const { data: transactions, error } = await query;

    if (error) throw error;

    // Get total count
    let countQuery = supabase
      .from("transacoes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.user.id);

    if (categoryId) countQuery = countQuery.eq("category_id", categoryId);
    if (accountId) countQuery = countQuery.eq("account_id", accountId);
    if (tipo) countQuery = countQuery.eq("tipo", tipo);
    if (ownership) countQuery = countQuery.eq("ownership", ownership);
    if (dataInicio) countQuery = countQuery.gte("data", dataInicio);
    if (dataFim) countQuery = countQuery.lte("data", dataFim);
    if (mesFatura) countQuery = countQuery.eq("mes_fatura", mesFatura);

    const { count } = await countQuery;

    // Map to expected format
    const mappedTransactions = (transactions || []).map((t) => ({
      ...t,
      category: t.categorias,
      account: t.contas,
    }));

    const currentLimit = limit ? parseInt(limit) : 50;
    const currentOffset = offset ? parseInt(offset) : 0;
    const totalCount = count ?? 0;

    return NextResponse.json({
      transactions: mappedTransactions,
      total: totalCount,
      pagination: {
        limit: currentLimit,
        offset: currentOffset,
        hasMore: currentOffset + currentLimit < totalCount,
        totalPages: Math.ceil(totalCount / currentLimit),
        currentPage: Math.floor(currentOffset / currentLimit) + 1,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch transactions", error, { action: "fetch", resource: "transacoes" });
    return ErrorResponses.serverError("Erro ao buscar transações");
  }
}

// POST - Criar transação
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const body = await request.json();
    const supabase = await getSupabaseClient();

    const {
      descricao,
      valor,
      tipo,
      data,
      mesFatura, // NOVO: mês da fatura (obrigatório para cartão de crédito)
      recorrente,
      parcelas,
      categoryId,
      accountId,
      tags,
      notas,
      ownership,
    } = body;

    // Validações
    if (!descricao?.trim()) {
      return ErrorResponses.badRequest("Descrição é obrigatória");
    }

    if (!valor || valor <= 0) {
      return ErrorResponses.badRequest("Valor deve ser maior que zero");
    }

    if (!tipo) {
      return ErrorResponses.badRequest("Tipo é obrigatório");
    }

    if (!data) {
      return ErrorResponses.badRequest("Data é obrigatória");
    }

    // Verificar se a conta pertence ao usuário (se fornecida)
    if (accountId) {
      const { data: account } = await supabase
        .from("contas")
        .select("id")
        .eq("id", accountId)
        .eq("user_id", auth.user.id)
        .single();

      if (!account) {
        return ErrorResponses.notFound("Conta", true);
      }
    }

    // Função para calcular mes_fatura
    // Se mesFatura foi enviado explicitamente (importação de fatura), usa ele
    // Para cartão de crédito sem mesFatura: usa mesFatura enviado pelo frontend
    // Para outras contas: primeiro dia do mês da transação
    const calcularMesFatura = (dataTransacao: string, mesFaturaParam?: string): string => {
      // Se mesFatura foi enviado explicitamente, SEMPRE usar ele
      // Isso é importante para importação de faturas de cartão
      if (mesFaturaParam) {
        return mesFaturaParam;
      }
      const date = new Date(dataTransacao);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
    };

    // If it's an installment transaction, create all installments in batch (atômico)
    if (parcelas && parcelas > 1) {
      // Validar limite de parcelas
      if (parcelas > 48) {
        return ErrorResponses.badRequest("Número máximo de parcelas é 48");
      }

      const transactions = [];
      // Calcular valor da parcela arredondado para baixo
      const valorParcela = Math.floor((valor / parcelas) * 100) / 100;
      // A última parcela absorve a diferença para evitar perda de centavos
      const valorUltimaParcela = Math.round((valor - valorParcela * (parcelas - 1)) * 100) / 100;
      const dataBase = new Date(data);

      // Para parcelas, calcular mes_fatura de cada uma
      // Se mesFatura foi informado (cartão), incrementa o mês para cada parcela
      // Se não foi informado, usa o mês da data da parcela
      const mesFaturaBase = mesFatura ? new Date(mesFatura) : null;

      for (let i = 0; i < parcelas; i++) {
        const dataParcela = new Date(dataBase);
        dataParcela.setMonth(dataParcela.getMonth() + i);

        // Calcular mes_fatura da parcela
        let mesFaturaParcela: string;
        if (mesFaturaBase) {
          // Cartão de crédito: incrementa o mês da fatura base
          const mesFaturaParcelaDate = new Date(mesFaturaBase);
          mesFaturaParcelaDate.setMonth(mesFaturaParcelaDate.getMonth() + i);
          mesFaturaParcela = `${mesFaturaParcelaDate.getFullYear()}-${String(mesFaturaParcelaDate.getMonth() + 1).padStart(2, "0")}-01`;
        } else {
          // Outras contas: usa o mês da data da parcela
          mesFaturaParcela = `${dataParcela.getFullYear()}-${String(dataParcela.getMonth() + 1).padStart(2, "0")}-01`;
        }

        // Usar data local para evitar problemas de fuso horário
        const dataParcelaLocal = `${dataParcela.getFullYear()}-${String(dataParcela.getMonth() + 1).padStart(2, "0")}-${String(dataParcela.getDate()).padStart(2, "0")}`;

        const transactionData: Record<string, unknown> = {
          descricao: `${descricao} (${i + 1}/${parcelas})`,
          valor: i === parcelas - 1 ? valorUltimaParcela : valorParcela, // Última parcela absorve a diferença
          tipo: tipo as DbTransactionType,
          data: dataParcelaLocal,
          mes_fatura: mesFaturaParcela,
          recorrente: false,
          parcelas,
          parcela_atual: i + 1,
          category_id: categoryId || null,
          account_id: accountId || null,
          user_id: auth.user.id,
          tags: tags || [],
          notas: notas || null,
        };

        // Só adicionar ownership se foi explicitamente fornecido
        if (ownership) {
          transactionData.ownership = ownership as DbOwnershipType;
        }

        transactions.push(transactionData);
      }

      // Insert ALL installments atomically (se uma falhar, nenhuma é criada)
      const { data: createdTransactions, error } = await supabase
        .from("transacoes")
        .insert(transactions)
        .select();

      if (error) {
        logger.error("Failed to create installments", error, { action: "create_installments", resource: "transacoes" });
        return ErrorResponses.serverError("Erro ao criar parcelas. Nenhuma foi criada.");
      }

      return SuccessResponses.created({
        count: createdTransactions?.length || 0,
        transactions: createdTransactions,
      });
    }

    // Single transaction - usar data local para evitar problemas de fuso horário
    const dateObj = new Date(data);
    const dataTransacao = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    const insertData: Record<string, unknown> = {
      descricao: descricao.trim(),
      valor,
      tipo: tipo as DbTransactionType,
      data: dataTransacao,
      mes_fatura: calcularMesFatura(dataTransacao, mesFatura), // NOVO: mês da fatura
      recorrente: recorrente || false,
      category_id: categoryId || null,
      account_id: accountId || null,
      user_id: auth.user.id,
      tags: tags || [],
      notas: notas || null,
    };

    // Só adicionar ownership se foi explicitamente fornecido
    if (ownership) {
      insertData.ownership = ownership as DbOwnershipType;
    }

    const { data: transaction, error } = await supabase
      .from("transacoes")
      .insert(insertData)
      .select("*, categorias(*), contas(*)")
      .single();

    if (error) throw error;

    return SuccessResponses.created({
      ...transaction,
      category: transaction.categorias,
      account: transaction.contas,
    });
  } catch (error) {
    // Capturar erro do Supabase que tem formato específico
    const supabaseError = error as { message?: string; code?: string; details?: string; hint?: string };
    const errorMessage = supabaseError?.message ||
      (error instanceof Error ? error.message : "Erro ao criar transação");
    const errorDetails = supabaseError?.details || supabaseError?.hint || supabaseError?.code;

    logger.error("Failed to create transaction", error, {
      action: "create",
      resource: "transacoes",
      errorCode: supabaseError?.code,
      errorHint: supabaseError?.hint,
    });

    return ErrorResponses.serverError(
      errorDetails ? `${errorMessage} (${errorDetails})` : errorMessage
    );
  }
}

// PUT - Atualizar transação
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const body = await request.json();
    const supabase = await getSupabaseClient();

    const { id, descricao, valor, tipo, data, mesFatura, recorrente, categoryId, accountId, tags, notas, ownership } = body;

    if (!id) {
      return ErrorResponses.badRequest("ID da transação é obrigatório");
    }

    // Verificar se transação pertence ao usuário
    const { data: existing } = await supabase
      .from("transacoes")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!existing) {
      return ErrorResponses.notFound("Transação", true);
    }

    // Verificar se a conta pertence ao usuário (se fornecida)
    if (accountId) {
      const { data: account } = await supabase
        .from("contas")
        .select("id")
        .eq("id", accountId)
        .eq("user_id", auth.user.id)
        .single();

      if (!account) {
        return ErrorResponses.notFound("Conta", true);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (descricao !== undefined) updateData.descricao = descricao;
    if (valor !== undefined) updateData.valor = valor;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (data !== undefined) {
      const d = new Date(data);
      updateData.data = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    if (mesFatura !== undefined) updateData.mes_fatura = mesFatura;
    if (recorrente !== undefined) updateData.recorrente = recorrente;
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (accountId !== undefined) updateData.account_id = accountId;
    if (tags !== undefined) updateData.tags = tags;
    if (notas !== undefined) updateData.notas = notas;
    if (ownership !== undefined) updateData.ownership = ownership;

    const { data: transaction, error } = await supabase
      .from("transacoes")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .select("*, categorias(*), contas(*)")
      .single();

    if (error) throw error;

    return SuccessResponses.ok({
      ...transaction,
      category: transaction.categorias,
      account: transaction.contas,
    });
  } catch (error) {
    logger.error("Failed to update transaction", error, { action: "update", resource: "transacoes" });
    return ErrorResponses.serverError("Erro ao atualizar transação");
  }
}

// DELETE - Deletar transação
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return ErrorResponses.badRequest("ID da transação é obrigatório");
    }

    const supabase = await getSupabaseClient();

    // Verificar se transação pertence ao usuário
    const { data: existing } = await supabase
      .from("transacoes")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!existing) {
      return ErrorResponses.notFound("Transação", true);
    }

    const { error } = await supabase
      .from("transacoes")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return SuccessResponses.deleted();
  } catch (error) {
    logger.error("Failed to delete transaction", error, { action: "delete", resource: "transacoes" });
    return ErrorResponses.serverError("Erro ao deletar transação");
  }
}
