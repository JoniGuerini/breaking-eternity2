import { useContext } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GameContext } from "@/context/GameContext"

export function ImprovementsPage() {
  const ctx = useContext(GameContext)
  if (!ctx) return null
  const {
    upgrades,
    formatDecimal,
    comprarMelhoria,
    podeComprarMelhoria,
    custoProximoNivel,
    NUM_GERADORES,
  } = ctx

  return (
    <section className="w-full space-y-3">
      <div className="space-y-3">
        {Array.from({ length: NUM_GERADORES }, (_, i) => {
          const nivel = upgrades[i] ?? 0
          const mult = Math.pow(2, nivel)
          const custo = custoProximoNivel(i)
          const podeComprar = podeComprarMelhoria(i)
          return (
            <Card key={i} className="py-3 px-4 w-full">
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_7rem] items-center gap-4 min-w-0">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold leading-tight">Gerador {i + 1}</span>
                  <span className="text-muted-foreground text-xs">Melhoria</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight">{nivel}</span>
                  <span className="text-muted-foreground text-xs">Nível</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight">x{mult}</span>
                  <span className="text-muted-foreground text-xs">Produção</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight text-green-600 dark:text-green-500">x{mult * 2}</span>
                  <span className="text-muted-foreground text-xs">Próximo</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 items-center justify-center">
                  <Button
                    size="sm"
                    className="w-full h-auto flex flex-col gap-0.5 py-2 bg-white text-black hover:bg-gray-200 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    onClick={() => comprarMelhoria(i)}
                    disabled={!podeComprar}
                  >
                    <span>Comprar</span>
                    <span className="font-mono text-xs tabular-nums">
                      {formatDecimal(custo)}
                    </span>
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
