"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number
  onChange: (value: number) => void
  currency?: string
  locale?: string
}

export function MoneyInput({
  value,
  onChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currency = "BRL",
  locale = "pt-BR",
  className,
  ...props
}: MoneyInputProps) {
  const [displayValue, setDisplayValue] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Format number to currency display
  const formatCurrency = React.useCallback(
    (num: number) => {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num)
    },
    [locale]
  )

  // Initialize display value
  React.useEffect(() => {
    setDisplayValue(formatCurrency(value))
  }, [value, formatCurrency])

  // Parse display value to number
  const parseToNumber = (str: string): number => {
    // Remove all non-numeric characters except comma/period
    const cleaned = str.replace(/[^\d,.-]/g, "")
    // Replace comma with period for parsing
    const normalized = cleaned.replace(",", ".")
    const parsed = parseFloat(normalized)
    return isNaN(parsed) ? 0 : parsed
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value

    // Allow only numbers, comma, and period
    const cleaned = rawValue.replace(/[^\d,]/g, "")

    // Handle typing - keep only the last occurrence of comma
    const parts = cleaned.split(",")
    let formatted: string

    if (parts.length > 2) {
      // Multiple commas - keep first part and last part
      formatted = parts[0] + "," + parts.slice(1).join("")
    } else if (parts.length === 2) {
      // One comma - limit decimal places to 2
      formatted = parts[0] + "," + parts[1].slice(0, 2)
    } else {
      formatted = cleaned
    }

    setDisplayValue(formatted)

    // Parse and update parent
    const numValue = parseToNumber(formatted)
    onChange(numValue)
  }

  const handleBlur = () => {
    // Format on blur
    setDisplayValue(formatCurrency(value))
  }

  const handleFocus = () => {
    // Select all on focus
    setTimeout(() => {
      inputRef.current?.select()
    }, 0)
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
        R$
      </span>
      <Input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={cn("pl-10 text-right font-medium", className)}
        {...props}
      />
    </div>
  )
}

// Simplified version that just shows formatted value
interface MoneyDisplayProps {
  value: number
  className?: string
  showSign?: boolean
  colored?: boolean
}

export function MoneyDisplay({
  value,
  className,
  showSign = false,
  colored = false,
}: MoneyDisplayProps) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(value))

  const sign = value >= 0 ? "+" : "-"
  const display = showSign ? `${sign} ${formatted}` : formatted

  return (
    <span
      className={cn(
        colored && value > 0 && "income-text",
        colored && value < 0 && "expense-text",
        className
      )}
    >
      {display}
    </span>
  )
}
