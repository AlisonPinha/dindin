import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/auth-helper";
import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logger";

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
    logger.debug("OCR: Receiving file", {
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

    logger.debug("OCR: File validated", {
      fileName: file.name,
      fileSize: file.size,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
      fileType: file.type,
    });

    // Converter arquivo para base64
    let bytes: ArrayBuffer;
    try {
      bytes = await file.arrayBuffer();
      logger.debug("OCR: File converted to ArrayBuffer", {
        bytesLength: bytes.byteLength,
        expectedLength: file.size,
        match: bytes.byteLength === file.size,
      });
    } catch (error) {
      logger.error("OCR: Failed to read file", error, { action: "file_read", resource: "ocr" });
      return NextResponse.json(
        { error: "Erro ao ler o arquivo. Pode estar corrompido." },
        { status: 400 }
      );
    }

    // Verificar se o tamanho do buffer corresponde ao tamanho do arquivo
    if (bytes.byteLength !== file.size) {
      logger.error("OCR: Buffer size mismatch", undefined, {
        action: "buffer_validation",
        resource: "ocr",
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
    
    logger.debug("OCR: File converted to base64", {
      fileType: isPDF ? "PDF" : "Image",
      base64Length: base64.length,
      estimatedSizeMB: (base64.length * 3 / 4 / 1024 / 1024).toFixed(2),
    });

    // Preparar conteúdo para Claude
    let content: Anthropic.MessageParam['content'];

    if (isPDF) {
      logger.debug("OCR: Processing PDF with Claude");
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
      logger.debug("OCR: Processing image with Claude");
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
    } catch (claudeError: unknown) {
      logger.error("OCR: Claude API error", claudeError, { action: "claude_api_call", resource: "ocr" });
      
      // Tratar erros específicos da Claude
      const error = claudeError as { status?: number; error?: { message?: string }; message?: string };
      if (error?.status === 401) {
        return NextResponse.json(
          { error: "Chave da API Claude inválida. Verifique a configuração de ANTHROPIC_API_KEY." },
          { status: 503 }
        );
      }
      if (error?.status === 429) {
        return NextResponse.json(
          { error: "Limite de requisições excedido. Tente novamente em alguns minutos." },
          { status: 429 }
        );
      }
      if (error?.status === 400 && error?.error?.message?.includes("image")) {
        return NextResponse.json(
          { error: "Erro ao processar a imagem. Verifique se o arquivo está corrompido ou em formato inválido." },
          { status: 400 }
        );
      }
      
      // Erro genérico da Claude
      return NextResponse.json(
        { error: `Erro na API Claude: ${error?.error?.message || error?.message || "Erro desconhecido"}` },
        { status: 500 }
      );
    }

    // Extrair texto da resposta
    const responseText = response.content[0]?.type === "text" 
      ? response.content[0].text 
      : null;

    if (!responseText) {
      logger.error("OCR: Empty Claude response", undefined, { action: "claude_response", resource: "ocr" });
      return NextResponse.json(
        { error: "A API não retornou conteúdo. Tente novamente ou use outro arquivo." },
        { status: 500 }
      );
    }

    logger.debug("OCR: Claude response received");

    // Tentar parsear JSON da resposta (usar regex para extrair JSON mesmo se houver markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error("OCR: Failed to extract JSON from response", undefined, {
        action: "json_extraction",
        resource: "ocr",
        responsePreview: responseText.substring(0, 200)
      });
      return NextResponse.json(
        { error: "Não foi possível extrair dados do documento. O Claude pode não ter conseguido ler o documento corretamente." },
        { status: 422 }
      );
    }

    let resultado: ExtractionResult;
    try {
      resultado = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      logger.error("OCR: JSON parse error", parseError, {
        action: "json_parse",
        resource: "ocr",
        jsonPreview: jsonMatch[0].substring(0, 200)
      });
      return NextResponse.json(
        { error: "Erro ao interpretar os dados extraídos. O Claude pode não ter conseguido ler o documento corretamente." },
        { status: 500 }
      );
    }

    // Validar estrutura básica
    if (!resultado.transactions || !Array.isArray(resultado.transactions)) {
      logger.error("OCR: Invalid response structure", undefined, {
        action: "response_validation",
        resource: "ocr",
        hasTransactions: !!resultado.transactions,
        isArray: Array.isArray(resultado.transactions)
      });
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
  } catch (error: unknown) {
    logger.error("OCR: General error", error, { action: "ocr_process", resource: "ocr" });
    
    // Tratar erros específicos
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { error: "Erro de conexão. Verifique sua internet e tente novamente." },
        { status: 503 }
      );
    }
    
    const err = error as { message?: string; error?: { message?: string }; stack?: string; name?: string; status?: number };
    
    if (err?.message?.includes("timeout")) {
      return NextResponse.json(
        { error: "Tempo de processamento excedido. O arquivo pode ser muito grande. Tente uma imagem menor." },
        { status: 408 }
      );
    }
    
    // Erro genérico com mais detalhes no log
    const errorMessage = err?.message || err?.error?.message || "Erro desconhecido";
    logger.error("OCR: Error details", error, {
      action: "ocr_error_details",
      resource: "ocr",
      errorMessage,
      errorName: err?.name,
      errorStatus: err?.status,
    });
    
    return NextResponse.json(
      { error: `Erro ao processar documento: ${errorMessage}` },
      { status: 500 }
    );
  }
}

function getPromptForDocumentType(type: string | null): string {
  const prompts = {
    fatura: `Extraia APENAS as COMPRAS/DESPESAS desta fatura de cartão de crédito brasileiro.

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

REGRAS CRÍTICAS - LEIA COM ATENÇÃO:

1. IGNORAR COMPLETAMENTE (NÃO incluir no JSON):
   - "Pagamento da fatura" ou "Pagamento de fatura" (são pagamentos feitos pelo cliente)
   - "Pagamentos e créditos devolvidos"
   - "Crédito" ou "Estorno"
   - Linhas de resumo como "Total da fatura", "Consumos de X a Y"
   - Informações de parcelamento de fatura
   - Juros, multas, tarifas, encargos (a menos que sejam cobranças reais)

2. INCLUIR APENAS:
   - Compras em estabelecimentos (ex: MERCADOLIVRE, APPLE.COM/BILL, HOTEIS.COM)
   - Assinaturas e serviços (ex: NETFLIX, SPOTIFY, AF INTERNET)
   - Parcelas de compras (ex: "Parcela 2 de 12")

3. FORMATAÇÃO:
   - Limpe os nomes (ex: "MERCADOLIVRE*3PRODUTOS" → "MERCADOLIVRE 3PRODUTOS")
   - Use o ano correto baseado no contexto da fatura
   - tipo: sempre "SAIDA" para compras
   - Categorize: Compras (lojas), Assinaturas (serviços recorrentes), Lazer (hotéis, entretenimento), etc.

4. DATAS:
   - Use a data da transação mostrada na fatura
   - Se a fatura mostra apenas mês/dia (ex: 03/07), adicione o ano correto baseado no período da fatura`,

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

  const documentType = type || "fatura";
  if (documentType === "boleto") {
    return prompts.boleto;
  }
  // Default sempre retorna fatura
  return prompts.fatura;
}
