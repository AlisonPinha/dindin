"use client"

import { useState } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  CreditCard,
  TrendingUp,
  Building2,
  Power,
  PowerOff,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CurrencyInput } from "@/components/ui/currency-input"
import { useToast } from "@/hooks/use-toast"
import { cn, formatCurrency, generateId } from "@/lib/utils"
import type { AccountType } from "@/types"

interface AccountWithStatus {
  id: string
  name: string
  type: AccountType
  balance: number
  color: string
  icon?: string
  bank?: string
  isActive: boolean
}

interface AccountsTabProps {
  accounts: AccountWithStatus[]
  onAccountsChange: (accounts: AccountWithStatus[]) => void
}

const accountTypes: { value: AccountType; label: string; icon: React.ElementType }[] = [
  { value: "checking", label: "Conta Corrente", icon: Building2 },
  { value: "credit", label: "Cartão de Crédito", icon: CreditCard },
  { value: "investment", label: "Investimentos", icon: TrendingUp },
]

const colorOptions = [
  { value: "#ef4444", label: "Vermelho" },
  { value: "#f97316", label: "Laranja" },
  { value: "#eab308", label: "Amarelo" },
  { value: "#22c55e", label: "Verde" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#0ea5e9", label: "Azul Claro" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#8b5cf6", label: "Violeta" },
  { value: "#d946ef", label: "Fúcsia" },
  { value: "#ec4899", label: "Rosa" },
]

const bankOptions = [
  { value: "", label: "Selecione um banco" },
  { value: "bradesco", label: "Bradesco" },
  { value: "itau", label: "Itaú" },
  { value: "santander", label: "Santander" },
  { value: "bb", label: "Banco do Brasil" },
  { value: "caixa", label: "Caixa Econômica" },
  { value: "nubank", label: "Nubank" },
  { value: "inter", label: "Banco Inter" },
  { value: "c6", label: "C6 Bank" },
  { value: "btg", label: "BTG Pactual" },
  { value: "xp", label: "XP Investimentos" },
  { value: "rico", label: "Rico" },
  { value: "clear", label: "Clear" },
  { value: "modal", label: "Modal" },
  { value: "safra", label: "Safra" },
  { value: "original", label: "Banco Original" },
  { value: "pan", label: "Banco Pan" },
  { value: "neon", label: "Neon" },
  { value: "picpay", label: "PicPay" },
  { value: "mercadopago", label: "Mercado Pago" },
  { value: "outro", label: "Outro" },
]

// Icon options available for future use
// const iconOptions = [
//   { value: "wallet", label: "Carteira", icon: Wallet },
//   { value: "credit-card", label: "Cartão", icon: CreditCard },
//   { value: "piggy-bank", label: "Porquinho", icon: PiggyBank },
//   { value: "trending-up", label: "Gráfico", icon: TrendingUp },
//   { value: "building", label: "Banco", icon: Building2 },
// ]

export function AccountsTab({ accounts, onAccountsChange }: AccountsTabProps) {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountWithStatus | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<AccountWithStatus | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "checking" as AccountType,
    balance: 0,
    color: "#3b82f6",
    icon: "wallet",
    bank: "",
    isActive: true,
  })

  const handleOpenCreate = () => {
    setEditingAccount(null)
    setFormData({
      name: "",
      type: "checking",
      balance: 0,
      color: "#3b82f6",
      icon: "wallet",
      bank: "",
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (account: AccountWithStatus) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      color: account.color,
      icon: account.icon || "wallet",
      bank: account.bank || "",
      isActive: account.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleOpenDelete = (account: AccountWithStatus) => {
    setDeletingAccount(account)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome da conta.",
        variant: "destructive",
      })
      return
    }

    if (editingAccount) {
      const updated = accounts.map((a) =>
        a.id === editingAccount.id
          ? { ...a, ...formData }
          : a
      )
      onAccountsChange(updated)
      toast({
        title: "Conta atualizada",
        description: `${formData.name} foi atualizada com sucesso.`,
      })
    } else {
      const newAccount: AccountWithStatus = {
        id: generateId(),
        ...formData,
      }
      onAccountsChange([...accounts, newAccount])
      toast({
        title: "Conta adicionada",
        description: `${formData.name} foi adicionada com sucesso.`,
      })
    }

    setIsDialogOpen(false)
  }

  const handleDelete = () => {
    if (!deletingAccount) return

    const updated = accounts.filter((a) => a.id !== deletingAccount.id)
    onAccountsChange(updated)
    toast({
      title: "Conta removida",
      description: `${deletingAccount.name} foi removida com sucesso.`,
    })
    setIsDeleteDialogOpen(false)
    setDeletingAccount(null)
  }

  const handleToggleActive = (accountId: string) => {
    const updated = accounts.map((a) =>
      a.id === accountId ? { ...a, isActive: !a.isActive } : a
    )
    onAccountsChange(updated)
    const account = accounts.find((a) => a.id === accountId)
    toast({
      title: account?.isActive ? "Conta desativada" : "Conta ativada",
      description: `${account?.name} foi ${account?.isActive ? "desativada" : "ativada"}.`,
    })
  }

  const getAccountIcon = (type: AccountType) => {
    const config = accountTypes.find((t) => t.value === type)
    return config?.icon || Wallet
  }

  const getAccountTypeLabel = (type: AccountType) => {
    const config = accountTypes.find((t) => t.value === type)
    return config?.label || type
  }

  const getBankLabel = (bankValue: string | undefined) => {
    if (!bankValue) return null
    const bank = bankOptions.find((b) => b.value === bankValue)
    return bank?.label || bankValue
  }

  const totalBalance = accounts
    .filter((a) => a.isActive && a.type !== "credit")
    .reduce((sum, a) => sum + a.balance, 0)

  const totalCredit = accounts
    .filter((a) => a.isActive && a.type === "credit")
    .reduce((sum, a) => sum + a.balance, 0)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contas e Cartões</CardTitle>
              <CardDescription>
                Gerencie suas contas bancárias e cartões de crédito
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm text-muted-foreground">Saldo Total</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <p className="text-sm text-muted-foreground">Fatura Cartões</p>
              <p className="text-2xl font-bold text-rose-600">
                {formatCurrency(totalCredit)}
              </p>
            </div>
          </div>

          {/* Accounts List */}
          <div className="space-y-3">
            {accounts.map((account) => {
              const Icon = getAccountIcon(account.type)
              return (
                <div
                  key={account.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-4 transition-opacity",
                    !account.isActive && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${account.color}20` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: account.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{account.name}</p>
                        {!account.isActive && (
                          <span className="text-xs text-muted-foreground">(Inativa)</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getAccountTypeLabel(account.type)}
                        {account.bank && ` • ${getBankLabel(account.bank)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-lg font-semibold",
                          account.type === "credit" ? "text-rose-500" : "text-foreground"
                        )}
                      >
                        {account.type === "credit" ? "-" : ""}
                        {formatCurrency(account.balance)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(account.id)}
                        className={cn(
                          account.isActive
                            ? "text-emerald-600 hover:text-emerald-700"
                            : "text-muted-foreground"
                        )}
                      >
                        {account.isActive ? (
                          <Power className="h-4 w-4" />
                        ) : (
                          <PowerOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(account)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDelete(account)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}

            {accounts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhuma conta cadastrada</p>
                <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
                  Adicionar primeira conta
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? "Editar Conta" : "Nova Conta"}
            </DialogTitle>
            <DialogDescription>
              {editingAccount
                ? "Atualize as informações da conta"
                : "Adicione uma nova conta ou cartão"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Conta *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Nubank, Itaú, etc."
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <Select
                value={formData.type}
                onValueChange={(value: AccountType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bank */}
            <div className="space-y-2">
              <Label>Banco / Instituição</Label>
              <Select
                value={formData.bank}
                onValueChange={(value) =>
                  setFormData({ ...formData, bank: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um banco" />
                </SelectTrigger>
                <SelectContent>
                  {bankOptions.filter(b => b.value !== "").map((bank) => (
                    <SelectItem key={bank.value} value={bank.value}>
                      {bank.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Balance */}
            <div className="space-y-2">
              <Label htmlFor="balance">
                {formData.type === "credit" ? "Fatura Atual" : "Saldo Inicial"}
              </Label>
              <CurrencyInput
                id="balance"
                value={formData.balance}
                onChange={(value) => setFormData({ ...formData, balance: value })}
                placeholder="0,00"
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      formData.color === color.value &&
                        "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Conta Ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Contas inativas não aparecem nos resumos
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingAccount ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {deletingAccount?.name}?
              Todas as transações vinculadas perderão a referência à conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
