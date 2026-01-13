import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import { logger } from "@/lib/logger";
import { ErrorResponses } from "@/lib/api";

type ExportFormat = "json" | "csv";
type ExportResource = "transacoes" | "contas" | "categorias" | "all";

// Converte array de objetos para CSV
function toCSV(data: Record<string, unknown>[], columns?: string[]): string {
  if (data.length === 0) return "";

  const firstItem = data[0];
  if (!firstItem) return "";

  const headers = columns || Object.keys(firstItem);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) return "";
      if (typeof value === "string") {
        // Escapar aspas e envolver em aspas se contiver vírgula ou quebra de linha
        const escaped = value.replace(/"/g, '""');
        return escaped.includes(",") || escaped.includes("\n")
          ? `"${escaped}"`
          : escaped;
      }
      if (Array.isArray(value)) return `"${value.join("; ")}"`;
      return String(value);
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

// GET - Exportar dados do usuário
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);

    const format = (searchParams.get("format") || "json") as ExportFormat;
    const resource = (searchParams.get("resource") || "all") as ExportResource;
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    // Validar formato
    if (!["json", "csv"].includes(format)) {
      return ErrorResponses.badRequest("Formato inválido. Use 'json' ou 'csv'");
    }

    // Validar recurso
    if (!["transacoes", "contas", "categorias", "all"].includes(resource)) {
      return ErrorResponses.badRequest(
        "Recurso inválido. Use 'transacoes', 'contas', 'categorias' ou 'all'"
      );
    }

    const exportData: Record<string, unknown[]> = {};

    // Exportar transações
    if (resource === "transacoes" || resource === "all") {
      let query = supabase
        .from("transacoes")
        .select("id, descricao, valor, tipo, data, recorrente, parcelas, parcela_atual, tags, notas, ownership, category_id, account_id, created_at")
        .eq("user_id", auth.user.id)
        .order("data", { ascending: false });

      if (dataInicio) query = query.gte("data", dataInicio);
      if (dataFim) query = query.lte("data", dataFim);

      const { data: transacoes, error } = await query;
      if (error) throw error;

      exportData.transacoes = transacoes || [];
    }

    // Exportar contas
    if (resource === "contas" || resource === "all") {
      const { data: contas, error } = await supabase
        .from("contas")
        .select("id, nome, tipo, banco, saldo, cor, icone, ativo, created_at")
        .eq("user_id", auth.user.id)
        .order("nome");

      if (error) throw error;
      exportData.contas = contas || [];
    }

    // Exportar categorias (apenas do usuário, não do sistema)
    if (resource === "categorias" || resource === "all") {
      const { data: categorias, error } = await supabase
        .from("categorias")
        .select("id, nome, tipo, cor, icone, grupo, limite_mensal, created_at")
        .eq("user_id", auth.user.id)
        .order("tipo")
        .order("nome");

      if (error) throw error;
      exportData.categorias = categorias || [];
    }

    // Gerar resposta baseada no formato
    if (format === "json") {
      const filename = resource === "all"
        ? `dindin-export-${new Date().toISOString().split("T")[0]}.json`
        : `dindin-${resource}-${new Date().toISOString().split("T")[0]}.json`;

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // CSV - se for "all", retornar múltiplos CSVs como JSON com os dados
    if (resource === "all") {
      const csvData: Record<string, string> = {};

      if (exportData.transacoes) {
        csvData.transacoes = toCSV(exportData.transacoes as Record<string, unknown>[]);
      }
      if (exportData.contas) {
        csvData.contas = toCSV(exportData.contas as Record<string, unknown>[]);
      }
      if (exportData.categorias) {
        csvData.categorias = toCSV(exportData.categorias as Record<string, unknown>[]);
      }

      return NextResponse.json({
        format: "csv",
        files: csvData,
        message: "Use os dados de cada propriedade para salvar como arquivos CSV separados",
      });
    }

    // CSV para recurso específico
    const data = exportData[resource] as Record<string, unknown>[];
    const csv = toCSV(data);
    const filename = `dindin-${resource}-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error("Failed to export data", error, { action: "export", resource: "export" });
    return ErrorResponses.serverError("Erro ao exportar dados");
  }
}
