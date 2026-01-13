import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/auth-helper";
import Anthropic from "@anthropic-ai/sdk";

// Configurar runtime para suportar uploads maiores
// No Vercel, o limite padrão é 10s (Hobby) ou 60s (Pro)
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

    // Verificar se API key está configurada (lazy initialization)
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
    
    // Validar se PDF não está criptografado ou protegido por senha
    // (Claude não suporta PDFs protegidos)

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

    // Convert file to base64
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

    // Converter arquivo para base64
    const buffer = Buffer.from(bytes);
    const fileBase64 = buffer.toString("base64");
    
    // Determinar se é PDF ou imagem e configurar tipo de conteúdo
    const isPDF = file.type === "application/pdf";
    
    // Mapear MIME type para o formato aceito pelo Claude
    const mimeTypeMap: Record<string, "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "application/pdf"> = {
      "image/jpeg": "image/jpeg",
      "image/jpg": "image/jpeg",
      "image/png": "image/png",
      "image/gif": "image/gif",
      "image/webp": "image/webp",
      "application/pdf": "application/pdf",
    };
    
    const finalMimeType = mimeTypeMap[file.type] || (isPDF ? "application/pdf" : "image/jpeg");
    
    console.log("✅ Arquivo convertido para base64:", {
      fileType: isPDF ? "PDF" : "Imagem",
      base64Length: fileBase64.length,
      estimatedSizeMB: (fileBase64.length * 3 / 4 / 1024 / 1024).toFixed(2),
      mimeType: finalMimeType,
    });

    // Different prompts for boleto vs fatura
    const prompt = documentType === "fatura"
      ? `Analise esta fatura de cartão de crédito do Bradesco ou outro banco brasileiro.

         Extraia TODAS as transações listadas na fatura. Para cada transação, extraia:
         - descricao: nome do estabelecimento ou descrição da compra
         - valor: valor em reais (apenas número, sem R$)
         - data: data da transação no formato YYYY-MM-DD
         - tipo: sempre "SAIDA" para despesas de cartão
         - categoria: tente identificar a categoria (Alimentação, Transporte, Compras, Assinaturas, Lazer, Saúde, Educação, Outros)

         Retorne APENAS um JSON válido no formato:
         {
           "type": "fatura",
           "transactions": [
             { "descricao": "...", "valor": 99.90, "data": "2024-01-15", "tipo": "SAIDA", "categoria": "..." },
             ...
           ]
         }

         Se não conseguir identificar a data exata, use a data de vencimento da fatura.
         NÃO inclua o valor total da fatura, apenas as transações individuais.`
      : `Analise este boleto bancário brasileiro.

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
             { "descricao": "...", "valor": 99.90, "data": "2024-01-15", "tipo": "SAIDA", "categoria": "..." }
           ]
         }`;

    let response;
    try {
      // Claude API suporta PDFs diretamente usando tipo "document" e imagens usando tipo "image"
      const contentBlock = isPDF
        ? {
            type: "document" as const,
            source: {
              type: "base64" as const,
              media_type: "application/pdf" as const,
              data: fileBase64,
            },
          }
        : {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: finalMimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: fileBase64,
            },
          };

      response = await claude.messages.create({
        model: "claude-3-5-sonnet-20241022", // Suporta PDFs nativamente
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              contentBlock,
              {
                type: "text",
                text: prompt,
              },
            ],
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

    const content = response.content[0]?.type === "text" ? response.content[0].text : null;

    if (!content) {
      console.error("Resposta da Claude sem conteúdo:", response);
      return NextResponse.json(
        { error: "A API não retornou conteúdo. Tente novamente ou use outro arquivo." },
        { status: 500 }
      );
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonContent = content;
    if (content.includes("```json")) {
      jsonContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (content.includes("```")) {
      jsonContent = content.replace(/```\n?/g, "");
    }

    try {
      const result: ExtractionResult = JSON.parse(jsonContent.trim());

      // Validar estrutura básica
      if (!result.transactions || !Array.isArray(result.transactions)) {
        console.error("Resposta inválida: transactions não é um array", result);
        return NextResponse.json(
          { error: "Formato de resposta inválido da API. O documento pode não conter transações reconhecíveis." },
          { status: 500 }
        );
      }

      // Validate and clean the data
      const cleanedTransactions = result.transactions
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
        type: result.type,
        transactions: cleanedTransactions,
        count: cleanedTransactions.length,
      });
    } catch (parseError) {
      console.error("Erro ao interpretar resposta OCR:", parseError);
      console.error("Conteúdo recebido:", content.substring(0, 500)); // Log parcial para debug
      return NextResponse.json(
        { error: "Erro ao interpretar os dados extraídos. O Claude pode não ter conseguido ler o documento corretamente. Tente uma imagem mais clara ou outro formato." },
        { status: 500 }
      );
    }
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
