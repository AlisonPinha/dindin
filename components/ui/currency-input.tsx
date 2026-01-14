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
      locale: _locale = "pt-BR",
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState("")
    const [isFocused, setIsFocused] = React.useState(false)
    const previousValueRef = React.useRef<number>(value)

    // Format number to currency display with thousand separators
    const formatCurrency = React.useCallback((num: number): string => {
      // Format with Brazilian locale: thousands separator (.) and decimal separator (,)
      return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num)
    }, [])

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

      // Remove everything except numbers
      const numbersOnly = input.replace(/\D/g, "")

      // Handle empty input
      if (numbersOnly === "") {
        setDisplayValue("")
        onChange(0)
        previousValueRef.current = 0
        return
      }

      // Convert to number (treat as cents)
      const valueInCents = parseInt(numbersOnly, 10)
      const value = valueInCents / 100

      // Format with thousand separators
      const formatted = formatCurrency(value)
      setDisplayValue(formatted)

      // Update parent component
      previousValueRef.current = value
      onChange(value)
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
