import { createContext, useContext, useEffect, useState } from "react"

const ProgressoContext = createContext<number[] | null>(null)

/**
 * Mantém estado de progresso das barras; o App atualiza via setProgressoStateRef no tick.
 * Um loop rAF continua lendo progressoRef como fallback (ex.: quando a página é montada após o tick).
 */
export function ProgressoProvider({
  progressoRef,
  setProgressoStateRef,
  numGeradores,
  children,
}: {
  progressoRef: React.MutableRefObject<number[]>
  setProgressoStateRef: React.MutableRefObject<((v: number[]) => void) | null>
  numGeradores: number
  children: React.ReactNode
}) {
  const [progresso, setProgresso] = useState<number[]>(() => Array(numGeradores).fill(0))

  useEffect(() => {
    setProgressoStateRef.current = setProgresso
    return () => {
      setProgressoStateRef.current = null
    }
  }, [setProgressoStateRef])

  useEffect(() => {
    let rafId: number
    const tick = () => {
      setProgresso(progressoRef.current.slice())
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [progressoRef])

  return (
    <ProgressoContext.Provider value={progresso}>
      {children}
    </ProgressoContext.Provider>
  )
}

/* eslint-disable react-refresh/only-export-components -- hook precisa ser exportado junto do provider */
export function useProgresso(): number[] | null {
  return useContext(ProgressoContext)
}
