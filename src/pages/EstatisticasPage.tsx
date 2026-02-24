import { useContext } from "react"
import { useTranslation } from "react-i18next"
import Decimal from "break_eternity.js"
import { Card } from "@/components/ui/card"
import { GameContext } from "@/context/GameContext"

export function EstatisticasPage() {
  const { t, i18n } = useTranslation()
  const ctx = useContext(GameContext)
  if (!ctx) return null
  const {
    total,
    formatDecimal,
    geradores,
    upgrades,
    speedUpgrades,
    totalProducedLifetime,
    totalPlayTimeSeconds,
    firstPlayTime,
    geradoresCompradosManual,
    generatorUnlockTimestamps,
    generatorBonusCount,
  } = ctx

  function formatPlayTime(seconds: number): string {
    if (seconds < 60) return `${Number(seconds.toFixed(2))}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    return h > 0 ? `${d}d ${h}h` : `${d}d`
  }

  function formatFirstPlayDate(ts: number | null): string {
    if (!ts) return "—"
    const locale = i18n.language === "en" ? "en-US" : "pt-BR"
    return new Date(ts).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const temGeradores = geradores.some((g) => g >= 1)

  return (
    <section className="w-full space-y-4">
      <div className={`grid gap-4 ${temGeradores ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* ── Resumo ── */}
        <Card className="p-6 space-y-5 h-fit">
          <div>
            <p className="font-medium">{t("stats.summary")}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {t("stats.summaryDesc")}
            </p>
          </div>
          <dl className="space-y-4">
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">{t("stats.currentResource")}</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(total)}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">{t("stats.totalProduced")}</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(totalProducedLifetime)}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">{t("stats.playTime")}</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{formatPlayTime(totalPlayTimeSeconds)}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">{t("stats.firstSession")}</dt>
              <dd className="font-mono text-sm tabular-nums">{formatFirstPlayDate(firstPlayTime)}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">{t("stats.manualPurchases")}</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(new Decimal(geradoresCompradosManual))}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">{t("stats.autoProduced")}</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(Decimal.max(new Decimal(0), geradores.reduce((acc, g) => acc.add(g), new Decimal(0)).sub(geradoresCompradosManual)))}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">{t("stats.productionUpgrades")}</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(new Decimal(upgrades.reduce((a, b) => a + b, 0)))}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">{t("stats.speedUpgrades")}</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(new Decimal(speedUpgrades.reduce((a, b) => a + b, 0)))}</dd>
            </div>
          </dl>
        </Card>

        {/* ── Tempos por gerador ── */}
        {temGeradores && (
          <Card className="p-6 space-y-5 h-fit">
            <div>
              <p className="font-medium">{t("stats.timesPerGenerator")}</p>
              <p className="text-muted-foreground text-sm mt-1">
                {t("stats.timesPerGeneratorDesc")}
              </p>
            </div>
            <dl className="space-y-3">
              {geradores.map((count, i) => {
                if (count < 1) return null
                const ts = generatorUnlockTimestamps[i] ?? 0
                const segundosDesdeInicioBruto = ts > 0 && firstPlayTime != null ? (ts - firstPlayTime) / 1000 : 0
                const dentroDoTempoDeJogo = segundosDesdeInicioBruto >= 0 && segundosDesdeInicioBruto <= totalPlayTimeSeconds + 120
                const temDado = ts > 0 && firstPlayTime != null && dentroDoTempoDeJogo
                const segundosDesdeInicio = temDado ? segundosDesdeInicioBruto : 0
                const tsAnterior = generatorUnlockTimestamps[i - 1] ?? 0
                const segundosNoTierAnterior =
                  i === 0 ? 0 : tsAnterior > 0 && ts > 0 ? (ts - tsAnterior) / 1000 : 0
                const temDadoTierAnterior = i > 0 && tsAnterior > 0 && ts > 0 && segundosNoTierAnterior >= 0 && segundosNoTierAnterior <= totalPlayTimeSeconds + 120
                return (
                  <div key={i} className="flex flex-col gap-0.5 py-2 px-3 rounded-md bg-muted/50">
                    <div className="flex justify-between items-baseline gap-2">
                      <dt className="text-muted-foreground text-sm">{t("generators.generatorN", { n: i + 1 })} — {t("stats.timeToUnlock")}</dt>
                      <dd className="font-mono text-sm font-semibold tabular-nums">
                        {temDado ? formatPlayTime(segundosDesdeInicio) : "—"}
                      </dd>
                    </div>
                    {i > 0 && (
                      <div className="flex justify-between items-baseline gap-2">
                        <dt className="text-muted-foreground text-xs">{t("stats.timeInPreviousTier", { n: i })}</dt>
                        <dd className="font-mono text-xs tabular-nums">
                          {temDadoTierAnterior ? formatPlayTime(segundosNoTierAnterior) : "—"}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline gap-2">
                      <dt className="text-muted-foreground text-xs">{t("stats.bonusHits")}</dt>
                      <dd className="font-mono text-xs tabular-nums">
                        {(generatorBonusCount[i] ?? 0).toLocaleString(i18n.language === "en" ? "en-US" : "pt-BR")}
                      </dd>
                    </div>
                  </div>
                )
              })}
            </dl>
          </Card>
        )}
      </div>
    </section>
  )
}
