"use client"

import { useState, useRef, useEffect } from "react"
import {
  Plus,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { QuickTransactionModal } from "./quick-transaction-modal"

type TransactionType = "expense" | "income" | "transfer"

const fabOptions = [
  {
    type: "expense" as TransactionType,
    label: "Despesa rápida",
    icon: ArrowDownCircle,
    color: "bg-rose-500 hover:bg-rose-600",
    textColor: "text-rose-500",
  },
  {
    type: "income" as TransactionType,
    label: "Receita rápida",
    icon: ArrowUpCircle,
    color: "bg-emerald-500 hover:bg-emerald-600",
    textColor: "text-emerald-500",
  },
  {
    type: "transfer" as TransactionType,
    label: "Transferência",
    icon: ArrowLeftRight,
    color: "bg-blue-500 hover:bg-blue-600",
    textColor: "text-blue-500",
  },
]

export function QuickTransactionFab() {
  const [isOpen, setIsOpen] = useState(false)
  const [modalType, setModalType] = useState<TransactionType | null>(null)
  const fabRef = useRef<HTMLDivElement>(null)

  // Close FAB when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Close FAB on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  const handleOptionClick = (type: TransactionType) => {
    setIsOpen(false)
    setModalType(type)
  }

  return (
    <>
      {/* Backdrop when FAB is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div
        ref={fabRef}
        className="fixed bottom-20 right-4 z-50 lg:bottom-6 lg:right-6"
      >
        {/* Options */}
        <div
          className={cn(
            "absolute bottom-16 right-0 flex flex-col-reverse gap-3 transition-all duration-300",
            isOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          {fabOptions.map((option, index) => {
            const Icon = option.icon
            return (
              <button
                key={option.type}
                onClick={() => handleOptionClick(option.type)}
                className={cn(
                  "flex items-center gap-3 pr-4 pl-3 py-2.5 rounded-full shadow-lg transition-all duration-200",
                  "bg-card border hover:scale-105 active:scale-95",
                  "animate-in fade-in slide-in-from-bottom-2"
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center",
                    option.color
                  )}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium whitespace-nowrap">
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Main FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            isOpen
              ? "bg-muted-foreground rotate-45 focus:ring-muted-foreground"
              : "bg-primary hover:bg-primary/90 focus:ring-primary"
          )}
          aria-label={isOpen ? "Fechar menu" : "Adicionar transação"}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-background" />
          ) : (
            <Plus className="h-6 w-6 text-primary-foreground" />
          )}
        </button>
      </div>

      {/* Quick Transaction Modal */}
      <QuickTransactionModal
        open={modalType !== null}
        onOpenChange={(open) => {
          if (!open) setModalType(null)
        }}
        type={modalType || "expense"}
      />
    </>
  )
}
