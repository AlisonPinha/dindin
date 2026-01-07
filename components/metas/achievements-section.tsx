"use client"

import {
  Trophy,
  Flame,
  Target,
  PiggyBank,
  Star,
  Zap,
  Award,
  Medal,
  Crown,
  Sparkles,
  Lock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Achievement } from "@/types"

interface AchievementsSectionProps {
  achievements: Achievement[]
  className?: string
}

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  flame: Flame,
  target: Target,
  piggy: PiggyBank,
  star: Star,
  zap: Zap,
  award: Award,
  medal: Medal,
  crown: Crown,
  sparkles: Sparkles,
}

const categoryColors: Record<string, { color: string; bgColor: string }> = {
  savings: { color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  budget: { color: "text-blue-500", bgColor: "bg-blue-500/10" },
  streak: { color: "text-orange-500", bgColor: "bg-orange-500/10" },
  milestone: { color: "text-purple-500", bgColor: "bg-purple-500/10" },
}

function AchievementBadge({
  achievement,
  size = "md",
}: {
  achievement: Achievement
  size?: "sm" | "md" | "lg"
}) {
  const Icon = iconMap[achievement.icon] || Trophy
  const isUnlocked = !!achievement.unlockedAt
  const colors = categoryColors[achievement.category] || categoryColors.milestone

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-20 w-20",
  }

  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative rounded-full flex items-center justify-center transition-all cursor-pointer",
              sizeClasses[size],
              isUnlocked
                ? cn(colors.bgColor, "hover:scale-110")
                : "bg-muted/50 grayscale opacity-50"
            )}
          >
            {isUnlocked ? (
              <Icon className={cn(iconSizes[size], colors.color)} />
            ) : (
              <Lock className={cn(iconSizes[size], "text-muted-foreground")} />
            )}

            {/* Glow effect for unlocked */}
            {isUnlocked && (
              <div
                className={cn(
                  "absolute inset-0 rounded-full animate-pulse opacity-30",
                  colors.bgColor
                )}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold flex items-center gap-2">
              {achievement.title}
              {isUnlocked && <Sparkles className="h-3 w-3 text-yellow-500" />}
            </p>
            <p className="text-sm text-muted-foreground">
              {achievement.description}
            </p>
            {isUnlocked && achievement.unlockedAt && (
              <p className="text-xs text-muted-foreground">
                Desbloqueado em{" "}
                {format(new Date(achievement.unlockedAt), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            )}
            {!isUnlocked && (
              <p className="text-xs text-muted-foreground italic">
                Continue assim para desbloquear!
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function AchievementsSection({
  achievements,
  className,
}: AchievementsSectionProps) {
  const unlockedAchievements = achievements.filter((a) => a.unlockedAt)
  const lockedAchievements = achievements.filter((a) => !a.unlockedAt)

  // Recent achievements (last 30 days)
  const recentAchievements = unlockedAchievements.filter((a) => {
    if (!a.unlockedAt) return false
    const daysDiff =
      (new Date().getTime() - new Date(a.unlockedAt).getTime()) /
      (1000 * 60 * 60 * 24)
    return daysDiff <= 30
  })

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Conquistas
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {unlockedAchievements.length}/{achievements.length} desbloqueadas
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Recent achievements highlight */}
        {recentAchievements.length > 0 && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-rose-500/10 border border-yellow-500/20">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Conquistas Recentes
            </p>
            <div className="flex flex-wrap gap-3">
              {recentAchievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  size="md"
                />
              ))}
            </div>
          </div>
        )}

        {/* All unlocked achievements */}
        {unlockedAchievements.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-3 text-muted-foreground">
              Todas as conquistas ({unlockedAchievements.length})
            </p>
            <div className="flex flex-wrap gap-3">
              {unlockedAchievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* Locked achievements */}
        {lockedAchievements.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-3 text-muted-foreground">
              A conquistar ({lockedAchievements.length})
            </p>
            <div className="flex flex-wrap gap-3">
              {lockedAchievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {achievements.length === 0 && (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Continue usando o app para desbloquear conquistas!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
