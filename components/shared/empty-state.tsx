"use client"

import * as React from "react"
import {
  FileQuestion,
  Inbox,
  Search,
  TrendingUp,
  Target,
  ArrowLeftRight,
  Plus,
  Wallet,
  FolderOpen,
  Users,
  Bell,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EmptyStateType =
  | "no-data"
  | "no-results"
  | "no-transactions"
  | "no-investments"
  | "no-goals"
  | "no-accounts"
  | "no-categories"
  | "no-members"
  | "no-notifications"
  | "no-reports"

interface EmptyStateProps {
  type?: EmptyStateType
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary"
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: "sm" | "md" | "lg"
}

// Ilustrações SVG inline para empty states
const EmptyIllustrations = {
  transactions: (
    <svg
      className="w-32 h-32"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="80" className="fill-muted/50" />
      <rect x="50" y="70" width="100" height="60" rx="8" className="fill-background stroke-border" strokeWidth="2" />
      <line x1="65" y1="90" x2="135" y2="90" className="stroke-muted-foreground/30" strokeWidth="2" strokeLinecap="round" />
      <line x1="65" y1="100" x2="115" y2="100" className="stroke-muted-foreground/30" strokeWidth="2" strokeLinecap="round" />
      <line x1="65" y1="110" x2="100" y2="110" className="stroke-muted-foreground/30" strokeWidth="2" strokeLinecap="round" />
      <circle cx="150" cy="60" r="25" className="fill-primary/20" />
      <path d="M140 60h20M150 50v20" className="stroke-primary" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  investments: (
    <svg
      className="w-32 h-32"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="80" className="fill-muted/50" />
      <path d="M40 140L70 100L100 120L130 80L160 50" className="stroke-primary" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="70" cy="100" r="6" className="fill-primary" />
      <circle cx="100" cy="120" r="6" className="fill-primary" />
      <circle cx="130" cy="80" r="6" className="fill-primary" />
      <circle cx="160" cy="50" r="8" className="fill-primary" />
      <path d="M155 45l10-5-5 10" className="fill-primary" />
    </svg>
  ),
  goals: (
    <svg
      className="w-32 h-32"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="80" className="fill-muted/50" />
      <circle cx="100" cy="100" r="50" className="stroke-muted-foreground/30" strokeWidth="4" fill="none" />
      <circle cx="100" cy="100" r="35" className="stroke-muted-foreground/30" strokeWidth="4" fill="none" />
      <circle cx="100" cy="100" r="20" className="stroke-primary" strokeWidth="4" fill="none" />
      <circle cx="100" cy="100" r="8" className="fill-primary" />
      <path d="M100 40V60M100 140V160M40 100H60M140 100H160" className="stroke-muted-foreground/30" strokeWidth="2" />
    </svg>
  ),
  search: (
    <svg
      className="w-32 h-32"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="80" className="fill-muted/50" />
      <circle cx="90" cy="90" r="35" className="stroke-muted-foreground" strokeWidth="4" fill="none" />
      <line x1="115" y1="115" x2="145" y2="145" className="stroke-muted-foreground" strokeWidth="6" strokeLinecap="round" />
      <path d="M75 85Q90 70 105 85" className="stroke-muted-foreground/50" strokeWidth="2" fill="none" />
      <circle cx="80" cy="85" r="3" className="fill-muted-foreground/50" />
      <circle cx="100" cy="85" r="3" className="fill-muted-foreground/50" />
    </svg>
  ),
  empty: (
    <svg
      className="w-32 h-32"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="80" className="fill-muted/50" />
      <rect x="55" y="50" width="90" height="100" rx="8" className="fill-background stroke-border" strokeWidth="2" />
      <path d="M70 70h60M70 90h40M70 110h50" className="stroke-muted-foreground/30" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="140" r="15" className="fill-muted stroke-muted-foreground/50" strokeWidth="2" />
      <path d="M95 138l5 5 8-8" className="stroke-muted-foreground/50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
}

const defaultContent: Record<
  EmptyStateType,
  { title: string; description: string; icon: React.ReactNode; illustration?: React.ReactNode }
> = {
  "no-data": {
    title: "Nenhum dado encontrado",
    description: "Não há dados para exibir no momento.",
    icon: <Inbox className="h-12 w-12" />,
    illustration: EmptyIllustrations.empty,
  },
  "no-results": {
    title: "Nenhum resultado encontrado",
    description: "Tente ajustar os filtros ou buscar por outro termo.",
    icon: <Search className="h-12 w-12" />,
    illustration: EmptyIllustrations.search,
  },
  "no-transactions": {
    title: "Nenhuma transação ainda",
    description: "Comece registrando sua primeira receita ou despesa para acompanhar suas finanças.",
    icon: <ArrowLeftRight className="h-12 w-12" />,
    illustration: EmptyIllustrations.transactions,
  },
  "no-investments": {
    title: "Nenhum investimento cadastrado",
    description: "Adicione seus investimentos para acompanhar a evolução da sua carteira.",
    icon: <TrendingUp className="h-12 w-12" />,
    illustration: EmptyIllustrations.investments,
  },
  "no-goals": {
    title: "Você ainda não tem metas",
    description: "Crie metas financeiras para organizar seus objetivos e acompanhar seu progresso.",
    icon: <Target className="h-12 w-12" />,
    illustration: EmptyIllustrations.goals,
  },
  "no-accounts": {
    title: "Nenhuma conta cadastrada",
    description: "Adicione suas contas bancárias para organizar suas transações.",
    icon: <Wallet className="h-12 w-12" />,
    illustration: EmptyIllustrations.empty,
  },
  "no-categories": {
    title: "Nenhuma categoria personalizada",
    description: "Crie categorias para classificar suas transações.",
    icon: <FolderOpen className="h-12 w-12" />,
    illustration: EmptyIllustrations.empty,
  },
  "no-members": {
    title: "Você é o único membro",
    description: "Convide familiares para gerenciar as finanças juntos.",
    icon: <Users className="h-12 w-12" />,
    illustration: EmptyIllustrations.empty,
  },
  "no-notifications": {
    title: "Tudo em dia!",
    description: "Você não tem notificações no momento.",
    icon: <Bell className="h-12 w-12" />,
    illustration: EmptyIllustrations.empty,
  },
  "no-reports": {
    title: "Sem dados suficientes",
    description: "Adicione mais transações para gerar relatórios detalhados.",
    icon: <BarChart3 className="h-12 w-12" />,
    illustration: EmptyIllustrations.empty,
  },
}

const sizeClasses = {
  sm: {
    container: "py-8",
    illustration: "w-20 h-20",
    iconWrapper: "p-3",
    icon: "h-8 w-8",
    title: "text-base",
    description: "text-xs max-w-xs",
  },
  md: {
    container: "py-12",
    illustration: "w-32 h-32",
    iconWrapper: "p-4",
    icon: "h-12 w-12",
    title: "text-lg",
    description: "text-sm max-w-sm",
  },
  lg: {
    container: "py-16",
    illustration: "w-40 h-40",
    iconWrapper: "p-5",
    icon: "h-14 w-14",
    title: "text-xl",
    description: "text-base max-w-md",
  },
}

export function EmptyState({
  type = "no-data",
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const content = defaultContent[type]
  const sizeClass = sizeClasses[size]
  const showIllustration = size !== "sm" && content.illustration

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 text-center",
        sizeClass.container,
        className
      )}
      role="status"
      aria-label={title || content.title}
    >
      {/* Ilustração ou Ícone */}
      {showIllustration ? (
        <div className={cn("mb-4 text-muted-foreground", sizeClass.illustration)}>
          {content.illustration}
        </div>
      ) : (
        <div className={cn("rounded-full bg-muted mb-4 text-muted-foreground", sizeClass.iconWrapper)}>
          {icon || React.cloneElement(content.icon as React.ReactElement, {
            className: sizeClass.icon,
          })}
        </div>
      )}

      {/* Título */}
      <h3 className={cn("font-semibold mb-2", sizeClass.title)}>
        {title || content.title}
      </h3>

      {/* Descrição */}
      <p className={cn("text-muted-foreground mb-6", sizeClass.description)}>
        {description || content.description}
      </p>

      {/* Ações */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "default"}
              size={size === "sm" ? "sm" : "default"}
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="ghost"
              size={size === "sm" ? "sm" : "default"}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Inline empty state for smaller contexts
interface InlineEmptyStateProps {
  message: string
  className?: string
}

export function InlineEmptyState({ message, className }: InlineEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center py-8 text-sm text-muted-foreground",
        className
      )}
    >
      <FileQuestion className="h-4 w-4 mr-2" />
      {message}
    </div>
  )
}
