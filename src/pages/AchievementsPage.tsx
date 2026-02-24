import { useContext, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GameContext } from "@/context/GameContext"
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  getAchievementCategoryId,
  totalAchievementPoints,
} from "@/lib/achievements"

export function AchievementsPage() {
  const { t } = useTranslation()
  const ctx = useContext(GameContext)
  if (!ctx) return null
  const { achievementsUnlocked } = ctx

  const achievementsByCategory = useMemo(() => {
    const map = new Map<string, typeof ACHIEVEMENTS>()
    for (const cat of ACHIEVEMENT_CATEGORIES) {
      map.set(
        cat.id,
        ACHIEVEMENTS.filter((a) => getAchievementCategoryId(a.id) === cat.id)
      )
    }
    return map
  }, [])

  return (
    <div className="flex flex-col min-h-0 flex-1 w-full overflow-hidden h-full gap-4 sm:p-2">
      {/* Cabeçalho fixo: totais e abas — não rola */}
      <Card className="shrink-0 flex flex-wrap items-baseline gap-4 p-4 flex-none border-0 shadow-none bg-transparent sm:bg-card sm:border-2 sm:shadow-sm sm:rounded-lg">
        <span className="text-muted-foreground text-sm">
          {t("achievements.totalPoints")}: <span className="font-mono font-semibold tabular-nums text-foreground">{totalAchievementPoints(achievementsUnlocked)}</span>
        </span>
        <span className="text-muted-foreground text-sm">
          <span className="font-medium text-foreground">{achievementsUnlocked.length}</span> {t("achievements.ofAchievements", { total: ACHIEVEMENTS.length })}
        </span>
      </Card>

      <Tabs defaultValue={ACHIEVEMENT_CATEGORIES[0].id} className="flex flex-col flex-1 min-h-0 w-full overflow-hidden">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 shrink-0 w-fit mb-4 flex-none">
          {ACHIEVEMENT_CATEGORIES.map((cat) => {
            const count = achievementsByCategory.get(cat.id)?.length ?? 0
            const unlockedInCat =
              count > 0
                ? (achievementsByCategory.get(cat.id) ?? []).filter((a) =>
                  achievementsUnlocked.includes(a.id)
                ).length
                : 0
            return (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {t(`achievements.categories.${cat.id}`)}
                <span className="ml-1.5 text-xs opacity-70 tabular-nums">
                  {unlockedInCat}/{count}
                </span>
              </TabsTrigger>
            )
          })}
        </TabsList>
        {/* Só a lista de conquistas rola */}
        {ACHIEVEMENT_CATEGORIES.map((cat) => {
          const list = achievementsByCategory.get(cat.id) ?? []
          const sorted = [...list].sort((a, b) => {
            const aUnlocked = achievementsUnlocked.includes(a.id)
            const bUnlocked = achievementsUnlocked.includes(b.id)
            if (aUnlocked && !bUnlocked) return -1
            if (!aUnlocked && bUnlocked) return 1
            return 0
          })
          return (
            <TabsContent
              key={cat.id}
              value={cat.id}
              className="scroll-overlay flex-1 min-h-0 overflow-y-auto mt-4 outline-none data-[state=inactive]:hidden data-[state=inactive]:overflow-hidden"
            >
              <div className="space-y-3 pb-4">
                {sorted.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">{t("achievements.emptyCategory")}</p>
                ) : (
                  sorted.map((a) => {
                    const unlocked = achievementsUnlocked.includes(a.id)
                    const name = t(`achievements.${a.id}.name`, { defaultValue: a.name })
                    const description = t(`achievements.${a.id}.description`, { defaultValue: a.description })
                    return (
                      <Card
                        key={a.id}
                        className={`flex items-start gap-3 p-4 ${unlocked
                          ? "border-primary bg-primary/5"
                          : "border-border opacity-60"
                          }`}
                      >
                        <span
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                          aria-hidden
                          title={unlocked ? t("achievements.unlocked") : t("achievements.locked")}
                        >
                          {unlocked ? "✓" : "?"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`font-medium ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                            {name}
                          </p>
                          <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
                        </div>
                        <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
                          {a.points} pts
                        </span>
                      </Card>
                    )
                  })
                )}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
