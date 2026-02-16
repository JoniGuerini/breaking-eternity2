import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GameContext } from "@/context/GameContext"
import {
  getClickSoundEnabled,
  getClickSoundVolume,
  playClickSound,
  setClickSoundEnabled as persistClickSound,
  setClickSoundVolume as persistClickSoundVolume,
} from "@/lib/clickSound"
import { applyTheme, getTheme, setTheme, THEMES, THEME_PREVIEW_COLORS, type ThemeId } from "@/lib/theme"

export function SettingsPage() {
  const ctx = useContext(GameContext)
  const navigate = useNavigate()
  const [openReset, setOpenReset] = useState(false)
  const [clickSoundEnabled, setClickSoundEnabled] = useState(getClickSoundEnabled)
  const [clickSoundVolume, setClickSoundVolume] = useState(() => getClickSoundVolume())
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => getTheme())
  const [tab, setTab] = useState<"geral" | "temas" | "estatisticas">("geral")
  if (!ctx) return null
  const {
    resetProgress,
    autoUnlockNextGerador,
    setAutoUnlockNextGerador,
    total,
    formatDecimal,
    geradores,
    upgrades,
    speedUpgrades,
    totalProducedLifetime,
    totalPlayTimeSeconds,
    firstPlayTime,
    geradoresCompradosManual,
  } = ctx

  function formatPlayTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    return h > 0 ? `${d}d ${h}h` : `${d}d`
  }

  function formatFirstPlayDate(ts: number | null): string {
    if (!ts) return "—"
    return new Date(ts).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function handleThemeChange(theme: ThemeId) {
    playClickSound()
    setTheme(theme)
    applyTheme(theme)
    setCurrentTheme(theme)
  }

  function toggleClickSound() {
    const next = !clickSoundEnabled
    persistClickSound(next)
    setClickSoundEnabled(next)
    if (next) playClickSound()
  }

  function handleVolumeChange(value: number) {
    const v = Math.round(value)
    setClickSoundVolume(v)
    persistClickSoundVolume(v)
  }

  function handleConfirmReset() {
    resetProgress()
    setOpenReset(false)
    navigate("/")
  }

  return (
    <section className="w-full max-w-md mx-auto space-y-6">
      <h2 className="text-lg font-semibold">Configurações</h2>

      <div className="flex border-b border-border" role="tablist" aria-label="Configurações">
        <button
          type="button"
          onClick={() => {
            playClickSound()
            setTab("geral")
          }}
          className={`flex-1 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
            tab === "geral"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-selected={tab === "geral"}
          role="tab"
        >
          Geral
        </button>
        <button
          type="button"
          onClick={() => {
            playClickSound()
            setTab("temas")
          }}
          className={`flex-1 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
            tab === "temas"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-selected={tab === "temas"}
          role="tab"
        >
          Temas
        </button>
        <button
          type="button"
          onClick={() => {
            playClickSound()
            setTab("estatisticas")
          }}
          className={`flex-1 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
            tab === "estatisticas"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-selected={tab === "estatisticas"}
          role="tab"
        >
          Estatísticas
        </button>
      </div>

      {tab === "geral" && (
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Som de clique</p>
            <p className="text-muted-foreground text-sm mt-1">
              Toca um clique ao comprar geradores/melhorias e ao trocar de menu.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={clickSoundEnabled}
            onClick={toggleClickSound}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${clickSoundEnabled ? "bg-primary" : "bg-muted"}`}
          >
            <span
              className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${clickSoundEnabled ? "translate-x-5" : "translate-x-1"}`}
            />
          </button>
        </div>
        {clickSoundEnabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Volume do clique</span>
              <span className="text-sm font-mono tabular-nums">{clickSoundVolume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={clickSoundVolume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              onMouseUp={() => clickSoundEnabled && playClickSound()}
              onTouchEnd={() => clickSoundEnabled && playClickSound()}
              className="w-full h-2 rounded-full appearance-none bg-muted accent-primary cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-0 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              aria-label="Volume do som de clique"
            />
          </div>
        )}
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
            onClick={() => {
            playClickSound()
            setAutoUnlockNextGerador((v) => !v)
          }}
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
          onClick={() => {
            playClickSound()
            setOpenReset(true)
          }}
        >
          Resetar progresso
        </Button>
      </Card>
      )}

      {tab === "temas" && (
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">Tema visual</p>
            <p className="text-muted-foreground text-sm mt-1">
              Escolha a aparência da interface. Todas as opções estão liberadas.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEMES.map(({ id, label }) => {
              const colors = THEME_PREVIEW_COLORS[id]
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleThemeChange(id)}
                  className={`flex flex-col gap-2 rounded-lg border-2 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    currentTheme === id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-accent hover:border-accent text-foreground"
                  }`}
                >
                  <span className="text-sm font-medium leading-tight">{label}</span>
                  <div className="flex gap-1 flex-wrap" aria-hidden>
                    {colors.map((color, i) => (
                      <span
                        key={i}
                        className="size-4 shrink-0 rounded-sm border border-black/10 shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {tab === "estatisticas" && (
        <Card className="p-6 space-y-5">
          <div>
            <p className="font-medium">Resumo da sua partida</p>
            <p className="text-muted-foreground text-sm mt-1">
              Números gerais do progresso (zeram ao resetar).
            </p>
          </div>
          <dl className="space-y-4">
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">Recurso atual</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(total)}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">Total já produzido</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(totalProducedLifetime)}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">Tempo de jogo</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{formatPlayTime(totalPlayTimeSeconds)}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">Primeira partida</dt>
              <dd className="font-mono text-sm tabular-nums">{formatFirstPlayDate(firstPlayTime)}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">Geradores comprados (manual)</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{geradoresCompradosManual}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">Geradores produzidos (automático)</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{Math.max(0, geradores.reduce((a, b) => a + b, 0) - geradoresCompradosManual)}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">Melhorias de produção</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{upgrades.reduce((a, b) => a + b, 0)}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">Melhorias de velocidade</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{speedUpgrades.reduce((a, b) => a + b, 0)}</dd>
            </div>
          </dl>
        </Card>
      )}

      {openReset && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
          onClick={() => {
            playClickSound()
            setOpenReset(false)
          }}
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
                onClick={() => {
                  playClickSound()
                  setOpenReset(false)
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  playClickSound()
                  handleConfirmReset()
                }}
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
