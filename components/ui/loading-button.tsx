"use client"

import * as React from "react"
import { Loader2, Check, X } from "lucide-react"
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type LoadingState = "idle" | "loading" | "success" | "error"

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
  successText?: string
  errorText?: string
  showSuccessState?: boolean
  showErrorState?: boolean
  successDuration?: number
  errorDuration?: number
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      isLoading = false,
      loadingText,
      successText = "Sucesso!",
      errorText = "Erro!",
      showSuccessState = false,
      showErrorState = false,
      successDuration = 2000,
      errorDuration = 2000,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const [state, setState] = React.useState<LoadingState>("idle")

    React.useEffect(() => {
      if (isLoading) {
        setState("loading")
      } else if (showSuccessState && state === "loading") {
        setState("success")
        const timer = setTimeout(() => setState("idle"), successDuration)
        return () => clearTimeout(timer)
      } else if (showErrorState && state === "loading") {
        setState("error")
        const timer = setTimeout(() => setState("idle"), errorDuration)
        return () => clearTimeout(timer)
      } else if (!isLoading && state === "loading") {
        setState("idle")
      }
    }, [isLoading, showSuccessState, showErrorState, state, successDuration, errorDuration])

    const getContent = () => {
      switch (state) {
        case "loading":
          return (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {loadingText || children}
            </>
          )
        case "success":
          return (
            <>
              <Check className="mr-2 h-4 w-4 text-white" aria-hidden="true" />
              {successText}
            </>
          )
        case "error":
          return (
            <>
              <X className="mr-2 h-4 w-4" aria-hidden="true" />
              {errorText}
            </>
          )
        default:
          return children
      }
    }

    const getVariantStyles = () => {
      switch (state) {
        case "success":
          return "bg-green-600 hover:bg-green-600 text-white"
        case "error":
          return "bg-destructive hover:bg-destructive text-destructive-foreground"
        default:
          return ""
      }
    }

    return (
      <Button
        ref={ref}
        disabled={disabled || state === "loading"}
        className={cn(getVariantStyles(), className)}
        aria-busy={state === "loading"}
        aria-live="polite"
        {...props}
      >
        {getContent()}
      </Button>
    )
  }
)
LoadingButton.displayName = "LoadingButton"

export { LoadingButton }
export type { LoadingButtonProps, LoadingState }
