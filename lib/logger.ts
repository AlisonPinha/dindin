/**
 * Logger Estruturado para FamFinance
 *
 * Fornece logging consistente e estruturado para toda a aplicação.
 * Em produção, pode ser integrado com serviços como Sentry, LogRocket, etc.
 *
 * Política de retenção:
 * - Logs em memória são limitados a 1000 entradas (FIFO).
 * - Campos sensíveis (password, token, api_key, etc.) são auto-redactados.
 * - Para persistência de logs em produção, configure Sentry ou serviço externo.
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  userId?: string
  action?: string
  resource?: string
  duration?: number
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

const isDev = process.env.NODE_ENV === "development"

/** Limite máximo de entradas de log em memória */
const MAX_LOG_BUFFER = 1000

/** Buffer circular de logs em memória */
const logBuffer: LogEntry[] = []

/** Campos sensíveis que devem ser redactados */
const SENSITIVE_FIELDS = new Set([
  "password",
  "senha",
  "api_key",
  "apiKey",
  "token",
  "secret",
  "authorization",
  "cookie",
  "credit_card",
  "cartao",
])

/**
 * Redacta recursivamente campos sensíveis de um objeto.
 * Retorna uma cópia do objeto com valores sensíveis substituídos por "[REDACTED]".
 */
function sanitizeData<T>(data: T): T {
  if (data === null || data === undefined || typeof data !== "object") {
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item)) as unknown as T
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]"
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeData(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized as T
}

/**
 * Adiciona uma entrada ao buffer em memória, respeitando o limite MAX_LOG_BUFFER.
 */
function addToBuffer(entry: LogEntry): void {
  if (logBuffer.length >= MAX_LOG_BUFFER) {
    logBuffer.shift()
  }
  logBuffer.push(entry)
}

/**
 * Retorna uma cópia do buffer de logs atual (para diagnóstico).
 */
export function getLogBuffer(): readonly LogEntry[] {
  return [...logBuffer]
}

/**
 * Formata entrada de log para JSON estruturado
 */
function formatLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  }

  if (context && Object.keys(context).length > 0) {
    entry.context = sanitizeData(context)
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: isDev ? error.stack : undefined,
    }
  }

  return entry
}

/**
 * Output do log baseado no ambiente
 */
function output(entry: LogEntry): void {
  addToBuffer(entry)
  const jsonString = JSON.stringify(entry)

  switch (entry.level) {
    case "debug":
      if (isDev) console.debug(jsonString)
      break
    case "info":
      console.info(jsonString)
      break
    case "warn":
      console.warn(jsonString)
      break
    case "error":
      console.error(jsonString)
      break
  }
}

/**
 * Logger principal
 */
export const logger = {
  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message: string, context?: LogContext): void {
    if (isDev) {
      output(formatLogEntry("debug", message, context))
    }
  },

  /**
   * Log informativo
   */
  info(message: string, context?: LogContext): void {
    output(formatLogEntry("info", message, context))
  },

  /**
   * Log de aviso
   */
  warn(message: string, context?: LogContext): void {
    output(formatLogEntry("warn", message, context))
  },

  /**
   * Log de erro
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : undefined
    // Para erros que não são instâncias de Error (como erros do Supabase),
    // incluir o objeto completo no contexto
    const enrichedContext = err ? context : {
      ...context,
      errorDetails: error ? JSON.stringify(error) : undefined,
    }
    output(formatLogEntry("error", message, enrichedContext, err))
  },

  /**
   * Log de ação do usuário (para auditoria)
   */
  action(
    action: string,
    resource: string,
    userId: string,
    details?: Record<string, unknown>
  ): void {
    output(
      formatLogEntry("info", `User action: ${action}`, {
        action,
        resource,
        userId,
        ...details,
      })
    )
  },

  /**
   * Log de performance (tempo de execução)
   */
  performance(
    operation: string,
    durationMs: number,
    context?: LogContext
  ): void {
    const level = durationMs > 1000 ? "warn" : "info"
    output(
      formatLogEntry(level, `Performance: ${operation} took ${durationMs}ms`, {
        duration: durationMs,
        ...context,
      })
    )
  },

  /**
   * Helper para medir tempo de execução
   */
  startTimer(): () => number {
    const start = performance.now()
    return () => Math.round(performance.now() - start)
  },

  /**
   * Log de requisição API (para debugging)
   */
  apiRequest(
    method: string,
    path: string,
    userId?: string,
    status?: number
  ): void {
    output(
      formatLogEntry("info", `API ${method} ${path}`, {
        action: "api_request",
        resource: path,
        userId,
        status,
      })
    )
  },

  /**
   * Log de erro de API
   */
  apiError(
    method: string,
    path: string,
    error: Error | unknown,
    userId?: string
  ): void {
    const err = error instanceof Error ? error : undefined
    output(
      formatLogEntry(
        "error",
        `API Error ${method} ${path}`,
        {
          action: "api_error",
          resource: path,
          userId,
        },
        err
      )
    )
  },
}

/**
 * Wrapper para funções async com logging automático de erro
 */
export async function withLogging<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const timer = logger.startTimer()

  try {
    const result = await fn()
    logger.performance(operation, timer(), context)
    return result
  } catch (error) {
    logger.error(`Failed: ${operation}`, error, context)
    throw error
  }
}

export default logger
