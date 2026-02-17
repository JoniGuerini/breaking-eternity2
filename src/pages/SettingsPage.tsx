import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Decimal from "break_eternity.js"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { GameContext } from "@/context/GameContext"
import {
  getClickSoundEnabled,
  getClickSoundVolume,
  playClickSound,
  setClickSoundEnabled as persistClickSound,
  setClickSoundVolume as persistClickSoundVolume,
} from "@/lib/clickSound"
import {
  getShortcut,
  getShortcutDisplayKey,
  keyEventToShortcutKey,
  mouseButtonToShortcutKey,
  resetShortcutsToDefaults,
  setShortcut,
  SHORTCUT_LABELS,
  type ShortcutId,
} from "@/lib/shortcuts"
import { applyTheme, getTheme, setTheme, THEMES, THEME_PREVIEW_COLORS, type ThemeId } from "@/lib/theme"

export function SettingsPage() {
  const ctx = useContext(GameContext)
  const navigate = useNavigate()
  const [openReset, setOpenReset] = useState(false)
  const [clickSoundEnabled, setClickSoundEnabled] = useState(getClickSoundEnabled)
  const [clickSoundVolume, setClickSoundVolume] = useState(() => getClickSoundVolume())
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => getTheme())
  const [tab, setTab] = useState<"geral" | "temas" | "estatisticas" | "atalhos">("geral")
  const [recordingId, setRecordingId] = useState<ShortcutId | null>(null)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (recordingId === null) return
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const key = keyEventToShortcutKey(e)
      setShortcut(recordingId, key)
      setRecordingId(null)
      playClickSound()
      forceUpdate((n) => n + 1)
    }
    const onAuxClick = (e: MouseEvent) => {
      if (e.button < 4) return
      e.preventDefault()
      e.stopPropagation()
      const key = mouseButtonToShortcutKey(e.button)
      if (key) {
        setShortcut(recordingId, key)
        setRecordingId(null)
        playClickSound()
        forceUpdate((n) => n + 1)
      }
    }
    window.addEventListener("keydown", onKeyDown, { capture: true })
    window.addEventListener("auxclick", onAuxClick, { capture: true })
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true })
      window.removeEventListener("auxclick", onAuxClick, { capture: true })
    }
  }, [recordingId])
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
    <section className="w-full space-y-6">
      <div className="flex flex-nowrap border-b border-border gap-0" role="tablist" aria-label="Configurações">
        <button
          type="button"
          onClick={() => {
            playClickSound()
            setTab("geral")
          }}
          className={`flex-1 min-w-0 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
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
          className={`flex-1 min-w-0 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
            tab === "estatisticas"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-selected={tab === "estatisticas"}
          role="tab"
        >
          Estatísticas
        </button>
        <button
          type="button"
          onClick={() => {
            playClickSound()
            setTab("atalhos")
          }}
          className={`flex-1 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
            tab === "atalhos"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-selected={tab === "atalhos"}
          role="tab"
        >
          Atalhos
        </button>
      </div>

      {tab === "geral" && (
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-x-0 gap-y-6 md:gap-x-6 md:gap-y-0">
          <div className="space-y-6">
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
          </div>
          <div className="hidden md:flex self-stretch items-stretch">
            <Separator orientation="vertical" className="h-full min-h-[200px]" />
          </div>
          <div className="space-y-6">
            <div>
              <p className="font-medium">Restaurar configurações padrão</p>
              <p className="text-muted-foreground text-sm mt-1">
                Som de clique ativo (100%), desbloquear próximo gerador desativado, tema Escuro e atalhos de teclado padrão.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                playClickSound()
                persistClickSound(true)
                setClickSoundEnabled(true)
                persistClickSoundVolume(100)
                setClickSoundVolume(100)
                setAutoUnlockNextGerador(false)
                setTheme("dark")
                applyTheme("dark")
                setCurrentTheme("dark")
                resetShortcutsToDefaults()
                forceUpdate((n) => n + 1)
              }}
            >
              Restaurar configurações padrão
            </Button>
            <div>
              <p className="font-medium">Resetar progresso</p>
              <p className="text-muted-foreground text-sm mt-1">
                Volta o jogo ao estado inicial: contador em 0, nenhum gerador e nenhuma melhoria. O save será apagado.
              </p>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                playClickSound()
                setOpenReset(true)
              }}
            >
              Resetar progresso
            </Button>
          </div>
        </div>
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
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

      {tab === "atalhos" && (
        <Card className="p-6 space-y-5">
          <div>
            <p className="font-medium">Teclas de atalho</p>
            <p className="text-muted-foreground text-sm mt-1">
              Clique no botão e pressione a tecla (ou botão do mouse) que deseja usar. Atalhos funcionam em qualquer tela.
            </p>
          </div>
          <div className="space-y-4">
            {(Object.keys(SHORTCUT_LABELS) as ShortcutId[]).map((id) => (
              <div key={id} className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm font-medium">{SHORTCUT_LABELS[id]}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="font-mono min-w-[10rem]"
                  onClick={() => {
                    playClickSound()
                    setRecordingId(id)
                  }}
                >
                  {recordingId === id
                    ? "Pressione uma tecla..."
                    : getShortcutDisplayKey(getShortcut(id))}
                </Button>
              </div>
            ))}
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
              <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(new Decimal(geradoresCompradosManual))}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">Geradores produzidos (automático)</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(Decimal.max(new Decimal(0), geradores.reduce((acc, g) => acc.add(g), new Decimal(0)).sub(geradoresCompradosManual)))}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">Melhorias de produção</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(new Decimal(upgrades.reduce((a, b) => a + b, 0)))}</dd>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <dt className="text-muted-foreground text-sm">Melhorias de velocidade</dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{formatDecimal(new Decimal(speedUpgrades.reduce((a, b) => a + b, 0)))}</dd>
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
