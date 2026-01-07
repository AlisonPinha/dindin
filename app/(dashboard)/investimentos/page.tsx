"use client"

import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  InvestmentSummaryCards,
  PortfolioEvolutionChart,
  InvestmentsTable,
  AllocationCard,
  InvestmentModal,
} from "@/components/investimentos"
import type { Investment, InvestmentType } from "@/components/investimentos"
import { useToast } from "@/hooks/use-toast"
import { generateId } from "@/lib/utils"

// Mock investments data
const mockInvestments: Investment[] = [
  {
    id: "1",
    name: "Petrobras",
    ticker: "PETR4",
    type: "stocks",
    institution: "XP Investimentos",
    purchasePrice: 28.50,
    currentPrice: 36.80,
    quantity: 100,
    purchaseDate: new Date("2025-03-15"),
  },
  {
    id: "2",
    name: "Vale",
    ticker: "VALE3",
    type: "stocks",
    institution: "XP Investimentos",
    purchasePrice: 62.30,
    currentPrice: 58.45,
    quantity: 50,
    purchaseDate: new Date("2025-05-20"),
  },
  {
    id: "3",
    name: "Itaú Unibanco",
    ticker: "ITUB4",
    type: "stocks",
    institution: "Clear",
    purchasePrice: 24.80,
    currentPrice: 28.90,
    quantity: 200,
    purchaseDate: new Date("2024-11-10"),
  },
  {
    id: "4",
    name: "CDB Nubank 120% CDI",
    type: "bonds",
    institution: "Nubank",
    purchasePrice: 10000,
    currentPrice: 11250,
    quantity: 1,
    purchaseDate: new Date("2024-06-01"),
    maturityDate: new Date("2027-06-01"),
  },
  {
    id: "5",
    name: "Tesouro Selic 2029",
    type: "bonds",
    institution: "Rico",
    purchasePrice: 15000,
    currentPrice: 16800,
    quantity: 1,
    purchaseDate: new Date("2024-03-15"),
    maturityDate: new Date("2029-03-01"),
  },
  {
    id: "6",
    name: "LCI Banco Inter",
    type: "bonds",
    institution: "Inter",
    purchasePrice: 8000,
    currentPrice: 8650,
    quantity: 1,
    purchaseDate: new Date("2025-01-10"),
    maturityDate: new Date("2026-07-10"),
  },
  {
    id: "7",
    name: "Bitcoin",
    ticker: "BTC",
    type: "crypto",
    institution: "Binance",
    purchasePrice: 180000,
    currentPrice: 520000,
    quantity: 0.05,
    purchaseDate: new Date("2023-12-01"),
  },
  {
    id: "8",
    name: "Ethereum",
    ticker: "ETH",
    type: "crypto",
    institution: "Mercado Bitcoin",
    purchasePrice: 8500,
    currentPrice: 18200,
    quantity: 0.5,
    purchaseDate: new Date("2024-02-15"),
  },
  {
    id: "9",
    name: "CSHG Logística",
    ticker: "HGLG11",
    type: "real_estate",
    institution: "XP Investimentos",
    purchasePrice: 156.80,
    currentPrice: 162.50,
    quantity: 30,
    purchaseDate: new Date("2024-08-20"),
  },
  {
    id: "10",
    name: "XP Malls",
    ticker: "XPML11",
    type: "real_estate",
    institution: "XP Investimentos",
    purchasePrice: 95.20,
    currentPrice: 98.80,
    quantity: 50,
    purchaseDate: new Date("2025-02-10"),
  },
  {
    id: "11",
    name: "Fundo Alaska Black",
    type: "funds",
    institution: "BTG Pactual",
    purchasePrice: 12000,
    currentPrice: 14500,
    quantity: 1,
    purchaseDate: new Date("2024-04-01"),
  },
]

// Mock portfolio evolution data
const mockEvolutionData = [
  { date: "Jul/25", total: 85000, stocks: 18000, bonds: 28000, crypto: 15000, realEstate: 12000, funds: 12000 },
  { date: "Ago/25", total: 92000, stocks: 20000, bonds: 29500, crypto: 18000, realEstate: 12500, funds: 12000 },
  { date: "Set/25", total: 98000, stocks: 22000, bonds: 31000, crypto: 19500, realEstate: 13000, funds: 12500 },
  { date: "Out/25", total: 105000, stocks: 25000, bonds: 32500, crypto: 21000, realEstate: 13500, funds: 13000 },
  { date: "Nov/25", total: 112000, stocks: 27000, bonds: 34000, crypto: 23000, realEstate: 14500, funds: 13500 },
  { date: "Dez/25", total: 118000, stocks: 28500, bonds: 35500, crypto: 25000, realEstate: 15000, funds: 14000 },
  { date: "Jan/26", total: 125450, stocks: 30000, bonds: 36700, crypto: 35100, realEstate: 9355, funds: 14500 },
]

// Allocation targets (from investment goals)
const allocationTargets: Record<InvestmentType, number> = {
  stocks: 30,
  bonds: 35,
  crypto: 10,
  real_estate: 15,
  funds: 10,
  other: 0,
}

