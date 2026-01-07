"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

// Mapeamento de rotas para labels amigáveis
const routeLabels: Record<string, string> = {
  "": "Dashboard",
  "transacoes": "Transações",
  "contas": "Contas",
  "categorias": "Categorias",
  "metas": "Metas",
  "investimentos": "Investimentos",
  "orcamento": "Orçamento",
  "configuracoes": "Configurações",
  "relatorios": "Relatórios",
}

interface BreadcrumbItem {
  label: string
  href: string
  isCurrent: boolean
}

export function Breadcrumbs() {
  const pathname = usePathname()

  // Remove leading slash and split
  const segments = pathname.split("/").filter(Boolean)

  // Se estiver no dashboard (root), não mostrar breadcrumbs
  if (segments.length === 0) {
    return null
  }

  // Constrói os itens do breadcrumb
  const items: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/", isCurrent: false },
  ]

  let currentPath = ""
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    items.push({
      label,
      href: currentPath,
      isCurrent: index === segments.length - 1,
    })
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
            )}
            {item.isCurrent ? (
              <span
                className="font-medium text-foreground"
                aria-current="page"
              >
                {index === 0 && <Home className="h-4 w-4 inline mr-1" aria-hidden="true" />}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  "hover:text-foreground transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                )}
              >
                {index === 0 && <Home className="h-4 w-4 inline mr-1" aria-hidden="true" />}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
