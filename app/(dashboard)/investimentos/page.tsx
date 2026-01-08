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
import {
  mockInvestments as initialInvestments,
  mockPortfolioEvolutionData,
  allocationTargets,
} from "@/lib/mock-data"

export default function InvestimentosPage() {
  const { toast } = useToast()
  const [investments, setInvestments] = useState<Investment[]>(initialInvestments)
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
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-display">Investimentos</h1>
          <p className="text-callout text-secondary mt-1">
            Acompanhe sua carteira e evolução patrimonial
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="lg" className="gap-2">
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
      <PortfolioEvolutionChart data={mockPortfolioEvolutionData} />

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
