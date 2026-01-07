"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  Target,
  Settings,
  Plus,
  Users,
  User,
  ChevronDown,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { useStore } from "@/hooks/use-store"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transações", href: "/transacoes", icon: ArrowLeftRight },
  { name: "Investimentos", href: "/investimentos", icon: TrendingUp },
  { name: "Metas", href: "/metas", icon: Target },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
]

interface SidebarProps {
  className?: string
  onClose?: () => void
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const pathname = usePathname()
  const {
    user,
    familyMembers,
    viewMode,
    setUser,
    setViewMode,
    setAddTransactionOpen,
  } = useStore()

  const allMembers = user
    ? [user, ...familyMembers.filter((m) => m.id !== user.id)]
    : familyMembers

  return (
    <aside
      className={cn(
        "flex h-full w-72 flex-col bg-card border-r border-border",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">F</span>
          </div>
          <span className="text-xl font-bold text-foreground">FamFinance</span>
        </Link>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* User Selector */}
      <div className="px-4 py-4 border-b border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-2 h-auto py-2"
            >
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={user?.avatar || ""} alt={user?.name || "Usuário"} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                <span className="text-sm font-medium truncate w-full">
                  {user?.name || "Selecionar usuário"}
                </span>
                <span className="text-xs text-muted-foreground truncate w-full">
                  {user?.email || ""}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="start">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Trocar membro da família
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allMembers.map((member) => (
              <DropdownMenuItem
                key={member.id}
                onClick={() => setUser(member)}
                className="gap-3 py-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.avatar || ""} alt={member.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {member.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{member.name}</span>
                  <span className="text-xs text-muted-foreground">{member.email}</span>
                </div>
                {user?.id === member.id && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-accent-foreground"
                    )}
                  />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* FAB - Add Transaction */}
      <div className="px-4 py-3 border-t border-border">
        <Button
          onClick={() => setAddTransactionOpen(true)}
          className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Nova Transação
        </Button>
      </div>

      {/* Footer - View Toggle */}
      <div className="px-4 py-4 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {viewMode === "consolidated" ? (
              <Users className="h-4 w-4 text-primary" />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs font-medium">
              {viewMode === "consolidated" ? "Visão Consolidada" : "Visão Individual"}
            </span>
          </div>
          <Switch
            checked={viewMode === "consolidated"}
            onCheckedChange={(checked) =>
              setViewMode(checked ? "consolidated" : "individual")
            }
            className="data-[state=checked]:bg-primary"
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {viewMode === "consolidated"
            ? "Vendo dados de toda a família"
            : `Vendo dados de ${user?.name || "usuário"}`}
        </p>
      </div>
    </aside>
  )
}
