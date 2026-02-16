import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GameContext } from "@/context/GameContext"

export function SettingsPage() {
  const ctx = useContext(GameContext)
  const navigate = useNavigate()
  const [openReset, setOpenReset] = useState(false)
  if (!ctx) return null
  const { resetProgress, autoUnlockNextGerador, setAutoUnlockNextGerador } = ctx

  function handleConfirmReset() {
    resetProgress()
    setOpenReset(false)
    navigate("/")
  }

  return (
    <section className="w-full max-w-md mx-auto space-y-6">
      <h2 className="text-lg font-semibold">Configurações</h2>
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Desbloquear próximo gerador automaticamente</p>
            <p className="text-muted-foreground text-sm mt-1">
              Quando ativado, o próximo gerador (ainda com 0 unidades) é desbloqueado assim que você tiver recurso suficiente. Não compra unidades extras.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoUnlockNextGerador}
            onClick={() => setAutoUnlockNextGerador((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${autoUnlockNextGerador ? "bg-primary" : "bg-muted"}`}
          >
            <span
              className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${autoUnlockNextGerador ? "translate-x-5" : "translate-x-1"}`}
            />
          </button>
        </div>
        <div>
          <p className="font-medium">Resetar progresso</p>
          <p className="text-muted-foreground text-sm mt-1">
            Volta o jogo ao estado inicial: contador em 0, nenhum gerador e nenhuma melhoria. O save será apagado.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setOpenReset(true)}
        >
          Resetar progresso
        </Button>
      </Card>

      {openReset && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
          onClick={() => setOpenReset(false)}
        >
          <Card
            className="w-full max-w-sm p-6 space-y-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reset-dialog-title" className="text-lg font-semibold">
              Resetar progresso?
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tem certeza que deseja resetar todo o progresso? Contador, geradores e melhorias voltarão ao zero.
            </p>
            <div className="flex w-full flex-row justify-between gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setOpenReset(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmReset}
              >
                Confirmar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </section>
  )
}
