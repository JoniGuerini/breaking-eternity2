import { useEffect, useRef, useState } from "react"
import { BrowserRouter, NavLink, Route, Routes, useLocation } from "react-router-dom"
import Decimal from "break_eternity.js"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { GameContext, type GameContextValue } from "@/context/GameContext"
import { supabase } from "@/lib/supabase"
import { playAchievementSound, playClickSound } from "@/lib/clickSound"
import { ProgressoProvider } from "@/context/ProgressoContext"
import { ShortcutHandler } from "@/components/ShortcutHandler"
import { ScrollToTop } from "@/components/ScrollToTop"
import { CustomContextMenu } from "@/components/CustomContextMenu"
import { ACHIEVEMENTS, filterValidAchievementIds, getNewlyUnlockedAchievementIds } from "@/lib/achievements"
import { AchievementsPage } from "@/pages/AchievementsPage"
import { GeneratorsPage } from "@/pages/GeneratorsPage"
import { ImprovementsPage } from "@/pages/ImprovementsPage"
import { EstatisticasPage } from "@/pages/EstatisticasPage"
import { LoginPage } from "@/pages/LoginPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

/** Na página de conquistas trava o layout em 100vh para o documento não rolar; só a lista rola. */
function RootLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isConquistas = location.pathname === "/conquistas"
  return (
    <div
      className={
        "scroll-overlay bg-background text-foreground flex flex-col select-none " +
        (isConquistas ? "h-screen overflow-hidden" : "min-h-screen")
      }
    >
      {children}
    </div>
  )
}

