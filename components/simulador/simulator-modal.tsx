"use client"

import { useState, useMemo } from "react"
import { Calculator, TrendingUp, Scissors, SlidersHorizontal } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useSelicRate } from "@/hooks/use-selic-rate"
import { calculateCompoundInterest } from "@/lib/calculations"


interface SimulatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function InvestTab({ monthlyRate }: { monthlyRate: number }) {
  const [monthlyDeposit, setMonthlyDeposit] = useState(500)
  const [period, setPeriod] = useState(60) // months

  const projection = useMemo(() => {
    const data: { month: number; label: string; total: number; invested: number }[] = []

    for (let i = 0; i <= period; i += Math.max(1, Math.floor(period / 20))) {
      const total = calculateCompoundInterest(0, monthlyRate, i, monthlyDeposit)
      data.push({
        month: i,
        label: i < 12 ? `${i}m` : `${(i / 12).toFixed(0)}a`,
        total,
        invested: monthlyDeposit * i,
      })
    }

    // Always include last point
    if (data[data.length - 1]?.month !== period) {
      const total = calculateCompoundInterest(0, monthlyRate, period, monthlyDeposit)
      data.push({
        month: period,
        label: period < 12 ? `${period}m` : `${(period / 12).toFixed(0)}a`,
        total,
        invested: monthlyDeposit * period,
      })
    }

    return data
  }, [monthlyDeposit, period, monthlyRate])

