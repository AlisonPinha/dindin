"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api/fetch"
import { ProfileStep } from "./steps/profile-step"
import { AccountsStep, type AccountData } from "./steps/accounts-step"
import { IncomeStep } from "./steps/income-step"
import { cn } from "@/lib/utils"

type OnboardingStep = "profile" | "accounts" | "income" | "success"

interface OnboardingModalProps {
  open: boolean
  userId: string
  initialName?: string
  initialEmail?: string
  onComplete: () => void
}

const steps: { key: OnboardingStep; label: string }[] = [
  { key: "profile", label: "Perfil" },
  { key: "accounts", label: "Contas" },
  { key: "income", label: "Renda" },
]

export function OnboardingModal({
  open,
  userId,
  initialName = "",
  initialEmail = "",
  onComplete,
}: OnboardingModalProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("profile")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form data
  const [profileData, setProfileData] = useState({
    nome: initialName,
    email: initialEmail,
    avatar: "",
  })
  const [accounts, setAccounts] = useState<AccountData[]>([])
  const [rendaMensal, setRendaMensal] = useState(0)

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep)
  const progress = currentStep === "success" ? 100 : ((currentStepIndex + 1) / steps.length) * 100

  const validateProfile = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!profileData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório"
    }

    if (!profileData.email.trim()) {
      newErrors.email = "Email é obrigatório"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = "Email inválido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateAccounts = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (accounts.length === 0) {
      newErrors.accounts = "Adicione pelo menos uma conta"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateIncome = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (rendaMensal <= 0) {
      newErrors.rendaMensal = "Informe sua renda mensal"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    setErrors({})

    if (currentStep === "profile") {
      if (validateProfile()) {
        setCurrentStep("accounts")
      }
    } else if (currentStep === "accounts") {
      if (validateAccounts()) {
        setCurrentStep("income")
      }
    } else if (currentStep === "income") {
      if (validateIncome()) {
        await handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentStep === "accounts") {
      setCurrentStep("profile")
    } else if (currentStep === "income") {
      setCurrentStep("accounts")
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      const response = await apiFetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          nome: profileData.nome,
          email: profileData.email,
          avatar: profileData.avatar,
          accounts: accounts.map((a) => ({
            nome: a.nome,
            tipo: a.tipo,
            banco: a.banco,
            saldoInicial: a.saldoInicial,
            cor: a.cor,
          })),
          rendaMensal,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar dados")
      }

      setCurrentStep("success")

      // Aguardar 2 segundos e fechar
      setTimeout(() => {
        onComplete()
      }, 2000)
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar onboarding",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {currentStep === "success"
              ? "Tudo pronto!"
              : "Configure sua conta"}
          </DialogTitle>
          <DialogDescription>
            {currentStep === "success"
              ? "Seu FamFinance está configurado"
              : `Passo ${currentStepIndex + 1} de ${steps.length}`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        {currentStep !== "success" && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {steps.map((step, index) => (
                <span
                  key={step.key}
                  className={cn(
                    index <= currentStepIndex && "text-primary font-medium"
                  )}
                >
                  {step.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="py-4">
          {currentStep === "profile" && (
            <ProfileStep
              data={profileData}
              onChange={setProfileData}
              errors={errors}
            />
          )}

          {currentStep === "accounts" && (
            <AccountsStep
              accounts={accounts}
              onChange={setAccounts}
              errors={errors}
            />
          )}

          {currentStep === "income" && (
            <IncomeStep
              rendaMensal={rendaMensal}
              onChange={setRendaMensal}
              errors={errors}
            />
          )}

          {currentStep === "success" && (
            <div className="text-center py-8">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Bem-vindo ao FamFinance!
              </h3>
              <p className="text-sm text-muted-foreground">
                Suas configurações foram salvas. Redirecionando...
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {currentStep !== "success" && (
          <div className="flex gap-3">
            {currentStep !== "profile" && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={isLoading}
              className={cn(
                currentStep === "profile" ? "w-full" : "flex-1"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : currentStep === "income" ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {currentStep === "income" ? "Finalizar" : "Continuar"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
