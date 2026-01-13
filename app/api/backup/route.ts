import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseClient } from "@/lib/supabase/auth-helper";
import { logger } from "@/lib/logger";
import { ErrorResponses, SuccessResponses } from "@/lib/api";

const BACKUP_VERSION = "1.0.0";

interface BackupData {
  version: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
  };
  data: {
    usuario: Record<string, unknown> | null;
    contas: Record<string, unknown>[];
    categorias: Record<string, unknown>[];
    transacoes: Record<string, unknown>[];
    investimentos: Record<string, unknown>[];
    metas: Record<string, unknown>[];
  };
  checksum: string;
}

// Gerar checksum simples para verificação de integridade
function generateChecksum(data: object): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// GET - Gerar backup completo
export async function GET(_request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();

    // Buscar todos os dados do usuário em paralelo
    const [
      { data: usuario },
      { data: contas },
      { data: categorias },
      { data: transacoes },
      { data: investimentos },
      { data: metas },
    ] = await Promise.all([
      supabase
        .from("usuarios")
        .select("*")
        .eq("id", auth.user.id)
        .single(),
      supabase
        .from("contas")
        .select("*")
        .eq("user_id", auth.user.id),
      supabase
        .from("categorias")
        .select("*")
        .eq("user_id", auth.user.id),
      supabase
        .from("transacoes")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("data", { ascending: false }),
      supabase
        .from("investimentos")
        .select("*")
        .eq("user_id", auth.user.id),
      supabase
        .from("metas")
        .select("*")
        .eq("user_id", auth.user.id),
    ]);

    const backupDataContent = {
      usuario: usuario || null,
      contas: contas || [],
      categorias: categorias || [],
      transacoes: transacoes || [],
      investimentos: investimentos || [],
      metas: metas || [],
    };

    const backup: BackupData = {
      version: BACKUP_VERSION,
      createdAt: new Date().toISOString(),
      user: {
        id: auth.user.id,
        email: auth.user.email,
      },
      data: backupDataContent,
      checksum: generateChecksum(backupDataContent),
    };

    const filename = `dindin-backup-${new Date().toISOString().split("T")[0]}.json`;

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error("Failed to create backup", error, { action: "backup", resource: "backup" });
    return ErrorResponses.serverError("Erro ao criar backup");
  }
}

