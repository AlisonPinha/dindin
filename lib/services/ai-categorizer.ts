import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logger";

interface CategoryInfo {
  id: string;
  nome: string;
  tipo: string;
}

interface CategorizationResult {
  categoryId: string | null;
  categoryName: string | null;
  confidence: "high" | "medium" | "low";
}

// Lazy initialization of Claude client
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

/** Reset the cached client (for testing only) */
export function _resetClient(): void {
  claudeClient = null;
}

const AI_CATEGORIZE_TIMEOUT_MS = 10_000; // 10s timeout for categorization

/**
 * Categorize a transaction description using Claude AI.
 * Uses user's existing categories and historical categorizations as context.
 * Returns null categoryId on any failure — transaction is saved without category.
 */
export async function categorizeTransaction(
  description: string,
  categories: CategoryInfo[],
  historicalMatches: { descricao: string; category_id: string; nome: string }[]
): Promise<CategorizationResult> {
  const nullResult: CategorizationResult = {
    categoryId: null,
    categoryName: null,
    confidence: "low",
  };

  const claude = getClaudeClient();
  if (!claude) {
    logger.error("AI Categorizer: ANTHROPIC_API_KEY not configured", undefined, {
      action: "ai_categorize",
      resource: "categorizer",
    });
    return nullResult;
  }

  // Only use expense categories for categorization
  const expenseCategories = categories.filter(
    (c) => c.tipo === "DESPESA" || c.tipo === "INVESTIMENTO"
  );

  if (expenseCategories.length === 0) {
    logger.warn("AI Categorizer: No expense categories available", {
      action: "ai_categorize",
      resource: "categorizer",
    });
    return nullResult;
  }

  // Build context from historical categorizations
  let historyContext = "";
  if (historicalMatches.length > 0) {
    const historyLines = historicalMatches.map(
      (h) => `- "${h.descricao}" → ${h.nome}`
    );
    historyContext = `\nHistórico de categorizações anteriores do mesmo estabelecimento:\n${historyLines.join("\n")}\n`;
  }

  const categoryList = expenseCategories
    .map((c) => `- id: "${c.id}", nome: "${c.nome}"`)
    .join("\n");

  const prompt = `Categorize esta transação financeira brasileira.

Descrição da transação: "${description}"

Categorias disponíveis:
${categoryList}
${historyContext}
Responda APENAS com um JSON válido no formato:
{"categoryId": "<id da categoria mais adequada>", "confidence": "high"|"medium"|"low"}

Regras:
- Se o histórico mostra categorizações anteriores para o mesmo estabelecimento, use a mesma categoria (confidence: "high")
- Se a descrição claramente indica uma categoria (ex: "iFood" → Alimentação, "Uber" → Transporte, "Netflix" → Assinaturas), use-a (confidence: "high")
- Se a correspondência é possível mas incerta, use confidence: "medium"
- Se não conseguir determinar a categoria, retorne: {"categoryId": null, "confidence": "low"}
- Use APENAS IDs das categorias listadas acima`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_CATEGORIZE_TIMEOUT_MS);

    const response = await claude.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        messages: [{ role: "user", content: prompt }],
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const responseText =
      response.content[0]?.type === "text" ? response.content[0].text : null;

    if (!responseText) {
      logger.warn("AI Categorizer: Empty response from Claude", {
        action: "ai_categorize",
        resource: "categorizer",
      });
      return nullResult;
    }

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn("AI Categorizer: No JSON in response", {
        action: "ai_categorize",
        resource: "categorizer",
        responsePreview: responseText.substring(0, 200),
      });
      return nullResult;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate the returned categoryId exists in the available categories
    if (parsed.categoryId) {
      const matchedCategory = expenseCategories.find(
        (c) => c.id === parsed.categoryId
      );
      if (!matchedCategory) {
        logger.warn("AI Categorizer: Returned categoryId not found in available categories", {
          action: "ai_categorize",
          resource: "categorizer",
          returnedId: parsed.categoryId,
        });
        return nullResult;
      }

      return {
        categoryId: matchedCategory.id,
        categoryName: matchedCategory.nome,
        confidence: parsed.confidence || "medium",
      };
    }

    return nullResult;
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };

    if (err?.name === "AbortError") {
      logger.error("AI Categorizer: Timeout after 10s", undefined, {
        action: "ai_categorize_timeout",
        resource: "categorizer",
        description,
      });
    } else {
      logger.error("AI Categorizer: Claude API error", error, {
        action: "ai_categorize",
        resource: "categorizer",
        description,
      });
    }

    return nullResult;
  }
}