  const finalValue = projection[projection.length - 1]?.total || 0
  const totalInvested = monthlyDeposit * period
  const totalInterest = finalValue - totalInvested

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Valor mensal (R$)</label>
          <Input
            type="number"
            min={0}
            value={monthlyDeposit}
            onChange={e => setMonthlyDeposit(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Período (meses)</label>
          <Input
            type="number"
            min={1}
            max={360}
            value={period}
            onChange={e => setPeriod(Math.min(360, Number(e.target.value) || 1))}
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Investido</p>
          <p className="text-sm font-semibold">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <p className="text-xs text-muted-foreground">Juros</p>
          <p className="text-sm font-semibold text-emerald-500">{formatCurrency(totalInterest)}</p>
        </div>
        <div className="p-2 rounded-lg bg-blue-500/10">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-sm font-semibold text-blue-500">{formatCurrency(finalValue)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={projection} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="investGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(v) => `${((v as number)/1000).toFixed(0)}K`} tick={{ fontSize: 10 }} width={45} />
            <Tooltip formatter={(v) => formatCurrency(v as number)} />
            <Area type="monotone" dataKey="invested" stroke="#6b7280" strokeWidth={1} fill="url(#investedGradient)" name="Investido" />
            <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fill="url(#investGradient)" name="Com juros" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function CutExpenseTab({ monthlyRate }: { monthlyRate: number }) {
  const [cutAmount, setCutAmount] = useState(200)

  const results = useMemo(() => {
    const annualSaving = cutAmount * 12
    const fiveYearWithInterest = calculateCompoundInterest(0, monthlyRate, 60, cutAmount)
    const tenYearWithInterest = calculateCompoundInterest(0, monthlyRate, 120, cutAmount)

    return { annualSaving, fiveYearWithInterest, tenYearWithInterest }
  }, [cutAmount, monthlyRate])

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Cortar quanto por mês? (R$)</label>
        <Input
          type="number"
          min={0}
          value={cutAmount}
          onChange={e => setCutAmount(Number(e.target.value) || 0)}
        />
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Economia em 1 ano</p>
          <p className="text-xl font-bold text-emerald-500">{formatCurrency(results.annualSaving)}</p>
        </div>
        <div className="p-4 rounded-lg bg-emerald-500/10">
          <p className="text-sm text-muted-foreground">Em 5 anos (com rendimento)</p>
          <p className="text-xl font-bold text-emerald-500">{formatCurrency(results.fiveYearWithInterest)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            +{formatCurrency(results.fiveYearWithInterest - cutAmount * 60)} em juros
          </p>
        </div>
        <div className="p-4 rounded-lg bg-blue-500/10">
          <p className="text-sm text-muted-foreground">Em 10 anos (com rendimento)</p>
          <p className="text-xl font-bold text-blue-500">{formatCurrency(results.tenYearWithInterest)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            +{formatCurrency(results.tenYearWithInterest - cutAmount * 120)} em juros
          </p>
        </div>
      </div>
    </div>
  )
}

function RuleChangeTab() {
  const [essentials, setEssentials] = useState(50)
  const [lifestyle, setLifestyle] = useState(30)
  const [investmentPct, setInvestmentPct] = useState(20)

  const handleChange = (field: "essentials" | "lifestyle" | "investments", value: number) => {
    const clamped = Math.max(0, Math.min(100, value))
    if (field === "essentials") {
      setEssentials(clamped)
      const remainder = 100 - clamped
      const ratio = lifestyle + investmentPct > 0 ? lifestyle / (lifestyle + investmentPct) : 0.6
      setLifestyle(Math.round(remainder * ratio))
      setInvestmentPct(remainder - Math.round(remainder * ratio))
    } else if (field === "lifestyle") {
      setLifestyle(clamped)
      const remainder = 100 - clamped
      const ratio = essentials + investmentPct > 0 ? essentials / (essentials + investmentPct) : 0.7
      setEssentials(Math.round(remainder * ratio))
      setInvestmentPct(remainder - Math.round(remainder * ratio))
    } else {
      setInvestmentPct(clamped)
      const remainder = 100 - clamped
      const ratio = essentials + lifestyle > 0 ? essentials / (essentials + lifestyle) : 0.6
      setEssentials(Math.round(remainder * ratio))
      setLifestyle(remainder - Math.round(remainder * ratio))
    }
  }

  const total = essentials + lifestyle + investmentPct

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ajuste os percentuais da regra orçamentária (soma = 100%)
      </p>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Essenciais</span>
            <span className="font-medium">{essentials}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={essentials}
            onChange={e => handleChange("essentials", Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Estilo de Vida</span>
            <span className="font-medium">{lifestyle}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={lifestyle}
            onChange={e => handleChange("lifestyle", Number(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Investimentos</span>
            <span className="font-medium">{investmentPct}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={investmentPct}
            onChange={e => handleChange("investments", Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>

      {total !== 100 && (
        <p className="text-xs text-amber-500">Total: {total}% (deve ser 100%)</p>
      )}

      {/* Visual comparison */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Comparação com 50/30/20</p>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded bg-blue-500/10">
            <p className="text-muted-foreground">Essenciais</p>
            <p className="font-bold">{essentials}% <span className="text-muted-foreground font-normal">vs 50%</span></p>
            <p className={essentials <= 50 ? "text-emerald-500" : "text-amber-500"}>
              {essentials <= 50 ? "OK" : `+${essentials - 50}%`}
            </p>
          </div>
          <div className="p-2 rounded bg-purple-500/10">
            <p className="text-muted-foreground">Lifestyle</p>
            <p className="font-bold">{lifestyle}% <span className="text-muted-foreground font-normal">vs 30%</span></p>
            <p className={lifestyle <= 30 ? "text-emerald-500" : "text-amber-500"}>
              {lifestyle <= 30 ? "OK" : `+${lifestyle - 30}%`}
            </p>
          </div>
          <div className="p-2 rounded bg-emerald-500/10">
            <p className="text-muted-foreground">Invest.</p>
            <p className="font-bold">{investmentPct}% <span className="text-muted-foreground font-normal">vs 20%</span></p>
            <p className={investmentPct >= 20 ? "text-emerald-500" : "text-amber-500"}>
              {investmentPct >= 20 ? "OK" : `${investmentPct - 20}%`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SimulatorModal({ open, onOpenChange }: SimulatorModalProps) {
  const { rate: monthlyRate, annualRate } = useSelicRate()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulador &quot;E Se...&quot;
          </DialogTitle>
          <DialogDescription>
            Simule cenários usando taxa Selic ({annualRate.toFixed(2)}% a.a.)
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="invest" className="mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="invest" className="text-xs gap-1">
              <TrendingUp className="h-3 w-3" />
              Investir
            </TabsTrigger>
            <TabsTrigger value="cut" className="text-xs gap-1">
              <Scissors className="h-3 w-3" />
              Cortar
            </TabsTrigger>
            <TabsTrigger value="rule" className="text-xs gap-1">
              <SlidersHorizontal className="h-3 w-3" />
              Regra
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invest" className="mt-4">
            <InvestTab monthlyRate={monthlyRate} />
          </TabsContent>

          <TabsContent value="cut" className="mt-4">
            <CutExpenseTab monthlyRate={monthlyRate} />
          </TabsContent>

          <TabsContent value="rule" className="mt-4">
            <RuleChangeTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
