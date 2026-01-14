"use client"

import { useState } from "react"
import {
  Plus,
  Trash2,
  Wallet,
  CreditCard,
  TrendingUp,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CurrencyInput } from "@/components/ui/currency-input"
import { cn } from "@/lib/utils"
import type { DbAccountType } from "@/types"

export interface AccountData {
  id: string
  nome: string
  tipo: DbAccountType
  banco: string
  saldoInicial: number
  cor: string
}

interface AccountsStepProps {
  accounts: AccountData[]
  onChange: (accounts: AccountData[]) => void
  errors?: Record<string, string>
}

const accountTypes: { value: DbAccountType; label: string; icon: React.ElementType }[] = [
  { value: "CORRENTE", label: "Conta Corrente", icon: Building2 },
  { value: "CARTAO_CREDITO", label: "Cartão de Crédito", icon: CreditCard },
  { value: "INVESTIMENTO", label: "Investimentos", icon: TrendingUp },
]

const bankOptions = [
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
  { value: "neon", label: "Neon" },
  { value: "picpay", label: "PicPay" },
  { value: "mercadopago", label: "Mercado Pago" },
  { value: "outro", label: "Outro" },
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

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function AccountsStep({ accounts, onChange, errors }: AccountsStepProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newAccount, setNewAccount] = useState<AccountData>({
    id: "",
    nome: "",
    tipo: "CORRENTE",
    banco: "bradesco",
    saldoInicial: 0,
    cor: "#3b82f6",
  })

  const handleAddAccount = () => {
    if (!newAccount.nome.trim()) return

    onChange([
      ...accounts,
      { ...newAccount, id: generateId() },
    ])
    setNewAccount({
      id: "",
      nome: "",
      tipo: "CORRENTE",
      banco: "bradesco",
      saldoInicial: 0,
      cor: "#3b82f6",
    })
    setIsAdding(false)
  }

  const handleRemoveAccount = (id: string) => {
    onChange(accounts.filter((a) => a.id !== id))
  }

  const getAccountIcon = (tipo: DbAccountType) => {
    const config = accountTypes.find((t) => t.value === tipo)
    return config?.icon || Wallet
  }

  const getAccountTypeLabel = (tipo: DbAccountType) => {
    const config = accountTypes.find((t) => t.value === tipo)
    return config?.label || tipo
  }

  const getBankLabel = (banco: string) => {
    const bank = bankOptions.find((b) => b.value === banco)
    return bank?.label || banco
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Suas Contas</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Adicione suas contas bancárias e cartões
        </p>
      </div>

      {/* Lista de contas adicionadas */}
      {accounts.length > 0 && (
        <div className="space-y-2">
          {accounts.map((account) => {
            const Icon = getAccountIcon(account.tipo)
            return (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${account.cor}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: account.cor }} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{account.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {getAccountTypeLabel(account.tipo)} • {getBankLabel(account.banco)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(account.saldoInicial)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAccount(account.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Formulário para adicionar conta */}
      {isAdding ? (
        <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
          <div className="space-y-2">
            <Label htmlFor="accountName">Nome da conta *</Label>
            <Input
              id="accountName"
              value={newAccount.nome}
              onChange={(e) =>
                setNewAccount({ ...newAccount, nome: e.target.value })
              }
              placeholder="Ex: Conta Principal, Cartão Nubank..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={newAccount.tipo}
                onValueChange={(value: DbAccountType) =>
                  setNewAccount({ ...newAccount, tipo: value })
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

            <div className="space-y-2">
              <Label>Banco</Label>
              <Select
                value={newAccount.banco}
                onValueChange={(value) =>
                  setNewAccount({ ...newAccount, banco: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bankOptions.map((bank) => (
                    <SelectItem key={bank.value} value={bank.value}>
                      {bank.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              {newAccount.tipo === "CARTAO_CREDITO"
                ? "Fatura Atual"
                : "Saldo Inicial"}
            </Label>
            <CurrencyInput
              value={newAccount.saldoInicial}
              onChange={(value) =>
                setNewAccount({ ...newAccount, saldoInicial: value })
              }
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() =>
                    setNewAccount({ ...newAccount, cor: color.value })
                  }
                  className={cn(
                    "h-7 w-7 rounded-full transition-all",
                    newAccount.cor === color.value &&
                      "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAddAccount}
              disabled={!newAccount.nome.trim()}
              className="flex-1"
            >
              Adicionar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4" />
          Adicionar Conta
        </Button>
      )}

      {errors?.accounts && (
        <p className="text-sm text-destructive text-center">{errors.accounts}</p>
      )}

      {accounts.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground text-center">
          Adicione pelo menos uma conta para continuar
        </p>
      )}
    </div>
  )
}
