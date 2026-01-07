"use client"

import Link from "next/link"
import {
  ArrowRight,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Briefcase,
  Heart,
  GraduationCap,
  Gamepad2,
  CreditCard,
  Banknote,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Transaction } from "@/types"

interface RecentTransactionsProps {
  transactions: Transaction[]
}

const categoryIcons: Record<string, React.ReactNode> = {
  "Salário": <Briefcase className="h-4 w-4" />,
  "Freelance": <Banknote className="h-4 w-4" />,
  "Rendimentos": <TrendingUp className="h-4 w-4" />,
  "Moradia": <Home className="h-4 w-4" />,
  "Alimentação": <Utensils className="h-4 w-4" />,
  "Transporte": <Car className="h-4 w-4" />,
  "Saúde": <Heart className="h-4 w-4" />,
  "Educação": <GraduationCap className="h-4 w-4" />,
  "Lazer": <Gamepad2 className="h-4 w-4" />,
  "Compras": <ShoppingCart className="h-4 w-4" />,
  "Assinaturas": <CreditCard className="h-4 w-4" />,
}

function getCategoryIcon(categoryName?: string) {
  if (!categoryName) return <MoreHorizontal className="h-4 w-4" />
  return categoryIcons[categoryName] || <MoreHorizontal className="h-4 w-4" />
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recentTransactions = transactions.slice(0, 5)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Últimas Transações</CardTitle>
        <Button variant="ghost" size="sm" asChild className="text-xs text-primary hover:text-primary/80">
          <Link href="/transacoes" className="flex items-center gap-1">
            Ver todas
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma transação encontrada
            </p>
          ) : (
            recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Category Icon */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                    transaction.type === "income"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-rose-500/10 text-rose-500"
                  }`}
                >
                  {getCategoryIcon(transaction.category?.name)}
                </div>

                {/* Description and Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{transaction.category?.name || "Sem categoria"}</span>
                    <span>•</span>
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                </div>

                {/* User Avatar */}
                {transaction.user && (
                  <Avatar className="h-6 w-6 shrink-0 border border-border">
                    <AvatarImage
                      src={transaction.user.avatar || ""}
                      alt={transaction.user.name}
                    />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {transaction.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Amount */}
                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-semibold ${
                      transaction.type === "income"
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
