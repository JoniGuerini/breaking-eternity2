import { useEffect } from "react"
import { useLocation } from "react-router-dom"

/**
 * Rola para o topo ao trocar de página, para que cada rota comece no início do conteúdo.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    const main = document.querySelector("main.scroll-overlay")
    if (main) (main as HTMLElement).scrollTop = 0
  }, [pathname])

  return null
}
