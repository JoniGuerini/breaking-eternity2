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
}

export const GameContext = createContext<GameContextValue | null>(null)
