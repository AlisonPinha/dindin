"use client"

import { AlertTriangle, RefreshCw, WifiOff, ServerCrash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ErrorType = "network" | "server" | "generic" | "notFound"

interface ErrorStateProps {
  type?: ErrorType
  title?: string
  message?: string
  onRetry?: () => void
  isRetrying?: boolean
  className?: string
}

const errorConfig: Record<ErrorType, { icon: React.ElementType; title: string; message: string }> = {
  network: {
    icon: WifiOff,
    title: "Sem conexão",
    message: "Verifique sua conexão com a internet e tente novamente.",
  },
  server: {
    icon: ServerCrash,
    title: "Erro no servidor",
    message: "Nossos servidores estão com problemas. Tente novamente em alguns instantes.",
  },
  generic: {
    icon: AlertTriangle,
    title: "Algo deu errado",
    message: "Ocorreu um erro inesperado. Por favor, tente novamente.",
  },
  notFound: {
    icon: AlertTriangle,
    title: "Não encontrado",
    message: "O recurso que você está procurando não foi encontrado.",
  },
}

export function ErrorState({
  type = "generic",
  title,
  message,
  onRetry,
  isRetrying = false,
  className,
}: ErrorStateProps) {
  const config = errorConfig[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <Icon className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>

      <h3 className="text-lg font-semibold mb-2">
        {title || config.title}
      </h3>

      <p className="text-muted-foreground max-w-md mb-6">
        {message || config.message}
      </p>

      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw
            className={cn("h-4 w-4", isRetrying && "animate-spin")}
            aria-hidden="true"
          />
          {isRetrying ? "Tentando..." : "Tentar novamente"}
        </Button>
      )}
    </div>
  )
}

/**
 * Hook para gerenciar estado de erro com retry
 */
import { useState, useCallback } from "react"

interface UseErrorRetryOptions {
  maxRetries?: number
  retryDelay?: number
}

export function useErrorRetry(
  fetchFn: () => Promise<void>,
  options: UseErrorRetryOptions = {}
) {
  const { maxRetries = 3, retryDelay = 1000 } = options

  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const execute = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await fetchFn()
      setRetryCount(0)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro desconhecido"))
    } finally {
      setIsLoading(false)
    }
  }, [fetchFn])

  const retry = useCallback(async () => {
    if (retryCount >= maxRetries) {
      return
    }

    setRetryCount((prev) => prev + 1)

    // Exponential backoff
    const delay = retryDelay * Math.pow(2, retryCount)
    await new Promise((resolve) => setTimeout(resolve, delay))

    await execute()
  }, [execute, retryCount, maxRetries, retryDelay])

  return {
    error,
    isLoading,
    retryCount,
    canRetry: retryCount < maxRetries,
    execute,
    retry,
    clearError: () => setError(null),
  }
}
