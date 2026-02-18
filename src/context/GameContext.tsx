import { createContext } from "react"
import type Decimal from "break_eternity.js"

export interface GameContextValue {
  total: Decimal
  setTotal: React.Dispatch<React.SetStateAction<Decimal>>
  geradores: number[]
  progressoRef: React.MutableRefObject<number[]>
  upgrades: number[]
  speedUpgrades: number[]
  formatDecimal: (d: Decimal) => string
  comprarGerador: (i: number) => void
  podeComprar: (i: number) => boolean
  custoGerador: (i: number) => Decimal
  comprarMelhoria: (i: number) => void
  podeComprarMelhoria: (i: number) => boolean
  custoProximoNivel: (i: number) => Decimal
  intervaloGerador: (i: number) => number
  intervaloEfetivo: (i: number) => number
  NUM_GERADORES: number
  resetProgress: () => void
  autoUnlockNextGerador: boolean
  setAutoUnlockNextGerador: React.Dispatch<React.SetStateAction<boolean>>
  comprarMelhoriaVelocidade: (i: number) => void
  podeComprarMelhoriaVelocidade: (i: number) => boolean
  custoProximoNivelVelocidade: (i: number) => Decimal
  luckUpgrades: number[]
  comprarMelhoriaSorte: (i: number) => void
  podeComprarMelhoriaSorte: (i: number) => boolean
  custoProximoNivelSorte: (i: number) => Decimal
  chanceCritPorNivel: number
  luckMultiplierUpgrades: number[]
  comprarMelhoriaEfeitoSorte: (i: number) => void
  podeComprarMelhoriaEfeitoSorte: (i: number) => boolean
  custoProximoNivelEfeitoSorte: (i: number) => Decimal
  luckCritMultiplier: (level: number) => number
  globalProductionLevel: number
  globalSpeedLevel: number
  comprarMelhoriaGlobalProducao: () => void
  podeComprarMelhoriaGlobalProducao: () => boolean
  custoProximoNivelGlobalProducao: () => Decimal
  comprarMelhoriaGlobalVelocidade: () => void
  podeComprarMelhoriaGlobalVelocidade: () => boolean
  custoProximoNivelGlobalVelocidade: () => Decimal
  globalPriceReductionLevel: number
  comprarMelhoriaGlobalPreco: () => void
  podeComprarMelhoriaGlobalPreco: () => boolean
  custoProximoNivelGlobalPreco: () => Decimal
  globalPriceMultiplier: (level: number) => number
  totalProducedLifetime: Decimal
  totalPlayTimeSeconds: number
  firstPlayTime: number | null
  geradoresCompradosManual: number
  achievementsUnlocked: string[]
  showFpsCounter: boolean
  setShowFpsCounter: React.Dispatch<React.SetStateAction<boolean>>
  generatorUnlockTimestamps: number[]
  generatorBonusCount: number[]
  persistSave: () => void
}

export const GameContext = createContext<GameContextValue | null>(null)
