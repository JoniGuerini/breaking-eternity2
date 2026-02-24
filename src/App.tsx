import React, { useEffect, useRef, useState, useMemo } from "react"
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { BarChart3, Cpu, Settings, Trophy, Zap } from "lucide-react"
import Decimal from "break_eternity.js"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { GameContext, type GameContextValue } from "@/context/GameContext"
import { supabase } from "@/lib/supabase"
import { getDeviceId } from "@/lib/deviceId"
import {
  claimSession,
  getCurrentSessionDevice,
  subscribeSessionDevice,
} from "@/lib/sessionDevice"
import { playAchievementSound, playClickSound } from "@/lib/clickSound"
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
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { NotificationProvider, useNotification } from "@/context/NotificationContext"
import { NotificationCenter } from "@/components/NotificationCenter"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getShortcut, getShortcutDisplayKey } from "@/lib/shortcuts"


const NUM_GERADORES = 100
const SAVE_KEY = "breaking-eternity-save"
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
  cloudSaveInterval?: number
  upgradePoints?: number
  milestonesReached?: number[]
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
): { total: Decimal; geradores: number[]; totalGain: Decimal; bonusCountDelta: number[]; offlineUpgradePointsGain: number; curMilestones: number[] } {
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

  // Calculate offline milestone points
  let offlineUpgradePointsGain = 0
  const curMilestones = Array(NUM_GERADORES).fill(0)
  for (let i = 0; i < NUM_GERADORES; i++) {
    const oldIndex = getMilestoneIndex(geradores[i] ?? 0)
    const newIndex = getMilestoneIndex(curGen[i] ?? 0)
    if (newIndex > oldIndex) {
      offlineUpgradePointsGain += (newIndex - oldIndex) * (i + 1)
    }
    curMilestones[i] = newIndex
  }

  const totalGain = Decimal.sub(curTotal, total)
  return { total: curTotal, geradores: curGen, totalGain, bonusCountDelta, offlineUpgradePointsGain, curMilestones }
}

/** Retorna em qual "marco" de quantidade o gerador está. */
export function getMilestoneIndex(count: number): number {
  if (count < 10) return 0
  return Math.floor(Math.log10(count))
}

/** Retorna qual a quantidade necessária para o próximo marco. */
export function getNextMilestoneThreshold(currentIndex: number): number {
  return Math.pow(10, currentIndex + 1)
}

/** Retorna a quantidade do marco atual (ou 0 se não atingiu o primeiro). */
export function getCurrentMilestoneThreshold(currentIndex: number): number {
  if (currentIndex === 0) return 0
  return Math.pow(10, currentIndex)
}

