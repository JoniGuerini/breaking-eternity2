import { useContext } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import Decimal from "break_eternity.js"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GameContext } from "@/context/GameContext"
import { playClickSound } from "@/lib/clickSound"
import { formatTime } from "@/lib/formatTime"

export function ImprovementsPage() {
  const { t } = useTranslation()
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
            <span className="font-semibold text-primary text-sm">{t("improvements.upgradePoints")}:</span>
            <span className="font-mono text-base font-bold tabular-nums text-primary">{upgradePoints}</span>
          </Card>

          <TabsList className="flex flex-row h-auto gap-1 bg-muted p-1 shrink-0 w-fit flex-none">
            <TabsTrigger value="gerador" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              {t("improvements.perGenerator")}
            </TabsTrigger>
            <TabsTrigger value="globais" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              {t("improvements.global")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="gerador"
          className="flex-1 min-h-0 overflow-y-auto mt-0 outline-none data-[state=inactive]:hidden data-[state=inactive]:overflow-hidden"
        >
          <div className="flex flex-col gap-4 pb-4">
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
                <Card key={i} className="p-0 min-w-0 overflow-hidden" data-slot="card">
                  <div className="px-4 pt-4 pb-2 border-b border-border">
                    <h3 className="font-semibold text-base">{t("generators.generatorN", { n: i + 1 })}</h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-w-0 p-4">
                    <div className="flex flex-col gap-3 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold text-sm leading-tight">{t("improvements.production")}</p>
                        <span className="text-muted-foreground text-xs shrink-0">{t("improvements.level")} {nivel}</span>
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-mono text-sm tabular-nums">x{formatDecimal(new Decimal(mult))}</span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className="font-mono text-sm tabular-nums text-green-600 dark:text-green-500">x{formatDecimal(new Decimal(mult * 2))}</span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-auto"
                        onClick={() => { playClickSound(); comprarMelhoria(i) }}
                        disabled={!podeComprar}
                      >
                        <span className="mr-1">{t("improvements.buy")}</span>
                        <span className="font-mono text-xs">{formatDecimal(custo)} {t("improvements.frag")} · {custoPontosMelhoria(i, nivel)} pts</span>
                      </Button>
                    </div>
                    <div className="flex flex-col gap-3 min-w-0 lg:border-l lg:border-border lg:pl-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold text-sm leading-tight">{t("improvements.speed")}</p>
                        <span className="text-muted-foreground text-xs shrink-0">{t("improvements.level")} {nivelVel}</span>
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-mono text-sm tabular-nums">{formatTime(cicloAtual)}</span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className="font-mono text-sm tabular-nums text-green-600 dark:text-green-500">{formatTime(cicloProximo)}</span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-auto"
                        onClick={() => { playClickSound(); comprarMelhoriaVelocidade(i) }}
                        disabled={!podeComprarVel}
                      >
                        <span className="mr-1">{t("improvements.buy")}</span>
                        <span className="font-mono text-xs">{formatDecimal(custoVel)} {t("improvements.frag")} · {custoPontosMelhoria(i, nivelVel)} pts</span>
                      </Button>
                    </div>
                    <div className="flex flex-col gap-3 min-w-0 lg:border-l lg:border-border lg:pl-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold text-sm leading-tight">{t("improvements.luck")}</p>
                        <span className="text-muted-foreground text-xs shrink-0">{t("improvements.level")} {nivelSorte}</span>
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-mono text-sm tabular-nums">{chanceAtualPct.toFixed(1)}%</span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className="font-mono text-sm tabular-nums text-green-600 dark:text-green-500">{chanceProximaPct.toFixed(1)}%</span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-auto"
                        onClick={() => { playClickSound(); comprarMelhoriaSorte(i) }}
                        disabled={!podeComprarSorte}
                      >
                        <span className="mr-1">{t("improvements.buy")}</span>
                        <span className="font-mono text-xs">{formatDecimal(custoSorte)} {t("improvements.frag")} · {custoPontosMelhoria(i, nivelSorte)} pts</span>
                      </Button>
                    </div>
                    <div className="flex flex-col gap-3 min-w-0 lg:border-l lg:border-border lg:pl-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold text-sm leading-tight">{t("improvements.luckEffect")}</p>
                        <span className="text-muted-foreground text-xs shrink-0">{t("improvements.level")} {nivelEfeitoSorte}</span>
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-mono text-sm tabular-nums">x{formatDecimal(new Decimal(multEfeitoAtual))}</span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className="font-mono text-sm tabular-nums text-green-600 dark:text-green-500">x{formatDecimal(new Decimal(multEfeitoProximo))}</span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-auto"
                        onClick={() => { playClickSound(); comprarMelhoriaEfeitoSorte(i) }}
                        disabled={!podeComprarEfeitoSorte}
                      >
                        <span className="mr-1">{t("improvements.buy")}</span>
                        <span className="font-mono text-xs">{formatDecimal(custoEfeitoSorte)} {t("improvements.frag")} · {custoPontosMelhoria(i, nivelEfeitoSorte)} pts</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
          {indicesDesbloqueados.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">
              {t("improvements.unlockGeneratorsHint")}
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
                  <span className="font-semibold leading-tight">{t("improvements.globalProduction")}</span>
                  <span className="text-muted-foreground text-xs">{t("improvements.globalProductionDesc")}</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight">{globalProductionLevel}</span>
                  <span className="text-muted-foreground text-xs">{t("improvements.level")}</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight">x{formatDecimal(new Decimal(multGlobalProducao))}</span>
                  <span className="text-muted-foreground text-xs">{t("improvements.multiplier")}</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight text-green-600 dark:text-green-500">x{formatDecimal(new Decimal(multProximoGlobalProducao))}</span>
                  <span className="text-muted-foreground text-xs">{t("improvements.next")}</span>
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
                    <span>{t("improvements.buy")}</span>
                    <div className="flex flex-col items-center leading-none">
                      <span className="font-mono text-[10px] tabular-nums">
                        {formatDecimal(custoProximoNivelGlobalProducao())} {t("improvements.frag")}
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
                  <span className="font-semibold leading-tight">{t("improvements.globalSpeed")}</span>
                  <span className="text-muted-foreground text-xs">{t("improvements.globalSpeedDesc")}</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight">{globalSpeedLevel}</span>
                  <span className="text-muted-foreground text-xs">{t("improvements.level")}</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight">x{(0.9 ** globalSpeedLevel).toFixed(2)}</span>
                  <span className="text-muted-foreground text-xs">{t("improvements.cycleFactor")}</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight text-green-600 dark:text-green-500">x{(0.9 ** (globalSpeedLevel + 1)).toFixed(2)}</span>
                  <span className="text-muted-foreground text-xs">{t("improvements.next")}</span>
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
                    <span>{t("improvements.buy")}</span>
                    <div className="flex flex-col items-center leading-none">
                      <span className="font-mono text-[10px] tabular-nums">
                        {formatDecimal(custoProximoNivelGlobalVelocidade())} {t("improvements.frag")}
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
                  <span className="font-semibold leading-tight">{t("improvements.generatorPrice")}</span>
                  <span className="text-muted-foreground text-xs">{t("improvements.generatorPriceDesc")}</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight">{globalPriceReductionLevel}</span>
                  <span className="text-muted-foreground text-xs">{t("improvements.level")}</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight">{reducaoPrecoAtualPct.toFixed(0)}%</span>
                  <span className="text-muted-foreground text-xs">{t("improvements.currentReduction")}</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm tabular-nums leading-tight text-green-600 dark:text-green-500">{reducaoPrecoProximaPct.toFixed(0)}%</span>
                  <span className="text-muted-foreground text-xs">{t("improvements.nextReduction")}</span>
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
                    <span>{t("improvements.buy")}</span>
                    <div className="flex flex-col items-center leading-none">
                      <span className="font-mono text-[10px] tabular-nums">
                        {formatDecimal(custoProximoNivelGlobalPreco())} {t("improvements.frag")}
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
