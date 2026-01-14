"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Repeat,
  TrendingUp,
  Target,
  Settings,
  Plus,
  Users,
  User,
  ChevronDown,
  X,
  LogOut,
  ArrowDownCircle,
  ArrowUpCircle,
  Upload,
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
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transações", href: "/transacoes", icon: Repeat },
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
  const router = useRouter()
  const {
    user,
    familyMembers,
    viewMode,
    setUser,
    setViewMode,
    openAddTransaction,
    setImportDocumentOpen,
  } = useStore()

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const allMembers = user
    ? [user, ...familyMembers.filter((m) => m.id !== user.id)]
    : familyMembers

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 flex flex-col",
        "border-r border-card-border bg-background-secondary/50 backdrop-blur-xl",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-card-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-title font-bold">
            Fam<span className="text-primary">Finance</span>
          </span>
        </Link>
        {onClose && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* User Selector */}
      <div className="p-4 border-b border-card-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg",
                "hover:bg-muted transition-colors cursor-pointer"
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar || ""} alt={user?.name || "Usuário"} />
                <AvatarFallback className="bg-primary text-white text-caption">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-subhead font-medium truncate">
                  {user?.name || "Selecionar usuário"}
                </p>
                <p className="text-caption text-secondary truncate">
                  {viewMode === "consolidated" ? "Visão consolidada" : "Visão pessoal"}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-secondary shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel className="text-caption text-secondary font-normal">
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
                  <AvatarFallback className="bg-primary/10 text-primary text-caption">
                    {member.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-subhead font-medium truncate">{member.name}</span>
                  <span className="text-caption text-secondary truncate">{member.email}</span>
                </div>
                {user?.id === member.id && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="w-full justify-between gap-2"
              size="lg"
            >
              <span className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nova Transação
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem
              onClick={() => openAddTransaction("expense")}
              className="gap-3 py-2.5"
            >
              <div className="h-8 w-8 rounded-full bg-rose-500 flex items-center justify-center">
                <ArrowDownCircle className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium">Despesa</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openAddTransaction("income")}
              className="gap-3 py-2.5"
            >
              <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <ArrowUpCircle className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium">Receita</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setImportDocumentOpen(true)}
              className="gap-3 py-2.5"
            >
              <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center">
                <Upload className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium">Importar Documento</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                    "text-subhead font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary text-white"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive ? "text-white" : "text-secondary"
                    )}
                  />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer - View Toggle */}
      <div className="p-4 border-t border-card-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {viewMode === "consolidated" ? (
              <Users className="h-4 w-4 text-primary" />
            ) : (
              <User className="h-4 w-4 text-secondary" />
            )}
            <span className="text-caption font-medium">
              {viewMode === "consolidated" ? "Consolidada" : "Individual"}
            </span>
          </div>
          <Switch
            checked={viewMode === "consolidated"}
            onCheckedChange={(checked) =>
              setViewMode(checked ? "consolidated" : "individual")
            }
          />
        </div>
        <p className="text-caption text-secondary mt-2">
          {viewMode === "consolidated"
            ? "Vendo dados de toda a família"
            : `Vendo dados de ${user?.name || "usuário"}`}
        </p>
      </div>

      {/* Logout & Version */}
      <div className="px-4 py-3 border-t border-card-border space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-2 text-secondary hover:text-danger hover:bg-danger/10"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
        <div className="flex items-center justify-between text-caption text-secondary">
          <span>v1.0.0</span>
          <button className="hover:text-foreground transition-colors">
            Ajuda
          </button>
        </div>
      </div>
    </aside>
  )
}