// Custo base: Fórmula ajustada para escalar mais rápido que 100x
// Antes: 10^(2*i)
// Agora: 10^(2*i + (i^2)/10) -> Curva mais acentuada
function custoBase(i: number): Decimal {
  // Ajuste o divisor (10) para controlar o quão rápido o "gap" aumenta
  return Decimal.pow(10, 2 * i + (i * i) / 8)
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

/**
 * Formata valores Decimal (break_eternity.js) para exibição, em toda a faixa suportada:
 * - 0 a 999: inteiro
 * - 1.000 a 999.999: inteiro com separador de milhar (.)
 * - 1 = M (milhões), 2 = B (bilhões), 3 = T (trilhões), 4 = Q (quatrilhões)
 * - 5 = Qi (quintilhão), 6 = Sx (sextilhão), 7 = Sp (septilhão), 8 = Oc (octilhão), 9 = No (nonilhão), 10 = Dc (decilhão)
 * - A partir de 1e36: sufixos de letras AA, AB … ZZ, depois AAA…ZZZ, AAAA…ZZZZ, AAAAA…ZZZZZ (até 999 ZZZZZ)
 * - Acima de 999 ZZZZZ: notação científica via break_eternity (toStringWithDecimalPlaces).
 * Todos os números exibidos no jogo passam por esta função (recurso, custos, multiplicadores, estatísticas).
 */
function formatDecimal(d: Decimal): string {
  if (d.lt(0)) return "-" + formatDecimal(d.neg())
  if (d.eq(0)) return "0"

  const dExp = d.log10().floor().toNumber()

  if (dExp < 3) {
    return d.floor().toString()
  }

  if (dExp < 6) {
    return d.floor().toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  // Índice para letras: só a partir de 1e36 (depois de Qi, Sx, Sp, Oc, No, Dc). Acima de 999 ZZZZZ → científica
  const letterIndex = Math.floor((dExp - 36) / 3)
  if (letterIndex >= LIMIT_5) {
    return d.toStringWithDecimalPlaces(2)
  }

  const exp = dExp
  const remainder = exp % 3

  // Mantissa e expoente vêm do break_eternity (layer 0: mantissa 1–10, exponent inteiro); evita Math.pow com expoentes gigantes
  const baseMantissa =
    d.layer === 0 ? Math.abs(d.mantissa) : Math.pow(10, d.log10().toNumber() - exp)

  const displayMantissa = baseMantissa * Math.pow(10, remainder)

  const rounded = Math.round(displayMantissa * 100) / 100
  const mantissaStr =
    rounded % 1 === 0
      ? rounded.toString()
      : rounded.toFixed(2).replace(/\.?0+$/, "")

  // 1 = M, 2 = B, 3 = T, 4 = Q (até 1e18)
  if (exp < 9) return mantissaStr + " M"
  if (exp < 12) return mantissaStr + " B"
  if (exp < 15) return mantissaStr + " T"
  if (exp < 18) return mantissaStr + " Q"
  // 5 = Qi, 6 = Sx, 7 = Sp, 8 = Oc, 9 = No, 10 = Dc (1e18 até antes de 1e36)
  if (exp < 21) return mantissaStr + " Qi"
  if (exp < 24) return mantissaStr + " Sx"
  if (exp < 27) return mantissaStr + " Sp"
  if (exp < 30) return mantissaStr + " Oc"
  if (exp < 33) return mantissaStr + " No"
  if (exp < 36) return mantissaStr + " Dc"
  // A partir de 1e36: AA, AB … 999 ZZZZZ
  let numLetters: number
  let localIndex: number
  if (letterIndex < LIMIT_2) {
    numLetters = 2
    localIndex = letterIndex
  } else if (letterIndex < LIMIT_3) {
    numLetters = 3
    localIndex = letterIndex - LIMIT_2
  } else if (letterIndex < LIMIT_4) {
    numLetters = 4
    localIndex = letterIndex - LIMIT_3
  } else {
    numLetters = 5
    localIndex = letterIndex - LIMIT_4
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

const MemoizedHeader = React.memo(({ fps, showFpsCounter }: { fps: number, showFpsCounter: boolean }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const gameCtx = React.useContext(GameContext)

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 flex items-center gap-4">
      {/* Esquerda: nome do jogo */}
      <div className="flex items-center gap-4 flex-1 min-w-0 justify-start">
        <h1 className="text-lg font-semibold tracking-tight truncate shrink-0">
          {t("app.title")}
        </h1>
      </div>
      {/* Centro: contador do recurso principal */}
      <div className="flex-shrink-0 px-2">
        <p className="text-2xl font-mono tabular-nums break-all text-center">
          {gameCtx?.formatDecimal(gameCtx.total) || "0"}
        </p>
      </div>
      {/* Direita: Todos os menus e FPS */}
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
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
        <nav className="flex items-center gap-2 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  playClickSound()
                  navigate("/")
                }}
                className={cn("transition-colors", location.pathname === "/" ? "text-foreground bg-muted hover:text-foreground hover:bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
              >
                <Cpu className="h-5 w-5" />
                <span className="sr-only">{t("nav.geradores")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2">
              <span>{t("nav.geradores")}</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                {getShortcutDisplayKey(getShortcut("menuGeradores"))}
              </kbd>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  playClickSound()
                  navigate("/melhorias")
                }}
                className={cn("transition-colors", location.pathname === "/melhorias" ? "text-foreground bg-muted hover:text-foreground hover:bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
              >
                <Zap className="h-5 w-5" />
                <span className="sr-only">{t("nav.melhorias")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2">
              <span>{t("nav.melhorias")}</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                {getShortcutDisplayKey(getShortcut("menuMelhorias"))}
              </kbd>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-border mx-1" aria-hidden="true" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  playClickSound()
                  navigate("/conquistas")
                }}
                className="relative"
              >
                <Trophy className="h-5 w-5" />
                <span className="sr-only">{t("nav.conquistas")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2">
              <span>{t("nav.conquistas")}</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                {getShortcutDisplayKey(getShortcut("menuConquistas"))}
              </kbd>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  playClickSound()
                  navigate("/estatisticas")
                }}
                className="relative"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="sr-only">{t("nav.estatisticas")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2">
              <span>{t("nav.estatisticas")}</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                {getShortcutDisplayKey(getShortcut("menuEstatisticas"))}
              </kbd>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-border mx-1" aria-hidden="true" />
          <NotificationCenter />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  playClickSound()
                  navigate("/configuracoes")
                }}
                className="relative"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">{t("nav.configuracoes")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2">
              <span>{t("nav.configuracoes")}</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                {getShortcutDisplayKey(getShortcut("menuConfiguracoes"))}
              </kbd>
            </TooltipContent>
          </Tooltip>
        </nav>
      </div>
    </header>
  )
})

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

function AppContent() {
  const { t } = useTranslation()
  const auth = useAuth()
  const location = useLocation()

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
  const [upgradePoints, setUpgradePoints] = useState<number>(() => {
    const saved = loadSavedState()
    return saved?.upgradePoints ?? 0
  })
  const [milestonesReached, setMilestonesReached] = useState<number[]>(() => {
    const saved = loadSavedState()
    if (saved?.milestonesReached && Array.isArray(saved.milestonesReached) && saved.milestonesReached.length === NUM_GERADORES) {
      return saved.milestonesReached
    }
    return Array(NUM_GERADORES).fill(0)
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
  const { addNotification, clearAll } = useNotification()
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
  const upgradePointsRef = useRef(0)
  const milestonesReachedRef = useRef<number[]>(Array(NUM_GERADORES).fill(0))
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
  const autoUnlockNextGeradorRef = useRef(false)
  const [lastSaveTime, setLastSaveTime] = useState(() => loadSavedState()?.lastSaveTime ?? Date.now())
  const [cloudSaveInterval, setCloudSaveInterval] = useState(() => {
    const saved = loadSavedState()
    const val = saved?.cloudSaveInterval ?? 10000
    if (val < 5000) return 5000
    if (val > 60000) return 60000
    return val
  })
  const framesRef = useRef(0)
  const fpsIntervalRef = useRef(0)
  const authUserIdRef = useRef<string | null>(null)
  const cloudSaveAppliedForRef = useRef<string | null>(null)
  const sessionLoadTimeRef = useRef(Date.now())

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
      setUpgradePoints(payload.upgradePoints ?? 0)

      const milestonesArr = payload.milestonesReached?.length === NUM_GERADORES ? payload.milestonesReached : Array(NUM_GERADORES).fill(0)
      setMilestonesReached(milestonesArr)

      setGeneratorUnlockTimestamps(tsArr)
      setGeneratorBonusCount(bonusArr)
      setTotalProducedLifetime(lifetimeDec)
      setTotalPlayTimeSeconds(payload.totalPlayTimeSeconds ?? 0)
      setFirstPlayTime(payload.firstPlayTime ?? null)
      setGeradoresCompradosManual(payload.geradoresCompradosManual ?? 0)
      setAchievementsUnlocked(filterValidAchievementIds(payload.achievementsUnlocked ?? []))

      const savedInterval = payload.cloudSaveInterval ?? 10000
      setCloudSaveInterval(Math.max(5000, Math.min(60000, savedInterval)))

      // Notifications logic
      // We don't want to spam notifications on load, but we could add a "Game Loaded" one if desired.
      // For now, let's just respect the loaded state.

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
      upgradePointsRef.current = payload.upgradePoints ?? 0

      const milestonesArr2 = payload.milestonesReached?.length === NUM_GERADORES ? payload.milestonesReached : Array(NUM_GERADORES).fill(0)
      milestonesReachedRef.current = milestonesArr2

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
        if (raw?.total && Array.isArray(raw.geradores) && raw.geradores.length === NUM_GERADORES) {
          // Calcular progresso offline ao carregar do cloud
          if (raw.lastSaveTime) {
            const offlineSeconds = (Date.now() - raw.lastSaveTime) / 1000
            if (offlineSeconds > 5) {
              const totalAntes = Decimal.fromString(raw.total)
              const savedUpgrades =
                raw.upgrades && raw.upgrades.length === NUM_GERADORES
                  ? raw.upgrades.map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : Number(v)))
                  : Array(NUM_GERADORES).fill(0)
              const savedSpeedUpgrades =
                raw.speedUpgrades && raw.speedUpgrades.length === NUM_GERADORES
                  ? raw.speedUpgrades.map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : Number(v)))
                  : Array(NUM_GERADORES).fill(0)
              const savedLuckUpgrades =
                raw.luckUpgrades && raw.luckUpgrades.length === NUM_GERADORES
                  ? raw.luckUpgrades.map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : Number(v)))
                  : Array(NUM_GERADORES).fill(0)
              const savedLuckMult =
                raw.luckMultiplierUpgrades && raw.luckMultiplierUpgrades.length === NUM_GERADORES
                  ? raw.luckMultiplierUpgrades.map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : Number(v)))
                  : Array(NUM_GERADORES).fill(0)
              const savedGlobalProd = typeof raw.globalProductionLevel === "number" && raw.globalProductionLevel >= 0 ? raw.globalProductionLevel : 0
              const savedGlobalSpeed = typeof raw.globalSpeedLevel === "number" && raw.globalSpeedLevel >= 0 ? raw.globalSpeedLevel : 0

              const result = simulateOffline(
                totalAntes,
                raw.geradores,
                offlineSeconds,
                savedUpgrades,
                savedSpeedUpgrades,
                savedLuckUpgrades,
                savedLuckMult,
                savedGlobalProd,
                savedGlobalSpeed
              )

              // Atualiza o estado carregado com o resultado da simulação
              raw.total = result.total.toString()
              raw.geradores = result.geradores

              if (result.totalGain.gt(0)) {
                const base = raw.totalProducedLifetime
                  ? Decimal.fromString(raw.totalProducedLifetime)
                  : new Decimal(0)
                raw.totalProducedLifetime = base.add(result.totalGain).toString()
              }

              const currentBonus = raw.generatorBonusCount && raw.generatorBonusCount.length === NUM_GERADORES
                ? raw.generatorBonusCount.map(Number)
                : Array(NUM_GERADORES).fill(0)

              raw.generatorBonusCount = currentBonus.map((c, i) => c + (result.bonusCountDelta[i] ?? 0))

              if (result.offlineUpgradePointsGain > 0) {
                raw.upgradePoints = (raw.upgradePoints ?? 0) + result.offlineUpgradePointsGain
                raw.milestonesReached = result.curMilestones
              }

              setOfflineCard({ totalGain: result.totalGain, seconds: offlineSeconds })
            }
          }
          applySave(raw)
        }
      })
  }, [auth?.user?.id])

  useEffect(() => {
    const userId = auth?.user?.id
    if (!userId) return
    const deviceId = getDeviceId()
    let cancelled = false
    let unsub: (() => void) | null = null
    getCurrentSessionDevice(userId).then((current) => {
      if (cancelled) return
      if (current != null && current !== deviceId) {
        // Se estamos na página de login, o modal "Forçar login" vai tratar; não deslogar aqui.
        if (location.pathname === "/entrar") return
        auth?.signOut()
        toast.info(t("toasts.sessionOtherDevice"))
        return
      }
      return claimSession(userId, deviceId)
    }).then(() => {
      if (cancelled) return
      unsub = subscribeSessionDevice(userId, deviceId, () => {
        auth?.signOut()
        toast.info(t("toasts.sessionOtherDevice"))
      })
    })
    return () => {
      cancelled = true
      unsub?.()
    }
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
    upgradePointsRef.current = upgradePoints
  }, [upgradePoints])
  useEffect(() => {
    milestonesReachedRef.current = milestonesReached
  }, [milestonesReached])
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
          const name = t(`achievements.${achievement.id}.name`, { defaultValue: achievement.name })
          const desc = t(`achievements.${achievement.id}.description`, { defaultValue: achievement.description })
          toast.success(name, {
            description: `${desc}\n${achievement.points} pts`,
            position: "bottom-right",
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
      cloudSaveInterval: cloudSaveInterval,
      upgradePoints: upgradePointsRef.current,
      milestonesReached: milestonesReachedRef.current,
    }
    setLastSaveTime(now)
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
      if (authUserIdRef.current) {
        // Notification for manual/cloud save if enough time passed since load
        void supabase
          .from("saves")
          .upsert(
            { user_id: authUserIdRef.current, save_data: payload, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          )
          .then(() => {
            if (Date.now() - sessionLoadTimeRef.current > 5000) {
              // addNotification("Jogo Salvo", "Progresso salvo na nuvem com sucesso.", "save")
            }
          })
      }
    } catch {
      // ignora erro de quota ou network
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
  // Salvar a cada X segundos (configurável) e ao fechar/sair da aba
  useEffect(() => {
    const interval = setInterval(persistSave, cloudSaveInterval)
    const onBeforeUnload = () => {
      persistSave()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => {
      clearInterval(interval)
      window.removeEventListener("beforeunload", onBeforeUnload)
    }
  }, [cloudSaveInterval])

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
      const currentMilestones = milestonesReachedRef.current
      const nextMilestones = [...currentMilestones]
      let hadBonusThisTick = false
      let gainedUpgradePoints = 0

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

      const nextGeradores = current.map((g, i) => {
        const nextQtd = g + deltaGen[i]
        const oldIndex = currentMilestones[i]
        const newIndex = getMilestoneIndex(nextQtd)
        if (newIndex > oldIndex) {
          gainedUpgradePoints += (newIndex - oldIndex) * (i + 1)
          nextMilestones[i] = newIndex
        }
        return nextQtd
      })
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

      if (gainedUpgradePoints > 0) {
        upgradePointsRef.current += gainedUpgradePoints
        setUpgradePoints(upgradePointsRef.current)
        milestonesReachedRef.current = nextMilestones
        setMilestonesReached(nextMilestones)

        toast.success(t("toasts.upgradePointsTitle"), {
          description: t("toasts.upgradePointsDesc", { count: gainedUpgradePoints }),
          position: "bottom-right",
        })
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
        console.log("Desbloqueando conquistas:", newly)
        achievementsUnlockedRef.current = next
        setAchievementsUnlocked(next)
        playAchievementSound()
        newly.forEach((id) => {
          const achievement = ACHIEVEMENTS.find((a) => a.id === id)
          if (achievement) {
            const name = t(`achievements.${achievement.id}.name`, { defaultValue: achievement.name })
            const desc = t(`achievements.${achievement.id}.description`, { defaultValue: achievement.description })
            toast.success(name, {
              id: achievement.id,
              className: `toast-${achievement.id}`,
              description: `${desc}\n${achievement.points} pts`,
              position: "bottom-right",
            })
            addNotification(
              name,
              `${desc} (+${achievement.points} pts)`,
              "achievement"
            )
          }
        })
      }

      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])

  const custoGerador = (i: number): Decimal => {
    // Multiplicador base cresce com o tier: G1=1.5, G2=1.6, G3=1.7...
    const multBase = 1.5 + i * 0.1
    const base = custoBase(i).times(Decimal.pow(multBase, geradores[i])).floor()
    if (geradores[i] === 0) return base
    const mult = globalPriceMultiplier(globalPriceReductionLevel)
    return base.times(mult).floor()
  }

  const podeComprar = (i: number) => {
    const cost = custoGerador(i)
    if (total.lt(cost)) return false
    return true
  }

  const comprarGerador = (i: number) => {
    const cost = custoGerador(i)
    if (!podeComprar(i)) return

    const eraPrimeiroDoGerador = geradores[i] === 0
    if (eraPrimeiroDoGerador) {
      setGeneratorUnlockTimestamps((prev) => {
        const next = [...prev]
        if (next[i] === 0) next[i] = Date.now()
        return next
      })
    }
    setTotal((t) => Decimal.sub(t, cost))
    setGeradoresCompradosManual((n) => n + 1)
    setGeradores((prev) => {
      const next = [...prev]
      next[i] += 1
      return next
    })
  }

  const custoProximoNivel = (i: number): Decimal =>
    Decimal.pow(10, 4 + i).times(Decimal.pow(10, upgrades[i]))
  const custoPontosMelhoria = (i: number, nivel: number): number => (nivel + 1) * (i + 1)
  const custoPontosMelhoriaGlobal = (nivel: number): number => nivel + 1

  const podeComprarMelhoria = (i: number) => total.gte(custoProximoNivel(i)) && upgradePoints >= custoPontosMelhoria(i, upgrades[i])
  const comprarMelhoria = (i: number) => {
    const custo = custoProximoNivel(i)
    const custoPts = custoPontosMelhoria(i, upgrades[i])
    if (!podeComprarMelhoria(i)) return
    setTotal((t) => Decimal.sub(t, custo))
    setUpgradePoints((p) => p - custoPts)
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
    intervaloEfetivo(i, speedUpgrades[i] + 1) >= MIN_INTERVALO &&
    upgradePoints >= custoPontosMelhoria(i, speedUpgrades[i])
  const comprarMelhoriaVelocidade = (i: number) => {
    const custo = custoProximoNivelVelocidade(i)
    const custoPts = custoPontosMelhoria(i, speedUpgrades[i])
    if (!podeComprarMelhoriaVelocidade(i)) return
    setTotal((t) => Decimal.sub(t, custo))
    setUpgradePoints((p) => p - custoPts)
    setSpeedUpgrades((prev) => {
      const next = [...prev]
      next[i] += 1
      return next
    })
  }

  const custoProximoNivelSorte = (i: number) =>
    Decimal.pow(10, 7 + i).times(Decimal.pow(10, luckUpgrades[i]))
  const podeComprarMelhoriaSorte = (i: number) => total.gte(custoProximoNivelSorte(i)) && upgradePoints >= custoPontosMelhoria(i, luckUpgrades[i])
  const comprarMelhoriaSorte = (i: number) => {
    const custo = custoProximoNivelSorte(i)
    const custoPts = custoPontosMelhoria(i, luckUpgrades[i])
    if (!podeComprarMelhoriaSorte(i)) return
    setTotal((t) => Decimal.sub(t, custo))
    setUpgradePoints((p) => p - custoPts)
    setLuckUpgrades((prev) => {
      const next = [...prev]
      next[i] += 1
      return next
    })
  }

  const custoProximoNivelEfeitoSorte = (i: number) =>
    Decimal.pow(10, 8 + i).times(Decimal.pow(10, luckMultiplierUpgrades[i]))
  const podeComprarMelhoriaEfeitoSorte = (i: number) => total.gte(custoProximoNivelEfeitoSorte(i)) && upgradePoints >= custoPontosMelhoria(i, luckMultiplierUpgrades[i])
  const comprarMelhoriaEfeitoSorte = (i: number) => {
    const custo = custoProximoNivelEfeitoSorte(i)
    const custoPts = custoPontosMelhoria(i, luckMultiplierUpgrades[i])
    if (!podeComprarMelhoriaEfeitoSorte(i)) return
    setTotal((t) => Decimal.sub(t, custo))
    setUpgradePoints((p) => p - custoPts)
    setLuckMultiplierUpgrades((prev) => {
      const next = [...prev]
      next[i] += 1
      return next
    })
  }

  const custoProximoNivelGlobalProducao = () =>
    Decimal.pow(10, 12).times(Decimal.pow(10, globalProductionLevel))
  const podeComprarMelhoriaGlobalProducao = () => total.gte(custoProximoNivelGlobalProducao()) && upgradePoints >= custoPontosMelhoriaGlobal(globalProductionLevel)
  const comprarMelhoriaGlobalProducao = () => {
    const custo = custoProximoNivelGlobalProducao()
    const custoPts = custoPontosMelhoriaGlobal(globalProductionLevel)
    if (!podeComprarMelhoriaGlobalProducao()) return
    setTotal((t) => Decimal.sub(t, custo))
    setUpgradePoints((p) => p - custoPts)
    setGlobalProductionLevel((n) => n + 1)
  }

  const custoProximoNivelGlobalVelocidade = () =>
    Decimal.pow(10, 13).times(Decimal.pow(10, globalSpeedLevel))
  const podeComprarMelhoriaGlobalVelocidade = () => total.gte(custoProximoNivelGlobalVelocidade()) && upgradePoints >= custoPontosMelhoriaGlobal(globalSpeedLevel)
  const comprarMelhoriaGlobalVelocidade = () => {
    const custo = custoProximoNivelGlobalVelocidade()
    const custoPts = custoPontosMelhoriaGlobal(globalSpeedLevel)
    if (!podeComprarMelhoriaGlobalVelocidade()) return
    setTotal((t) => Decimal.sub(t, custo))
    setUpgradePoints((p) => p - custoPts)
    setGlobalSpeedLevel((n) => n + 1)
  }

  const custoProximoNivelGlobalPreco = () =>
    Decimal.pow(10, 14).times(Decimal.pow(10, globalPriceReductionLevel))
  const podeComprarMelhoriaGlobalPreco = () => total.gte(custoProximoNivelGlobalPreco()) && upgradePoints >= custoPontosMelhoriaGlobal(globalPriceReductionLevel)
  const comprarMelhoriaGlobalPreco = () => {
    const custo = custoProximoNivelGlobalPreco()
    const custoPts = custoPontosMelhoriaGlobal(globalPriceReductionLevel)
    if (!podeComprarMelhoriaGlobalPreco()) return
    setTotal((t) => Decimal.sub(t, custo))
    setUpgradePoints((p) => p - custoPts)
    setGlobalPriceReductionLevel((n) => n + 1)
  }

  function resetProgress() {
    try {
      localStorage.removeItem(SAVE_KEY)
      clearAll()
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
    setUpgradePoints(0)
    setMilestonesReached(Array(NUM_GERADORES).fill(0))

    // Atualizar Refs imediatamente para o save forçado
    totalRef.current = new Decimal(0)
    geradoresRef.current = Array(NUM_GERADORES).fill(0)
    upgradesRef.current = Array(NUM_GERADORES).fill(0)
    speedUpgradesRef.current = Array(NUM_GERADORES).fill(0)
    luckUpgradesRef.current = Array(NUM_GERADORES).fill(0)
    luckMultiplierUpgradesRef.current = Array(NUM_GERADORES).fill(0)
    globalProductionLevelRef.current = 0
    globalSpeedLevelRef.current = 0
    globalPriceReductionLevelRef.current = 0
    generatorUnlockTimestampsRef.current = Array(NUM_GERADORES).fill(0)
    jaColetouManualRef.current = false
    totalProducedLifetimeRef.current = new Decimal(0)
    totalPlayTimeSecondsRef.current = 0
    firstPlayTimeRef.current = null
    geradoresCompradosManualRef.current = 0
    achievementsUnlockedRef.current = []
    upgradePointsRef.current = 0
    milestonesReachedRef.current = Array(NUM_GERADORES).fill(0)

    // Forçar save imediato do estado zerado
    setTimeout(() => persistSave(), 0)
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
  }

  function formatOfflineTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} h`
    return `${(seconds / 86400).toFixed(1)} dias`
  }

  const gameContextValue: GameContextValue = useMemo(() => ({
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
    custoPontosMelhoria,
    custoPontosMelhoriaGlobal,
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
    upgradePoints,
    setUpgradePoints,
    milestonesReached,
    generatorUnlockTimestamps,
    generatorBonusCount,
    persistSave,
    lastSaveTime,
    cloudSaveInterval,
    setCloudSaveInterval,
  }), [
    total,
    geradores,
    upgrades,
    speedUpgrades,
    luckUpgrades,
    luckMultiplierUpgrades,
    globalProductionLevel,
    globalSpeedLevel,
    globalPriceReductionLevel,
    autoUnlockNextGerador,
    totalProducedLifetime,
    totalPlayTimeSeconds,
    firstPlayTime,
    geradoresCompradosManual,
    achievementsUnlocked,
    showFpsCounter,
    upgradePoints,
    milestonesReached,
    generatorUnlockTimestamps,
    generatorBonusCount,
    lastSaveTime,
    cloudSaveInterval,
    // Add stable functions/refs that don't technically need to be here but are part of the value:
    progressoRef,
  ])

  return (
    <GameContext.Provider value={gameContextValue}>
      <ShortcutHandler />
      <ScrollToTop />
      <CustomContextMenu>
        <RootLayout>
          {total.lt(1) && !jaColetouManual && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" aria-modal="true" role="dialog" aria-labelledby="welcome-dialog-title">
              <Card className="max-w-md w-full p-6 space-y-5 shadow-lg">
                <h2 id="welcome-dialog-title" className="font-semibold text-xl">{t("app.welcomeTitle")}</h2>
                <div className="space-y-3 text-muted-foreground text-sm leading-relaxed">
                  <p dangerouslySetInnerHTML={{ __html: t("app.welcomeP1") }} />
                  <p dangerouslySetInnerHTML={{ __html: t("app.welcomeP2") }} />
                  <p dangerouslySetInnerHTML={{ __html: t("app.welcomeP3") }} />
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    playClickSound()
                    setTotal((prev) => Decimal.add(prev, 1))
                    setJaColetouManual(true)
                    setTotalProducedLifetime((prev) => prev.add(1))
                    totalProducedLifetimeRef.current = totalProducedLifetimeRef.current.add(1)
                  }}
                >
                  {t("app.firstResource")}
                </Button>
              </Card>
            </div>
          )}
          {offlineCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" aria-modal="true" role="dialog">
              <Card className="max-w-sm w-full p-6 space-y-4">
                <h2 className="font-semibold text-lg">{t("app.offlineTitle")}</h2>
                <p className="text-muted-foreground text-sm">
                  {t("app.offlineGain", { amount: formatDecimal(offlineCard.totalGain) })}
                </p>
                <p className="text-muted-foreground text-xs">
                  {t("app.offlineTime")}: {formatOfflineTime(offlineCard.seconds)}
                </p>
                <Button
                  className="w-full"
                  onClick={() => {
                    playClickSound()
                    setOfflineCard(null)
                  }}
                >
                  {t("common.ok")}
                </Button>
              </Card>
            </div>
          )}
          <MemoizedHeader fps={fps} showFpsCounter={showFpsCounter} />


          <MainWithScrollBehavior>
            <Routes>
              <Route
                path="/"
                element={
                  <GeneratorsPage />
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
      <Toaster position="bottom-right" />
      <TooltipProvider>
        <NotificationProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </NotificationProvider>
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App
