"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CATEGORY_COLORS } from "@/lib/constants"

interface GoalFormProps {
  trigger?: React.ReactNode
  onSubmit?: (data: GoalFormData) => void
}

export interface GoalFormData {
  name: string
  description?: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  color?: string
}

export function GoalForm({ trigger, onSubmit }: GoalFormProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<GoalFormData>({
    name: "",
    description: "",
    targetAmount: 0,
    currentAmount: 0,
    deadline: "",
    color: CATEGORY_COLORS[0],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
    setOpen(false)
    setFormData({
      name: "",
      description: "",
      targetAmount: 0,
      currentAmount: 0,
      deadline: "",
      color: CATEGORY_COLORS[0],
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Nova Meta</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Meta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da Meta</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ex: Viagem para Europa"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição (opcional)</label>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descreva sua meta..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor da Meta</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.targetAmount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetAmount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Atual</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.currentAmount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentAmount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Prazo (opcional)</label>
            <Input
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cor</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.slice(0, 10).map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    formData.color === color
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
