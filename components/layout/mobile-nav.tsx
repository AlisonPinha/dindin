"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  Target,
  Plus,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/hooks/use-store"

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  isAction?: boolean
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transações", href: "/transacoes", icon: ArrowLeftRight },
  { name: "add", href: "#", icon: Plus, isAction: true },
  { name: "Investimentos", href: "/investimentos", icon: TrendingUp },
  { name: "Metas", href: "/metas", icon: Target },
]

export function MobileNav() {
  const pathname = usePathname()
  const { setAddTransactionOpen } = useStore()
  const navRef = React.useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0 })

  // Calculate active indicator position
  React.useEffect(() => {
    if (!navRef.current) return

    const activeIndex = navigation.findIndex(
      (item) => !item.isAction && pathname === item.href
    )

    if (activeIndex === -1) return

    const navItems = navRef.current.querySelectorAll("[data-nav-item]")
    const activeItem = navItems[activeIndex] as HTMLElement

    if (activeItem) {
      setIndicatorStyle({
        left: activeItem.offsetLeft + activeItem.offsetWidth / 2 - 12,
        width: 24,
      })
    }
  }, [pathname])

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
        "border-t border-border",
        "bg-background/95 backdrop-blur-lg",
        "supports-[backdrop-filter]:bg-background/80"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="navigation"
      aria-label="Navegação principal mobile"
    >
      {/* Active indicator line */}
      <div
        className="absolute top-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-out"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          opacity: indicatorStyle.width > 0 ? 1 : 0,
        }}
      />

      <div ref={navRef} className="flex h-16 items-center justify-around px-2">
        {navigation.map((item, index) => {
          if (item.isAction) {
            return (
              <button
                key={item.name}
                onClick={() => setAddTransactionOpen(true)}
                className={cn(
                  "flex h-14 w-14 items-center justify-center",
                  "rounded-full bg-primary text-primary-foreground",
                  "shadow-lg shadow-primary/25",
                  "-mt-7",
                  "transition-all duration-200",
                  "hover:scale-105 hover:shadow-xl hover:shadow-primary/30",
                  "active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                aria-label="Adicionar transação"
              >
                <item.icon className="h-6 w-6" aria-hidden="true" />
              </button>
            )
          }

          const isActive = pathname === item.href
          const navIndex = navigation.filter((n, i) => !n.isAction && i < index).length

          return (
            <Link
              key={item.name}
              href={item.href}
              data-nav-item={navIndex}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "min-w-[64px] min-h-[44px] px-3 py-2",
                "text-xs font-medium rounded-lg",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Icon container with background on active */}
              <span
                className={cn(
                  "relative flex items-center justify-center",
                  "h-8 w-8 rounded-lg mb-0.5",
                  "transition-all duration-200",
                  isActive && "bg-primary/10"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                  aria-hidden="true"
                />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive && "font-semibold"
                )}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
