import { useContext } from "react"
import Decimal from "break_eternity.js"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FlowBar } from "@/components/FlowBar"
import { Progress } from "@/components/ui/progress"
import { GameContext } from "@/context/GameContext"
import { useProgresso } from "@/context/ProgressoContext"
import { playClickSound } from "@/lib/clickSound"
import { formatTime } from "@/lib/formatTime"
import { getMilestoneIndex, getNextMilestoneThreshold, getCurrentMilestoneThreshold } from "@/App"


export function GeneratorsPage() {
  const ctx = useContext(GameContext)
  const progresso = useProgresso()
  if (!ctx) return null
  const {
    total,
    geradores,
    upgrades,
    formatDecimal,
    comprarGerador,
    podeComprar,
    custoGerador,
    intervaloEfetivo,
    NUM_GERADORES,
    milestonesReached,
  } = ctx

  return (
    <section className="w-full space-y-3">
      {(() => {
        const ultimoComUnidade = geradores.reduce((max, g, idx) => (g >= 1 ? idx : max), -1)
        const ateIndice = Math.min(ultimoComUnidade + 1, NUM_GERADORES - 1)
        return Array.from({ length: ateIndice + 1 }, (_, i) => i)
      })().map((i) => {
        const estaBloqueado = geradores[i] === 0
        if (estaBloqueado) {
          return (
            <Card
              key={i}
              role="button"
              tabIndex={podeComprar(i) ? 0 : -1}
              className={`py-4 px-6 cursor-pointer transition-colors ${podeComprar(i) ? "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" : "cursor-not-allowed opacity-70"}`}
              onClick={() => {
                if (podeComprar(i)) {
                  playClickSound()
                  comprarGerador(i)
                }
              }}
              onKeyDown={(e) => {
                if (podeComprar(i) && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault()
                  playClickSound()
                  comprarGerador(i)
                }
              }}
            >
              <div className="flex items-center justify-center gap-6 flex-wrap">
                <div className="flex flex-col gap-0.5 text-center">
                  <span className="font-semibold text-lg">Gerador {i + 1}</span>
                  <span className="text-muted-foreground text-sm">Desbloqueie para começar a produzir</span>
                </div>
                <div className="h-10 w-px bg-border shrink-0" aria-hidden />
                <div className="flex flex-col gap-0.5 text-center">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Custo para desbloquear</span>
                  <div className="flex flex-col items-center">
                    <span className={`font-mono text-sm tabular-nums font-semibold ${total.gte(custoGerador(i)) ? "text-green-600 dark:text-green-500" : "text-destructive"}`}>
                      {formatDecimal(custoGerador(i))} Fragmentos
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )
        }
        const interval = intervaloEfetivo(i)
        const cicloRapido = interval <= 1
        const produz = i === 0 ? "Recurso" : `Gerador ${i}`
        const produzidoPeloProximo = i < NUM_GERADORES - 1 && geradores[i + 1] >= 1
        const mostraBotaoComprar = !produzidoPeloProximo
        const mult = Math.pow(2, upgrades[i] ?? 0)

        const countGen = geradores[i]
        const currentMilestoneIndex = milestonesReached[i] ?? getMilestoneIndex(countGen)
        const currentThreshold = getCurrentMilestoneThreshold(currentMilestoneIndex)
        const nextThreshold = getNextMilestoneThreshold(currentMilestoneIndex)

        const progressInTier = Math.max(0, countGen - currentThreshold)
        const tierGoal = nextThreshold - currentThreshold
        const progressToNext = Math.max(0, Math.min(100, (progressInTier / tierGoal) * 100))
        const ptsForNext = i + 1

        return (
          <Card key={i} className="py-3 px-4">
            <div className="grid grid-cols-[1.1fr_0.8fr_1.3fr_0.7fr_0.8fr_1.1fr_1.6fr_0.9fr] items-center gap-3 min-w-0">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold leading-tight text-sm">Gerador {i + 1}</span>
                <span className="text-muted-foreground text-[10px] uppercase">Gerador</span>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-mono text-sm tabular-nums leading-tight break-all">
                  {formatDecimal(new Decimal(countGen))}
                </span>
                <span className="text-muted-foreground text-[10px] uppercase">Quantidade</span>
              </div>

              <div className="flex flex-col gap-0.5 min-w-0" title={`Marco: ${progressInTier} / ${tierGoal} (+${ptsForNext} pts) | Total: ${countGen} / ${nextThreshold}`}>
                <div className="flex items-center gap-1.5 w-full mt-0.5">
                  <Progress value={progressToNext} className="h-1.5 flex-1 bg-muted/50" />
                  <span className="font-mono text-sm tabular-nums leading-none opacity-80 w-16 text-right shrink-0">{progressInTier}/{tierGoal}</span>
                </div>
                <div className="flex justify-between items-center w-full mt-0.5">
                  <span className="text-muted-foreground text-[10px] uppercase truncate">Marco</span>
                  <span className="text-muted-foreground text-[10px] uppercase">+{ptsForNext} pts</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 items-end">
                <span className="font-mono text-sm tabular-nums leading-tight text-right whitespace-nowrap">{formatTime(interval)}</span>
                <span className="text-muted-foreground text-[10px] uppercase text-right">Tempo</span>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                {cicloRapido ? (
                  <FlowBar />
                ) : (
                  <Progress value={(progresso ?? [])[i] ?? 0} className="h-2 w-full" />
                )}
                <span className="text-muted-foreground text-[10px] uppercase">Ciclo</span>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-mono text-sm tabular-nums leading-tight break-all">
                  +{formatDecimal(new Decimal(countGen * mult))}
                  {mult > 1 && <span className="text-green-600 dark:text-green-500 ml-0.5">(x{formatDecimal(new Decimal(mult))})</span>}
                </span>
                <span className="text-muted-foreground text-[10px] uppercase">{produz}</span>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                {mostraBotaoComprar ? (
                  <>
                    <div className="flex items-baseline gap-2 whitespace-nowrap">
                      <span className={`font-mono text-sm tabular-nums leading-tight ${total.gte(custoGerador(i)) ? "text-foreground font-semibold" : "text-destructive font-semibold"}`}>
                        {formatDecimal(custoGerador(i))} Fragmentos
                      </span>
                    </div>
                    <span className="text-muted-foreground text-[10px] uppercase tracking-tight">Preço</span>
                  </>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs italic">Gerado automaticamente</span>
                    <span className="text-muted-foreground text-[10px] uppercase tracking-tight opacity-0">Preço</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 items-center justify-center">
                {mostraBotaoComprar ? (
                  <Button
                    size="sm"
                    className="w-full py-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      playClickSound()
                      comprarGerador(i)
                    }}
                    disabled={!podeComprar(i)}
                  >
                    Comprar
                  </Button>
                ) : (
                  <span className="w-full inline-flex items-center justify-center rounded-md border border-border bg-muted px-2 py-2 min-h-[2.25rem] text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Automático
                  </span>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </section>
  )
}
