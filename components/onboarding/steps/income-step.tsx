"use client"

import { DollarSign, Wallet, ShoppingBag, TrendingUp } from "lucide-react"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/currency-input"
import { cn } from "@/lib/utils"

interface IncomeStepProps {
  rendaMensal: number
  onChange: (value: number) => void
  errors?: Record<string, string>
}

export function IncomeStep({ rendaMensal, onChange, errors }: IncomeStepProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)

  // Cálculos 50/30/20
  const essentials = rendaMensal * 0.5
  const lifestyle = rendaMensal * 0.3
  const investments = rendaMensal * 0.2

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Sua Renda Mensal</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Usaremos para calcular seu orçamento ideal
        </p>
      </div>

      {/* Input de Renda */}
      <div className="space-y-2">
        <Label htmlFor="renda">Renda mensal líquida *</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <CurrencyInput
            value={rendaMensal}
            onChange={onChange}
            placeholder="0,00"
            className={cn("pl-10 text-lg", errors?.rendaMensal && "border-destructive")}
          />
        </div>
        {errors?.rendaMensal && (
          <p className="text-sm text-destructive">{errors.rendaMensal}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Informe o valor total que você recebe por mês
        </p>
      </div>

      {/* Preview da Regra 50/30/20 */}
      {rendaMensal > 0 && (
        <div className="space-y-4 pt-4">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Regra 50/30/20
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Como seu orçamento será dividido
            </p>
          </div>

          <div className="space-y-3">
            {/* Essenciais - 50% */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Essenciais</p>
                    <p className="text-xs text-muted-foreground">
                      Moradia, alimentação, saúde
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(essentials)}
                  </p>
                  <p className="text-xs text-muted-foreground">50%</p>
                </div>
              </div>
            </div>

            {/* Estilo de Vida - 30% */}
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Estilo de Vida</p>
                    <p className="text-xs text-muted-foreground">
                      Lazer, compras, assinaturas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(lifestyle)}
                  </p>
                  <p className="text-xs text-muted-foreground">30%</p>
                </div>
              </div>
            </div>

            {/* Investimentos - 20% */}
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Investimentos</p>
                    <p className="text-xs text-muted-foreground">
                      CDB, ações, fundos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">
                    {formatCurrency(investments)}
                  </p>
                  <p className="text-xs text-muted-foreground">20%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de progresso visual */}
          <div className="h-3 rounded-full overflow-hidden flex">
            <div className="bg-blue-500 w-1/2" />
            <div className="bg-purple-500 w-[30%]" />
            <div className="bg-emerald-500 w-1/5" />
          </div>
        </div>
      )}
    </div>
  )
}
