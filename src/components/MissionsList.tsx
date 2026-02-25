import { useContext } from "react"
import { useTranslation } from "react-i18next"
import Decimal from "break_eternity.js"
import { GameContext } from "@/context/GameContext"
import { MISSIONS } from "@/constants/missions"
import type { Mission } from "@/constants/missions"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function MissionsList() {
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

    const incompleteMissions = MISSIONS.filter((m) => !claimedMissions.includes(m.id))

    const activeMissions = incompleteMissions
        .map((m) => {
            const currentVal = getProgress(m)
            let pct = 0

            if (currentVal instanceof Decimal) {
                if (currentVal.gte(m.targetAmount)) pct = 100
                else pct = currentVal.div(m.targetAmount).times(100).toNumber()
            } else {
                if (currentVal >= m.targetAmount) pct = 100
                else pct = Math.min(100, (currentVal / m.targetAmount) * 100)
            }

            return { mission: m, pct }
        })
        .sort((a, b) => b.pct - a.pct) // Highest percentage first to find the top 5
        .slice(0, 5)
        .sort((a, b) => MISSIONS.indexOf(a.mission) - MISSIONS.indexOf(b.mission)) // Restore to original order to avoid jumping
        .map((data) => data.mission)

    if (activeMissions.length === 0) return null

    return (
        <div className="w-full mb-1 overflow-x-auto pb-2 scroll-overlay snap-x flex touch-pan-x">
            <div className="flex gap-4 w-full min-w-max flex-nowrap" style={{ paddingLeft: "1px", paddingRight: "1px" }}>
                {activeMissions.map((m) => {
                    const currentVal = getProgress(m)
                    let isCompleted = false
                    let pct = 0
                    let currentDisplay = "0"
                    const targetDisplay = formatDecimal(new Decimal(m.targetAmount))

                    if (currentVal instanceof Decimal) {
                        isCompleted = currentVal.gte(m.targetAmount)
                        if (isCompleted) {
                            pct = 100
                            currentDisplay = targetDisplay
                        } else {
                            pct = currentVal.div(m.targetAmount).times(100).toNumber()
                            currentDisplay = formatDecimal(currentVal)
                        }
                    } else {
                        isCompleted = currentVal >= m.targetAmount
                        pct = Math.min(100, (currentVal / m.targetAmount) * 100)
                        currentDisplay = isCompleted ? targetDisplay : formatDecimal(new Decimal(currentVal))
                    }

                    const hasRewardFragments = m.rewardType === "FRAGMENTS"
                    const rewardLabel = hasRewardFragments
                        ? `${formatDecimal(new Decimal(m.rewardAmount))} ${t("missions.fragments", { defaultValue: "Fragments" })}`
                        : `${m.rewardAmount} ${t("missions.upgradePoints", { defaultValue: "Upgrade Pts" })}`

                    return (
                        <Card
                            key={m.id}
                            onClick={() => {
                                if (isCompleted) claimMission(m.id)
                            }}
                            className={`w-[85vw] sm:w-[18rem] md:w-[22rem] xl:flex-1 xl:max-w-[28rem] shrink-0 p-4 flex flex-col justify-between snap-start backdrop-blur-sm transition-all ${isCompleted
                                ? "bg-[#0C4130]/20 border-emerald-500/40 cursor-pointer hover:bg-[#0C4130]/40 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                                : "bg-card/80 border-border"
                                }`}
                        >
                            <div className="flex flex-col gap-1.5 mb-4">
                                <span className={`font-semibold text-sm leading-tight transition-colors ${isCompleted ? "text-emerald-400" : "text-foreground"}`}>
                                    {(t as any)([`missions.${m.id}.name`, `missions.dynamic.${m.type}.name`], { amount: targetDisplay, gen: (m.generatorIndex ?? 0) + 1, defaultValue: m.id })}
                                </span>
                                <span className="text-xs text-muted-foreground leading-snug h-8 overflow-hidden line-clamp-2">
                                    {(t as any)([`missions.${m.id}.desc`, `missions.dynamic.${m.type}.desc`], { amount: targetDisplay, gen: (m.generatorIndex ?? 0) + 1, defaultValue: `Complete objective for ${m.targetAmount}` })}
                                </span>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isCompleted ? "text-emerald-400" : "text-muted-foreground"}`}>
                                            {isCompleted ? t("missions.ready", { defaultValue: "READY" }) : t("missions.progress", { defaultValue: "PROGRESS" })}
                                        </span>
                                        <span className={`font-mono text-xs tabular-nums font-medium transition-colors ${isCompleted ? "text-emerald-400" : ""}`}>
                                            {currentDisplay} <span className={isCompleted ? "text-emerald-400/80" : "text-muted-foreground"}>/ {targetDisplay}</span>
                                        </span>
                                    </div>
                                    <Progress value={pct} className={`h-1.5 transition-colors ${isCompleted ? "bg-emerald-950/50 [&_[data-slot=progress-indicator]]:bg-emerald-400" : "bg-muted/50"}`} />
                                </div>

                                <div
                                    className={`w-full flex items-center justify-center text-xs font-semibold h-9 rounded-md transition-all ${isCompleted
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
        </div>
    )
}
