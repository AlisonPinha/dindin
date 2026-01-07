"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  Building2,
  Coins,
  LineChart,
  Landmark,
  PiggyBank,
  HelpCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatCurrency, formatPercentage, cn } from "@/lib/utils"

export type InvestmentType = "stocks" | "bonds" | "crypto" | "real_estate" | "funds" | "other"

export interface Investment {
  id: string
  name: string
  ticker?: string
  type: InvestmentType
  institution: string
  purchasePrice: number
  currentPrice: number
  quantity: number
  purchaseDate: Date
  maturityDate?: Date
}

interface InvestmentsTableProps {
  investments: Investment[]
  onEdit?: (investment: Investment) => void
  onDelete?: (id: string) => void
}

type SortField = "name" | "type" | "institution" | "invested" | "current" | "return" | "returnPercent" | "purchaseDate" | "maturityDate"
type SortDirection = "asc" | "desc"

const typeConfig: Record<InvestmentType, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  stocks: { label: "Ações", icon: LineChart, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  bonds: { label: "Renda Fixa", icon: PiggyBank, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  crypto: { label: "Cripto", icon: Coins, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  real_estate: { label: "FIIs", icon: Building2, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  funds: { label: "Fundos", icon: Landmark, color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
  other: { label: "Outros", icon: HelpCircle, color: "text-slate-500", bgColor: "bg-slate-500/10" },
}

export function InvestmentsTable({
  investments,
  onEdit,
  onDelete,
}: InvestmentsTableProps) {
  const [sortField, setSortField] = useState<SortField>("invested")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterInstitution, setFilterInstitution] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Get unique institutions
  const institutions = useMemo(() => {
    return Array.from(new Set(investments.map((i) => i.institution)))
  }, [investments])

  // Filter and sort investments
  const processedInvestments = useMemo(() => {
    let filtered = [...investments]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(term) ||
          i.ticker?.toLowerCase().includes(term) ||
          i.institution.toLowerCase().includes(term)
      )
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter((i) => i.type === filterType)
    }

    // Apply institution filter
    if (filterInstitution !== "all") {
      filtered = filtered.filter((i) => i.institution === filterInstitution)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: number | string | Date
      let bValue: number | string | Date

      const aInvested = a.purchasePrice * a.quantity
      const bInvested = b.purchasePrice * b.quantity
      const aCurrent = a.currentPrice * a.quantity
      const bCurrent = b.currentPrice * b.quantity
      const aReturn = aCurrent - aInvested
      const bReturn = bCurrent - bInvested
      const aReturnPercent = aInvested > 0 ? (aReturn / aInvested) * 100 : 0
      const bReturnPercent = bInvested > 0 ? (bReturn / bInvested) * 100 : 0

      switch (sortField) {
        case "name":
          aValue = a.name
          bValue = b.name
          break
        case "type":
          aValue = a.type
          bValue = b.type
          break
        case "institution":
          aValue = a.institution
          bValue = b.institution
          break
        case "invested":
          aValue = aInvested
          bValue = bInvested
          break
        case "current":
          aValue = aCurrent
          bValue = bCurrent
          break
        case "return":
          aValue = aReturn
          bValue = bReturn
          break
        case "returnPercent":
          aValue = aReturnPercent
          bValue = bReturnPercent
          break
        case "purchaseDate":
          aValue = new Date(a.purchaseDate)
          bValue = new Date(b.purchaseDate)
          break
        case "maturityDate":
          aValue = a.maturityDate ? new Date(a.maturityDate) : new Date(0)
          bValue = b.maturityDate ? new Date(b.maturityDate) : new Date(0)
          break
        default:
          aValue = aInvested
          bValue = bInvested
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [investments, sortField, sortDirection, filterType, filterInstitution, searchTerm])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    )
  }

  const hasActiveFilters = filterType !== "all" || filterInstitution !== "all" || searchTerm

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Meus Investimentos</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar investimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[200px]"
            />
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant={hasActiveFilters ? "default" : "outline"} size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros</h4>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFilterType("all")
                          setFilterInstitution("all")
                          setSearchTerm("")
                        }}
                      >
                        Limpar
                        <X className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Tipo</label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        {Object.entries(typeConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Instituição</label>
                    <Select value={filterInstitution} onValueChange={setFilterInstitution}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as instituições</SelectItem>
                        {institutions.map((inst) => (
                          <SelectItem key={inst} value={inst}>
                            {inst}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 font-medium"
                    onClick={() => handleSort("name")}
                  >
                    Nome
                    <SortIcon field="name" />
                  </Button>
                </th>
                <th className="text-left py-3 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 font-medium"
                    onClick={() => handleSort("type")}
                  >
                    Tipo
                    <SortIcon field="type" />
                  </Button>
                </th>
                <th className="text-left py-3 px-2 hidden md:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 font-medium"
                    onClick={() => handleSort("institution")}
                  >
                    Instituição
                    <SortIcon field="institution" />
                  </Button>
                </th>
                <th className="text-right py-3 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 font-medium"
                    onClick={() => handleSort("invested")}
                  >
                    Aplicado
                    <SortIcon field="invested" />
                  </Button>
                </th>
                <th className="text-right py-3 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 font-medium"
                    onClick={() => handleSort("current")}
                  >
                    Atual
                    <SortIcon field="current" />
                  </Button>
                </th>
                <th className="text-right py-3 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 font-medium"
                    onClick={() => handleSort("returnPercent")}
                  >
                    Rent. %
                    <SortIcon field="returnPercent" />
                  </Button>
                </th>
                <th className="text-center py-3 px-2 hidden lg:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 font-medium"
                    onClick={() => handleSort("purchaseDate")}
                  >
                    Aplicação
                    <SortIcon field="purchaseDate" />
                  </Button>
                </th>
                <th className="text-center py-3 px-2 hidden lg:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 font-medium"
                    onClick={() => handleSort("maturityDate")}
                  >
                    Vencimento
                    <SortIcon field="maturityDate" />
                  </Button>
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {processedInvestments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum investimento encontrado
                  </td>
                </tr>
              ) : (
                processedInvestments.map((investment) => {
                  const invested = investment.purchasePrice * investment.quantity
                  const current = investment.currentPrice * investment.quantity
                  const returnValue = current - invested
                  const returnPercent = invested > 0 ? (returnValue / invested) * 100 : 0
                  const isPositive = returnValue >= 0
                  const config = typeConfig[investment.type]
                  const TypeIcon = config.icon

                  return (
                    <tr key={investment.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", config.bgColor)}>
                            <TypeIcon className={cn("h-4 w-4", config.color)} />
                          </div>
                          <div>
                            <p className="font-medium">{investment.name}</p>
                            {investment.ticker && (
                              <p className="text-xs text-muted-foreground">
                                {investment.ticker}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="secondary" className={cn(config.bgColor, config.color)}>
                          {config.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 hidden md:table-cell text-muted-foreground">
                        {investment.institution}
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        {formatCurrency(invested)}
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        {formatCurrency(current)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isPositive ? (
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-rose-500" />
                          )}
                          <span className={cn(
                            "font-medium",
                            isPositive ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {isPositive ? "+" : ""}{formatPercentage(returnPercent)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center hidden lg:table-cell text-muted-foreground text-sm">
                        {format(new Date(investment.purchaseDate), "dd/MM/yy", { locale: ptBR })}
                      </td>
                      <td className="py-3 px-2 text-center hidden lg:table-cell text-muted-foreground text-sm">
                        {investment.maturityDate
                          ? format(new Date(investment.maturityDate), "dd/MM/yy", { locale: ptBR })
                          : "-"}
                      </td>
                      <td className="py-3 px-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(investment)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onDelete?.(investment.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {processedInvestments.length > 0 && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {processedInvestments.length} investimento{processedInvestments.length !== 1 && "s"}
            </span>
            <div className="flex items-center gap-6">
              <div>
                <span className="text-muted-foreground">Total aplicado: </span>
                <span className="font-medium">
                  {formatCurrency(
                    processedInvestments.reduce(
                      (sum, i) => sum + i.purchasePrice * i.quantity,
                      0
                    )
                  )}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Valor atual: </span>
                <span className="font-medium">
                  {formatCurrency(
                    processedInvestments.reduce(
                      (sum, i) => sum + i.currentPrice * i.quantity,
                      0
                    )
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
