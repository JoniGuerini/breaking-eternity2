import { useContext } from "react"
import { useNavigate } from "react-router-dom"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { GameContext } from "@/context/GameContext"
import { playClickSound } from "@/lib/clickSound"

interface CustomContextMenuProps {
  children: React.ReactNode
}

export function CustomContextMenu({ children }: CustomContextMenuProps) {
  const ctx = useContext(GameContext)
  const navigate = useNavigate()
  const autoUnlock = ctx?.autoUnlockNextGerador ?? false
  const setAutoUnlock = ctx?.setAutoUnlockNextGerador

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-[220px]">
        <ContextMenuCheckboxItem
          checked={autoUnlock}
          onCheckedChange={(checked) => {
            playClickSound()
            setAutoUnlock?.(!!checked)
          }}
        >
          Desbloquear próximo gerador
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={() => {
            playClickSound()
            navigate("/configuracoes")
          }}
        >
          Abrir Configurações
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
