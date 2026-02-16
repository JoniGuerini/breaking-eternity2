import { useEffect, useRef, useState } from "react"
import Decimal from "break_eternity.js"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const NUM_GERADORES = 100
const SAVE_KEY = "breaking-eternity-save"
const SAVE_INTERVAL_MS = 5000
const MAX_OFFLINE_SECONDS = 7 * 24 * 3600 // 7 dias (simulação em passos de 1s)

// Intervalo em segundos: gerador i leva (3 + i) segundos por ciclo
function intervaloGerador(i: number): number {
  return 3 + i
}

interface SavedState {
  total: string
  geradores: number[]
  jaColetouManual: boolean
  lastSaveTime: number
}

/** Simula produção offline por `seconds` segundos; retorna novo total, novos geradores e ganho no recurso principal */
function simulateOffline(
  total: Decimal,
  geradores: number[],
  seconds: number
): { total: Decimal; geradores: number[]; totalGain: Decimal } {
  const capped = Math.min(seconds, MAX_OFFLINE_SECONDS)
  let curTotal = new Decimal(total)
  const curGen = [...geradores]
  const acumulado = Array(NUM_GERADORES).fill(0)
  for (let t = 0; t < capped; t++) {
    for (let i = 0; i < NUM_GERADORES; i++) {
      const count = curGen[i]
      const interval = intervaloGerador(i)
      if (count > 0) {
        acumulado[i] += 1
        while (acumulado[i] >= interval) {
          acumulado[i] -= interval
          if (i === 0) {
            curTotal = Decimal.add(curTotal, count)
          } else {
            curGen[i - 1] += count
          }
        }
      }
    }
  }
  const totalGain = Decimal.sub(curTotal, total)
  return { total: curTotal, geradores: curGen, totalGain }
}

// Custo base do gerador i: 10^i (gerador 0 = 1, 1 = 10, 2 = 100, ...)
function custoBase(i: number): Decimal {
  return Decimal.pow(10, i)
}

// Limites: 2 letras (AA–ZZ), depois 3 (AAA–ZZZ), 4 (AAAA–ZZZZ), 5 (AAAAA–ZZZZZ)
const LIMIT_2 = 26 ** 2                    // 0 .. 675
const LIMIT_3 = LIMIT_2 + 26 ** 3         // 676 .. 18251
const LIMIT_4 = LIMIT_3 + 26 ** 4         // 18252 .. 475227
const LIMIT_5 = LIMIT_4 + 26 ** 5         // 475228 .. 12356603

/** Converte índice local (0 até 26^n - 1) em string de n letras */
function indexToLetters(localIndex: number, numLetters: number): string {
  let s = ""
  for (let i = 0; i < numLetters; i++) {
    s = String.fromCharCode(65 + (localIndex % 26)) + s
    localIndex = Math.floor(localIndex / 26)
  }
  return s
}

/** Formata número: 1.000, 1 M, 1 B, 1 T, 1 Q, depois 1 AAAAA ... 999 ZZZZZ, além disso notação científica */
function formatDecimal(d: Decimal): string {
  if (d.lt(0)) return "-" + formatDecimal(d.neg())
  if (d.eq(0)) return "0"

  const n = d.toNumber()
  if (!Number.isFinite(n)) {
    return d.toStringWithDecimalPlaces(2)
  }

  if (n < 1000) {
    return Math.floor(n).toString()
  }

  if (n < 1e6) {
    return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  const exp = Math.floor(Math.log10(n))
  const mantissa = n / Math.pow(10, exp)
  const remainder = exp % 3
  const displayMantissa = mantissa * Math.pow(10, remainder)
  const rounded = Math.round(displayMantissa * 100) / 100
  const mantissaStr =
    rounded % 1 === 0
      ? rounded.toString()
      : rounded.toFixed(2).replace(/\.?0+$/, "")

  if (exp < 9) return mantissaStr + " M"
  if (exp < 12) return mantissaStr + " B"
  if (exp < 15) return mantissaStr + " T"
  if (exp < 18) return mantissaStr + " Q"

  // A partir de 10^18: 2 letras (1 AA .. 1 ZZ), depois 3 (1 AAA .. 1 ZZZ), 4, 5; acima → notação científica
  const index = Math.floor((exp - 18) / 3)
  if (index >= LIMIT_5) {
    return d.toStringWithDecimalPlaces(2)
  }
  let numLetters: number
  let localIndex: number
  if (index < LIMIT_2) {
    numLetters = 2
    localIndex = index
  } else if (index < LIMIT_3) {
    numLetters = 3
    localIndex = index - LIMIT_2
  } else if (index < LIMIT_4) {
    numLetters = 4
    localIndex = index - LIMIT_3
  } else {
    numLetters = 5
    localIndex = index - LIMIT_4
  }
  const letters = indexToLetters(localIndex, numLetters)
  return mantissaStr + " " + letters
}

function loadSavedState(): SavedState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SavedState
    if (!data.total || !Array.isArray(data.geradores) || data.geradores.length !== NUM_GERADORES) return null
    return data
  } catch {
    return null
  }
}

