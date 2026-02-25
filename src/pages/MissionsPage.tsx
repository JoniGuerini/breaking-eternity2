import { useTranslation } from "react-i18next"
import { useContext } from "react"
import { GameContext } from "@/context/GameContext"
import { MISSIONS } from "@/constants/missions"
import type { Mission } from "@/constants/missions"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Decimal from "break_eternity.js"

export function MissionsPage() {
    const { t } = useTranslation()
    const ctx = useContext(GameContext)

    if (!ctx) return null

    const {
        claimedMissions,
        claimMission,
        geradores,
        upgrades,
        globalProductionLevel,
        totalProducedLifetime,
        formatDecimal,
    } = ctx

    const getProgress = (m: Mission) => {
        switch (m.type) {
            case "OWN_GENERATOR":
                return geradores[m.generatorIndex ?? 0]
            case "UPGRADE_LEVEL":
                return upgrades[m.generatorIndex ?? 0]
            case "GLOBAL_UPGRADE_LEVEL":
                return globalProductionLevel
            case "TOTAL_FRAGMENTS_LIFETIME":
                return totalProducedLifetime
            default:
                return 0
        }
    }

    // Group missions by type
    const missionsByType = MISSIONS.reduce((acc, mission) => {
        if (!acc[mission.type]) acc[mission.type] = []
        acc[mission.type].push(mission)
        return acc
    }, {} as Record<string, Mission[]>)

    // Available tab types mapped to readable translations
    const tabTypes = Object.keys(missionsByType)
    const tabNames: Record<string, string> = {
        OWN_GENERATOR: t("missions.tab_generators", { defaultValue: "Generators" }),
        UPGRADE_LEVEL: t("missions.tab_upgrades", { defaultValue: "Upgrades" }),
        GLOBAL_UPGRADE_LEVEL: t("missions.tab_global", { defaultValue: "Global" }),
        TOTAL_FRAGMENTS_LIFETIME: t("missions.tab_fragments", { defaultValue: "Fragments" })
    }

    return (
        <div className="flex flex-col h-full min-h-0 relative">
            <div className="flex-1 w-full flex flex-col min-h-0 relative z-10 overflow-hidden">
                <Tabs defaultValue={tabTypes[0]} className="flex-1 flex flex-col h-full min-h-0">
                    <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 shrink-0 w-fit mb-6 flex-none">
                        {tabTypes.map(type => (
                            <TabsTrigger
                                key={type}
                                value={type}
                                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                            >
                                {tabNames[type]}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="flex-1 min-h-0 overflow-y-auto scroll-overlay pr-2 pb-20">
                        {tabTypes.map(type => (
                            <TabsContent key={type} value={type} className="m-0 focus-visible:outline-none focus-visible:ring-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {missionsByType[type].map((m) => {
                                        const currentVal = getProgress(m)
                                        const isClaimed = claimedMissions.includes(m.id)
                                        let isCompleted = false
                                        let pct = 0
                                        let currentDisplay = "0"
                                        const targetDisplay = formatDecimal(new Decimal(m.targetAmount))

                                        if (currentVal instanceof Decimal) {
                                            isCompleted = currentVal.gte(m.targetAmount)
                                            if (isCompleted || isClaimed) {
                                                pct = 100
                                                currentDisplay = targetDisplay
                                            } else {
                                                pct = currentVal.div(m.targetAmount).times(100).toNumber()
                                                currentDisplay = formatDecimal(currentVal)
                                            }
                                        } else {
                                            isCompleted = currentVal >= m.targetAmount
                                            pct = Math.min(100, (currentVal / m.targetAmount) * 100)
                                            currentDisplay = isCompleted || isClaimed ? targetDisplay : formatDecimal(new Decimal(currentVal))
                                        }

                                        // Override pct to 100% if already formally claimed
                                        if (isClaimed) {
                                            pct = 100
                                        }

                                        const hasRewardFragments = m.rewardType === "FRAGMENTS"
                                        const rewardLabel = hasRewardFragments
                                            ? `${formatDecimal(new Decimal(m.rewardAmount))} ${t("missions.fragments", { defaultValue: "Fragments" })}`
                                            : `${m.rewardAmount} ${t("missions.upgradePoints", { defaultValue: "Upgrade Pts" })}`

                                        const isReadyToClaim = isCompleted && !isClaimed

                                        return (
                                            <Card
                                                key={m.id}
                                                onClick={() => {
                                                    if (isReadyToClaim) claimMission(m.id)
                                                }}
                                                className={`w-full p-4 flex flex-col justify-between backdrop-blur-sm transition-all min-h-[14rem] ${isClaimed
                                                    ? "bg-card/40 border-border opacity-60 grayscale-[0.8]"
                                                    : isReadyToClaim
                                                        ? "bg-[#0C4130]/20 border-emerald-500/40 cursor-pointer hover:bg-[#0C4130]/40 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                                                        : "bg-card/80 border-border"
                                                    }`}
                                            >
                                                <div className="flex flex-col gap-1.5 mb-4">
                                                    <span className={`font-semibold text-lg leading-tight transition-colors ${isReadyToClaim ? "text-emerald-400" : isClaimed ? "text-muted-foreground" : "text-foreground"}`}>
                                                        {(t as any)([`missions.${m.id}.name`, `missions.dynamic.${m.type}.name`], { amount: targetDisplay, gen: (m.generatorIndex ?? 0) + 1, defaultValue: m.id })}
                                                    </span>
                                                    <span className={`text-sm leading-snug h-10 overflow-hidden line-clamp-2 ${isClaimed ? "text-muted-foreground" : "text-muted-foreground"}`}>
                                                        {(t as any)([`missions.${m.id}.desc`, `missions.dynamic.${m.type}.desc`], { amount: targetDisplay, gen: (m.generatorIndex ?? 0) + 1, defaultValue: `Complete objective for ${m.targetAmount}` })}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col gap-3">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isReadyToClaim ? "text-emerald-400" : isClaimed ? "text-muted-foreground" : "text-muted-foreground"}`}>
                                                                {isClaimed ? t("missions.claimed", { defaultValue: "CLAIMED" }) : isReadyToClaim ? t("missions.ready", { defaultValue: "READY" }) : t("missions.progress", { defaultValue: "PROGRESS" })}
                                                            </span>
                                                            <span className={`font-mono text-xs tabular-nums font-medium transition-colors ${isReadyToClaim ? "text-emerald-400" : isClaimed ? "text-muted-foreground" : ""}`}>
                                                                {currentDisplay} <span className={isReadyToClaim ? "text-emerald-400/80" : "text-muted-foreground"}>/ {targetDisplay}</span>
                                                            </span>
                                                        </div>
                                                        <Progress value={pct} className={`h-1.5 transition-colors ${isReadyToClaim ? "bg-emerald-950/50 [&_[data-slot=progress-indicator]]:bg-emerald-400" : isClaimed ? "bg-muted/30" : "bg-muted/50"}`} />
                                                    </div>

                                                    <div
                                                        className={`w-full flex items-center justify-center text-xs font-semibold h-9 rounded-md transition-all ${isClaimed
                                                            ? "bg-secondary/50 text-muted-foreground border border-border"
                                                            : isReadyToClaim
                                                                ? "bg-[#0C4130] border border-emerald-500/40 text-emerald-400"
                                                                : "bg-secondary text-secondary-foreground opacity-80"
                                                            }`}
                                                    >
                                                        {rewardLabel}
                                                    </div>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </TabsContent>
                        ))}
                    </div>
                </Tabs>
            </div>
        </div>
    )
}
