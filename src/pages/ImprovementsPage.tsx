import { useContext } from "react"
import { Button } from "@/components/ui/button"
import Decimal from "break_eternity.js"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GameContext } from "@/context/GameContext"
import { playClickSound } from "@/lib/clickSound"
import { formatTime } from "@/lib/formatTime"

export function ImprovementsPage() {
  const ctx = useContext(GameContext)
  if (!ctx) return null
  const {
    geradores,
    upgrades,
    speedUpgrades,
    luckUpgrades,
    luckMultiplierUpgrades,
    formatDecimal,
    comprarMelhoria,
    podeComprarMelhoria,
    custoProximoNivel,
    comprarMelhoriaVelocidade,
    podeComprarMelhoriaVelocidade,
    custoProximoNivelVelocidade,
    comprarMelhoriaSorte,
    podeComprarMelhoriaSorte,
    custoProximoNivelSorte,
    chanceCritPorNivel,
    comprarMelhoriaEfeitoSorte,
    podeComprarMelhoriaEfeitoSorte,
    custoProximoNivelEfeitoSorte,
    luckCritMultiplier,
    intervaloEfetivo,
    globalProductionLevel,
    globalSpeedLevel,
    comprarMelhoriaGlobalProducao,
    podeComprarMelhoriaGlobalProducao,
    custoProximoNivelGlobalProducao,
    comprarMelhoriaGlobalVelocidade,
    podeComprarMelhoriaGlobalVelocidade,
    custoProximoNivelGlobalVelocidade,
    globalPriceReductionLevel,
    comprarMelhoriaGlobalPreco,
    podeComprarMelhoriaGlobalPreco,
    custoProximoNivelGlobalPreco,
    globalPriceMultiplier,
    upgradePoints,
    custoPontosMelhoria,
    custoPontosMelhoriaGlobal,
  } = ctx

  const indicesDesbloqueados = (() => {
    const ultimo = geradores.reduce((max, g, idx) => (g >= 1 ? idx : max), -1)
    if (ultimo < 0) return []
    return Array.from({ length: ultimo + 1 }, (_, i) => i)
  })()


  const multGlobalProducao = Math.pow(2, globalProductionLevel)
  const multProximoGlobalProducao = Math.pow(2, globalProductionLevel + 1)
  const reducaoPrecoAtualPct = (1 - globalPriceMultiplier(globalPriceReductionLevel)) * 100
  const reducaoPrecoProximaPct = (1 - globalPriceMultiplier(globalPriceReductionLevel + 1)) * 100

  return (
    <section className="flex flex-col min-h-0 flex-1 w-full overflow-hidden">
      <Tabs defaultValue="gerador" className="flex flex-col flex-1 min-h-0 w-full overflow-hidden">
        <div className="flex flex-row items-center justify-start gap-4 mb-4 shrink-0 overflow-x-auto pb-1">
          <Card className="px-3 py-1.5 flex flex-row items-center gap-2 bg-primary/10 border-primary/20 shrink-0 whitespace-nowrap">
            <span className="font-semibold text-primary text-sm">Pontos de Melhoria:</span>
            <span className="font-mono text-base font-bold tabular-nums text-primary">{upgradePoints}</span>
          </Card>

          <TabsList className="flex flex-row h-auto gap-1 bg-muted p-1 shrink-0 w-fit flex-none">
            <TabsTrigger value="gerador" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Por gerador
            </TabsTrigger>
            <TabsTrigger value="globais" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Globais
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="gerador"
          className="flex-1 min-h-0 overflow-y-auto mt-0 outline-none data-[state=inactive]:hidden data-[state=inactive]:overflow-hidden"
        >
          <div className="space-y-3 pb-4">
            {indicesDesbloqueados.map((i) => {
              const nivel = upgrades[i] ?? 0
              const mult = Math.pow(2, nivel)
              const custo = custoProximoNivel(i)
              const podeComprar = podeComprarMelhoria(i)
              const nivelVel = speedUpgrades[i] ?? 0
              const cicloAtual = intervaloEfetivo(i)
              const custoVel = custoProximoNivelVelocidade(i)
              const podeComprarVel = podeComprarMelhoriaVelocidade(i)
              const cicloProximo = Math.max(0.1, cicloAtual * 0.9)
              const nivelSorte = luckUpgrades[i] ?? 0
              const chanceAtualPct = Math.min(100, (nivelSorte * chanceCritPorNivel) * 100)
              const chanceProximaPct = Math.min(100, ((nivelSorte + 1) * chanceCritPorNivel) * 100)
              const custoSorte = custoProximoNivelSorte(i)
              const podeComprarSorte = podeComprarMelhoriaSorte(i)
              const nivelEfeitoSorte = luckMultiplierUpgrades[i] ?? 0
              const multEfeitoAtual = luckCritMultiplier(nivelEfeitoSorte)
              const multEfeitoProximo = luckCritMultiplier(nivelEfeitoSorte + 1)
              const custoEfeitoSorte = custoProximoNivelEfeitoSorte(i)
              const podeComprarEfeitoSorte = podeComprarMelhoriaEfeitoSorte(i)
              return (
                <Card key={i} className="py-3 px-4 w-full space-y-4">
                  <div className="grid grid-cols-[1fr_1fr_1fr_1fr_7rem] items-center gap-4 min-w-0">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-semibold leading-tight">Gerador {i + 1}</span>
                      <span className="text-muted-foreground text-xs">Produção</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono text-sm tabular-nums leading-tight">{nivel}</span>
                      <span className="text-muted-foreground text-xs">Nível</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono text-sm tabular-nums leading-tight">x{formatDecimal(new Decimal(mult))}</span>
                      <span className="text-muted-foreground text-xs">Multiplicador</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono text-sm tabular-nums leading-tight text-green-600 dark:text-green-500">x{formatDecimal(new Decimal(mult * 2))}</span>
                      <span className="text-muted-foreground text-xs">Próximo</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 items-center justify-center">
                      <Button
                        size="sm"
                        className="w-full h-auto flex flex-col gap-0.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => {
                          playClickSound()
                          comprarMelhoria(i)
                        }}
                        disabled={!podeComprar}
                      >
                        <span>Comprar</span>
                        <div className="flex flex-col items-center leading-none">
                          <span className="font-mono text-[10px] tabular-nums">
                            {formatDecimal(custo)} frag
                          </span>
                          <span className="font-mono text-[10px] tabular-nums text-primary-foreground/90">
                            {custoPontosMelhoria(i, nivel)} pts
                          </span>
                        </div>
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_1fr_1fr_7rem] items-center gap-4 min-w-0 border-t pt-4">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-semibold leading-tight">Gerador {i + 1}</span>
                      <span className="text-muted-foreground text-xs">Velocidade</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono text-sm tabular-nums leading-tight">{nivelVel}</span>
                      <span className="text-muted-foreground text-xs">Nível</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono text-sm tabular-nums leading-tight">{formatTime(cicloAtual)}</span>
                      <span className="text-muted-foreground text-xs">Ciclo atual</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono text-sm tabular-nums leading-tight text-green-600 dark:text-green-500">{formatTime(cicloProximo)}</span>
                      <span className="text-muted-foreground text-xs">Próximo</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 items-center justify-center">
                      <Button
                        size="sm"
                        className="w-full h-auto flex flex-col gap-0.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => {
                          playClickSound()
                          comprarMelhoriaVelocidade(i)
                        }}
                        disabled={!podeComprarVel}
                      >
                        <span>Comprar</span>
                        <div className="flex flex-col items-center leading-none">
                          <span className="font-mono text-[10px] tabular-nums">
                            {formatDecimal(custoVel)} frag
                          </span>
                          <span className="font-mono text-[10px] tabular-nums text-primary-foreground/90">
                            {custoPontosMelhoria(i, nivelVel)} pts
                          </span>
                        </div>
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_1fr_1fr_7rem] items-center gap-4 min-w-0 border-t pt-4">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-semibold leading-tight">Gerador {i + 1}</span>
                      <span className="text-muted-foreground text-xs">Sorte</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono text-sm tabular-nums leading-tight">{nivelSorte}</span>
                      <span className="text-muted-foreground text-xs">Nível</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono text-sm tabular-nums leading-tight">{chanceAtualPct.toFixed(1)}%</span>
                      <span className="text-muted-foreground text-xs">Chance atual</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono text-sm tabular-nums leading-tight text-green-600 dark:text-green-500">{chanceProximaPct.toFixed(1)}%</span>
                      <span className="text-muted-foreground text-xs">Próxima chance</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 items-center justify-center">
                      <Button
                        size="sm"
                        className="w-full h-auto flex flex-col gap-0.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => {
                          playClickSound()
                          comprarMelhoriaSorte(i)
                        }}
                        disabled={!podeComprarSorte}
                      >
                        <span>Comprar</span>
                        <div className="flex flex-col items-center leading-none">
                          <span className="font-mono text-[10px] tabular-nums">
                            {formatDecimal(custoSorte)} frag
                          </span>
                          <span className="font-mono text-[10px] tabular-nums text-primary-foreground/90">
                            {custoPontosMelhoria(i, nivelSorte)} pts
                          </span>
                        </div>
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_1fr_1fr_7rem] items-center gap-4 min-w-0 border-t pt-4">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-semibold leading-tight">Gerador {i + 1}</span>
                      <span className="text-muted-foreground text-xs">Efeito da sorte</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono text-sm tabular-nums leading-tight">{nivelEfeitoSorte}</span>
                      <span className="text-muted-foreground text-xs">Nível</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono text-sm tabular-nums leading-tight">x{formatDecimal(new Decimal(multEfeitoAtual))}</span>
                      <span className="text-muted-foreground text-xs">Mult. ao acertar crítico</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono text-sm tabular-nums leading-tight text-green-600 dark:text-green-500">x{formatDecimal(new Decimal(multEfeitoProximo))}</span>
                      <span className="text-muted-foreground text-xs">Próximo</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 items-center justify-center">
                      <Button
                        size="sm"
                        className="w-full h-auto flex flex-col gap-0.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => {
                          playClickSound()
                          comprarMelhoriaEfeitoSorte(i)
                        }}
                        disabled={!podeComprarEfeitoSorte}
                      >
                        <span>Comprar</span>
                        <div className="flex flex-col items-center leading-none">
                          <span className="font-mono text-[10px] tabular-nums">
                            {formatDecimal(custoEfeitoSorte)} frag
                          </span>
                          <span className="font-mono text-[10px] tabular-nums text-primary-foreground/90">
                            {custoPontosMelhoria(i, nivelEfeitoSorte)} pts
                          </span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
          {indicesDesbloqueados.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">
              Desbloqueie geradores na página Geradores para ver as melhorias aqui.
            </p>
          )}
        </TabsContent>

        <TabsContent
          value="globais"
          className="flex-1 min-h-0 overflow-y-auto mt-0 outline-none data-[state=inactive]:hidden data-[state=inactive]:overflow-hidden"
        >
          <div className="grid gap-3 sm:grid-cols-2 pb-4">
            <Card className="py-3 px-4 w-full">
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_7rem] items-center gap-4 min-w-0">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold leading-tight">Produção global</span>
                  <span className="text-muted-foreground text-xs">x2 em todos por nível</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight">{globalProductionLevel}</span>
                  <span className="text-muted-foreground text-xs">Nível</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight">x{formatDecimal(new Decimal(multGlobalProducao))}</span>
                  <span className="text-muted-foreground text-xs">Multiplicador</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight text-green-600 dark:text-green-500">x{formatDecimal(new Decimal(multProximoGlobalProducao))}</span>
                  <span className="text-muted-foreground text-xs">Próximo</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 items-center justify-center">
                  <Button
                    size="sm"
                    className="w-full h-auto flex flex-col gap-0.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      playClickSound()
                      comprarMelhoriaGlobalProducao()
                    }}
                    disabled={!podeComprarMelhoriaGlobalProducao()}
                  >
                    <span>Comprar</span>
                    <div className="flex flex-col items-center leading-none">
                      <span className="font-mono text-[10px] tabular-nums">
                        {formatDecimal(custoProximoNivelGlobalProducao())} frag
                      </span>
                      <span className="font-mono text-[10px] tabular-nums text-primary-foreground/90">
                        {custoPontosMelhoriaGlobal(globalProductionLevel)} pts
                      </span>
                    </div>
                  </Button>
                </div>
              </div>
            </Card>
            <Card className="py-3 px-4 w-full">
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_7rem] items-center gap-4 min-w-0">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold leading-tight">Velocidade global</span>
                  <span className="text-muted-foreground text-xs">−10% por nível</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight">{globalSpeedLevel}</span>
                  <span className="text-muted-foreground text-xs">Nível</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight">x{(0.9 ** globalSpeedLevel).toFixed(2)}</span>
                  <span className="text-muted-foreground text-xs">Fator do ciclo atual</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight text-green-600 dark:text-green-500">x{(0.9 ** (globalSpeedLevel + 1)).toFixed(2)}</span>
                  <span className="text-muted-foreground text-xs">Próximo</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 items-center justify-center">
                  <Button
                    size="sm"
                    className="w-full h-auto flex flex-col gap-0.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      playClickSound()
                      comprarMelhoriaGlobalVelocidade()
                    }}
                    disabled={!podeComprarMelhoriaGlobalVelocidade()}
                  >
                    <span>Comprar</span>
                    <div className="flex flex-col items-center leading-none">
                      <span className="font-mono text-[10px] tabular-nums">
                        {formatDecimal(custoProximoNivelGlobalVelocidade())} frag
                      </span>
                      <span className="font-mono text-[10px] tabular-nums text-primary-foreground/90">
                        {custoPontosMelhoriaGlobal(globalSpeedLevel)} pts
                      </span>
                    </div>
                  </Button>
                </div>
              </div>
            </Card>
            <Card className="py-3 px-4 w-full">
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_7rem] items-center gap-4 min-w-0">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold leading-tight">Preço dos geradores</span>
                  <span className="text-muted-foreground text-xs">−5% por nível</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight">{globalPriceReductionLevel}</span>
                  <span className="text-muted-foreground text-xs">Nível</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight">{reducaoPrecoAtualPct.toFixed(0)}%</span>
                  <span className="text-muted-foreground text-xs">Redução atual</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight text-green-600 dark:text-green-500">{reducaoPrecoProximaPct.toFixed(0)}%</span>
                  <span className="text-muted-foreground text-xs">Próxima</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 items-center justify-center">
                  <Button
                    size="sm"
                    className="w-full h-auto flex flex-col gap-0.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      playClickSound()
                      comprarMelhoriaGlobalPreco()
                    }}
                    disabled={!podeComprarMelhoriaGlobalPreco()}
                  >
                    <span>Comprar</span>
                    <div className="flex flex-col items-center leading-none">
                      <span className="font-mono text-[10px] tabular-nums">
                        {formatDecimal(custoProximoNivelGlobalPreco())} frag
                      </span>
                      <span className="font-mono text-[10px] tabular-nums text-primary-foreground/90">
                        {custoPontosMelhoriaGlobal(globalPriceReductionLevel)} pts
                      </span>
                    </div>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}