export default function InvestimentosPage() {
  const { toast } = useToast()
  const [investments, setInvestments] = useState<Investment[]>(mockInvestments)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)

  // Calculate totals
  const totals = useMemo(() => {
    const totalInvested = investments.reduce(
      (sum, inv) => sum + inv.purchasePrice * inv.quantity,
      0
    )
    const totalCurrent = investments.reduce(
      (sum, inv) => sum + inv.currentPrice * inv.quantity,
      0
    )

    // Calculate by type
    const byType: Record<InvestmentType, number> = {
      stocks: 0,
      bonds: 0,
      crypto: 0,
      real_estate: 0,
      funds: 0,
      other: 0,
    }

    investments.forEach((inv) => {
      byType[inv.type] += inv.currentPrice * inv.quantity
    })

    return { totalInvested, totalCurrent, byType }
  }, [investments])

  // Distribution by type for summary cards
  const distributionByType = useMemo(() => {
    const typeLabels: Record<InvestmentType, { label: string; color: string }> = {
      stocks: { label: "Ações", color: "#3b82f6" },
      bonds: { label: "Renda Fixa", color: "#22c55e" },
      crypto: { label: "Cripto", color: "#f97316" },
      real_estate: { label: "FIIs", color: "#8b5cf6" },
      funds: { label: "Fundos", color: "#06b6d4" },
      other: { label: "Outros", color: "#64748b" },
    }

    return Object.entries(totals.byType)
      .filter(([, value]) => value > 0)
      .map(([type, value]) => ({
        type,
        label: typeLabels[type as InvestmentType].label,
        value,
        color: typeLabels[type as InvestmentType].color,
      }))
      .sort((a, b) => b.value - a.value)
  }, [totals.byType])

  // Allocation data with targets
  const allocationData = useMemo(() => {
    const typeLabels: Record<InvestmentType, { label: string; color: string }> = {
      stocks: { label: "Ações", color: "#3b82f6" },
      bonds: { label: "Renda Fixa", color: "#22c55e" },
      crypto: { label: "Cripto", color: "#f97316" },
      real_estate: { label: "FIIs", color: "#8b5cf6" },
      funds: { label: "Fundos", color: "#06b6d4" },
      other: { label: "Outros", color: "#64748b" },
    }

    return Object.entries(totals.byType)
      .filter(([type]) => totals.byType[type as InvestmentType] > 0 || allocationTargets[type as InvestmentType] > 0)
      .map(([type, value]) => ({
        type,
        label: typeLabels[type as InvestmentType].label,
        value,
        color: typeLabels[type as InvestmentType].color,
        targetPercent: allocationTargets[type as InvestmentType],
      }))
  }, [totals.byType])

  // Monthly contribution (mock - would come from transactions)
  const monthlyContribution = 2500
  const monthlyTarget = 3000

  // Handlers
  const handleOpenCreate = () => {
    setEditingInvestment(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleOpenEdit = (investment: Investment) => {
    setEditingInvestment(investment)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    const investment = investments.find((i) => i.id === id)
    setInvestments((prev) => prev.filter((i) => i.id !== id))
    toast({
      title: "Investimento excluído",
      description: `${investment?.name} foi removido da carteira.`,
    })
  }

  const handleSubmit = (data: Omit<Investment, "id">) => {
    if (modalMode === "create") {
      const newInvestment: Investment = {
        id: generateId(),
        ...data,
      }
      setInvestments((prev) => [newInvestment, ...prev])
      toast({
        title: "Investimento adicionado",
        description: `${data.name} foi adicionado à sua carteira.`,
      })
    } else if (editingInvestment) {
      setInvestments((prev) =>
        prev.map((i) =>
          i.id === editingInvestment.id
            ? { ...i, ...data }
            : i
        )
      )
      toast({
        title: "Investimento atualizado",
        description: `${data.name} foi atualizado com sucesso.`,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investimentos</h1>
          <p className="text-muted-foreground">
            Acompanhe sua carteira e evolução patrimonial
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="lg" className="gap-2 shadow-lg">
          <Plus className="h-5 w-5" />
          Novo Investimento
        </Button>
      </div>

      {/* Summary Cards */}
      <InvestmentSummaryCards
        totalInvested={totals.totalInvested}
        totalCurrent={totals.totalCurrent}
        monthlyContribution={monthlyContribution}
        monthlyTarget={monthlyTarget}
        distributionByType={distributionByType}
      />

      {/* Evolution Chart */}
      <PortfolioEvolutionChart data={mockEvolutionData} />

      {/* Table and Allocation */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Investments Table */}
        <div className="lg:col-span-2">
          <InvestmentsTable
            investments={investments}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Allocation Card */}
        <div>
          <AllocationCard
            currentAllocation={allocationData}
            totalValue={totals.totalCurrent}
          />
        </div>
      </div>

      {/* Investment Modal */}
      <InvestmentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        initialData={editingInvestment || undefined}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
