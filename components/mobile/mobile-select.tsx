"use client"

import * as React from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BottomSheet } from "./bottom-sheet"

interface SelectOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface MobileSelectProps {
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  searchable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

export function MobileSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  label,
  searchable = false,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado",
  className,
  disabled = false,
}: MobileSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        opt.description?.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearch("")
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={cn(
          "flex h-12 w-full items-center justify-between",
          "rounded-lg border border-input bg-background px-4",
          "text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors",
          !value && "text-muted-foreground",
          className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {/* Bottom sheet for options */}
      <BottomSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        title={label || "Selecione uma opção"}
        snapPoints={[0.5, 0.85]}
      >
        {/* Search input */}
        {searchable && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-12 pl-10 pr-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Options list */}
        <div className="space-y-1">
          {filteredOptions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => !option.disabled && handleSelect(option.value)}
                disabled={option.disabled}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-3",
                  "text-left transition-colors",
                  "hover:bg-muted focus-visible:bg-muted",
                  "focus-visible:outline-none",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  option.value === value && "bg-primary/10"
                )}
              >
                {option.icon && (
                  <span className="shrink-0">{option.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      option.value === value && "text-primary"
                    )}
                  >
                    {option.label}
                  </p>
                  {option.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {option.description}
                    </p>
                  )}
                </div>
                {option.value === value && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
              </button>
            ))
          )}
        </div>
      </BottomSheet>
    </>
  )
}

// Multi-select version
interface MobileMultiSelectProps {
  options: SelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  label?: string
  searchable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  maxSelections?: number
  className?: string
  disabled?: boolean
}

export function MobileMultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Selecione...",
  label,
  searchable = false,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado",
  maxSelections,
  className,
  disabled = false,
}: MobileMultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedOptions = options.filter((opt) => value.includes(opt.value))
  const canSelectMore = !maxSelections || value.length < maxSelections

  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        opt.description?.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else if (canSelectMore) {
      onChange([...value, optionValue])
    }
  }

  const handleClear = () => {
    onChange([])
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={cn(
          "flex min-h-12 w-full items-center justify-between",
          "rounded-lg border border-input bg-background px-4 py-2",
          "text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors",
          className
        )}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
              >
                {opt.label}
              </span>
            ))
          )}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
      </button>

      {/* Bottom sheet for options */}
      <BottomSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        title={label || "Selecione opções"}
        snapPoints={[0.5, 0.85]}
      >
        {/* Search input */}
        {searchable && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-12 pl-10 pr-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Selection info */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">
            {value.length} selecionado{value.length !== 1 ? "s" : ""}
            {maxSelections && ` de ${maxSelections}`}
          </span>
          {value.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Limpar
            </Button>
          )}
        </div>

        {/* Options list */}
        <div className="space-y-1">
          {filteredOptions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = value.includes(option.value)
              const isDisabled =
                option.disabled || (!isSelected && !canSelectMore)

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => !isDisabled && handleToggle(option.value)}
                  disabled={isDisabled}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3",
                    "text-left transition-colors",
                    "hover:bg-muted focus-visible:bg-muted",
                    "focus-visible:outline-none",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isSelected && "bg-primary/10"
                  )}
                >
                  {/* Checkbox indicator */}
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border-2 shrink-0",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </span>

                  {option.icon && (
                    <span className="shrink-0">{option.icon}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{option.label}</p>
                    {option.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {option.description}
                      </p>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Confirm button */}
        <div className="mt-4 pt-4 border-t">
          <Button onClick={() => setIsOpen(false)} className="w-full h-12">
            Confirmar
          </Button>
        </div>
      </BottomSheet>
    </>
  )
}
