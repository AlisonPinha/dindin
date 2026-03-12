"use client"

import { useState } from "react"
import { format, addDays } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles } from "lucide-react"
import { CHALLENGE_TEMPLATES, type ChallengeTemplate } from "./challenge-templates"

interface ChallengeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    nome: string
    descricao?: string
    tipo: string
    template?: string
    dataInicio: string
    dataFim: string
    metaValor?: number
  }) => void
}

export function ChallengeModal({ open, onOpenChange, onSubmit }: ChallengeModalProps) {
  const [mode, setMode] = useState<"templates" | "custom">("templates")
  const [customName, setCustomName] = useState("")
  const [customDescription, setCustomDescription] = useState("")
  const [customDays, setCustomDays] = useState(30)
  const [customTarget, setCustomTarget] = useState<number | undefined>()

  const handleTemplateSelect = (template: ChallengeTemplate) => {
    const today = format(new Date(), "yyyy-MM-dd")
    const endDate = format(addDays(new Date(), template.durationDays), "yyyy-MM-dd")

    onSubmit({
      nome: template.name,
      descricao: template.description,
      tipo: template.type,
      template: template.id,
      dataInicio: today,
      dataFim: endDate,
      metaValor: template.suggestedTarget,
    })
    onOpenChange(false)
  }

  const handleCustomSubmit = () => {
    if (!customName.trim()) return

    const today = format(new Date(), "yyyy-MM-dd")
    const endDate = format(addDays(new Date(), customDays), "yyyy-MM-dd")

    onSubmit({
      nome: customName.trim(),
      descricao: customDescription || undefined,
      tipo: "CUSTOM",
      dataInicio: today,
      dataFim: endDate,
      metaValor: customTarget,
    })

    // Reset
    setCustomName("")
    setCustomDescription("")
    setCustomDays(30)
    setCustomTarget(undefined)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Novo Desafio
          </DialogTitle>
          <DialogDescription>Escolha um template ou crie personalizado</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === "templates" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("templates")}
              className="flex-1"
            >
              Templates
            </Button>
            <Button
              variant={mode === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("custom")}
              className="flex-1"
            >
              Personalizado
            </Button>
          </div>

          {mode === "templates" ? (
            <div className="space-y-2">
              {CHALLENGE_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                  <div className="flex gap-2 mt-1.5 text-xs text-muted-foreground">
                    <span>{template.durationDays} dias</span>
                    {template.suggestedTarget && (
                      <span>Meta: R$ {template.suggestedTarget.toLocaleString("pt-BR")}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="Ex: Mês sem gastos desnecessários"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição (opcional)</label>
                <Input
                  value={customDescription}
                  onChange={e => setCustomDescription(e.target.value)}
                  placeholder="Descreva o desafio"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Duração (dias)</label>
                  <Input
                    type="number"
                    min={1}
                    value={customDays}
                    onChange={e => setCustomDays(Number(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Meta em R$ (opcional)</label>
                  <Input
                    type="number"
                    min={0}
                    value={customTarget || ""}
                    onChange={e => setCustomTarget(Number(e.target.value) || undefined)}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <Button onClick={handleCustomSubmit} className="w-full" disabled={!customName.trim()}>
                Criar Desafio
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
