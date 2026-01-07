"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Calendar as CalendarIcon,
  X,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { Category, Account, User } from "@/types"

export interface TransactionFilters {
  dateStart?: Date
  dateEnd?: Date
  type: "all" | "income" | "expense" | "transfer"
  categories: string[]
  accountId?: string
  memberId?: string
  tags: string[]
}

interface TransactionFiltersProps {
  filters: TransactionFilters
  onFiltersChange: (filters: TransactionFilters) => void
  categories: Category[]
  accounts: Account[]
  members: User[]
  tags?: string[]
}

export function TransactionFiltersComponent({
  filters,
  onFiltersChange,
  categories,
  accounts,
  members,
  tags = [],
}: TransactionFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateFilter = <K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      type: "all",
      categories: [],
      tags: [],
    })
  }

  const hasActiveFilters =
    filters.dateStart ||
    filters.dateEnd ||
    filters.type !== "all" ||
    filters.categories.length > 0 ||
    filters.accountId ||
    filters.memberId ||
    filters.tags.length > 0

  const activeFilterCount = [
    filters.dateStart || filters.dateEnd,
    filters.type !== "all",
    filters.categories.length > 0,
    filters.accountId,
    filters.memberId,
    filters.tags.length > 0,
  ].filter(Boolean).length

  const toggleCategory = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((c) => c !== categoryId)
      : [...filters.categories, categoryId]
    updateFilter("categories", newCategories)
  }

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag]
    updateFilter("tags", newTags)
  }

  return (
    <div className="space-y-4">
      {/* Main Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal min-w-[200px]",
                (filters.dateStart || filters.dateEnd) && "border-primary"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateStart && filters.dateEnd ? (
                <>
                  {format(filters.dateStart, "dd/MM", { locale: ptBR })} -{" "}
                  {format(filters.dateEnd, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : filters.dateStart ? (
                <>A partir de {format(filters.dateStart, "dd/MM/yyyy", { locale: ptBR })}</>
              ) : filters.dateEnd ? (
                <>Até {format(filters.dateEnd, "dd/MM/yyyy", { locale: ptBR })}</>
              ) : (
                <span className="text-muted-foreground">Período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              <div className="border-r p-3">
                <p className="text-xs text-muted-foreground mb-2">Data Início</p>
                <Calendar
                  mode="single"
                  selected={filters.dateStart}
                  onSelect={(date) => updateFilter("dateStart", date)}
                  locale={ptBR}
                  initialFocus
                />
              </div>
              <div className="p-3">
                <p className="text-xs text-muted-foreground mb-2">Data Fim</p>
                <Calendar
                  mode="single"
                  selected={filters.dateEnd}
                  onSelect={(date) => updateFilter("dateEnd", date)}
                  locale={ptBR}
                  disabled={(date) =>
                    filters.dateStart ? date < filters.dateStart : false
                  }
                />
              </div>
            </div>
            <div className="border-t p-2 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateFilter("dateStart", undefined)
                  updateFilter("dateEnd", undefined)
                }}
              >
                Limpar
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Type Filter */}
        <Select
          value={filters.type}
          onValueChange={(value) =>
            updateFilter("type", value as TransactionFilters["type"])
          }
        >
          <SelectTrigger
            className={cn(
              "w-[140px]",
              filters.type !== "all" && "border-primary"
            )}
          >
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Entradas</SelectItem>
            <SelectItem value="expense">Saídas</SelectItem>
            <SelectItem value="transfer">Transferências</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "min-w-[140px] justify-between",
                filters.categories.length > 0 && "border-primary"
              )}
            >
              <span>
                {filters.categories.length > 0
                  ? `${filters.categories.length} categoria${filters.categories.length > 1 ? "s" : ""}`
                  : "Categorias"}
              </span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <div className="p-3 border-b">
              <p className="text-sm font-medium">Categorias</p>
            </div>
            <div className="max-h-[250px] overflow-y-auto p-2">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma categoria
                </p>
              ) : (
                <div className="space-y-1">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <Checkbox
                        checked={filters.categories.includes(category.id)}
                        onCheckedChange={() => toggleCategory(category.id)}
                      />
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm flex-1">{category.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {filters.categories.length > 0 && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => updateFilter("categories", [])}
                >
                  Limpar seleção
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Account Filter */}
        <Select
          value={filters.accountId || "all"}
          onValueChange={(value) =>
            updateFilter("accountId", value === "all" ? undefined : value)
          }
        >
          <SelectTrigger
            className={cn(
              "w-[150px]",
              filters.accountId && "border-primary"
            )}
          >
            <SelectValue placeholder="Conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas contas</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Member Filter */}
        <Select
          value={filters.memberId || "all"}
          onValueChange={(value) =>
            updateFilter("memberId", value === "all" ? undefined : value)
          }
        >
          <SelectTrigger
            className={cn(
              "w-[150px]",
              filters.memberId && "border-primary"
            )}
          >
            <SelectValue placeholder="Membro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos membros</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        {tags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Mais filtros
          </Button>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground gap-1"
          >
            <X className="h-4 w-4" />
            Limpar ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg">
          <span className="text-sm text-muted-foreground mr-2">Tags:</span>
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant={filters.tags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtros ativos:</span>
          {(filters.dateStart || filters.dateEnd) && (
            <Badge variant="secondary" className="gap-1">
              <CalendarIcon className="h-3 w-3" />
              {filters.dateStart && filters.dateEnd
                ? `${format(filters.dateStart, "dd/MM")} - ${format(filters.dateEnd, "dd/MM")}`
                : filters.dateStart
                ? `A partir de ${format(filters.dateStart, "dd/MM")}`
                : `Até ${format(filters.dateEnd!, "dd/MM")}`}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => {
                  updateFilter("dateStart", undefined)
                  updateFilter("dateEnd", undefined)
                }}
              />
            </Badge>
          )}
          {filters.type !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {filters.type === "income"
                ? "Entradas"
                : filters.type === "expense"
                ? "Saídas"
                : "Transferências"}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilter("type", "all")}
              />
            </Badge>
          )}
          {filters.categories.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {filters.categories.length} categoria{filters.categories.length > 1 ? "s" : ""}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilter("categories", [])}
              />
            </Badge>
          )}
          {filters.accountId && (
            <Badge variant="secondary" className="gap-1">
              {accounts.find((a) => a.id === filters.accountId)?.name}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilter("accountId", undefined)}
              />
            </Badge>
          )}
          {filters.memberId && (
            <Badge variant="secondary" className="gap-1">
              {members.find((m) => m.id === filters.memberId)?.name}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilter("memberId", undefined)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
