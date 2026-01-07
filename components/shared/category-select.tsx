"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  nome: string
  tipo: string
  cor: string
  icone?: string
  grupo: string
}

interface CategorySelectProps {
  value: string
  onValueChange: (value: string) => void
  categories: Category[]
  placeholder?: string
  filterType?: "RECEITA" | "DESPESA" | "INVESTIMENTO"
  filterGroup?: "ESSENCIAL" | "LIVRE" | "INVESTIMENTO"
  disabled?: boolean
  className?: string
}

export function CategorySelect({
  value,
  onValueChange,
  categories,
  placeholder = "Selecione uma categoria",
  filterType,
  filterGroup,
  disabled,
  className,
}: CategorySelectProps) {
  const filteredCategories = React.useMemo(() => {
    return categories.filter((cat) => {
      if (filterType && cat.tipo !== filterType) return false
      if (filterGroup && cat.grupo !== filterGroup) return false
      return true
    })
  }, [categories, filterType, filterGroup])

  // Group categories by tipo
  const groupedCategories = React.useMemo(() => {
    const groups: Record<string, Category[]> = {}

    filteredCategories.forEach((cat) => {
      if (!groups[cat.tipo]) {
        groups[cat.tipo] = []
      }
      groups[cat.tipo].push(cat)
    })

    return groups
  }, [filteredCategories])

  const tipoLabels: Record<string, string> = {
    RECEITA: "Receitas",
    DESPESA: "Despesas",
    INVESTIMENTO: "Investimentos",
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder}>
          {value && (
            <CategoryItem
              category={categories.find((c) => c.id === value)}
            />
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedCategories).map(([tipo, cats]) => (
          <React.Fragment key={tipo}>
            {!filterType && (
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {tipoLabels[tipo] || tipo}
              </div>
            )}
            {cats.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <CategoryItem category={category} />
              </SelectItem>
            ))}
          </React.Fragment>
        ))}
        {filteredCategories.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            Nenhuma categoria encontrada
          </div>
        )}
      </SelectContent>
    </Select>
  )
}

function CategoryItem({ category }: { category?: Category }) {
  if (!category) return null

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-3 w-3 rounded-full shrink-0"
        style={{ backgroundColor: category.cor }}
      />
      <span>{category.nome}</span>
    </div>
  )
}

// Chip-style category selector for quick selection
interface CategoryChipsProps {
  value: string
  onValueChange: (value: string) => void
  categories: Category[]
  filterType?: "RECEITA" | "DESPESA" | "INVESTIMENTO"
  maxVisible?: number
  className?: string
}

export function CategoryChips({
  value,
  onValueChange,
  categories,
  filterType,
  maxVisible = 5,
  className,
}: CategoryChipsProps) {
  const filteredCategories = React.useMemo(() => {
    return categories.filter((cat) => {
      if (filterType && cat.tipo !== filterType) return false
      return true
    })
  }, [categories, filterType])

  const visibleCategories = filteredCategories.slice(0, maxVisible)
  const hasMore = filteredCategories.length > maxVisible

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {visibleCategories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onValueChange(category.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
            value === category.id
              ? "ring-2 ring-primary ring-offset-2"
              : "bg-muted hover:bg-muted/80"
          )}
          style={{
            backgroundColor:
              value === category.id ? `${category.cor}20` : undefined,
            borderColor: value === category.id ? category.cor : undefined,
          }}
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: category.cor }}
          />
          <span>{category.nome}</span>
        </button>
      ))}
      {hasMore && (
        <span className="flex items-center px-2 text-sm text-muted-foreground">
          +{filteredCategories.length - maxVisible} mais
        </span>
      )}
    </div>
  )
}