function App() {
  const [total, setTotal] = useState<Decimal>(() => {
    const saved = loadSavedState()
    if (!saved) return new Decimal(0)
    try {
      return Decimal.fromString(saved.total)
    } catch {
      return new Decimal(0)
    }
  })
  const [geradores, setGeradores] = useState<number[]>(() => {
    const saved = loadSavedState()
    if (!saved) return Array(NUM_GERADORES).fill(0)
    return saved.geradores
  })
  const [progresso, setProgresso] = useState<number[]>(() =>
    Array(NUM_GERADORES).fill(0)
  )
  const [jaColetouManual, setJaColetouManual] = useState(() => {
    const saved = loadSavedState()
    return saved?.jaColetouManual ?? false
  })
  const [fps, setFps] = useState(0)
  const [offlineCard, setOfflineCard] = useState<{
    totalGain: Decimal
    seconds: number
  } | null>(null)
  const ultimoTick = useRef(performance.now())
  const acumuladoRef = useRef<number[]>(Array(NUM_GERADORES).fill(0))
  const geradoresRef = useRef<number[]>(Array(NUM_GERADORES).fill(0))
  const totalRef = useRef<Decimal>(new Decimal(0))
  const jaColetouManualRef = useRef(false)
  const framesRef = useRef(0)
  const fpsIntervalRef = useRef(performance.now())

  useEffect(() => {
    geradoresRef.current = geradores
  }, [geradores])
  useEffect(() => {
    totalRef.current = total
  }, [total])
  useEffect(() => {
    jaColetouManualRef.current = jaColetouManual
  }, [jaColetouManual])

  function persistSave() {
    const payload: SavedState = {
      total: totalRef.current.toString(),
      geradores: geradoresRef.current,
      jaColetouManual: jaColetouManualRef.current,
      lastSaveTime: Date.now(),
    }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
    } catch {
      // storage cheio ou indisponível
    }
  }

  // Carregar save e aplicar ganho offline ao abrir o jogo
  useEffect(() => {
    const saved = loadSavedState()
    if (!saved?.lastSaveTime) return
    const offlineSeconds = (Date.now() - saved.lastSaveTime) / 1000
    if (offlineSeconds < 5) return
    try {
      const totalAntes = Decimal.fromString(saved.total)
      const result = simulateOffline(totalAntes, saved.geradores, offlineSeconds)
      setTotal(result.total)
      setGeradores(result.geradores)
      geradoresRef.current = result.geradores
      setOfflineCard({ totalGain: result.totalGain, seconds: offlineSeconds })
    } catch {
      // ignora erro e mantém estado carregado
    }
  }, [])

  // Salvar a cada 5 segundos e ao fechar/sair da aba (refs têm sempre o estado atual)
  useEffect(() => {
    const interval = setInterval(persistSave, SAVE_INTERVAL_MS)
    const onBeforeUnload = () => {
      persistSave()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    const timeout = setTimeout(persistSave, 1000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
      window.removeEventListener("beforeunload", onBeforeUnload)
    }
  }, [])

  useEffect(() => {
    let id: number
    const tick = (now: number) => {
      const dt = (now - ultimoTick.current) / 1000
      ultimoTick.current = now
      framesRef.current += 1
      if (now - fpsIntervalRef.current >= 500) {
        setFps(
          Math.round(
            (framesRef.current * 1000) / (now - fpsIntervalRef.current)
          )
        )
        framesRef.current = 0
        fpsIntervalRef.current = now
      }

      const current = geradoresRef.current
      const acumulado = acumuladoRef.current
      let deltaTotal = new Decimal(0)
      const deltaGen = Array(NUM_GERADORES).fill(0)
      const newProgresso = [...progresso]

      for (let i = 0; i < NUM_GERADORES; i++) {
        const count = current[i]
        const interval = intervaloGerador(i)
        if (count > 0) {
          acumulado[i] += dt
          while (acumulado[i] >= interval) {
            acumulado[i] -= interval
            if (i === 0) {
              deltaTotal = deltaTotal.add(count)
            } else {
              deltaGen[i - 1] += count
            }
          }
          newProgresso[i] = Math.min(
            100,
            (acumulado[i] / interval) * 100
          )
        } else {
          acumulado[i] = 0
          newProgresso[i] = 0
        }
      }

      setProgresso(newProgresso)
      if (deltaTotal.gt(0)) {
        setTotal((t) => Decimal.add(t, deltaTotal))
      }
      if (deltaGen.some((d) => d > 0)) {
        setGeradores((prev) => {
          const next = prev.map((g, i) => g + deltaGen[i])
          geradoresRef.current = next
          return next
        })
      }

      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])

  const custoGerador = (i: number): Decimal =>
    custoBase(i).times(Decimal.pow(1.5, geradores[i])).floor()

  const podeComprar = (i: number) => total.gte(custoGerador(i))

  const comprarGerador = (i: number) => {
    const custo = custoGerador(i)
    if (!total.gte(custo)) return
    setTotal((t) => Decimal.sub(t, custo))
    setGeradores((prev) => {
      const next = [...prev]
      next[i] += 1
      return next
    })
  }

  function formatOfflineTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} h`
    return `${(seconds / 86400).toFixed(1)} dias`
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {offlineCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" aria-modal="true" role="dialog">
          <Card className="max-w-sm w-full p-6 space-y-4">
            <h2 className="font-semibold text-lg">Ganho offline</h2>
            <p className="text-muted-foreground text-sm">
              Você ganhou <span className="font-mono font-semibold text-foreground">{formatDecimal(offlineCard.totalGain)}</span> enquanto estava offline.
            </p>
            <p className="text-muted-foreground text-xs">
              Tempo ausente: {formatOfflineTime(offlineCard.seconds)}
            </p>
            <Button
              className="w-full"
              onClick={() => setOfflineCard(null)}
            >
              OK
            </Button>
          </Card>
        </div>
      )}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex flex-col min-w-0 flex-1">
          <h1 className="text-lg font-semibold tracking-tight truncate">
            Breaking Eternity
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-2xl font-mono tabular-nums break-all">
              {formatDecimal(total)}
            </p>
            {total.lt(1) && !jaColetouManual && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    setTotal((t) => Decimal.add(t, 1))
                    setJaColetouManual(true)
                  }}
                >
                  Clique para +1
                </Button>
                <span className="text-muted-foreground text-xs">
                  Colete 1 para comprar o primeiro gerador.
                </span>
              </>
            )}
          </div>
        </div>
        <span className="text-muted-foreground text-sm font-mono shrink-0">
          {fps} FPS
        </span>
      </header>

      <main className="flex-1 overflow-auto px-4 py-4 md:px-6">
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
                      +{formatDecimal(new Decimal(geradores[i]))}
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
      </main>
    </div>
  )
}

export default App
