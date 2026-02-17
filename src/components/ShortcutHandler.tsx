import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { playClickSound } from "@/lib/clickSound"
import { getShortcut } from "@/lib/shortcuts"

const MENU_PATHS = ["/", "/melhorias", "/conquistas", "/configuracoes"] as const

function isInputTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  if (tag === "input" || tag === "textarea" || tag === "select") return true
  if (target.isContentEditable) return true
  return false
}

export function ShortcutHandler() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isInputTarget(e.target)) return
      const code = e.code
      if (code === getShortcut("nextMenu")) {
        e.preventDefault()
        const idx = MENU_PATHS.indexOf(location.pathname as (typeof MENU_PATHS)[number])
        const nextIdx = idx < 0 ? 0 : (idx + 1) % MENU_PATHS.length
        navigate(MENU_PATHS[nextIdx])
        playClickSound()
      } else if (code === getShortcut("prevMenu")) {
        e.preventDefault()
        const idx = MENU_PATHS.indexOf(location.pathname as (typeof MENU_PATHS)[number])
        const nextIdx = idx <= 0 ? MENU_PATHS.length - 1 : idx - 1
        navigate(MENU_PATHS[nextIdx])
        playClickSound()
      } else if (code === getShortcut("menuGeradores")) {
        e.preventDefault()
        navigate("/")
        playClickSound()
      } else if (code === getShortcut("menuMelhorias")) {
        e.preventDefault()
        navigate("/melhorias")
        playClickSound()
      } else if (code === getShortcut("menuConquistas")) {
        e.preventDefault()
        navigate("/conquistas")
        playClickSound()
      } else if (code === getShortcut("menuConfiguracoes")) {
        e.preventDefault()
        navigate("/configuracoes")
        playClickSound()
      } else if (code === getShortcut("scrollTop")) {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: "smooth" })
        playClickSound()
      } else if (code === getShortcut("scrollBottom")) {
        e.preventDefault()
        const max = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        )
        window.scrollTo({ top: max, behavior: "smooth" })
        playClickSound()
      }
    }

    const onAuxClick = (e: MouseEvent) => {
      if (e.button < 4 || isInputTarget(e.target)) return
      const key = `Mouse${e.button}` as string
      const actions: Record<string, () => void> = {
        [getShortcut("nextMenu")]: () => {
          const idx = MENU_PATHS.indexOf(location.pathname as (typeof MENU_PATHS)[number])
          const nextIdx = idx < 0 ? 0 : (idx + 1) % MENU_PATHS.length
          navigate(MENU_PATHS[nextIdx])
          playClickSound()
        },
        [getShortcut("prevMenu")]: () => {
          const idx = MENU_PATHS.indexOf(location.pathname as (typeof MENU_PATHS)[number])
          const nextIdx = idx <= 0 ? MENU_PATHS.length - 1 : idx - 1
          navigate(MENU_PATHS[nextIdx])
          playClickSound()
        },
        [getShortcut("menuGeradores")]: () => {
          navigate("/")
          playClickSound()
        },
        [getShortcut("menuMelhorias")]: () => {
          navigate("/melhorias")
          playClickSound()
        },
        [getShortcut("menuConquistas")]: () => {
          navigate("/conquistas")
          playClickSound()
        },
        [getShortcut("menuConfiguracoes")]: () => {
          navigate("/configuracoes")
          playClickSound()
        },
        [getShortcut("scrollTop")]: () => {
          window.scrollTo({ top: 0, behavior: "smooth" })
          playClickSound()
        },
        [getShortcut("scrollBottom")]: () => {
          const max = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
          )
          window.scrollTo({ top: max, behavior: "smooth" })
          playClickSound()
        },
      }
      if (actions[key]) {
        e.preventDefault()
        e.stopPropagation()
        actions[key]()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("auxclick", onAuxClick, { capture: true })
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("auxclick", onAuxClick, { capture: true })
    }
  }, [navigate, location.pathname])

  return null
}
