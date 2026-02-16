import { useContext } from "react"
import Decimal from "break_eternity.js"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { GameContext } from "@/context/GameContext"

export function GeneratorsPage() {
  const ctx = useContext(GameContext)
  if (!ctx) return null
  const {
    geradores,
    progresso,
    upgrades,
    formatDecimal,
    comprarGerador,
    podeComprar,
    custoGerador,
    intervaloGerador,
    NUM_GERADORES,
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
              onClick={() => podeComprar(i) && comprarGerador(i)}
              onKeyDown={(e) => podeComprar(i) && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), comprarGerador(i))}
            >
              <div className="flex items-center justify-center gap-6 flex-wrap">
                <div className="flex flex-col gap-0.5 text-center">
                  <span className="font-semibold text-lg">Gerador {i + 1}</span>
                  <span className="text-muted-foreground text-sm">Desbloqueie para começar a produzir</span>
                </div>
                <div className="h-10 w-px bg-border shrink-0" aria-hidden />
                <div className="flex flex-col gap-0.5 text-center">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Custo para desbloquear</span>
                  <span className={`font-mono text-sm tabular-nums font-semibold ${podeComprar(i) ? "text-green-600 dark:text-green-500" : "text-destructive"}`}>
                    {formatDecimal(custoGerador(i))}
                  </span>
                </div>
              </div>
            </Card>
          )
        }
        const interval = intervaloGerador(i)
        const produz = i === 0 ? "recurso" : `Gerador ${i}`
        const produzidoPeloProximo = i < NUM_GERADORES - 1 && geradores[i + 1] >= 1
        const mostraBotaoComprar = !produzidoPeloProximo
        const mult = Math.pow(2, upgrades[i] ?? 0)
        return (
          <Card key={i} className="py-3 px-4">
            <div className="grid grid-cols-[6rem_7rem_10rem_1fr_3rem_7rem] items-center gap-4 min-w-0">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold leading-tight">Gerador {i + 1}</span>
                <span className="text-muted-foreground text-xs">Gerador</span>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-mono text-sm tabular-nums leading-tight break-all">
                  {formatDecimal(new Decimal(geradores[i]))}
                </span>
                <span className="text-muted-foreground text-xs">Quantidade</span>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-mono text-sm tabular-nums leading-tight break-all">
                  +{formatDecimal(new Decimal(geradores[i] * mult))}
                  {mult > 1 && <span className="text-green-600 dark:text-green-500 ml-0.5">(x{mult})</span>}
                </span>
                <span className="text-muted-foreground text-xs">{produz}</span>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <Progress value={progresso[i]} className="h-2 w-full" />
                <span className="text-muted-foreground text-xs">Ciclo</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-sm tabular-nums leading-tight text-right">{interval}s</span>
                <span className="text-muted-foreground text-xs">Tempo</span>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 items-center justify-center">
                {mostraBotaoComprar ? (
                  <Button
                    size="sm"
                    className="w-full h-auto flex flex-col gap-0.5 py-2 bg-white text-black hover:bg-gray-200 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    onClick={() => comprarGerador(i)}
                    disabled={!podeComprar(i)}
                  >
                    <span>Comprar</span>
                    <span className="font-mono text-xs tabular-nums">
                      {formatDecimal(custoGerador(i))}
                    </span>
                  </Button>
                ) : (
                  <span className="w-full inline-flex items-center justify-center rounded-md border border-border bg-muted px-2 py-2 min-h-[3.5rem] text-xs font-medium text-muted-foreground">
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
