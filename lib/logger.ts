/**
 * Logger Estruturado para FamFinance
 *
 * Fornece logging consistente e estruturado para toda a aplicação.
 * Em produção, pode ser integrado com serviços como Sentry, LogRocket, etc.
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
    entry.context = context
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
    output(formatLogEntry("error", message, context, err))
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
