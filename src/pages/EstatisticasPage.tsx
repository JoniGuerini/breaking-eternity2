import { useContext } from "react"
import Decimal from "break_eternity.js"
import { Card } from "@/components/ui/card"
import { GameContext } from "@/context/GameContext"

export function EstatisticasPage() {
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
    return new Date(ts).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <section className="p-4 pb-8 space-y-6 max-w-2xl mx-auto">
      <Card className="p-6 space-y-5">
        <div>
          <p className="font-medium">Resumo da sua partida</p>
          <p className="text-muted-foreground text-sm mt-1">
            Números gerais do progresso (zeram ao resetar).
          </p>
        </div>
        <dl className="space-y-4">
          <div className="flex justify-between items-baseline gap-2">
            <dt className="text-muted-foreground text-sm">Recurso atual</dt>
            <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(total)}</dd>
          </div>
          <div className="flex justify-between items-baseline gap-2">
            <dt className="text-muted-foreground text-sm">Total já produzido</dt>
            <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(totalProducedLifetime)}</dd>
          </div>
          <div className="flex justify-between items-baseline gap-2">
            <dt className="text-muted-foreground text-sm">Tempo de jogo</dt>
            <dd className="font-mono text-sm font-semibold tabular-nums">{formatPlayTime(totalPlayTimeSeconds)}</dd>
          </div>
          <div className="flex justify-between items-baseline gap-2">
            <dt className="text-muted-foreground text-sm">Primeira partida</dt>
            <dd className="font-mono text-sm tabular-nums">{formatFirstPlayDate(firstPlayTime)}</dd>
          </div>
          <div className="flex justify-between items-baseline gap-2">
            <dt className="text-muted-foreground text-sm">Geradores comprados (manual)</dt>
            <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(new Decimal(geradoresCompradosManual))}</dd>
          </div>
          <div className="flex justify-between items-baseline gap-2">
            <dt className="text-muted-foreground text-sm">Geradores produzidos (automático)</dt>
            <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(Decimal.max(new Decimal(0), geradores.reduce((acc, g) => acc.add(g), new Decimal(0)).sub(geradoresCompradosManual)))}</dd>
          </div>
          <div className="flex justify-between items-baseline gap-2">
            <dt className="text-muted-foreground text-sm">Melhorias de produção</dt>
            <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(new Decimal(upgrades.reduce((a, b) => a + b, 0)))}</dd>
          </div>
          <div className="flex justify-between items-baseline gap-2">
            <dt className="text-muted-foreground text-sm">Melhorias de velocidade</dt>
            <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(new Decimal(speedUpgrades.reduce((a, b) => a + b, 0)))}</dd>
          </div>
        </dl>
        {geradores.some((g) => g >= 1) && (
          <>
            <div className="pt-4 border-t">
              <p className="font-medium">Tempos por gerador</p>
              <p className="text-muted-foreground text-sm mt-1">
                Quanto tempo desde o início até desbloquear cada gerador e quanto tempo você passou em cada tier. Desbloqueios a partir de agora passam a ser registrados.
              </p>
            </div>
            <dl className="space-y-3 pt-2">
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
                      <dt className="text-muted-foreground text-sm">Gerador {i + 1} — tempo até desbloquear</dt>
                      <dd className="font-mono text-sm font-semibold tabular-nums">
                        {temDado ? formatPlayTime(segundosDesdeInicio) : "—"}
                      </dd>
                    </div>
                    {i > 0 && (
                      <div className="flex justify-between items-baseline gap-2">
                        <dt className="text-muted-foreground text-xs">Tempo só no tier anterior (Gerador {i})</dt>
                        <dd className="font-mono text-xs tabular-nums">
                          {temDadoTierAnterior ? formatPlayTime(segundosNoTierAnterior) : "—"}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline gap-2">
                      <dt className="text-muted-foreground text-xs">Vezes que gerou recurso bônus (sorte)</dt>
                      <dd className="font-mono text-xs tabular-nums">
                        {(generatorBonusCount[i] ?? 0).toLocaleString("pt-BR")}
                      </dd>
                    </div>
                  </div>
                )
              })}
            </dl>
          </>
        )}
      </Card>
    </section>
  )
}
