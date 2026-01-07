"use client"

import * as React from "react"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
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

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  className?: string
  align?: "start" | "center" | "end"
}

const presets = [
  {
    label: "Hoje",
    getValue: () => ({
      from: new Date(),
      to: new Date(),
    }),
  },
  {
    label: "Últimos 7 dias",
    getValue: () => ({
      from: subDays(new Date(), 7),
      to: new Date(),
    }),
  },
  {
    label: "Últimos 30 dias",
    getValue: () => ({
      from: subDays(new Date(), 30),
      to: new Date(),
    }),
  },
  {
    label: "Este mês",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Mês passado",
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: "Últimos 3 meses",
    getValue: () => ({
      from: subMonths(new Date(), 3),
      to: new Date(),
    }),
  },
  {
    label: "Este ano",
    getValue: () => ({
      from: new Date(new Date().getFullYear(), 0, 1),
      to: new Date(),
    }),
  },
]

export function DateRangePicker({
  value,
  onChange,
  className,
  align = "start",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const formatDateRange = () => {
    if (!value?.from) {
      return "Selecione um período"
    }

    if (!value.to) {
      return format(value.from, "dd MMM yyyy", { locale: ptBR })
    }

    return `${format(value.from, "dd MMM", { locale: ptBR })} - ${format(
      value.to,
      "dd MMM yyyy",
      { locale: ptBR }
    )}`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex">
          <div className="border-r p-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground px-2 py-1">
              Atalhos
            </p>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left font-normal"
                onClick={() => {
                  onChange(preset.getValue())
                  setIsOpen(false)
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="p-2">
            <Calendar
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={onChange}
              numberOfMonths={2}
              locale={ptBR}
            />
          </div>
        </div>
        <div className="border-t p-2 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(undefined)
              setIsOpen(false)
            }}
          >
            Limpar
          </Button>
          <Button size="sm" onClick={() => setIsOpen(false)}>
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Simple month/year picker
interface MonthPickerProps {
  value: Date
  onChange: (date: Date) => void
  className?: string
}

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div className={cn("flex gap-2", className)}>
      <Select
        value={value.getMonth().toString()}
        onValueChange={(month) => {
          const newDate = new Date(value)
          newDate.setMonth(parseInt(month))
          onChange(newDate)
        }}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((month, index) => (
            <SelectItem key={month} value={index.toString()}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.getFullYear().toString()}
        onValueChange={(year) => {
          const newDate = new Date(value)
          newDate.setFullYear(parseInt(year))
          onChange(newDate)
        }}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