/** Envolve o main e o conteúdo; na página de conquistas desativa rolagem aqui (só a lista interna rola). */
function MainWithScrollBehavior({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isConquistas = location.pathname === "/conquistas"
  return (
    <main className="scroll-overlay flex-1 min-h-0 flex flex-col overflow-hidden px-4 py-4 md:px-6">
      <div
        className={
          "flex-1 flex flex-col min-h-0 " +
          (isConquistas ? "overflow-hidden" : "overflow-auto")
        }
      >
        {children}
      </div>
    </main>
  )
}

const NUM_GERADORES = 100
const SAVE_KEY = "breaking-eternity-save"
const SAVE_INTERVAL_MS = 5000
const MAX_OFFLINE_SECONDS = 7 * 24 * 3600 // 7 dias (simulação em passos de 1s)
/** Se o tick demorar mais que isso em tempo real (tela bloqueada, tampa fechada, aba em segundo plano), aplicamos catch-up com simulação offline. */
const PAUSE_THRESHOLD_SECONDS = 3

// Intervalo base em segundos: gerador 1 = 3s, cada tier dobra (2 → 6s, 3 → 12s, 4 → 24s...).
function intervaloGerador(i: number): number {
  return 3 * Math.pow(2, i)
}

const MIN_INTERVALO = 0.1 // ciclo mínimo (melhoria de velocidade)

/** Redução de intervalo por nível de velocidade: 10% a menos por nível (multiplicativo). */
const VELOCIDADE_REDUCAO_POR_NIVEL = 0.9 // 0.9 = 10% a menos

/** Intervalo efetivo após melhoria de velocidade: cada nível reduz 10% do tempo, mínimo 0,1s */
function intervaloEfetivo(i: number, speedLevel: number): number {
  const base = intervaloGerador(i)
  return Math.max(MIN_INTERVALO, base * Math.pow(VELOCIDADE_REDUCAO_POR_NIVEL, speedLevel))
}

/** Chance de produzir o dobro por nível da melhoria "Sorte" (ex.: 0,02 = 2% por nível) */
const CHANCE_CRIT_POR_NIVEL = 0.02

/** Multiplicador da sorte quando dá crítico: nível 0 = 2x, 1 = 3x, 2 = 4x... */
const LUCK_MULT_BASE = 2
function luckCritMultiplier(level: number): number {
  return LUCK_MULT_BASE + level
}

interface SavedState {
  total: string
  geradores: number[]
  jaColetouManual: boolean
  lastSaveTime: number
  upgrades?: number[]
  speedUpgrades?: number[]
  luckUpgrades?: number[]
  luckMultiplierUpgrades?: number[]
  globalProductionLevel?: number
  globalSpeedLevel?: number
  globalPriceReductionLevel?: number
  autoUnlockNextGerador?: boolean
  showFpsCounter?: boolean
  generatorUnlockTimestamps?: number[]
  generatorBonusCount?: number[]
  totalProducedLifetime?: string
  totalPlayTimeSeconds?: number
  firstPlayTime?: number
  lastSessionStart?: number
  geradoresCompradosManual?: number
  achievementsUnlocked?: string[]
}

/** Chance de crítico (dobro) para gerador i com nível da melhoria Sorte */
function chanceCrit(luckLevel: number): number {
  return Math.min(1, luckLevel * CHANCE_CRIT_POR_NIVEL)
}

/** Simula produção offline por `seconds` segundos; retorna novo total, novos geradores, ganho e quantas vezes cada gerador deu bônus (sorte). */
function simulateOffline(
  total: Decimal,
  geradores: number[],
  seconds: number,
  upgrades: number[] = [],
  speedUpgrades: number[] = [],
  luckUpgrades: number[] = [],
  luckMultiplierUpgrades: number[] = [],
  globalProductionLevel = 0,
  globalSpeedLevel = 0
): { total: Decimal; geradores: number[]; totalGain: Decimal; bonusCountDelta: number[] } {
  const capped = Math.min(seconds, MAX_OFFLINE_SECONDS)
  let curTotal = new Decimal(total)
  const curGen = [...geradores]
  const acumulado = Array(NUM_GERADORES).fill(0)
  const bonusCountDelta = Array(NUM_GERADORES).fill(0)
  const globalProdMult = Math.pow(2, globalProductionLevel)
  const mult = (i: number) => Math.pow(2, upgrades[i] ?? 0) * globalProdMult
  const interval = (i: number) => intervaloEfetivo(i, (speedUpgrades[i] ?? 0) + globalSpeedLevel)
  for (let t = 0; t < capped; t++) {
    for (let i = 0; i < NUM_GERADORES; i++) {
      const count = curGen[i]
      const iv = interval(i)
      if (count > 0) {
        acumulado[i] += 1
        while (acumulado[i] >= iv) {
          acumulado[i] -= iv
          let qty = count * mult(i)
          const luckLvl = luckUpgrades[i] ?? 0
          const luckMultLvl = luckMultiplierUpgrades[i] ?? 0
          if (luckLvl > 0 && Math.random() < chanceCrit(luckLvl)) {
            qty *= luckCritMultiplier(luckMultLvl)
            bonusCountDelta[i] += 1
          }
          qty = Math.floor(qty)
          if (i === 0) {
            curTotal = Decimal.add(curTotal, qty)
          } else {
            curGen[i - 1] += qty
          }
        }
      }
    }
  }
  const totalGain = Decimal.sub(curTotal, total)
  return { total: curTotal, geradores: curGen, totalGain, bonusCountDelta }
}

// Custo base: Gerador 1 = 1; cada tier custa 100x mais que o anterior (10^(2*i))
// G1=1, G2=100, G3=10.000, G4=1.000.000, G5=10^8, ...
function custoBase(i: number): Decimal {
  return Decimal.pow(10, 2 * i)
}

/** Multiplicador de preço pós-desbloqueio: cada nível global reduz 5% (0.95^nível); só afeta compras quando gerador já está desbloqueado */
function globalPriceMultiplier(level: number): number {
  return level <= 0 ? 1 : Math.pow(0.95, level)
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

function AppContent() {
  const auth = useAuth()
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
  const [jaColetouManual, setJaColetouManual] = useState(() => {
    const saved = loadSavedState()
    return saved?.jaColetouManual ?? false
  })
  const [upgrades, setUpgrades] = useState<number[]>(() => {
    const saved = loadSavedState()
    if (saved?.upgrades && Array.isArray(saved.upgrades) && saved.upgrades.length === NUM_GERADORES)
      return saved.upgrades.map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : Number(v)))
    return Array(NUM_GERADORES).fill(0)
  })
  const [speedUpgrades, setSpeedUpgrades] = useState<number[]>(() => {
    const saved = loadSavedState()
    if (saved?.speedUpgrades && Array.isArray(saved.speedUpgrades) && saved.speedUpgrades.length === NUM_GERADORES)
      return saved.speedUpgrades.map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : Number(v)))
    return Array(NUM_GERADORES).fill(0)
  })
  const [luckUpgrades, setLuckUpgrades] = useState<number[]>(() => {
    const saved = loadSavedState()
    if (saved?.luckUpgrades && Array.isArray(saved.luckUpgrades) && saved.luckUpgrades.length === NUM_GERADORES)
      return saved.luckUpgrades.map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : Number(v)))
    return Array(NUM_GERADORES).fill(0)
  })
  const [luckMultiplierUpgrades, setLuckMultiplierUpgrades] = useState<number[]>(() => {
    const saved = loadSavedState()
    if (saved?.luckMultiplierUpgrades && Array.isArray(saved.luckMultiplierUpgrades) && saved.luckMultiplierUpgrades.length === NUM_GERADORES)
      return saved.luckMultiplierUpgrades.map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : Number(v)))
    return Array(NUM_GERADORES).fill(0)
  })
  const [globalProductionLevel, setGlobalProductionLevel] = useState(() => {
    const saved = loadSavedState()
    const v = saved?.globalProductionLevel
    return typeof v === "number" && v >= 0 ? v : 0
  })
  const [globalSpeedLevel, setGlobalSpeedLevel] = useState(() => {
    const saved = loadSavedState()
    const v = saved?.globalSpeedLevel
    return typeof v === "number" && v >= 0 ? v : 0
  })
  const [globalPriceReductionLevel, setGlobalPriceReductionLevel] = useState(() => {
    const saved = loadSavedState()
    const v = saved?.globalPriceReductionLevel
    return typeof v === "number" && v >= 0 ? v : 0
  })
  const [autoUnlockNextGerador, setAutoUnlockNextGerador] = useState(() => {
    const saved = loadSavedState()
    return saved?.autoUnlockNextGerador ?? false
  })
  const [fps, setFps] = useState(0)
  const [showFpsCounter, setShowFpsCounter] = useState(() => {
    const saved = loadSavedState()
    return saved?.showFpsCounter === true
  })
  const [generatorUnlockTimestamps, setGeneratorUnlockTimestamps] = useState<number[]>(() => {
    const saved = loadSavedState()
    const arr = saved?.generatorUnlockTimestamps
    if (arr && Array.isArray(arr) && arr.length >= NUM_GERADORES) return arr.slice(0, NUM_GERADORES).map((v) => Number(v) || 0)
    return Array(NUM_GERADORES).fill(0)
  })
  const [generatorBonusCount, setGeneratorBonusCount] = useState<number[]>(() => {
    const saved = loadSavedState()
    const arr = saved?.generatorBonusCount
    if (arr && Array.isArray(arr) && arr.length >= NUM_GERADORES) return arr.slice(0, NUM_GERADORES).map((v) => Number(v) || 0)
    return Array(NUM_GERADORES).fill(0)
  })
  const [totalProducedLifetime, setTotalProducedLifetime] = useState<Decimal>(() => {
    const saved = loadSavedState()
    if (!saved?.totalProducedLifetime) return new Decimal(0)
    try {
      return Decimal.fromString(saved.totalProducedLifetime)
    } catch {
      return new Decimal(0)
    }
  })
  const [totalPlayTimeSeconds, setTotalPlayTimeSeconds] = useState(() => {
    const saved = loadSavedState()
    let sec = saved?.totalPlayTimeSeconds ?? 0
    if (saved?.lastSessionStart) sec += (Date.now() - saved.lastSessionStart) / 1000
    return Math.floor(sec)
  })
  const [firstPlayTime, setFirstPlayTime] = useState<number | null>(() => loadSavedState()?.firstPlayTime ?? null)
  const [geradoresCompradosManual, setGeradoresCompradosManual] = useState(() => loadSavedState()?.geradoresCompradosManual ?? 0)
  const initialAchievementsRef = useRef<string[] | null>(null)
  if (initialAchievementsRef.current === null) {
    initialAchievementsRef.current = filterValidAchievementIds(loadSavedState()?.achievementsUnlocked ?? [])
  }
  const [achievementsUnlocked, setAchievementsUnlocked] = useState<string[]>(() => initialAchievementsRef.current ?? [])
  const achievementsUnlockedRef = useRef<string[]>(initialAchievementsRef.current ?? [])
  const [offlineCard, setOfflineCard] = useState<{
    totalGain: Decimal
    seconds: number
  } | null>(null)
  const ultimoTick = useRef(0)
  const lastTickWallTimeRef = useRef(Date.now())
  const acumuladoRef = useRef<number[]>(Array(NUM_GERADORES).fill(0))
  const geradoresRef = useRef<number[]>(Array(NUM_GERADORES).fill(0))
  const totalRef = useRef<Decimal>(new Decimal(0))
  const totalProducedLifetimeRef = useRef<Decimal>(new Decimal(0))
  const lastSessionStartRef = useRef(Date.now())
  const totalPlayTimeSecondsRef = useRef(0)
  const geradoresCompradosManualRef = useRef(0)
  const jaColetouManualRef = useRef(false)
  const upgradesRef = useRef<number[]>(Array(NUM_GERADORES).fill(0))
  const speedUpgradesRef = useRef<number[]>(Array(NUM_GERADORES).fill(0))
  const luckUpgradesRef = useRef<number[]>(Array(NUM_GERADORES).fill(0))
  const luckMultiplierUpgradesRef = useRef<number[]>(Array(NUM_GERADORES).fill(0))
  const globalProductionLevelRef = useRef(0)
  const globalSpeedLevelRef = useRef(0)
  const globalPriceReductionLevelRef = useRef(0)
  const generatorUnlockTimestampsRef = useRef<number[]>(Array(NUM_GERADORES).fill(0))
  const generatorBonusCountRef = useRef<number[]>(Array(NUM_GERADORES).fill(0))
  const firstPlayTimeRef = useRef<number | null>(null)
  const progressoRef = useRef<number[]>(Array(NUM_GERADORES).fill(0))
  const setProgressoStateRef = useRef<((v: number[]) => void) | null>(null)
  const autoUnlockNextGeradorRef = useRef(false)
  const framesRef = useRef(0)
  const fpsIntervalRef = useRef(0)
  const authUserIdRef = useRef<string | null>(null)
  const cloudSaveAppliedForRef = useRef<string | null>(null)

  useEffect(() => {
    authUserIdRef.current = auth?.user?.id ?? null
    if (!auth?.user?.id) cloudSaveAppliedForRef.current = null
  }, [auth?.user?.id])

  function applySave(payload: SavedState) {
    try {
      const geradoresArr = payload.geradores?.length === NUM_GERADORES ? payload.geradores : Array(NUM_GERADORES).fill(0)
      const upgradesArr = payload.upgrades?.length === NUM_GERADORES ? payload.upgrades : Array(NUM_GERADORES).fill(0)
      const speedArr = payload.speedUpgrades?.length === NUM_GERADORES ? payload.speedUpgrades : Array(NUM_GERADORES).fill(0)
      const luckArr = payload.luckUpgrades?.length === NUM_GERADORES ? payload.luckUpgrades : Array(NUM_GERADORES).fill(0)
      const luckMultArr = payload.luckMultiplierUpgrades?.length === NUM_GERADORES ? payload.luckMultiplierUpgrades : Array(NUM_GERADORES).fill(0)
      const tsArr = payload.generatorUnlockTimestamps?.length === NUM_GERADORES ? payload.generatorUnlockTimestamps : Array(NUM_GERADORES).fill(0)
      const bonusArr = payload.generatorBonusCount?.length === NUM_GERADORES ? payload.generatorBonusCount : Array(NUM_GERADORES).fill(0)
      const totalDec = Decimal.fromString(payload.total)
      const lifetimeDec = payload.totalProducedLifetime ? Decimal.fromString(payload.totalProducedLifetime) : new Decimal(0)
      const now = payload.lastSaveTime ?? Date.now()

      setTotal(totalDec)
      setGeradores(geradoresArr)
      setJaColetouManual(payload.jaColetouManual ?? false)
      setUpgrades(upgradesArr)
      setSpeedUpgrades(speedArr)
      setLuckUpgrades(luckArr)
      setLuckMultiplierUpgrades(luckMultArr)
      setGlobalProductionLevel(payload.globalProductionLevel ?? 0)
      setGlobalSpeedLevel(payload.globalSpeedLevel ?? 0)
      setGlobalPriceReductionLevel(payload.globalPriceReductionLevel ?? 0)
      setAutoUnlockNextGerador(payload.autoUnlockNextGerador ?? false)
      setShowFpsCounter(payload.showFpsCounter ?? false)
      setGeneratorUnlockTimestamps(tsArr)
      setGeneratorBonusCount(bonusArr)
      setTotalProducedLifetime(lifetimeDec)
      setTotalPlayTimeSeconds(payload.totalPlayTimeSeconds ?? 0)
      setFirstPlayTime(payload.firstPlayTime ?? null)
      setGeradoresCompradosManual(payload.geradoresCompradosManual ?? 0)
      setAchievementsUnlocked(filterValidAchievementIds(payload.achievementsUnlocked ?? []))

      totalRef.current = totalDec
      geradoresRef.current = geradoresArr
      jaColetouManualRef.current = payload.jaColetouManual ?? false
      upgradesRef.current = upgradesArr
      speedUpgradesRef.current = speedArr
      luckUpgradesRef.current = luckArr
      luckMultiplierUpgradesRef.current = luckMultArr
      globalProductionLevelRef.current = payload.globalProductionLevel ?? 0
      globalSpeedLevelRef.current = payload.globalSpeedLevel ?? 0
      globalPriceReductionLevelRef.current = payload.globalPriceReductionLevel ?? 0
      autoUnlockNextGeradorRef.current = payload.autoUnlockNextGerador ?? false
      generatorUnlockTimestampsRef.current = tsArr
      generatorBonusCountRef.current = bonusArr
      totalProducedLifetimeRef.current = lifetimeDec
      totalPlayTimeSecondsRef.current = payload.totalPlayTimeSeconds ?? 0
      geradoresCompradosManualRef.current = payload.geradoresCompradosManual ?? 0
      firstPlayTimeRef.current = payload.firstPlayTime ?? null
      achievementsUnlockedRef.current = filterValidAchievementIds(payload.achievementsUnlocked ?? [])
      lastSessionStartRef.current = now
    } catch {
      // ignora payload inválido
    }
  }

  useEffect(() => {
    if (!auth?.user?.id) return
    if (cloudSaveAppliedForRef.current === auth.user.id) return
    cloudSaveAppliedForRef.current = auth.user.id
    supabase
      .from("saves")
      .select("save_data")
      .eq("user_id", auth.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data?.save_data) return
        const raw = data.save_data as SavedState
        if (raw?.total && Array.isArray(raw.geradores) && raw.geradores.length === NUM_GERADORES) applySave(raw)
      })
  }, [auth?.user?.id])

  useEffect(() => {
    geradoresRef.current = geradores
  }, [geradores])
  useEffect(() => {
    totalRef.current = total
  }, [total])
  useEffect(() => {
    jaColetouManualRef.current = jaColetouManual
  }, [jaColetouManual])
  useEffect(() => {
    upgradesRef.current = upgrades
  }, [upgrades])
  useEffect(() => {
    speedUpgradesRef.current = speedUpgrades
  }, [speedUpgrades])
  useEffect(() => {
    luckUpgradesRef.current = luckUpgrades
  }, [luckUpgrades])
  useEffect(() => {
    luckMultiplierUpgradesRef.current = luckMultiplierUpgrades
  }, [luckMultiplierUpgrades])
  useEffect(() => {
    globalProductionLevelRef.current = globalProductionLevel
  }, [globalProductionLevel])
  useEffect(() => {
    globalSpeedLevelRef.current = globalSpeedLevel
  }, [globalSpeedLevel])
  useEffect(() => {
    globalPriceReductionLevelRef.current = globalPriceReductionLevel
  }, [globalPriceReductionLevel])
  useEffect(() => {
    generatorUnlockTimestampsRef.current = generatorUnlockTimestamps
  }, [generatorUnlockTimestamps])
  useEffect(() => {
    generatorBonusCountRef.current = generatorBonusCount
  }, [generatorBonusCount])
  useEffect(() => {
    firstPlayTimeRef.current = firstPlayTime
  }, [firstPlayTime])
  useEffect(() => {
    autoUnlockNextGeradorRef.current = autoUnlockNextGerador
  }, [autoUnlockNextGerador])
  useEffect(() => {
    totalProducedLifetimeRef.current = totalProducedLifetime
  }, [totalProducedLifetime])
  useEffect(() => {
    totalPlayTimeSecondsRef.current = totalPlayTimeSeconds
  }, [totalPlayTimeSeconds])
  useEffect(() => {
    geradoresCompradosManualRef.current = geradoresCompradosManual
  }, [geradoresCompradosManual])
  useEffect(() => {
    achievementsUnlockedRef.current = achievementsUnlocked
  }, [achievementsUnlocked])
  useEffect(() => {
    totalProducedLifetimeRef.current = totalProducedLifetime
    geradoresCompradosManualRef.current = geradoresCompradosManual
  }, [])

  function persistSave() {
    const now = Date.now()
    const elapsed = (now - lastSessionStartRef.current) / 1000
    totalPlayTimeSecondsRef.current = Math.floor(totalPlayTimeSecondsRef.current + elapsed)
    setTotalPlayTimeSeconds(totalPlayTimeSecondsRef.current)
    lastSessionStartRef.current = now
    const first = firstPlayTimeRef.current ?? now
    if (firstPlayTimeRef.current == null) {
      firstPlayTimeRef.current = now
      setFirstPlayTime(now)
    }

    const currentUnlocked = achievementsUnlockedRef.current
    const checkState = {
      total: totalRef.current,
      geradores: geradoresRef.current,
      upgrades: upgradesRef.current,
      speedUpgrades: speedUpgradesRef.current,
      totalProducedLifetime: totalProducedLifetimeRef.current,
      totalPlayTimeSeconds: totalPlayTimeSecondsRef.current,
      geradoresCompradosManual: geradoresCompradosManualRef.current,
      jaColetouManual: jaColetouManualRef.current,
    }
    const newly = getNewlyUnlockedAchievementIds(checkState, currentUnlocked)
    if (newly.length > 0) {
      const next = [...currentUnlocked, ...newly]
      achievementsUnlockedRef.current = next
      setAchievementsUnlocked(next)
      playAchievementSound()
      newly.forEach((id) => {
        const achievement = ACHIEVEMENTS.find((a) => a.id === id)
        if (achievement) {
          toast.success(achievement.name, {
            description: `${achievement.description}\n${achievement.points} pts`,
            position: "top-right",
          })
        }
      })
    }

    const payload: SavedState = {
      total: totalRef.current.toString(),
      geradores: geradoresRef.current,
      jaColetouManual: jaColetouManualRef.current,
      lastSaveTime: now,
      upgrades: upgradesRef.current,
      speedUpgrades: speedUpgradesRef.current,
      luckUpgrades: luckUpgradesRef.current,
      luckMultiplierUpgrades: luckMultiplierUpgradesRef.current,
      globalProductionLevel: globalProductionLevelRef.current,
      globalSpeedLevel: globalSpeedLevelRef.current,
      globalPriceReductionLevel: globalPriceReductionLevelRef.current,
      autoUnlockNextGerador: autoUnlockNextGeradorRef.current,
      showFpsCounter,
      generatorUnlockTimestamps: generatorUnlockTimestampsRef.current,
      generatorBonusCount: generatorBonusCountRef.current,
      totalProducedLifetime: totalProducedLifetimeRef.current.toString(),
      totalPlayTimeSeconds: totalPlayTimeSecondsRef.current,
      firstPlayTime: first,
      lastSessionStart: now,
      geradoresCompradosManual: geradoresCompradosManualRef.current,
      achievementsUnlocked: achievementsUnlockedRef.current,
    }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
      if (authUserIdRef.current) {
        supabase
          .from("saves")
          .upsert(
            { user_id: authUserIdRef.current, save_data: payload, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          )
          .then(() => {})
          .catch(() => {})
      }
    } catch {
      // storage cheio ou indisponível
    }
  }

  // Auto-desbloquear o próximo gerador (0 → 1) quando há recurso suficiente (independente do tick)
  useEffect(() => {
    if (!autoUnlockNextGerador) return
    const nextIndex = geradores.findIndex((g) => g === 0)
    if (nextIndex === -1) return
    const cost = custoBase(nextIndex)
      .times(Decimal.pow(1.5, geradores[nextIndex]))
      .floor()
    if (total.lt(cost)) return
    setGeneratorUnlockTimestamps((prev) => {
      const next = [...prev]
      if (next[nextIndex] === 0) next[nextIndex] = Date.now()
      return next
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intencional: aplicar desbloqueio ao estado
    setTotal((t) => Decimal.sub(t, cost))
    setGeradores((prev) => {
      const next = [...prev]
      next[nextIndex] = 1
      return next
    })
  }, [total, geradores, autoUnlockNextGerador])

  // Carregar save e aplicar ganho offline ao abrir o jogo
  useEffect(() => {
    const saved = loadSavedState()
    if (!saved?.lastSaveTime) return
    const offlineSeconds = (Date.now() - saved.lastSaveTime) / 1000
    if (offlineSeconds < 5) return
    try {
      const totalAntes = Decimal.fromString(saved.total)
      const savedUpgrades =
        saved.upgrades && saved.upgrades.length === NUM_GERADORES
          ? saved.upgrades.map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : Number(v)))
          : Array(NUM_GERADORES).fill(0)
      const savedSpeedUpgrades =
        saved.speedUpgrades && saved.speedUpgrades.length === NUM_GERADORES
          ? saved.speedUpgrades.map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : Number(v)))
          : Array(NUM_GERADORES).fill(0)
      const savedLuckUpgrades =
        saved.luckUpgrades && saved.luckUpgrades.length === NUM_GERADORES
          ? saved.luckUpgrades.map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : Number(v)))
          : Array(NUM_GERADORES).fill(0)
      const savedLuckMult =
        saved.luckMultiplierUpgrades && saved.luckMultiplierUpgrades.length === NUM_GERADORES
          ? saved.luckMultiplierUpgrades.map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : Number(v)))
          : Array(NUM_GERADORES).fill(0)
      const savedGlobalProd = typeof saved.globalProductionLevel === "number" && saved.globalProductionLevel >= 0 ? saved.globalProductionLevel : 0
      const savedGlobalSpeed = typeof saved.globalSpeedLevel === "number" && saved.globalSpeedLevel >= 0 ? saved.globalSpeedLevel : 0
      const result = simulateOffline(totalAntes, saved.geradores, offlineSeconds, savedUpgrades, savedSpeedUpgrades, savedLuckUpgrades, savedLuckMult, savedGlobalProd, savedGlobalSpeed)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intencional: aplicar save carregado
      setTotal(result.total)
      setGeradores(result.geradores)
      geradoresRef.current = result.geradores
      if (result.totalGain.gt(0)) {
        const saved = loadSavedState()
        const base = saved?.totalProducedLifetime
          ? Decimal.fromString(saved.totalProducedLifetime)
          : new Decimal(0)
        const newLifetime = base.add(result.totalGain)
        totalProducedLifetimeRef.current = newLifetime
        setTotalProducedLifetime(newLifetime)
      }
      setGeneratorBonusCount((prev) =>
        prev.map((c, i) => c + (result.bonusCountDelta[i] ?? 0))
      )
      generatorBonusCountRef.current = generatorBonusCountRef.current.map(
        (c, i) => c + (result.bonusCountDelta[i] ?? 0)
      )
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
      const wallNow = Date.now()
      const wallDt = (wallNow - lastTickWallTimeRef.current) / 1000
      if (ultimoTick.current !== 0 && wallDt > PAUSE_THRESHOLD_SECONDS) {
        const result = simulateOffline(
          totalRef.current,
          geradoresRef.current,
          wallDt,
          upgradesRef.current,
          speedUpgradesRef.current,
          luckUpgradesRef.current,
          luckMultiplierUpgradesRef.current,
          globalProductionLevelRef.current,
          globalSpeedLevelRef.current
        )
        totalRef.current = result.total
        setTotal(result.total)
        geradoresRef.current = result.geradores
        setGeradores(result.geradores)
        totalProducedLifetimeRef.current = totalProducedLifetimeRef.current.add(result.totalGain)
        setTotalProducedLifetime((prev) => prev.add(result.totalGain))
        generatorBonusCountRef.current = generatorBonusCountRef.current.map(
          (c, i) => c + (result.bonusCountDelta[i] ?? 0)
        )
        setGeneratorBonusCount((prev) =>
          prev.map((c, i) => c + (result.bonusCountDelta[i] ?? 0))
        )
        totalPlayTimeSecondsRef.current += Math.floor(wallDt)
        setTotalPlayTimeSeconds(totalPlayTimeSecondsRef.current)
        lastTickWallTimeRef.current = wallNow
        ultimoTick.current = now
        id = requestAnimationFrame(tick)
        return
      }
      if (ultimoTick.current === 0) {
        ultimoTick.current = now
        fpsIntervalRef.current = now
      }
      const dt = (now - ultimoTick.current) / 1000
      ultimoTick.current = now
      lastTickWallTimeRef.current = wallNow
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
      const newProgresso = [...progressoRef.current]
      let hadBonusThisTick = false

      const globalProdMult = Math.pow(2, globalProductionLevelRef.current)
      const mult = (idx: number) => Math.pow(2, upgradesRef.current[idx] ?? 0) * globalProdMult
      const interval = (idx: number) => intervaloEfetivo(idx, (speedUpgradesRef.current[idx] ?? 0) + globalSpeedLevelRef.current)
      for (let i = 0; i < NUM_GERADORES; i++) {
        const count = current[i]
        const iv = interval(i)
        if (count > 0) {
          acumulado[i] += dt
          while (acumulado[i] >= iv) {
            acumulado[i] -= iv
            let qty = count * mult(i)
            const luckLvl = luckUpgradesRef.current[i] ?? 0
            const luckMultLvl = luckMultiplierUpgradesRef.current[i] ?? 0
            if (luckLvl > 0 && Math.random() < chanceCrit(luckLvl)) {
              qty *= luckCritMultiplier(luckMultLvl)
              generatorBonusCountRef.current[i] = (generatorBonusCountRef.current[i] ?? 0) + 1
              hadBonusThisTick = true
            }
            if (i === 0) {
              deltaTotal = deltaTotal.add(qty)
            } else {
              deltaGen[i - 1] += qty
            }
          }
          newProgresso[i] = Math.min(100, (acumulado[i] / iv) * 100)
        } else {
          acumulado[i] = 0
          newProgresso[i] = 0
        }
      }

      const nextGeradores = current.map((g, i) => g + deltaGen[i])
      const totalAfterProd = totalRef.current.add(deltaTotal)
      let finalTotal = totalAfterProd
      let finalGeradores = nextGeradores
      let autoUnlockHappened = false
      let autoUnlockIndex: number | null = null
      if (autoUnlockNextGeradorRef.current) {
        const nextIndex = nextGeradores.findIndex((g) => g === 0)
        if (nextIndex !== -1) {
          const cost = custoBase(nextIndex)
            .times(Decimal.pow(1.5, nextGeradores[nextIndex]))
            .floor()
          if (totalAfterProd.gte(cost)) {
            finalTotal = totalAfterProd.sub(cost)
            finalGeradores = [...nextGeradores]
            finalGeradores[nextIndex] = 1
            autoUnlockHappened = true
            autoUnlockIndex = nextIndex
          }
        }
      }
      progressoRef.current = newProgresso
      setProgressoStateRef.current?.(newProgresso.slice())
      if (hadBonusThisTick) setGeneratorBonusCount(generatorBonusCountRef.current.slice())
      if (deltaTotal.gt(0) || autoUnlockHappened) {
        totalRef.current = finalTotal
        setTotal(finalTotal)
        if (deltaTotal.gt(0)) {
          setTotalProducedLifetime((prev) => {
            const next = prev.add(deltaTotal)
            totalProducedLifetimeRef.current = next
            return next
          })
        }
      }
      if (deltaGen.some((d) => d > 0) || autoUnlockHappened) {
        if (autoUnlockHappened && autoUnlockIndex !== null) {
          setGeneratorUnlockTimestamps((prev) => {
            const next = [...prev]
            if (next[autoUnlockIndex!] === 0) next[autoUnlockIndex!] = Date.now()
            return next
          })
        }
        geradoresRef.current = finalGeradores
        setGeradores(finalGeradores)
      }

      // Verificar conquistas no tick para toast imediato (evita delay de até 5s do persistSave)
      const checkState = {
        total: totalRef.current,
        geradores: geradoresRef.current,
        upgrades: upgradesRef.current,
        speedUpgrades: speedUpgradesRef.current,
        totalProducedLifetime: totalProducedLifetimeRef.current,
        totalPlayTimeSeconds: totalPlayTimeSecondsRef.current,
        geradoresCompradosManual: geradoresCompradosManualRef.current,
        jaColetouManual: jaColetouManualRef.current,
      }
      const newly = getNewlyUnlockedAchievementIds(checkState, achievementsUnlockedRef.current)
      if (newly.length > 0) {
        const next = [...achievementsUnlockedRef.current, ...newly]
        achievementsUnlockedRef.current = next
        setAchievementsUnlocked(next)
        playAchievementSound()
        newly.forEach((id) => {
          const achievement = ACHIEVEMENTS.find((a) => a.id === id)
          if (achievement) {
            toast.success(achievement.name, {
              description: `${achievement.description}\n${achievement.points} pts`,
              position: "top-right",
            })
          }
        })
      }

      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])

  const custoGerador = (i: number): Decimal => {
    const base = custoBase(i).times(Decimal.pow(1.5, geradores[i])).floor()
    if (geradores[i] === 0) return base
    const mult = globalPriceMultiplier(globalPriceReductionLevel)
    return base.times(mult).floor()
  }

  const podeComprar = (i: number) => total.gte(custoGerador(i))

  const comprarGerador = (i: number) => {
    const custo = custoGerador(i)
    if (!total.gte(custo)) return
    const eraPrimeiroDoGerador = geradores[i] === 0
    if (eraPrimeiroDoGerador) {
      setGeneratorUnlockTimestamps((prev) => {
        const next = [...prev]
        if (next[i] === 0) next[i] = Date.now()
        return next
      })
    }
    setTotal((t) => Decimal.sub(t, custo))
    setGeradoresCompradosManual((n) => n + 1)
    setGeradores((prev) => {
      const next = [...prev]
      next[i] += 1
      return next
    })
  }

  const custoProximoNivel = (i: number): Decimal =>
    Decimal.pow(10, 4 + i).times(Decimal.pow(10, upgrades[i]))
  const podeComprarMelhoria = (i: number) => total.gte(custoProximoNivel(i))
  const comprarMelhoria = (i: number) => {
    const custo = custoProximoNivel(i)
    if (!total.gte(custo)) return
    setTotal((t) => Decimal.sub(t, custo))
    setUpgrades((prev) => {
      const next = [...prev]
      next[i] += 1
      return next
    })
  }

  const custoProximoNivelVelocidade = (i: number): Decimal =>
    Decimal.pow(10, 6 + i).times(Decimal.pow(10, speedUpgrades[i]))
  const podeComprarMelhoriaVelocidade = (i: number) =>
    total.gte(custoProximoNivelVelocidade(i)) &&
    intervaloEfetivo(i, speedUpgrades[i] + 1) >= MIN_INTERVALO
  const comprarMelhoriaVelocidade = (i: number) => {
    const custo = custoProximoNivelVelocidade(i)
    if (!total.gte(custo)) return
    if (intervaloEfetivo(i, speedUpgrades[i] + 1) < MIN_INTERVALO) return
    setTotal((t) => Decimal.sub(t, custo))
    setSpeedUpgrades((prev) => {
      const next = [...prev]
      next[i] += 1
      return next
    })
  }

  const custoProximoNivelSorte = (i: number) =>
    Decimal.pow(10, 7 + i).times(Decimal.pow(10, luckUpgrades[i]))
  const podeComprarMelhoriaSorte = (i: number) => total.gte(custoProximoNivelSorte(i))
  const comprarMelhoriaSorte = (i: number) => {
    const custo = custoProximoNivelSorte(i)
    if (!total.gte(custo)) return
    setTotal((t) => Decimal.sub(t, custo))
    setLuckUpgrades((prev) => {
      const next = [...prev]
      next[i] += 1
      return next
    })
  }

  const custoProximoNivelEfeitoSorte = (i: number) =>
    Decimal.pow(10, 8 + i).times(Decimal.pow(10, luckMultiplierUpgrades[i]))
  const podeComprarMelhoriaEfeitoSorte = (i: number) => total.gte(custoProximoNivelEfeitoSorte(i))
  const comprarMelhoriaEfeitoSorte = (i: number) => {
    const custo = custoProximoNivelEfeitoSorte(i)
    if (!total.gte(custo)) return
    setTotal((t) => Decimal.sub(t, custo))
    setLuckMultiplierUpgrades((prev) => {
      const next = [...prev]
      next[i] += 1
      return next
    })
  }

  const custoProximoNivelGlobalProducao = () =>
    Decimal.pow(10, 12).times(Decimal.pow(10, globalProductionLevel))
  const podeComprarMelhoriaGlobalProducao = () => total.gte(custoProximoNivelGlobalProducao())
  const comprarMelhoriaGlobalProducao = () => {
    const custo = custoProximoNivelGlobalProducao()
    if (!total.gte(custo)) return
    setTotal((t) => Decimal.sub(t, custo))
    setGlobalProductionLevel((n) => n + 1)
  }

  const custoProximoNivelGlobalVelocidade = () =>
    Decimal.pow(10, 13).times(Decimal.pow(10, globalSpeedLevel))
  const podeComprarMelhoriaGlobalVelocidade = () => total.gte(custoProximoNivelGlobalVelocidade())
  const comprarMelhoriaGlobalVelocidade = () => {
    const custo = custoProximoNivelGlobalVelocidade()
    if (!total.gte(custo)) return
    setTotal((t) => Decimal.sub(t, custo))
    setGlobalSpeedLevel((n) => n + 1)
  }

  const custoProximoNivelGlobalPreco = () =>
    Decimal.pow(10, 14).times(Decimal.pow(10, globalPriceReductionLevel))
  const podeComprarMelhoriaGlobalPreco = () => total.gte(custoProximoNivelGlobalPreco())
  const comprarMelhoriaGlobalPreco = () => {
    const custo = custoProximoNivelGlobalPreco()
    if (!total.gte(custo)) return
    setTotal((t) => Decimal.sub(t, custo))
    setGlobalPriceReductionLevel((n) => n + 1)
  }

  function resetProgress() {
    try {
      localStorage.removeItem(SAVE_KEY)
    } catch {
      // ignore
    }
    setTotal(new Decimal(0))
    setGeradores(Array(NUM_GERADORES).fill(0))
    setUpgrades(Array(NUM_GERADORES).fill(0))
    setSpeedUpgrades(Array(NUM_GERADORES).fill(0))
    setLuckUpgrades(Array(NUM_GERADORES).fill(0))
    setLuckMultiplierUpgrades(Array(NUM_GERADORES).fill(0))
    setGlobalProductionLevel(0)
    setGlobalSpeedLevel(0)
    setGlobalPriceReductionLevel(0)
    setGeneratorUnlockTimestamps(Array(NUM_GERADORES).fill(0))
    setJaColetouManual(false)
    setOfflineCard(null)
    setTotalProducedLifetime(new Decimal(0))
    setTotalPlayTimeSeconds(0)
    setFirstPlayTime(null)
    firstPlayTimeRef.current = null
    setGeradoresCompradosManual(0)
    setAchievementsUnlocked([])
    setShowFpsCounter(false)
    geradoresCompradosManualRef.current = 0
    achievementsUnlockedRef.current = []
    geradoresRef.current = Array(NUM_GERADORES).fill(0)
    totalRef.current = new Decimal(0)
    totalProducedLifetimeRef.current = new Decimal(0)
    totalPlayTimeSecondsRef.current = 0
    lastSessionStartRef.current = Date.now()
    upgradesRef.current = Array(NUM_GERADORES).fill(0)
    speedUpgradesRef.current = Array(NUM_GERADORES).fill(0)
    luckUpgradesRef.current = Array(NUM_GERADORES).fill(0)
    luckMultiplierUpgradesRef.current = Array(NUM_GERADORES).fill(0)
    globalProductionLevelRef.current = 0
    globalSpeedLevelRef.current = 0
    globalPriceReductionLevelRef.current = 0
    generatorUnlockTimestampsRef.current = Array(NUM_GERADORES).fill(0)
    generatorBonusCountRef.current = Array(NUM_GERADORES).fill(0)
    setGeneratorBonusCount(Array(NUM_GERADORES).fill(0))
    jaColetouManualRef.current = false
    acumuladoRef.current = Array(NUM_GERADORES).fill(0)
    progressoRef.current = Array(NUM_GERADORES).fill(0)
    setProgressoStateRef.current?.(Array(NUM_GERADORES).fill(0))
  }

  function formatOfflineTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} h`
    return `${(seconds / 86400).toFixed(1)} dias`
  }

  const gameContextValue: GameContextValue = {
    total,
    setTotal,
    geradores,
    progressoRef,
    upgrades,
    formatDecimal,
    comprarGerador,
    podeComprar,
    custoGerador,
    comprarMelhoria,
    podeComprarMelhoria,
    custoProximoNivel,
    intervaloGerador,
    intervaloEfetivo: (i: number) => intervaloEfetivo(i, speedUpgrades[i] + globalSpeedLevel),
    NUM_GERADORES,
    resetProgress,
    autoUnlockNextGerador,
    setAutoUnlockNextGerador,
    speedUpgrades,
    comprarMelhoriaVelocidade,
    podeComprarMelhoriaVelocidade,
    custoProximoNivelVelocidade,
    luckUpgrades,
    comprarMelhoriaSorte,
    podeComprarMelhoriaSorte,
    custoProximoNivelSorte,
    chanceCritPorNivel: CHANCE_CRIT_POR_NIVEL,
    luckMultiplierUpgrades,
    comprarMelhoriaEfeitoSorte,
    podeComprarMelhoriaEfeitoSorte,
    custoProximoNivelEfeitoSorte,
    luckCritMultiplier,
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
    totalProducedLifetime,
    totalPlayTimeSeconds,
    firstPlayTime,
    geradoresCompradosManual,
    achievementsUnlocked,
    showFpsCounter,
    setShowFpsCounter,
    generatorUnlockTimestamps,
    generatorBonusCount,
    persistSave,
  }

  return (
      <GameContext.Provider value={gameContextValue}>
        <ShortcutHandler />
        <ScrollToTop />
        <CustomContextMenu>
          <RootLayout>
            {total.lt(1) && !jaColetouManual && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" aria-modal="true" role="dialog" aria-labelledby="welcome-dialog-title">
                <Card className="max-w-md w-full p-6 space-y-5 shadow-lg">
                  <h2 id="welcome-dialog-title" className="font-semibold text-xl">Boas-vindas ao Breaking Eternity</h2>
                  <div className="space-y-3 text-muted-foreground text-sm leading-relaxed">
                    <p>
                      Este é um jogo <strong className="text-foreground">incremental</strong> (idle): você coleta recurso, compra geradores que produzem mais recurso e desbloqueia melhorias. Os números podem ficar enormes — milhões, bilhões e além.
                    </p>
                    <p>
                      Para lidar com números tão grandes, o jogo usa a biblioteca <strong className="text-foreground">break_eternity.js</strong>, que permite operar com valores muito além do que o JavaScript nativo suporta (notação científica, sufixos como M, B, T, Q e letras).
                    </p>
                    <p>
                      O <strong className="text-foreground">objetivo</strong> é chegar ao limite dessa biblioteca — o maior número que ela consegue representar. Resgate seu primeiro recurso abaixo e comece a comprar geradores. Bom jogo!
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      playClickSound()
                      setTotal((t) => Decimal.add(t, 1))
                      setJaColetouManual(true)
                      setTotalProducedLifetime((prev) => prev.add(1))
                      totalProducedLifetimeRef.current = totalProducedLifetimeRef.current.add(1)
                    }}
                  >
                    Resgatar primeiro recurso
                  </Button>
                </Card>
              </div>
            )}
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
                    onClick={() => {
                      playClickSound()
                      setOfflineCard(null)
                    }}
                  >
                    OK
                  </Button>
                </Card>
              </div>
            )}
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 flex items-center gap-4">
              {/* Esquerda: nome do jogo + menus (futuros menus podem preencher aqui) */}
              <div className="flex items-center gap-4 flex-1 min-w-0 justify-start">
                <h1 className="text-lg font-semibold tracking-tight truncate shrink-0">
                  Breaking Eternity
                </h1>
                <nav className="flex gap-2 flex-wrap">
                  <NavLink
                    to="/"
                    onClick={() => playClickSound()}
                    className={({ isActive }) =>
                      "text-sm px-2 py-1 rounded-md " +
                      (isActive ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted")
                    }
                  >
                    Geradores
                  </NavLink>
                  <NavLink
                    to="/melhorias"
                    onClick={() => playClickSound()}
                    className={({ isActive }) =>
                      "text-sm px-2 py-1 rounded-md " +
                      (isActive ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted")
                    }
                  >
                    Melhorias
                  </NavLink>
                  <NavLink
                    to="/conquistas"
                    onClick={() => playClickSound()}
                    className={({ isActive }) =>
                      "text-sm px-2 py-1 rounded-md " +
                      (isActive ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted")
                    }
                  >
                    Conquistas
                  </NavLink>
                  <NavLink
                    to="/estatisticas"
                    onClick={() => playClickSound()}
                    className={({ isActive }) =>
                      "text-sm px-2 py-1 rounded-md " +
                      (isActive ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted")
                    }
                  >
                    Estatísticas
                  </NavLink>
                  <NavLink
                    to="/configuracoes"
                    onClick={() => playClickSound()}
                    className={({ isActive }) =>
                      "text-sm px-2 py-1 rounded-md " +
                      (isActive ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted")
                    }
                  >
                    Configurações
                  </NavLink>
                </nav>
              </div>
              {/* Centro: contador do recurso principal */}
              <div className="flex-shrink-0 px-2">
                <p className="text-2xl font-mono tabular-nums break-all text-center">
                  {formatDecimal(total)}
                </p>
              </div>
              {/* Direita: FPS (se ativado) e futuros menus */}
              <div className="flex items-center gap-4 flex-1 min-w-0 justify-end">
                {showFpsCounter && (
                  <Card className="px-3 py-1.5 shrink-0 border-muted">
                    <span
                      className={`text-xs font-mono ${fps >= 60 ? "text-green-500" : fps >= 30 ? "text-yellow-500" : "text-red-500"
                        }`}
                    >
                      {fps} FPS
                    </span>
                  </Card>
                )}
              </div>
            </header>

            <MainWithScrollBehavior>
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProgressoProvider progressoRef={progressoRef} setProgressoStateRef={setProgressoStateRef} numGeradores={NUM_GERADORES}>
                      <GeneratorsPage />
                    </ProgressoProvider>
                  }
                />
                <Route path="/melhorias" element={<ImprovementsPage />} />
                <Route path="/estatisticas" element={<EstatisticasPage />} />
                <Route
                  path="/conquistas"
                  element={
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                      <AchievementsPage />
                    </div>
                  }
                />
                <Route path="/entrar" element={<LoginPage />} />
                <Route path="/configuracoes" element={<SettingsPage />} />
              </Routes>
            </MainWithScrollBehavior>
          </RootLayout>
        </CustomContextMenu>
      </GameContext.Provider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
