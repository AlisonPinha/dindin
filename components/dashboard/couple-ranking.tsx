"use client"

import { Trophy, Crown, Flame, Star, Medal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, cn } from "@/lib/utils"

interface FamilyMember {
  id: string
  name: string
  avatar?: string | null
  savedAmount: number
  unnecessarySpent: number
  streak: number
  isWinner: boolean
}

interface CoupleRankingProps {
  members: FamilyMember[]
  categoryName?: string
  className?: string
}

export function CoupleRanking({
  members,
  categoryName = "besteiras",
  className,
}: CoupleRankingProps) {
  // Sort by saved amount (who saved more wins)
  const sortedMembers = [...members].sort((a, b) => b.savedAmount - a.savedAmount)
  const winner = sortedMembers[0]
  const totalSaved = members.reduce((sum, m) => sum + m.savedAmount, 0)

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Winner banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 p-4 border-b">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-medium">Ranking do Casal - {categoryName}</span>
          <Trophy className="h-5 w-5 text-amber-500" />
        </div>
      </div>

      <CardContent className="pt-6 space-y-6">
        {/* Podium */}
        <div className="flex items-end justify-center gap-4">
          {sortedMembers.map((member, index) => {
            const isFirst = index === 0
            const heightClass = isFirst ? "h-32" : "h-24"

            return (
              <div
                key={member.id}
                className={cn(
                  "flex flex-col items-center",
                  isFirst ? "order-1" : index === 1 ? "order-0" : "order-2"
                )}
              >
                {/* Crown for winner */}
                {isFirst && (
                  <div className="mb-2 animate-bounce">
                    <Crown className="h-8 w-8 text-amber-500 fill-amber-500" />
                  </div>
                )}

                {/* Avatar */}
                <div className="relative">
                  <Avatar
                    className={cn(
                      "border-4 transition-transform hover:scale-105",
                      isFirst
                        ? "h-20 w-20 border-amber-500"
                        : "h-16 w-16 border-muted"
                    )}
                  >
                    <AvatarImage src={member.avatar || undefined} alt={member.name} />
                    <AvatarFallback
                      className={cn(
                        "text-lg font-bold",
                        isFirst ? "bg-amber-500/20" : "bg-muted"
                      )}
                    >
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Position badge */}
                  <div
                    className={cn(
                      "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      isFirst
                        ? "bg-amber-500 text-white"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    )}
                  >
                    {index + 1}º
                  </div>

                  {/* Streak flame */}
                  {member.streak >= 2 && (
                    <div className="absolute -top-1 -left-1">
                      <div className="relative">
                        <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                          {member.streak}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Name */}
                <p
                  className={cn(
                    "mt-2 font-medium text-center",
                    isFirst ? "text-lg" : "text-sm"
                  )}
                >
                  {member.name}
                </p>

                {/* Saved amount */}
                <p
                  className={cn(
                    "font-bold",
                    isFirst ? "text-xl text-emerald-500" : "text-base text-muted-foreground",
                    member.savedAmount < 0 && "text-rose-500"
                  )}
                >
                  {member.savedAmount >= 0 ? "+" : ""}
                  {formatCurrency(member.savedAmount)}
                </p>

                {/* Podium base */}
                <div
                  className={cn(
                    "mt-2 w-20 rounded-t-lg flex items-end justify-center pb-2",
                    heightClass,
                    isFirst
                      ? "bg-gradient-to-t from-amber-500 to-amber-400"
                      : index === 1
                      ? "bg-gradient-to-t from-slate-400 to-slate-300"
                      : "bg-gradient-to-t from-amber-700 to-amber-600"
                  )}
                >
                  <span className="text-2xl font-bold text-white/80">
                    {index + 1}º
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center p-3 rounded-lg bg-emerald-500/10">
            <p className="text-xs text-muted-foreground mb-1">Economia total da família</p>
            <p className="text-xl font-bold text-emerald-500">
              +{formatCurrency(totalSaved)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-500/10">
            <p className="text-xs text-muted-foreground mb-1">Campeão do mês</p>
            <div className="flex items-center justify-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={winner?.avatar || undefined} />
                <AvatarFallback className="text-xs">
                  {winner ? getInitials(winner.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-amber-600 dark:text-amber-400">
                {winner?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Conquistas do mês</p>
          <div className="flex flex-wrap gap-2">
            {winner && (
              <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Trophy className="h-3 w-3" />
                {winner.name} venceu o mês
              </Badge>
            )}
            {members.some((m) => m.streak >= 3) && (
              <Badge variant="secondary" className="gap-1 bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Flame className="h-3 w-3" />
                Sequência de {Math.max(...members.map((m) => m.streak))} meses
              </Badge>
            )}
            {totalSaved > 500 && (
              <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Star className="h-3 w-3" />
                Super economia
              </Badge>
            )}
            {members.every((m) => m.savedAmount > 0) && (
              <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Medal className="h-3 w-3" />
                Todos economizaram!
              </Badge>
            )}
          </div>
        </div>

        {/* Motivation message */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
          <p className="text-sm text-center">
            {members.every((m) => m.savedAmount > 0) ? (
              <span className="text-violet-600 dark:text-violet-400">
                Parabéns! Todos da família economizaram em {categoryName} este mês! Continuem assim!
              </span>
            ) : winner && winner.savedAmount > 0 ? (
              <span className="text-violet-600 dark:text-violet-400">
                <span className="font-semibold">{winner.name}</span> é o campeão de economia em {categoryName}!
                Próximo mês pode ser você!
              </span>
            ) : (
              <span className="text-muted-foreground">
                Que tal definir uma meta de economia para {categoryName} no próximo mês?
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
