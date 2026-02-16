import { createContext, useContext, useEffect, useRef, useState } from "react"

const ProgressoContext = createContext<number[] | null>(null)

/**
 * Sincroniza progressoRef (do GameContext) em estado local a cada frame.
 * Só é montado na rota de Geradores, então Melhorias/Config não re-renderizam a cada frame.
 */
export function ProgressoProvider({
  progressoRef,
  children,
}: {
  progressoRef: React.MutableRefObject<number[]>
  children: React.ReactNode
}) {
  const [progresso, setProgresso] = useState<number[]>(() => progressoRef.current.slice())

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

export function useProgresso(): number[] | null {
  return useContext(ProgressoContext)
}
