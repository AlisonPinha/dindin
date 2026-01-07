"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useStore } from "@/hooks/use-store"
import { TRANSACTION_TYPES } from "@/lib/constants"
import type { TransactionType } from "@/types"

interface TransactionFormProps {
  trigger?: React.ReactNode
  onSubmit?: (data: TransactionFormData) => void
}

export interface TransactionFormData {
  description: string
  amount: number
  type: TransactionType
  date: string
  categoryId?: string
  accountId?: string
  notes?: string
}

export function TransactionForm({ trigger, onSubmit }: TransactionFormProps) {
  const { categories, accounts } = useStore()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<TransactionFormData>({
    description: "",
    amount: 0,
    type: "expense",
    date: format(new Date(), "yyyy-MM-dd"),
    categoryId: "",
    accountId: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
    setOpen(false)
    setFormData({
      description: "",
      amount: 0,
      type: "expense",
      date: format(new Date(), "yyyy-MM-dd"),
      categoryId: "",
      accountId: "",
      notes: "",
    })
  }

  const filteredCategories = categories.filter(
    (c) => c.type === formData.type || formData.type === "transfer"
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Nova Transação</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <Select
              value={formData.type}
              onValueChange={(value: TransactionType) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TRANSACTION_TYPES.INCOME}>Receita</SelectItem>
                <SelectItem value={TRANSACTION_TYPES.EXPENSE}>Despesa</SelectItem>
                <SelectItem value={TRANSACTION_TYPES.TRANSFER}>
                  Transferência
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ex: Supermercado"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Valor</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ""}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
              }
              placeholder="0,00"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Data</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) =>
                setFormData({ ...formData, categoryId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Conta</label>
            <Select
              value={formData.accountId}
              onValueChange={(value) =>
                setFormData({ ...formData, accountId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
