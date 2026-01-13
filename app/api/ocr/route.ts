import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/auth-helper";
import Anthropic from "@anthropic-ai/sdk";

// Configurar runtime para suportar uploads maiores
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 segundos para processar (requer Vercel Pro)

// Lazy initialization - only create client when API is called
let claudeClient: Anthropic | null = null;

function getClaudeClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  if (!claudeClient) {
    claudeClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return claudeClient;
}

interface ExtractedTransaction {
  descricao: string;
  valor: number;
  data: string;
  tipo: "SAIDA" | "ENTRADA";
  categoria?: string;
}

interface ExtractionResult {
  type: "boleto" | "fatura";
  transactions: ExtractedTransaction[];
}

// POST /api/ocr - Process image/PDF and extract transaction data
export async function POST(request: NextRequest) {
  try {
    // Autenticação obrigatória
    const auth = await getAuthenticatedUser();
    if (auth.error) return auth.error;

    // Verificar se API key está configurada
    const claude = getClaudeClient();
    if (!claude) {
      return NextResponse.json(
        { error: "Serviço de OCR não configurado. Configure ANTHROPIC_API_KEY no Vercel." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("type") as string | null; // "boleto" ou "fatura"

    // Log para debug
    console.log("📄 Recebendo arquivo:", {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      documentType,
    });

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não enviado" },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não suportado. Use JPG, PNG, GIF, WebP ou PDF." },
        { status: 400 }
      );
    }

    // Validar tamanho (máx 10MB para imagens, 32MB para PDFs - limite do Claude)
    const maxSize = file.type === "application/pdf" 
      ? 32 * 1024 * 1024  // Claude suporta até 32MB para PDFs
      : 10 * 1024 * 1024; // 10MB para imagens
    
    if (file.size > maxSize) {
      const maxSizeMB = file.type === "application/pdf" ? "32MB" : "10MB";
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}` },
        { status: 400 }
      );
    }

    // Verificar se o arquivo está vazio
    if (file.size === 0) {
      return NextResponse.json(
        { error: "Arquivo está vazio ou corrompido" },
        { status: 400 }
      );
    }

    console.log("✅ Arquivo validado:", {
      name: file.name,
      size: file.size,
      sizeMB: (file.size / 1024 / 1024).toFixed(2),
      type: file.type,
    });

    // Converter arquivo para base64
    let bytes: ArrayBuffer;
    try {
      bytes = await file.arrayBuffer();
      console.log("✅ Arquivo convertido para ArrayBuffer:", {
        bytesLength: bytes.byteLength,
        expectedLength: file.size,
        match: bytes.byteLength === file.size,
      });
    } catch (error) {
      console.error("❌ Erro ao ler arquivo:", error);
      return NextResponse.json(
        { error: "Erro ao ler o arquivo. Pode estar corrompido." },
        { status: 400 }
      );
    }

    // Verificar se o tamanho do buffer corresponde ao tamanho do arquivo
    if (bytes.byteLength !== file.size) {
      console.error("⚠️ Tamanho do buffer não corresponde:", {
        fileSize: file.size,
        bufferSize: bytes.byteLength,
        difference: file.size - bytes.byteLength,
      });
      return NextResponse.json(
        { error: `Arquivo não foi enviado completamente. Recebido: ${bytes.byteLength} bytes, esperado: ${file.size} bytes` },
        { status: 400 }
      );
    }

    // Converter para base64
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    
    // Determinar se é PDF ou imagem
    const isPDF = file.type === "application/pdf";
    
    console.log("✅ Arquivo convertido para base64:", {
      fileType: isPDF ? "PDF" : "Imagem",
      base64Length: base64.length,
      estimatedSizeMB: (base64.length * 3 / 4 / 1024 / 1024).toFixed(2),
    });

    // Preparar conteúdo para Claude
    let content: Anthropic.MessageParam['content'];

    if (isPDF) {
      console.log("📄 Processando PDF com Claude...");
      content = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        },
        {
          type: "text",
          text: getPromptForDocumentType(documentType || "fatura"),
        },
      ];
    } else {
      console.log("🖼️ Processando imagem com Claude...");
      // Mapear MIME type para o formato aceito pelo Claude
      const mimeTypeMap: Record<string, "image/jpeg" | "image/png" | "image/gif" | "image/webp"> = {
        "image/jpeg": "image/jpeg",
        "image/jpg": "image/jpeg",
        "image/png": "image/png",
        "image/gif": "image/gif",
        "image/webp": "image/webp",
      };
      
      const mediaType = mimeTypeMap[file.type] || "image/jpeg";

      content = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data: base64,
          },
        },
        {
          type: "text",
          text: getPromptForDocumentType(documentType || "fatura"),
        },
      ];
    }

    // Chamar Claude
    let response;
    try {
      response = await claude.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content,
          },
        ],
      });
    } catch (claudeError: any) {
      console.error("Erro na API Claude:", claudeError);
      
      // Tratar erros específicos da Claude
      if (claudeError?.status === 401) {
        return NextResponse.json(
          { error: "Chave da API Claude inválida. Verifique a configuração de ANTHROPIC_API_KEY." },
          { status: 503 }
        );
      }
      if (claudeError?.status === 429) {
        return NextResponse.json(
          { error: "Limite de requisições excedido. Tente novamente em alguns minutos." },
          { status: 429 }
        );
      }
      if (claudeError?.status === 400 && claudeError?.error?.message?.includes("image")) {
        return NextResponse.json(
          { error: "Erro ao processar a imagem. Verifique se o arquivo está corrompido ou em formato inválido." },
          { status: 400 }
        );
      }
      
      // Erro genérico da Claude
      return NextResponse.json(
        { error: `Erro na API Claude: ${claudeError?.error?.message || claudeError?.message || "Erro desconhecido"}` },
        { status: 500 }
      );
    }

    // Extrair texto da resposta
    const responseText = response.content[0]?.type === "text" 
      ? response.content[0].text 
      : null;

    if (!responseText) {
      console.error("Resposta da Claude sem conteúdo:", response);
      return NextResponse.json(
        { error: "A API não retornou conteúdo. Tente novamente ou use outro arquivo." },
        { status: 500 }
      );
    }

    console.log("✅ Resposta do Claude recebida");

    // Tentar parsear JSON da resposta (usar regex para extrair JSON mesmo se houver markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Não foi possível extrair JSON da resposta:", responseText.substring(0, 500));
      return NextResponse.json(
        { error: "Não foi possível extrair dados do documento. O Claude pode não ter conseguido ler o documento corretamente." },
        { status: 422 }
      );
    }

    let resultado: ExtractionResult;
    try {
      resultado = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Erro ao parsear JSON:", parseError);
      console.error("JSON extraído:", jsonMatch[0].substring(0, 500));
      return NextResponse.json(
        { error: "Erro ao interpretar os dados extraídos. O Claude pode não ter conseguido ler o documento corretamente." },
        { status: 500 }
      );
    }

    // Validar estrutura básica
    if (!resultado.transactions || !Array.isArray(resultado.transactions)) {
      console.error("Resposta inválida: transactions não é um array", resultado);
      return NextResponse.json(
        { error: "Formato de resposta inválido da API. O documento pode não conter transações reconhecíveis." },
        { status: 500 }
      );
    }

    // Validar e limpar os dados
    const cleanedTransactions = resultado.transactions
      .filter((t) => t && (t.descricao || t.valor)) // Filtrar transações inválidas
      .map((t) => ({
        descricao: t.descricao || "Transação importada",
        valor: typeof t.valor === "number" ? t.valor : parseFloat(String(t.valor).replace(",", ".")),
        data: t.data || new Date().toISOString().split("T")[0],
        tipo: t.tipo || "SAIDA",
        categoria: t.categoria || "Outros",
      }));

    if (cleanedTransactions.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma transação foi encontrada no documento. Verifique se o arquivo contém uma fatura ou boleto válido." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      type: resultado.type || (documentType as "boleto" | "fatura"),
      transactions: cleanedTransactions,
      count: cleanedTransactions.length,
    });
  } catch (error: any) {
    console.error("Erro no OCR:", error);
    
    // Tratar erros específicos
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { error: "Erro de conexão. Verifique sua internet e tente novamente." },
        { status: 503 }
      );
    }
    
    if (error?.message?.includes("timeout")) {
      return NextResponse.json(
        { error: "Tempo de processamento excedido. O arquivo pode ser muito grande. Tente uma imagem menor." },
        { status: 408 }
      );
    }
    
    // Erro genérico com mais detalhes no log
    const errorMessage = error?.message || error?.error?.message || "Erro desconhecido";
    console.error("Detalhes do erro:", {
      message: errorMessage,
      stack: error?.stack,
      name: error?.name,
      status: error?.status,
    });
    
    return NextResponse.json(
      { error: `Erro ao processar documento: ${errorMessage}` },
      { status: 500 }
    );
  }
}

function getPromptForDocumentType(type: string | null): string {
  const prompts: Record<string, string> = {
    fatura: `Extraia TODAS as transações desta fatura de cartão de crédito do Bradesco ou outro banco brasileiro.

Retorne APENAS um JSON válido no formato:
{
  "type": "fatura",
  "transactions": [
    {
      "descricao": "nome do estabelecimento ou descrição da compra (limpo e legível)",
      "valor": 0.00,
      "data": "YYYY-MM-DD",
      "tipo": "SAIDA",
      "categoria": "Alimentação|Transporte|Compras|Assinaturas|Lazer|Saúde|Educação|Outros"
    }
  ]
}

IMPORTANTE:
- Extraia TODAS as transações listadas na fatura
- Limpe os nomes dos estabelecimentos (remova códigos estranhos)
- Use o ano correto nas datas
- Se não conseguir identificar a data exata, use a data de vencimento da fatura
- NÃO inclua o valor total da fatura, apenas as transações individuais
- Para despesas de cartão, tipo sempre "SAIDA"`,

    boleto: `Analise este boleto bancário brasileiro.

Extraia as seguintes informações:
- descricao: nome do beneficiário/cedente (empresa que vai receber o pagamento)
- valor: valor do boleto em reais (apenas número, sem R$)
- data: data de vencimento no formato YYYY-MM-DD
- tipo: sempre "SAIDA"
- categoria: tente identificar a categoria baseado no beneficiário (Moradia, Saúde, Educação, Assinaturas, Outros)

Retorne APENAS um JSON válido no formato:
{
  "type": "boleto",
  "transactions": [
    {
      "descricao": "...",
      "valor": 99.90,
      "data": "YYYY-MM-DD",
      "tipo": "SAIDA",
      "categoria": "..."
    }
  ]
}`,
  };

  const documentType = (type || "fatura") as keyof typeof prompts;
  const prompt = prompts[documentType];
  if (prompt) {
    return prompt;
  }
  return prompts.fatura;
}
