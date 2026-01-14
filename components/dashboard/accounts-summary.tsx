"use client"

import { useState } from "react"
import {
  Building2,
  CreditCard,
  Wallet,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import type { Account, Transaction } from "@/types"
import Link from "next/link"

interface AccountWithTransactions extends Account {
  transactions?: Transaction[]
  balanceHistory?: { date: string; balance: number }[]
}

interface AccountsSummaryProps {
  accounts: AccountWithTransactions[]
}

const accountTypeIcons: Record<string, React.ElementType> = {
  checking: Building2,
  credit: CreditCard,
  investment: TrendingUp,
}

const accountTypeLabels: Record<string, string> = {
  checking: "Conta Corrente",
  credit: "Cartão de Crédito",
  investment: "Investimento",
}

const defaultColors: Record<string, string> = {
  checking: "#8b5cf6",
  credit: "#f43f5e",
  investment: "#0ea5e9",
}

function AccountCard({
  account,
  onClick,
}: {
  account: AccountWithTransactions
  onClick: () => void
}) {
  const Icon = accountTypeIcons[account.type] || Wallet
  const color = account.color || defaultColors[account.type] || "#64748b"
  const isCredit = account.type === "credit"

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[200px] text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <Card
        className="h-full border-2 transition-colors hover:border-primary/50"
        style={{ borderColor: `${color}30` }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground truncate">
              {accountTypeLabels[account.type]}
            </p>
            <p className="text-sm font-medium truncate">{account.name}</p>
            <p
              className={cn(
                "text-lg font-bold",
                isCredit && account.balance > 0
                  ? "text-rose-500"
                  : "text-foreground"
              )}
            >
              {isCredit && account.balance > 0 ? "-" : ""}
              {formatCurrency(Math.abs(account.balance))}
            </p>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}

function AccountDetailModal({
  account,
  open,
  onOpenChange,
}: {
  account: AccountWithTransactions | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!account) return null

  const Icon = accountTypeIcons[account.type] || Wallet
  const color = account.color || defaultColors[account.type] || "#64748b"
  const transactions = account.transactions || []
  const balanceHistory = account.balanceHistory || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <DialogTitle>{account.name}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {accountTypeLabels[account.type]}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Current Balance */}
          <div className="text-center py-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Saldo Atual</p>
            <p
              className={cn(
                "text-3xl font-bold",
                account.type === "credit" && account.balance > 0
                  ? "text-rose-500"
                  : "text-foreground"
              )}
            >
              {account.type === "credit" && account.balance > 0 ? "-" : ""}
              {formatCurrency(Math.abs(account.balance))}
            </p>
          </div>

          {/* Balance Evolution Chart */}
          {balanceHistory.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Evolução do Saldo</h4>
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={balanceHistory}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      className="fill-muted-foreground"
                      tickFormatter={(value) =>
                        new Intl.NumberFormat("pt-BR", {
                          notation: "compact",
                          compactDisplay: "short",
                        }).format(value)
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        "Saldo",
                      ]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke={color}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Últimas Movimentações</h4>
              <span className="text-xs text-muted-foreground">
                Últimos 30 dias
              </span>
            </div>
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Nenhuma movimentação recente
                </p>
              ) : (
                transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "p-1.5 rounded-full",
                          transaction.type === "income"
                            ? "bg-emerald-500/10"
                            : "bg-rose-500/10"
                        )}
                      >
                        {transaction.type === "income" ? (
                          <ArrowDownRight className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3 text-rose-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[180px]">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        transaction.type === "income"
                          ? "text-emerald-500"
                          : "text-rose-500"
                      )}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t">
          <Button asChild className="w-full">
            <Link href={`/transacoes?conta=${account.id}`}>
              Ver extrato completo
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AccountsSummary({ accounts }: AccountsSummaryProps) {
  const [selectedAccount, setSelectedAccount] =
    useState<AccountWithTransactions | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleAccountClick = (account: AccountWithTransactions) => {
    setSelectedAccount(account)
    setModalOpen(true)
  }

  const totalBalance = accounts.reduce((sum, acc) => {
    const balance = Number(acc.balance) || 0
    if (acc.type === "credit") {
      return sum - balance
    }
    return sum + balance
  }, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Minhas Contas</h3>
          <p className="text-xs text-muted-foreground">
            Saldo total: {formatCurrency(totalBalance)}
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs">
          <Link href="/contas">Ver todas</Link>
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onClick={() => handleAccountClick(account)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <AccountDetailModal
        account={selectedAccount}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