// POST - Restaurar backup
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    const supabase = await getSupabaseClient();
    const backup: BackupData & { preview?: boolean; confirmDelete?: boolean } = await request.json();

    // Validar estrutura do backup
    if (!backup.version || !backup.data || !backup.checksum) {
      return ErrorResponses.badRequest("Arquivo de backup inválido");
    }

    // Verificar checksum
    const expectedChecksum = generateChecksum(backup.data);
    if (backup.checksum !== expectedChecksum) {
      return ErrorResponses.badRequest("Backup corrompido - checksum inválido");
    }

    // Verificar versão (aceita apenas versões compatíveis)
    const [major] = backup.version.split(".");
    const [currentMajor] = BACKUP_VERSION.split(".");
    if (major !== currentMajor) {
      return ErrorResponses.badRequest(
        `Versão do backup (${backup.version}) incompatível com a versão atual (${BACKUP_VERSION})`
      );
    }

    // Preview - mostrar o que será restaurado
    if (backup.preview) {
      return NextResponse.json({
        success: true,
        preview: true,
        backupInfo: {
          version: backup.version,
          createdAt: backup.createdAt,
          originalUser: backup.user.email,
        },
        counts: {
          contas: backup.data.contas?.length || 0,
          categorias: backup.data.categorias?.length || 0,
          transacoes: backup.data.transacoes?.length || 0,
          investimentos: backup.data.investimentos?.length || 0,
          metas: backup.data.metas?.length || 0,
        },
        warning: "ATENÇÃO: Restaurar este backup irá DELETAR todos os seus dados atuais e substituí-los pelos dados do backup.",
      });
    }

    // Requer confirmação explícita para deletar dados existentes
    if (!backup.confirmDelete) {
      return ErrorResponses.badRequest(
        "Para restaurar o backup, envie confirmDelete: true. ATENÇÃO: Isso irá DELETAR todos os seus dados atuais!"
      );
    }

    // ========== RESTAURAR DADOS ==========
    // A ordem importa devido às foreign keys

    // 1. Deletar dados existentes (ordem reversa das dependências)
    await supabase.from("transacoes").delete().eq("user_id", auth.user.id);
    await supabase.from("investimentos").delete().eq("user_id", auth.user.id);
    await supabase.from("metas").delete().eq("user_id", auth.user.id);
    await supabase.from("categorias").delete().eq("user_id", auth.user.id);
    await supabase.from("contas").delete().eq("user_id", auth.user.id);

    const results: Record<string, { restored: number; errors: string[] }> = {};

    // 2. Restaurar contas
    if (backup.data.contas?.length) {
      const contas = backup.data.contas.map((c) => ({
        ...c,
        id: undefined, // Deixar o banco gerar novo ID
        user_id: auth.user.id,
      }));

      const { data, error } = await supabase.from("contas").insert(contas).select();
      results.contas = {
        restored: data?.length || 0,
        errors: error ? [error.message] : [],
      };
    }

    // 3. Restaurar categorias
    if (backup.data.categorias?.length) {
      const categorias = backup.data.categorias.map((c) => ({
        ...c,
        id: undefined,
        user_id: auth.user.id,
      }));

      const { data, error } = await supabase.from("categorias").insert(categorias).select();
      results.categorias = {
        restored: data?.length || 0,
        errors: error ? [error.message] : [],
      };
    }

    // 4. Restaurar transações (sem category_id e account_id por enquanto)
    if (backup.data.transacoes?.length) {
      const transacoes = backup.data.transacoes.map((t) => ({
        ...t,
        id: undefined,
        user_id: auth.user.id,
        category_id: null, // IDs antigos não são válidos
        account_id: null,
      }));

      const { data, error } = await supabase.from("transacoes").insert(transacoes).select();
      results.transacoes = {
        restored: data?.length || 0,
        errors: error ? [error.message] : [],
      };
    }

    // 5. Restaurar investimentos
    if (backup.data.investimentos?.length) {
      const investimentos = backup.data.investimentos.map((i) => ({
        ...i,
        id: undefined,
        user_id: auth.user.id,
      }));

      const { data, error } = await supabase.from("investimentos").insert(investimentos).select();
      results.investimentos = {
        restored: data?.length || 0,
        errors: error ? [error.message] : [],
      };
    }

    // 6. Restaurar metas
    if (backup.data.metas?.length) {
      const metas = backup.data.metas.map((m) => ({
        ...m,
        id: undefined,
        user_id: auth.user.id,
      }));

      const { data, error } = await supabase.from("metas").insert(metas).select();
      results.metas = {
        restored: data?.length || 0,
        errors: error ? [error.message] : [],
      };
    }

    // 7. Atualizar dados do usuário (se existir no backup)
    if (backup.data.usuario) {
      const { nome, renda_mensal } = backup.data.usuario as { nome?: string; renda_mensal?: number };
      if (nome || renda_mensal !== undefined) {
        await supabase
          .from("usuarios")
          .update({
            ...(nome && { nome }),
            ...(renda_mensal !== undefined && { renda_mensal }),
          })
          .eq("id", auth.user.id);
      }
    }

    return SuccessResponses.ok({
      success: true,
      message: "Backup restaurado com sucesso",
      results,
      note: "Os IDs de categoria e conta das transações foram removidos pois os IDs originais não são mais válidos. Você precisará reassociar manualmente se necessário.",
    });
  } catch (error) {
    logger.error("Failed to restore backup", error, { action: "restore", resource: "backup" });
    return ErrorResponses.serverError("Erro ao restaurar backup");
  }
}
