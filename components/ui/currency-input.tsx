"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number
  onChange: (value: number) => void
  locale?: string
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      className,
      value,
      onChange,
      locale = "pt-BR",
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState("")

    // Format number to currency display
    const formatCurrency = React.useCallback((num: number): string => {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num)
    }, [locale])

    // Initialize display value
    React.useEffect(() => {
      setDisplayValue(formatCurrency(value))
    }, [value, formatCurrency])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value

      // Allow only numbers, comma, and dot
      const cleaned = input.replace(/[^\d,]/g, "")

      // Handle the input
      if (cleaned === "") {
        setDisplayValue("")
        onChange(0)
        return
      }

      // Split by comma (decimal separator in pt-BR)
      const parts = cleaned.split(",")
      let formatted = parts[0]

      // Add decimal part if exists (max 2 digits)
      if (parts.length > 1) {
        formatted += "," + parts[1].slice(0, 2)
      }

      setDisplayValue(formatted)

      // Convert to number (replace comma with dot)
      const numValue = parseFloat(formatted.replace(",", ".")) || 0
      onChange(numValue)
    }

    const handleBlur = () => {
      // Format on blur
      setDisplayValue(formatCurrency(value))
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Select all on focus
      e.target.select()
    }

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          R$
        </span>
        <input
          type="text"
          inputMode="decimal"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right font-medium",
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          {...props}
        />
      </div>
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
