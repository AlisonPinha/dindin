"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Loader2, X, Upload, FileCheck, PartyPopper } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ============================================
// Upload Progress
// ============================================
interface UploadProgressProps {
  fileName: string
  progress: number
  status: "uploading" | "success" | "error"
  onCancel?: () => void
  onRetry?: () => void
  errorMessage?: string
  className?: string
}

export function UploadProgress({
  fileName,
  progress,
  status,
  onCancel,
  onRetry,
  errorMessage,
  className,
}: UploadProgressProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card",
        status === "error" && "border-destructive/50 bg-destructive/5",
        status === "success" && "border-green-500/50 bg-green-500/5",
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "shrink-0 rounded-full p-2",
          status === "uploading" && "bg-primary/10",
          status === "success" && "bg-green-500/10",
          status === "error" && "bg-destructive/10"
        )}
      >
        {status === "uploading" && (
          <Upload className="h-4 w-4 text-primary animate-pulse" />
        )}
        {status === "success" && (
          <FileCheck className="h-4 w-4 text-green-500" />
        )}
        {status === "error" && (
          <X className="h-4 w-4 text-destructive" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        {status === "uploading" && (
          <div className="mt-1.5 space-y-1">
            <Progress value={progress} className="h-1.5" />
            <p className="text-xs text-muted-foreground">{progress}% concluído</p>
          </div>
        )}
        {status === "success" && (
          <p className="text-xs text-green-600 dark:text-green-400">Upload concluído</p>
        )}
        {status === "error" && (
          <p className="text-xs text-destructive">{errorMessage || "Erro no upload"}</p>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0">
        {status === "uploading" && onCancel && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onCancel}
            aria-label="Cancelar upload"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {status === "error" && onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================
// Bulk Action Progress
// ============================================
interface BulkActionProgressProps {
  action: string
  current: number
  total: number
  status: "processing" | "success" | "error"
  onCancel?: () => void
  className?: string
}

export function BulkActionProgress({
  action,
  current,
  total,
  status,
  onCancel,
  className,
}: BulkActionProgressProps) {
  const progress = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md",
        "rounded-lg border bg-card shadow-lg p-4",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        {status === "processing" && (
          <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
        )}
        {status === "success" && (
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
        )}
        {status === "error" && (
          <X className="h-5 w-5 text-destructive shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium">{action}</p>
            <span className="text-sm text-muted-foreground">
              {current} de {total}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {status === "processing" && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="shrink-0"
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================
// Goal Achievement Animation
// ============================================
interface GoalAchievementProps {
  goalName: string
  targetAmount: number
  onClose: () => void
  className?: string
}

export function GoalAchievement({
  goalName,
  targetAmount,
  onClose,
  className,
}: GoalAchievementProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/50 backdrop-blur-sm animate-in fade-in",
        className
      )}
      onClick={onClose}
    >
      <div
        className="relative bg-card rounded-2xl p-8 max-w-md mx-4 text-center animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti animation */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"][i % 5],
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4">
            <PartyPopper className="w-10 h-10 text-green-500" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Parabéns!</h2>
          <p className="text-muted-foreground mb-4">
            Você atingiu sua meta <span className="font-semibold text-foreground">{goalName}</span>
          </p>

          <div className="inline-block px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-semibold mb-6">
            {formatCurrency(targetAmount)}
          </div>

          <Button onClick={onClose} className="w-full">
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Step Progress (for wizards/onboarding)
// ============================================
interface Step {
  id: string
  label: string
  description?: string
}

interface StepProgressProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isLast = index === steps.length - 1

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary",
                    !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      (isCompleted || isCurrent) && "text-foreground",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>

              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 -mt-10",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// Processing Indicator
// ============================================
interface ProcessingIndicatorProps {
  message?: string
  className?: string
}

export function ProcessingIndicator({
  message = "Processando...",
  className,
}: ProcessingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
