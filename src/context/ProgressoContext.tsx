import { createContext, useContext, useEffect, useState } from "react"

const ProgressoContext = createContext<number[] | null>(null)

/**
 * Sincroniza progressoRef (do GameContext) em estado local a cada frame.
 * Só é montado na rota de Geradores, então Melhorias/Config não re-renderizam a cada frame.
 */
export function ProgressoProvider({
  progressoRef,
  numGeradores,
  children,
}: {
  progressoRef: React.MutableRefObject<number[]>
  numGeradores: number
  children: React.ReactNode
}) {
  const [progresso, setProgresso] = useState<number[]>(() => Array(numGeradores).fill(0))

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
