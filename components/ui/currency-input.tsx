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
    const [isFocused, setIsFocused] = React.useState(false)
    const previousValueRef = React.useRef<number>(value)

    // Format number to currency display
    const formatCurrency = React.useCallback((num: number): string => {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num)
    }, [locale])

    // Initialize display value - only update if value changed externally (not while typing)
    React.useEffect(() => {
      // Only reformat if value changed externally (not from user typing)
      // and input is not focused
      if (!isFocused && previousValueRef.current !== value) {
        setDisplayValue(formatCurrency(value))
        previousValueRef.current = value
      }
    }, [value, formatCurrency, isFocused])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value

      // Allow only numbers and comma
      const cleaned = input.replace(/[^\d,]/g, "")

      // Handle the input
      if (cleaned === "") {
        setDisplayValue("")
        onChange(0)
        previousValueRef.current = 0
        return
      }

      // Split by comma (decimal separator in pt-BR)
      const parts = cleaned.split(",")
      let formatted = parts[0] ?? ""

      // Add decimal part if exists (max 2 digits)
      const decimalPart = parts[1]
      if (parts.length > 1 && decimalPart) {
        formatted += "," + decimalPart.slice(0, 2)
      }

      setDisplayValue(formatted)

      // Convert to number (replace comma with dot)
      const numValue = parseFloat(formatted.replace(",", ".")) || 0
      previousValueRef.current = numValue
      onChange(numValue)
    }

    const handleBlur = () => {
      setIsFocused(false)
      // Format on blur
      setDisplayValue(formatCurrency(value))
      previousValueRef.current = value
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
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
