"use client"

import { useState } from "react"
import {
  Menu,
  Search,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { NotificationCenter } from "@/components/notifications"
import { useStore } from "@/hooks/use-store"
import { useTheme } from "@/hooks/use-theme"

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { selectedPeriod, setSelectedPeriod } = useStore()
  const { theme, setTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")

  const handlePreviousMonth = () => {
    const newMonth = selectedPeriod.month === 0 ? 11 : selectedPeriod.month - 1
    const newYear = selectedPeriod.month === 0 ? selectedPeriod.year - 1 : selectedPeriod.year
    setSelectedPeriod({ month: newMonth, year: newYear })
  }

  const handleNextMonth = () => {
    const newMonth = selectedPeriod.month === 11 ? 0 : selectedPeriod.month + 1
    const newYear = selectedPeriod.month === 11 ? selectedPeriod.year + 1 : selectedPeriod.year
    setSelectedPeriod({ month: newMonth, year: newYear })
  }

  const handleMonthSelect = (month: number) => {
    setSelectedPeriod({ ...selectedPeriod, month })
  }

  const handleYearSelect = (year: number) => {
    setSelectedPeriod({ ...selectedPeriod, year })
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-card-border glass px-4 sm:px-6 lg:px-8">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Abrir menu</span>
      </Button>

      {/* Period Selector */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handlePreviousMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="min-w-[160px] justify-center gap-2 font-medium"
            >
              <span>{MONTHS[selectedPeriod.month]}</span>
              <span className="text-secondary">{selectedPeriod.year}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              {/* Year Selector */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleYearSelect(selectedPeriod.year - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium w-16 text-center">{selectedPeriod.year}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleYearSelect(selectedPeriod.year + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Months Grid */}
              <div className="grid grid-cols-3 gap-2">
                {MONTHS.map((month, index) => (
                  <Button
                    key={month}
                    variant={selectedPeriod.month === index ? "default" : "ghost"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleMonthSelect(index)}
                  >
                    {month.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search Bar */}
      <div className="hidden sm:flex relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
        <Input
          type="search"
          placeholder="Buscar transações..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-secondary border-0"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Mobile Search */}
        <Button variant="ghost" size="icon" className="sm:hidden">
          <Search className="h-5 w-5" />
        </Button>

        {/* Notification Center */}
        <NotificationCenter />

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Alternar tema</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Claro</span>
              {theme === "light" && <div className="ml-auto h-2 w-2 rounded-full bg-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Escuro</span>
              {theme === "dark" && <div className="ml-auto h-2 w-2 rounded-full bg-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Sistema</span>
              {theme === "system" && <div className="ml-auto h-2 w-2 rounded-full bg-primary" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
