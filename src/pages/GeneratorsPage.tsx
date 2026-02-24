import { useContext, memo, useCallback, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import Decimal from "break_eternity.js"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { GameContext } from "@/context/GameContext"
import { playClickSound } from "@/lib/clickSound"
import { formatTime } from "@/lib/formatTime"
import { getMilestoneIndex, getNextMilestoneThreshold, getCurrentMilestoneThreshold } from "@/App"

// ----------------------------------------------------------------------
// CycleProgressBar: usa ref diretamente para não re-renderizar todo o card a cada tick de 60 FPS
// ----------------------------------------------------------------------
const CycleProgressBar = memo(({ i, cicloRapido, progressoRef }: { i: number, cicloRapido: boolean, progressoRef: React.MutableRefObject<number[]> }) => {
  const indicatorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cicloRapido) return
    let raf: number
    const tick = () => {
      if (indicatorRef.current) {
        const val = progressoRef.current[i] || 0
        indicatorRef.current.style.transform = `translateX(-${100 - val}%)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [i, cicloRapido, progressoRef])

  if (cicloRapido) {
    return (
      <div data-slot="progress" className="bg-primary/20 relative h-2 w-full overflow-hidden rounded-full">
        <div data-slot="progress-indicator" className="h-full w-full flex-1 bg-green-700 dark:bg-green-600 opacity-90 transition-none" style={{ transform: 'translateX(0%)' }} />
      </div>
    )
  }

  return (
    <div data-slot="progress" className="bg-primary/20 relative h-2 w-full overflow-hidden rounded-full">
      <div data-slot="progress-indicator" ref={indicatorRef} className="bg-primary h-full w-full flex-1 transition-none" />
    </div>
  )
})

// ----------------------------------------------------------------------
// GeneratorCard: Componente memoizado do Card
// Não re-renderiza se as props relevantes forem as mesmas
// ----------------------------------------------------------------------
interface GeneratorCardProps {
  i: number;
  estaBloqueado: boolean;
  podeComprar: boolean;
  custoRawStr: string;
  interval: number;
  cicloRapido: boolean;
  produz: string;
  mostraBotaoComprar: boolean;
  mult: number;
  countGen: number;
  progressInTier: number;
  tierGoal: number;
  progressToNext: number;
  ptsForNext: number;
  nextThreshold: number;
  totalIsGteCusto: boolean;
  onBuy: (i: number) => void;
  formatDecimal: (val: Decimal) => string;
  progressoRef: React.MutableRefObject<number[]>;
}

const GeneratorCard = memo(({
  i,
  estaBloqueado,
  podeComprar,
  custoRawStr,
  interval,
  cicloRapido,
  produz,
  mostraBotaoComprar,
  mult,
  countGen,
  progressInTier,
  tierGoal,
  progressToNext,
  ptsForNext,
  nextThreshold,
  totalIsGteCusto,
  onBuy,
  formatDecimal,
  progressoRef
}: GeneratorCardProps) => {

  const { t } = useTranslation()
  const handleBuy = useCallback(() => {
    if (podeComprar) {
      playClickSound()
      onBuy(i)
    }
  }, [podeComprar, onBuy, i])

  if (estaBloqueado) {
    return (
      <Card
        className={`py-4 px-6 cursor-pointer transition-colors ${podeComprar ? "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" : "cursor-not-allowed opacity-70"}`}
        onClick={handleBuy}
        onKeyDown={(e) => {
          if (podeComprar && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            handleBuy()
          }
        }}
        role="button"
        tabIndex={podeComprar ? 0 : -1}
      >
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div className="flex flex-col gap-0.5 text-center">
            <span className="font-semibold text-lg">{t("generators.generatorN", { n: i + 1 })}</span>
            <span className="text-muted-foreground text-sm">{t("generators.unlockToProduce")}</span>
          </div>
          <div className="h-10 w-px bg-border shrink-0" aria-hidden />
          <div className="flex flex-col gap-0.5 text-center">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">{t("generators.costToUnlock")}</span>
            <div className="flex flex-col items-center">
              <span className={`font-mono text-sm tabular-nums font-semibold ${totalIsGteCusto ? "text-green-600 dark:text-green-500" : "text-destructive"}`}>
                {formatDecimal(new Decimal(custoRawStr))} {t("generators.fragments")}
              </span>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="py-3 px-4">
      <div className="grid items-center gap-y-3 min-w-0" style={{ gridTemplateColumns: "minmax(0,0.5fr) minmax(0,0.55fr) minmax(0,1.2fr) minmax(0,1.65fr) minmax(0,0.75fr) minmax(0,0.45fr)", columnGap: "1.25rem", rowGap: "0.75rem" }}>
        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
          <span className="font-semibold leading-tight text-sm truncate">{t("generators.generatorN", { n: i + 1 })}</span>
          <span className="text-muted-foreground text-[10px] uppercase truncate">{t("generators.generatorN", { n: i + 1 })}</span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
          <span className="font-mono text-sm tabular-nums leading-tight break-all">
            {formatDecimal(new Decimal(countGen))}
          </span>
          <span className="text-muted-foreground text-[10px] uppercase">{t("generators.quantity")}</span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col gap-0.5 min-w-0 max-w-[14rem] cursor-help mt-0.5 pt-0.5 pl-2">
              <div className="flex items-center w-full">
                <Progress value={progressToNext} className="h-1.5 w-full bg-muted/50" />
              </div>
              <div className="flex justify-between items-center w-full mt-1.5">
                <span className="text-muted-foreground text-[10px] uppercase truncate">{t("generators.milestone")}</span>
                <span className="text-muted-foreground text-[10px] uppercase shrink-0">+{ptsForNext} pts</span>
              </div>
            </div>
          </TooltipTrigger>

          <TooltipContent side="top" className="w-[220px] p-0" sideOffset={8}>
            <div className="flex flex-col gap-1.5 px-3 py-2.5 w-full">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("generators.milestoneProgress")}</span>
                <span className="font-mono text-sm tabular-nums leading-none">
                  {formatDecimal(new Decimal(progressInTier))} / {formatDecimal(new Decimal(tierGoal))} <span className="text-green-600 dark:text-green-500 ml-1">(+{ptsForNext} pts)</span>
                </span>
              </div>
              <div className="h-px bg-border my-0.5" aria-hidden="true" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("generators.totalGenerators")}</span>
                <span className="font-mono text-sm tabular-nums leading-none">
                  {formatDecimal(new Decimal(countGen))} / {formatDecimal(new Decimal(nextThreshold))}
                </span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
        <div className="flex flex-col gap-0.5 min-w-0 mt-0.5 pt-0.5 pl-2">
          <div className="h-1.5 w-full max-w-[20rem] overflow-hidden rounded-full">
            <CycleProgressBar i={i} cicloRapido={cicloRapido} progressoRef={progressoRef} />
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full max-w-[20rem] mt-1.5 gap-2 min-w-0">
            <span className="font-mono text-[10px] tabular-nums text-left truncate">
              {cicloRapido ? "1s" : formatTime(interval)}
            </span>
            <span className="text-muted-foreground text-[10px] uppercase text-center px-1">
              {cicloRapido ? t("generators.continuous") : t("generators.cycle")}
            </span>
            <span className="font-mono text-[10px] tabular-nums text-right min-w-0 truncate block">
              +{formatDecimal(new Decimal(countGen * mult).times(cicloRapido ? 1 / interval : 1))}{" "}{produz}{cicloRapido ? "/s" : ""}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 pl-2">
          {mostraBotaoComprar ? (
            <>
              <div className="flex items-baseline gap-2 whitespace-nowrap">
                <span className={`font-mono text-sm tabular-nums leading-tight ${totalIsGteCusto ? "text-foreground font-semibold" : "text-destructive font-semibold"}`}>
                  {formatDecimal(new Decimal(custoRawStr))} {t("generators.fragments")}
                </span>
              </div>
              <span className="text-muted-foreground text-[10px] uppercase tracking-tight">{t("generators.price")}</span>
            </>
          ) : (
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs italic">{t("generators.generatedAutomatically")}</span>
              <span className="text-muted-foreground text-[10px] uppercase tracking-tight opacity-0">{t("generators.price")}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 items-center justify-center pl-2">
          {mostraBotaoComprar ? (
            <Button
              size="sm"
              className="w-auto min-w-[5.5rem] py-2 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleBuy}
              disabled={!podeComprar}
            >
              {t("generators.buy")}
            </Button>
          ) : (
            <span className="w-auto min-w-[5.5rem] inline-flex items-center justify-center rounded-md border border-border bg-muted px-3 py-2 min-h-[2.25rem] text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {t("generators.automatic")}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}, (prev, next) => {
  return (
    prev.estaBloqueado === next.estaBloqueado &&
    prev.podeComprar === next.podeComprar &&
    prev.custoRawStr === next.custoRawStr &&
    prev.interval === next.interval &&
    prev.cicloRapido === next.cicloRapido &&
    prev.produz === next.produz &&
    prev.mostraBotaoComprar === next.mostraBotaoComprar &&
    prev.mult === next.mult &&
    prev.countGen === next.countGen &&
    prev.progressInTier === next.progressInTier &&
    prev.tierGoal === next.tierGoal &&
    prev.progressToNext === next.progressToNext &&
    prev.ptsForNext === next.ptsForNext &&
    prev.nextThreshold === next.nextThreshold &&
    prev.totalIsGteCusto === next.totalIsGteCusto
  )
})

export function GeneratorsPage() {
  const { t } = useTranslation()
  const ctx = useContext(GameContext)

  // Usar ref mutavel para funcoes de callback do contexto para não invalidar memo a toa
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx

  const handleBuy = useCallback((i: number) => {
    ctxRef.current?.comprarGerador(i)
  }, [])

  if (!ctx) return null

  const {
    total,
    geradores,
    upgrades,
    formatDecimal,
    podeComprar,
    custoGerador,
    intervaloEfetivo,
    NUM_GERADORES,
    milestonesReached,
    progressoRef,
  } = ctx

  return (
    <section className="w-full space-y-3">
      {(() => {
        const ultimoComUnidade = geradores.reduce((max, g, idx) => (g >= 1 ? idx : max), -1)
        const ateIndice = Math.min(ultimoComUnidade + 1, NUM_GERADORES - 1)
        return Array.from({ length: ateIndice + 1 }, (_, i) => i)
      })().map((i) => {
        const estaBloqueado = geradores[i] === 0
        const canBuy = podeComprar(i)
        const custoDecimal = custoGerador(i)
        const totalIsGteCusto = total.gte(custoDecimal)
        const custoRawStr = custoDecimal.toString()

        if (estaBloqueado) {
          return (
            <GeneratorCard
              key={i}
              i={i}
              estaBloqueado={true}
              podeComprar={canBuy}
              custoRawStr={custoRawStr}
              totalIsGteCusto={totalIsGteCusto}
              onBuy={handleBuy}
              formatDecimal={formatDecimal}
              progressoRef={progressoRef}
              // placeholders passados obrigatorios
              interval={0} cicloRapido={false} produz={""} mostraBotaoComprar={false}
              mult={0} countGen={0} progressInTier={0} tierGoal={0} progressToNext={0}
              ptsForNext={0} nextThreshold={0}
            />
          )
        }

        const interval = intervaloEfetivo(i)
        const cicloRapido = interval <= 1
        const produz = i === 0 ? t("generators.resource") : t("generators.generatorN", { n: i })
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
          <GeneratorCard
            key={i}
            i={i}
            estaBloqueado={false}
            podeComprar={canBuy}
            custoRawStr={custoRawStr}
            totalIsGteCusto={totalIsGteCusto}
            interval={interval}
            cicloRapido={cicloRapido}
            produz={produz}
            mostraBotaoComprar={mostraBotaoComprar}
            mult={mult}
            countGen={countGen}
            progressInTier={progressInTier}
            tierGoal={tierGoal}
            progressToNext={progressToNext}
            ptsForNext={ptsForNext}
            nextThreshold={nextThreshold}
            onBuy={handleBuy}
            formatDecimal={formatDecimal}
            progressoRef={progressoRef}
          />
        )
      })}
    </section>
  )
}
