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

    // Validar tamanho (máx 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Tamanho máximo: 10MB" },
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

    // Claude também aceita apenas imagens, não PDFs diretamente
    // Mas podemos tentar converter ou informar o usuário
    if (file.type === "application/pdf") {
      console.log("❌ PDF detectado - Claude API também requer imagens");
      return NextResponse.json(
        { 
          error: "PDFs não são suportados diretamente. Por favor, converta o PDF para uma imagem (JPG ou PNG) antes de importar. Você pode usar ferramentas online como ilovepdf.com ou simplesmente tirar uma captura de tela do PDF." 
        },
        { status: 400 }
      );
    }

    // Se for imagem, usar diretamente
    const buffer = Buffer.from(bytes);
    const imageBase64 = buffer.toString("base64");
    const finalMimeType = file.type || "image/jpeg";
    
    console.log("✅ Arquivo convertido para base64:", {
      base64Length: imageBase64.length,
      estimatedSizeMB: (imageBase64.length * 3 / 4 / 1024 / 1024).toFixed(2),
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
      // Claude API usa estrutura diferente
      response = await claude.messages.create({
        model: "claude-3-5-sonnet-20241022", // ou "claude-3-opus-20240229" para melhor qualidade
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: finalMimeType,
                  data: imageBase64,
                },
              },
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
